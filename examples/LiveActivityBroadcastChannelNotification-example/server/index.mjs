import Fastify from "fastify";
import readline from "node:readline/promises";
import fs from "node:fs";
import { TokenConnector } from "hapns/connectors/token";
import {
	createBroadcastChannel,
	readAllBroadcastChannels,
	deleteBroadcastChannel,
} from "hapns/channels/broadcast";
import { LiveActivityNotification } from "hapns/notifications/LiveActivityNotification";
import { send } from "hapns/send";
import { Device } from "hapns/targets/device";
import { BroadcastChannel } from "hapns/targets/broadcastchannel";
import { EventBusPlugin } from "@hapns-internal/utils/event-bus";
import { DeviceRegistrationPlugin } from "@hapns-internal/utils/device-registration";
import * as Database from "./database.mjs";

// *********************** //
// *** PERSONALIZATION *** //
// *********************** //

/**
 * @TODO This topic is the identifier of the app.
 */
const APNS_TOPIC = "com.alexandercerutti.broadcasting-application";

const TOKEN_KEY_PATH = "../../certificates/token/APNS_AuthKey_6WB99KX6YJ.p8";

const KEY_ID = "6WB99KX6YJ";
const TEAM_ID = "F53WB8AE67";

const USE_SANDBOX = true;

// *************************** //
// *** END PERSONALIZATION *** //
// *************************** //

const connector = TokenConnector({
	/**
	 * This is the key you generated in the Apple Developer Portal
	 *
	 * @see https://developer.apple.com/documentation/usernotifications/establishing-a-token-based-connection-to-apns
	 * @see https://developer.apple.com/account/resources/authkeys/list
	 */
	key: new Uint8Array(fs.readFileSync(TOKEN_KEY_PATH)),
	keyId: KEY_ID,
	teamIdentifier: TEAM_ID,
});

// In-memory storage for channels and device registrations
const broadcastChannels = new Map(); // channelId -> { channel: BroadcastChannel, name: string, subscribers: Set<deviceId> }
const registeredDevices = new Map(); // deviceId -> { deviceToken?, pushToStartToken? }
const devicePushTokens = new Map(); // deviceId -> { pushToStartToken }

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

async function showMenu() {
	console.log("\n" + "=".repeat(50));
	console.log("🎯 Broadcast Channel Manager");
	console.log("=".repeat(50));
	console.log("1. Create new channel");
	console.log("2. List existing channels");
	console.log("3. Delete channel");
	console.log("4. Send broadcast notification (push-to-start)");
	console.log("5. Send broadcast update (app-started)");
	console.log("6. Exit");
	console.log("=".repeat(50));

	const choice = await rl.question("Choose option (1-6): ");
	return choice.trim();
}

async function createChannel() {
	const channelName = await rl.question("Enter channel name (e.g., 'sports-warriors'): ");

	if (!channelName.trim()) {
		console.log("❌ Channel name cannot be empty!");
		return;
	}

	try {
		console.log("🔄 Creating broadcast channel...");

		const channel = await createBroadcastChannel(connector, {
			bundleId: APNS_TOPIC,
			useSandbox: USE_SANDBOX,
		});

		broadcastChannels.set(channel.channelId, {
			channel,
			name: channelName.trim(),
			subscribers: new Set(),
		});

		Database.addChannel(channel.channelId, channelName.trim(), channel.bundleId);

		console.log(`✅ Channel created successfully!`);
		console.log(`   Name: ${channelName}`);
		console.log(`   ID: ${channel.channelId}`);
		console.log(`   Bundle ID: ${channel.bundleId}`);
	} catch (error) {
		console.log(`❌ Failed to create channel: ${error.message}`);
	}
}

