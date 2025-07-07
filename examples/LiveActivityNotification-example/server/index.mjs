import Fastify from "fastify";
import { LiveActivityNotification } from "hapns/notifications/LiveActivityNotification";
import { Device } from "hapns/targets/device";
import { send } from "hapns/send";
import { TokenConnector } from "hapns/connectors/token";
import fs from "node:fs";
import { setInterval } from "node:timers/promises";

const PRINTER_ACTOR_ADDRESS = "http://localhost:3001";
const registeredDevices = new Map();
const jobsDevicesMap = new Map();
const devicesJobsMap = new Map();

// *********************** //
// *** PERSONALIZATION *** //
// *********************** //

/**
 * @TODO This topic is the identifier of the app.
 */
const APNS_TOPIC = "com.alexandercerutti.printing-application";

const TOKEN_KEY_PATH = "../../certificates/token/APNS_AuthKey_6WB99KX6YJ.p8";

const KEY_ID = "6WB99KX6YJ";
const TEAM_ID = "F53WB8AE67";

const USE_SANDBOX = true;

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

// *************************** //
// *** END PERSONALIZATION *** //
// *************************** //

const fastify = Fastify({
	logger: true,
});

fastify.head("/health", async (_, reply) => {
	reply.status(200).send({
		status: "ok",
	});
});

fastify.post("/register-device", async (request, reply) => {
	const { deviceId, deviceToken, pushToStartToken } = request.body;

	if (!deviceId) {
		return reply.status(400).send({
			error: "Device ID is required",
		});
	}

	if (!deviceToken && !pushToStartToken) {
		return reply.status(400).send({
			error: "Either device token or push to start token are required",
		});
	}

	const existingDevice = registeredDevices.get(deviceId);

	console.log(
		"Device registering",
		deviceId,
		`- ${existingDevice ? "already available" : "new"}`,
		request.body,
	);

	if (existingDevice) {
		registeredDevices.set(
			deviceId,
			Object.assign(existingDevice, {
				deviceToken: deviceToken || existingDevice.deviceToken,
				pushToStartToken: pushToStartToken || existingDevice.pushToStartToken,
			}),
		);

		return reply.status(200).send({
			registered: true,
		});
	}

	registeredDevices.set(deviceId, {
		deviceToken,
		pushToStartToken,
	});

	return reply.status(200).send({ registered: true });
});

async function waitForDeviceRegistration(deviceId) {
	if (registeredDevices.size) {
		return;
	}

	console.log("No registered devices found. Waiting for registration...");

	return new Promise((resolve) => {
		const interval = global.setInterval(() => {
			if (registeredDevices.has(deviceId)) {
				clearInterval(interval);
				resolve(registeredDevices.get(deviceId));
			}
		}, 1000);
	});
}

/**
 * This endpoint is meant to be called by the iOS application,
 * which will start the printing job and request updates
 * from the server.
 */
fastify.post("/print", async (request, reply) => {
	await waitForDeviceRegistration();

	const { deviceId } = request.body;

	if (!deviceId) {
		return reply.status(400).send({
			error: "Device ID is required",
		});
	}

	const response = await fetch(`${PRINTER_ACTOR_ADDRESS}/jobs/start`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			subscriptionUrl: `/subscription/jobs/%jobId%`,
		}),
	});

	if (!response.ok) {
		return reply.status(500).send({
			error: "Failed to start printing job. Printer actor crashed.",
		});
	}

	const { jobId } = await response.json();

	jobsDevicesMap.set(jobId, deviceId);
	devicesJobsMap.set(deviceId, jobId);

	reply.status(200).send({
		jobId,
	});
});