async function listChannels() {
	const broadcastChannelsFromAPNS = await readAllBroadcastChannels(connector, APNS_TOPIC, {
		useSandbox: USE_SANDBOX,
	});

	if (broadcastChannelsFromAPNS.length === 0) {
		console.log("📭 No channels available.");
		return [];
	}

	const channelsDB = Database.loadChannelsDB();

	console.log("\n📋 Current Channels:");
	console.log("-".repeat(80));

	const channelsWithNames = [];

	for (const { channelId, bundleId } of broadcastChannelsFromAPNS) {
		const channelData = channelsDB[channelId];
		const channelName = channelData?.name || `Channel ${channelId.slice(0, 8)}...`;

		console.log(`📺 ${channelName}`);
		console.log(`   ID: ${channelId}`);
		console.log(`   Bundle ID: ${bundleId}`);

		if (channelData?.createdAt) {
			console.log(`   Created: ${new Date(channelData.createdAt).toLocaleString()}`);
		}

		// Update in-memory storage to sync with database
		if (!broadcastChannels.has(channelId)) {
			broadcastChannels.set(channelId, {
				channel: BroadcastChannel(channelId, bundleId),
				name: channelName,
				subscribers: new Set(),
			});
		}

		channelsWithNames.push({
			channelId,
			bundleId,
			name: channelName,
			createdAt: channelData?.createdAt,
		});

		console.log("-".repeat(80));
	}

	// Clean up database from channels that no longer exist in APNS
	const activeChannelIds = new Set(broadcastChannelsFromAPNS.map((c) => c.channelId));
	const dbChannelIds = Object.keys(channelsDB);
	const channelsToRemove = dbChannelIds.filter((id) => !activeChannelIds.has(id));

	if (channelsToRemove.length > 0) {
		console.log(`🧹 Cleaning up ${channelsToRemove.length} orphaned channels from database...`);
		channelsToRemove.forEach((channelId) => {
			Database.removeChannel(channelId);
			broadcastChannels.delete(channelId);
		});
	}

	return channelsWithNames;
}

async function deleteChannelInteractive() {
	const channels = await listChannels();

	if (channels.length === 0) {
		console.log("📭 No channels available to delete.");
		return;
	}

	const channelId = await rl.question("Enter channel ID to delete: ");

	const channelToDelete = channels.find((c) => c.channelId === channelId);
	if (!channelToDelete) {
		console.log("❌ Channel not found!");
		return;
	}

	try {
		const channelData = broadcastChannels.get(channelId);

		if (channelData) {
			console.log("🔄 Deleting broadcast channel...");

			await deleteBroadcastChannel(connector, channelData.channel, {
				useSandbox: USE_SANDBOX,
			});

			// Remove from in-memory storage
			broadcastChannels.delete(channelId);
		}

		Database.removeChannel(channelId);

		console.log(`✅ Channel '${channelToDelete.name}' deleted successfully!`);
	} catch (error) {
		console.log(`❌ Failed to delete channel: ${error.message}`);
	}
}

async function sendBroadcastStart() {
	const channels = await listChannels();

	if (channels.length === 0) {
		console.log("📭 No channels available.");
		return;
	}

	const channelId = await rl.question("Enter channel ID to start broadcast: ");

	if (!broadcastChannels.has(channelId)) {
		console.log("❌ Channel not found!");
		return;
	}

	const { name } = broadcastChannels.get(channelId);

	try {
		console.log("🔄 Starting Live Activity broadcast...");

		const notification = LiveActivityNotification(APNS_TOPIC, {
			payload: {
				event: "start",
				attributes: {
					homeTeam: "Golden State Warriors",
					awayTeam: "Los Angeles Lakers",
					gameType: "NBA Regular Season",
					venue: "Chase Center",
					startTime: `${Date.now() / 1000}`,
				},
				contentState: {
					homeScore: 0,
					awayScore: 0,
					quarter: 1,
					status: "Game Started",
					lastPlay: "Tip-off!",
				},
				relevanceScore: 1.0,
				attributesType: "BroadcastActivityAttributes",
				alert: {
					title: "Game Started!",
					body: `${name} is now live - Warriors vs Lakers`,
					sound: "default",
				},
				inputPushChannel: channelId, // <---- THIS IS WHAT MAKES THE DIFFERENCE.
			},
			priority: 10,
		});

		for (const [deviceId, registeredDevice] of registeredDevices) {
			const device = Device(registeredDevice.pushToStartToken);

			const result = await send(connector, notification, device, {
				useSandbox: USE_SANDBOX,
			});

			console.log(`   📱 Sent to device ${deviceId}`);
			console.log(`      Response:`, result);
		}

		console.log(`✅ Broadcast notification sent successfully!`);
		console.log(`   Channel: ${name} (${channelId})`);
		console.log(`   Subscribers: ${registeredDevices.size}`);
	} catch (error) {
		console.log(`❌ Failed to start broadcast: ${error.message}`);
	}
}