fastify.post("/subscription/jobs/:jobId", async (request, reply) => {
	const { jobId, status, contentState } = request.body;

	if (!jobId) {
		return reply.status(400).send({
			error: "Job ID is required",
		});
	}

	if (!jobsDevicesMap.has(jobId)) {
		return reply.status(404).send({
			error: "Job not found",
		});
	}

	if (typeof contentState !== "object" || contentState === null) {
		return reply.status(400).send({
			error: "Content state is required",
		});
	}

	const { progress, statusMessage } = contentState;

	if (typeof progress !== "number" || typeof statusMessage !== "string") {
		return reply.status(400).send({
			error: "Progress and status message are required",
		});
	}

	const deviceId = jobsDevicesMap.get(jobId);

	if (status === "completed") {
		jobsDevicesMap.delete(jobId);
		devicesJobsMap.delete(deviceId);

		const notification = LiveActivityNotification(APNS_TOPIC, {
			payload: {
				event: "end",
				contentState: {
					progress,
					statusMessage,
				},
				relevanceScore: 1.0,
				alert: {
					title: "Live Activity Completed",
					body: `Job ${jobId} is completed.`,
					sound: "default",
				},
			},
			priority: 10,
		});

		await send(connector, notification, Device(registeredDevices.get(deviceId).deviceToken), {
			useSandbox: USE_SANDBOX,
		});
		return;
	}

	const notification = LiveActivityNotification(APNS_TOPIC, {
		payload: {
			event: "update",
			contentState: {
				progress,
				statusMessage,
			},
			relevanceScore: 1.0,
			alert: {
				title: "Live Activity Update",
				body: `Job ${jobId} is ${Math.round(progress * 100)}% complete.`,
				sound: "default",
			},
		},
	});

	await send(connector, notification, Device(registeredDevices.get(deviceId).deviceToken), {
		useSandbox: USE_SANDBOX,
	});
	reply.status(200).send();
});

fastify.post("/start", async (request, reply) => {
	await waitForDeviceRegistration();

	reply.status(200).send();

	const { jobId } = request.body;

	registeredDevices.forEach(async (device, deviceId) => {
		jobsDevicesMap.set(jobId, deviceId);
		devicesJobsMap.set(deviceId, jobId);

		const notification = LiveActivityNotification(APNS_TOPIC, {
			payload: {
				event: "start",
				attributes: {
					printName: "Bitchy boat",
					estimatedDuration: 65,
					startTime: Date.now() / 1000, // application expect seconds
				},
				contentState: {
					progress: 0.0,
					statusMessage: "Starting",
				},
				relevanceScore: 1.0,
				attributesType: "PrintingAttributes",
				alert: {
					title: "Live Activity Example",
					body: "This is a live activity example.",
					sound: "default",
				},
			},
			priority: 10,
		});

		const devicePushToStart = Device(device.pushToStartToken);

		console.log(
			await send(connector, notification, devicePushToStart, { useSandbox: USE_SANDBOX }),
		);

		await new Promise((resolve) => {
			const interval = global.setInterval(() => {
				if (device.deviceToken) {
					clearInterval(interval);
					resolve();
				}
			}, 200);
		});

		/**
		 * Too Frequent updates are ignored by APNs
		 */
		for await (const _ of setInterval(4000, 10)) {
			const deviceObject = Device(device.deviceToken);

			const response = await fetch(`${PRINTER_ACTOR_ADDRESS}/jobs/${jobId}`);

			const {
				job: { contentState, status },
			} = await response.json();

			const { progress, statusMessage } = contentState;

			if (status === "completed") {
				jobsDevicesMap.delete(jobId);
				devicesJobsMap.delete(deviceId);

				const notification = LiveActivityNotification(APNS_TOPIC, {
					payload: {
						event: "end",
						contentState: {
							progress,
							statusMessage,
						},
						relevanceScore: 1.0,
						alert: {
							title: "Live Activity Completed",
							body: `Job ${jobId} is completed.`,
							sound: "default",
						},
					},
					priority: 10,
				});

				console.log(
					await send(connector, notification, deviceObject, {
						useSandbox: USE_SANDBOX,
					}),
				);

				return;
			}

			const notification = LiveActivityNotification(APNS_TOPIC, {
				payload: {
					event: "update",
					contentState: {
						progress,
						statusMessage,
					},
					relevanceScore: 1.0,
					alert: {
						title: "Live Activity Update",
						body: `Job ${jobId} is ${Math.round(progress * 100)}% complete.`,
						sound: "default",
					},
				},
			});

			console.log(
				await send(connector, notification, deviceObject, {
					useSandbox: USE_SANDBOX,
				}),
			);
		}
	});
});

fastify.listen({ port: 3000, host: "0.0.0.0" }, (err, address) => {
	if (err) {
		console.error("Error starting server:", err);
		process.exit(1);
	}

	console.log(`Server is running on ${address}`);
});