async function sendBroadcastUpdate() {
	const channels = await listChannels();

	if (channels.length === 0) {
		console.log("📭 No channels available.");
		return;
	}

	const channelId = await rl.question("Enter channel ID to update: ");

	if (!broadcastChannels.has(channelId)) {
		console.log("❌ Channel not found!");
		return;
	}

	const { channel, name, subscribers } = broadcastChannels.get(channelId);

	const message = await rl.question("Enter update message (e.g., 'Warriors score!'): ");
	const homeScore = parseInt((await rl.question("Enter home team (Warriors) score: ")) || "0");
	const awayScore = parseInt((await rl.question("Enter away team (Lakers) score: ")) || "0");
	const quarter = parseInt((await rl.question("Enter quarter (1-4): ")) || "1");

	try {
		console.log("🔄 Sending Live Activity update...");

		const notification = LiveActivityNotification(APNS_TOPIC, {
			payload: {
				event: "update",
				contentState: {
					homeScore: homeScore,
					awayScore: awayScore,
					quarter: quarter,
					status: quarter <= 4 ? `Q${quarter}` : "Final",
					lastPlay: message || "Game update",
				},
				relevanceScore: 1.0,
				alert: {
					title: `${name} Update`,
					body: message || `Q${quarter}: Warriors ${homeScore} - ${awayScore} Lakers`,
					sound: "default",
				},
			},
			priority: 10,
		});

		// Send to broadcast channel (updates existing Live Activities)
		const result = await send(connector, notification, channel, {
			useSandbox: USE_SANDBOX,
		});

		console.log(`✅ Broadcast update sent successfully!`);
		console.log(`   Channel: ${name} (${channelId})`);
		console.log(`   Score: Warriors ${homeScore} - ${awayScore} Lakers`);
		console.log(`   Quarter: ${quarter}`);
		console.log(`   Last Play: ${message}`);
		console.log(`   Subscribers: ${subscribers.size}`);
		console.log(`   Response:`, result);
	} catch (error) {
		console.log(`❌ Failed to send update: ${error.message}`);
	}
}

async function startServer() {
	const fastify = Fastify({
		logger: true,
	});

	// Register plugins
	await fastify.register(EventBusPlugin);
	await fastify.register(DeviceRegistrationPlugin);

	// Listen for device registration events
	fastify.eventBus.on("device-registration", (data) => {
		const { deviceId, pushToStartToken, deviceToken, ...otherData } = data;

		const existingDevice = registeredDevices.get(deviceId) || {};
		const hadExistingPushToken = existingDevice.pushToStartToken;
		const hadExistingDeviceToken = existingDevice.deviceToken;

		console.log(
			`📱 Device ${existingDevice.deviceToken || existingDevice.pushToStartToken ? "updated" : "registered"}: ${deviceId}`,
		);

		// Handle push-to-start token updates
		if (pushToStartToken) {
			if (hadExistingPushToken && hadExistingPushToken !== pushToStartToken) {
				console.log(`   🔄 Push-to-start token updated (replaced previous token)`);
			} else if (!hadExistingPushToken) {
				console.log(`   ✅ Push-to-start token: NEW`);
			} else {
				console.log(`   ✅ Push-to-start token: SAME`);
			}
		} else if (hadExistingPushToken) {
			console.log(`   ✅ Push-to-start token: KEPT (from previous registration)`);
		} else {
			console.log(`   ❌ Push-to-start token: NONE`);
		}

		// Handle device token updates
		if (deviceToken) {
			if (hadExistingDeviceToken && hadExistingDeviceToken !== deviceToken) {
				console.log(`   🔄 Device token updated (replaced previous token)`);
			} else if (!hadExistingDeviceToken) {
				console.log(`   ✅ Device token: NEW`);
			} else {
				console.log(`   ✅ Device token: SAME`);
			}
		} else if (hadExistingDeviceToken) {
			console.log(`   ✅ Device token: KEPT (from previous registration)`);
		} else {
			console.log(`   ❌ Device token: NONE`);
		}

		// Store/update device registration data
		registeredDevices.set(deviceId, {
			...existingDevice,
			deviceToken: deviceToken || existingDevice.deviceToken,
			pushToStartToken: pushToStartToken || existingDevice.pushToStartToken,
			lastUpdated: new Date().toISOString(),
			...otherData,
		});

		// Update push-to-start token mapping (this handles token replacement automatically)
		if (pushToStartToken) {
			const hadDifferentToken =
				devicePushTokens.has(deviceId) &&
				devicePushTokens.get(deviceId).pushToStartToken !== pushToStartToken;

			devicePushTokens.set(deviceId, {
				pushToStartToken,
				updatedAt: new Date().toISOString(),
			});

			if (hadDifferentToken) {
				console.log(`   🗑️  Previous push-to-start token discarded`);
			}
		}
	});

	fastify.eventBus.on("device-unregistration", (data) => {
		const { deviceId } = data;
		console.log(`📱 Device unregistered: ${deviceId}`);

		registeredDevices.delete(deviceId);
		devicePushTokens.delete(deviceId);

		// Remove from all channel subscriptions
		for (const [channelId, channelData] of broadcastChannels) {
			channelData.subscribers.delete(deviceId);
		}
	});

	// Health check endpoint
	fastify.get("/health", async (_, reply) => {
		reply.status(200).send({
			status: "ok",
			channels: broadcastChannels.size,
			devices: registeredDevices.size,
			pushTokenDevices: devicePushTokens.size,
		});
	});

	// List available channels for iOS app
	fastify.get("/channels", async (_, reply) => {
		const channels = await listChannels();

		reply.send(channels);
	});

	/**
	 * Channel subscription happens when the device app selects
	 * a specific channel and starts a Broadcast Live Activity
	 * on its own (but it can be updated from the server).
	 *
	 * Unsubscription is not available in this example server.
	 */
	fastify.post("/channels/:channelId/subscribe", async (request, reply) => {
		const { channelId } = request.params;
		const { deviceId } = request.body;

		if (!deviceId) {
			return reply.status(400).send({
				error: "Device ID is required",
			});
		}

		if (!registeredDevices.has(deviceId)) {
			return reply.status(400).send({
				error: "Device not registered. Please register device first.",
			});
		}

		if (!broadcastChannels.has(channelId)) {
			return reply.status(404).send({
				error: "Channel not found",
			});
		}

		const channelData = broadcastChannels.get(channelId);
		channelData.subscribers.add(deviceId);

		console.log(`Device ${deviceId} subscribed to channel ${channelData.name} (${channelId})`);

		reply.send({
			success: true,
			message: `Subscribed to channel '${channelData.name}'`,
		});
	});

	// Broadcast notification endpoints (for testing)
	fastify.post("/broadcast/:channelId/start", async (request, reply) => {
		const { channelId } = request.params;
		const { title, subtitle, message } = request.body;

		if (!broadcastChannels.has(channelId)) {
			return reply.status(404).send({
				error: "Channel not found",
			});
		}

		const { channel, name, subscribers } = broadcastChannels.get(channelId);

		if (subscribers.size === 0) {
			return reply.status(400).send({
				error: "No subscribers to this channel",
			});
		}

		try {
			const notification = LiveActivityNotification(APNS_TOPIC, {
				payload: {
					event: "start",
					attributes: {
						homeTeam: "Golden State Warriors",
						awayTeam: "Los Angeles Lakers",
						gameType: "NBA Regular Season",
						venue: "Chase Center",
						startTime: Date.now() / 1000,
					},
					contentState: {
						homeScore: 0,
						awayScore: 0,
						quarter: 1,
						status: "Game Started",
						lastPlay: "Tip-off!",
					},
					relevanceScore: 1.0,
					attributesType: "BroadcastActivityAttributes",
					alert: {
						title: "Game Started!",
						body: message || `${name} is now live - Warriors vs Lakers`,
						sound: "default",
					},
					inputPushToken: 1,
				},
				priority: 10,
			});

			const result = await send(connector, notification, channel, {
				useSandbox: USE_SANDBOX,
			});

			console.log(`📡 Broadcast started for channel ${name} (${channelId})`);

			reply.send({
				success: true,
				channelId,
				channelName: name,
				subscribers: subscribers.size,
				// response: {
				// 	statusCode: result.statusCode,
				// 	reason: result.reason,
				// },
			});
		} catch (error) {
			console.error(`❌ Failed to start broadcast: ${error.message}`);
			reply.status(500).send({
				error: `Failed to start broadcast: ${error.message}`,
			});
		}
	});

	fastify.post("/broadcast/:channelId/update", async (request, reply) => {
		const { channelId } = request.params;
		const {
			message = "Game update",
			homeScore = "0",
			awayScore = "0",
			quarter = "1",
		} = request.body;

		if (!broadcastChannels.has(channelId)) {
			return reply.status(404).send({
				error: "Channel not found",
			});
		}

		const { channel, name, subscribers } = broadcastChannels.get(channelId);

		if (subscribers.size === 0) {
			return reply.status(400).send({
				error: "No subscribers to this channel",
			});
		}

		try {
			const notification = LiveActivityNotification(APNS_TOPIC, {
				payload: {
					event: "update",
					contentState: {
						homeScore: parseInt(homeScore) || 0,
						awayScore: parseInt(awayScore) || 0,
						quarter: parseInt(quarter) || 1,
						status: quarter <= 4 ? `Q${quarter}` : "Final",
						lastPlay: message,
					},
					relevanceScore: 1.0,
					alert: {
						title: `${name} Update`,
						body: `Q${quarter}: Warriors ${homeScore} - ${awayScore} Lakers`,
						sound: "default",
					},
				},
				priority: 10,
			});

			const result = await send(connector, notification, channel, {
				useSandbox: USE_SANDBOX,
			});

			console.log(`📡 Broadcast updated for channel ${name} (${channelId})`);

			reply.send({
				success: true,
				channelId,
				channelName: name,
				gameState: {
					homeScore: parseInt(homeScore) || 0,
					awayScore: parseInt(awayScore) || 0,
					quarter: parseInt(quarter) || 1,
					lastPlay: message,
				},
				subscribers: subscribers.size,
			});
		} catch (error) {
			console.error(`❌ Failed to update broadcast: ${error.message}`);
			reply.status(500).send({
				error: `Failed to update broadcast: ${error.message}`,
			});
		}
	});

	fastify.post("/broadcast/:channelId/end", async (request, reply) => {
		const { channelId } = request.params;
		const { message } = request.body;

		if (!broadcastChannels.has(channelId)) {
			return reply.status(404).send({
				error: "Channel not found",
			});
		}

		const { channel, name, subscribers } = broadcastChannels.get(channelId);

		if (subscribers.size === 0) {
			return reply.status(400).send({
				error: "No subscribers to this channel",
			});
		}

		try {
			const notification = LiveActivityNotification(APNS_TOPIC, {
				payload: {
					event: "end",
					contentState: {
						homeScore: 112,
						awayScore: 108,
						quarter: 4,
						status: "Final",
						lastPlay: message || "Game Over - Warriors Win!",
					},
					relevanceScore: 1.0,
					alert: {
						title: "Game Over!",
						body: message || `Final: Warriors 112 - 108 Lakers`,
						sound: "default",
					},
				},
				priority: 10,
			});

			const result = await send(connector, notification, channel, {
				useSandbox: USE_SANDBOX,
			});

			console.log(`📡 Broadcast ended for channel ${name} (${channelId})`);

			reply.send({
				success: true,
				channelId,
				channelName: name,
				message,
				subscribers: subscribers.size,
			});
		} catch (error) {
			console.error(`❌ Failed to end broadcast: ${error.message}`);
			reply.status(500).send({
				error: `Failed to end broadcast: ${error.message}`,
			});
		}
	});

	try {
		await fastify.listen({ port: 3000, host: "0.0.0.0" });

		console.log("\n🚀 Server is running on http://localhost:3000");
		console.log("\n📱 iOS App Endpoints:");
		console.log("   GET  /channels - List available channels");
		console.log("   POST /registration - Register device (via plugin)");
		console.log("   DELETE /registration - Unregister device (via plugin)");
		console.log("   POST /channels/:channelId/subscribe - Subscribe to channel");
		console.log("   DELETE /channels/:channelId/unsubscribe - Unsubscribe from channel");
		console.log("\n📡 Broadcast Endpoints:");
		console.log("   POST /broadcast/:channelId/start - Start Live Activity (push-to-start)");
		console.log("   POST /broadcast/:channelId/update - Update Live Activity (app-started)");
		console.log("   POST /broadcast/:channelId/end - End Live Activity");
		console.log("\n🔍 Management:");
		console.log("   GET /health - Server status");

		console.log("\n✨ Server is ready! Press Ctrl+C to stop.");

		// Return the fastify instance for cleanup
		return fastify;
	} catch (err) {
		console.error("❌ Error starting server:", err);
		process.exit(1);
	}
}

// Global server instance for cleanup
let serverInstance = null;

async function main() {
	console.log("🎯 Welcome to Broadcast Channel Manager!");

	// Auto-start the server in the background
	console.log("🔄 Starting HTTP server...");
	serverInstance = await startServer();
	console.log("✅ Server started! You can now use the CLI while the server runs.");

	while (true) {
		try {
			const choice = await showMenu();

			switch (choice) {
				case "1":
					await createChannel();
					break;
				case "2":
					await listChannels();
					break;
				case "3":
					await deleteChannelInteractive();
					break;
				case "4":
					await sendBroadcastStart();
					break;
				case "5":
					await sendBroadcastUpdate();
					break;
				case "6":
					console.log("👋 Goodbye!");
					rl.close();
					await gracefulShutdown();
				default:
					console.log("❌ Invalid option. Please choose 1-6.");
			}
		} catch (error) {
			console.error("❌ An error occurred:", error.message);
		}
	}
}

// Handle graceful shutdown
async function gracefulShutdown() {
	console.log("\n👋 Shutting down gracefully...");
	rl.close();

	if (serverInstance) {
		console.log("🔄 Stopping server...");
		try {
			await serverInstance.close();
			console.log("✅ Server stopped successfully");
		} catch (error) {
			console.error("❌ Error stopping server:", error.message);
		}
	}

	process.exit(0);
}

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

// Start the application
main().catch(async (error) => {
	console.error("❌ Fatal error:", error);
	if (serverInstance) {
		try {
			await serverInstance.close();
		} catch (closeError) {
			console.error("❌ Error closing server:", closeError.message);
		}
	}
	process.exit(1);
});
