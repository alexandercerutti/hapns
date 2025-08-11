import { test } from "node:test";
import assert from "node:assert";
import { readAllChannels, createBroadcastChannel, deleteChannel } from "hapns/channels/broadcast";
import * as mockUtils from "./mock/index.mjs";

test("Broadcast Channels", async (t) => {
	await t.test("should read all broadcast channels correctly", async () => {
		const mockChannels = ["channel-1", "channel-2", "channel-3"];
		const mockConnector = mockUtils.broadcastChannels.mockReadAllChannels(
			"com.example.app",
			mockChannels,
		);

		const channels = await readAllChannels(mockConnector, "com.example.app");

		assert.strictEqual(channels.length, 3);
		assert.deepStrictEqual(
			channels.map((channel) => channel.channelId),
			mockChannels,
		);

		// Verify the request was made correctly
		const lastRequest = mockUtils.assertions.getLastRequest(mockConnector);
		assert.strictEqual(lastRequest.method, "GET");
		assert.ok(lastRequest.requestPath.includes("/1/apps/com.example.app/all-channels"));
	});

	await t.test("should handle empty channels list", async () => {
		const mockConnector = mockUtils.broadcastChannels.mockReadAllChannels("com.example.app", []);

		const channels = await readAllChannels(mockConnector, "com.example.app");

		assert.strictEqual(channels.length, 0);
		assert.deepStrictEqual(channels, []);
	});

	await t.test("should create a broadcast channel correctly", async () => {
		const channelId = "Y2hhbm5lbC0xMjM="; // base64 encoded channel ID
		const mockConnector = mockUtils.broadcastChannels.mockChannelCreation(
			"com.example.app",
			channelId,
		);

		const result = await createBroadcastChannel(mockConnector, {
			bundleId: "com.example.app",
			useSandbox: true,
			apnsRequestId: "custom-request-123",
		});

		// createBroadcastChannel returns a BroadcastChannel object, not a success object
		assert.strictEqual(result.channelId, channelId);
		assert.strictEqual(result.bundleId, "com.example.app");

		// Verify the request was made correctly
		const lastRequest = mockUtils.assertions.getLastRequest(mockConnector);
		assert.strictEqual(lastRequest.method, "POST");
		assert.ok(lastRequest.requestPath.includes("/1/apps/com.example.app/channels"));
		assert.strictEqual(lastRequest.headers["apns-request-id"], "custom-request-123");
		assert.ok(lastRequest.baseUrl.includes("sandbox"));
	});

	await t.test("should create broadcast channel in production", async () => {
		const channelId = "cHJvZC1jaGFubmVs";
		const mockConnector = mockUtils.broadcastChannels.mockChannelCreation(
			"com.example.app",
			channelId,
		);

		const result = await createBroadcastChannel(mockConnector, {
			bundleId: "com.example.app",
			useSandbox: false,
		});

		assert.strictEqual(result.channelId, channelId);
		assert.strictEqual(result.bundleId, "com.example.app");

		// Verify production URL was used
		const lastRequest = mockUtils.assertions.getLastRequest(mockConnector);
		assert.ok(!lastRequest.baseUrl.includes("sandbox"));
	});

	await t.test("should delete a broadcast channel correctly", async () => {
		const mockBroadcastChannel = {
			channelId: "Y2hhbm5lbC1pZA==",
			bundleId: "com.example.app",
		};
		const mockConnector = mockUtils.broadcastChannels.mockChannelDeletion(
			"com.example.app",
			"delete-channel-123",
		);

		const result = await deleteChannel(mockConnector, mockBroadcastChannel, {
			useSandbox: true,
			apnsRequestId: "delete-request-123",
		});

		assert.strictEqual(result.success, true);
		assert.strictEqual(result.apnsRequestId, "delete-channel-123");

		// Verify the request was made correctly
		const lastRequest = mockUtils.assertions.getLastRequest(mockConnector);
		assert.strictEqual(lastRequest.method, "DELETE");
		assert.ok(lastRequest.requestPath.includes("/1/apps/com.example.app/channels"));
		assert.strictEqual(lastRequest.headers["apns-channel-id"], "Y2hhbm5lbC1pZA==");
		assert.strictEqual(lastRequest.headers["apns-request-id"], "delete-request-123");
	});

	await t.test("should handle channel creation errors", async () => {
		const mockConnector = mockUtils.apnsErrors.badRequest(
			"POST",
			"/1/apps/com.example.app/channels",
		);

		try {
			await createBroadcastChannel(mockConnector, {
				bundleId: "com.example.app",
				useSandbox: true,
			});
			assert.fail("Should have thrown an error");
		} catch (error) {
			assert.strictEqual(error.status, 400);
		}
	});

	await t.test("should handle channel deletion errors", async () => {
		const mockConnector = mockUtils.connectors.createMockConnectorWithApnsError(
			"DELETE",
			"/1/apps/com.example.app/channels",
			404,
			"ChannelNotFound",
		);
		const mockBroadcastChannel = {
			channelId: "invalid-channel",
			bundleId: "com.example.app",
		};

		try {
			await deleteChannel(mockConnector, mockBroadcastChannel, {
				useSandbox: true,
			});
			assert.fail("Should have thrown an error");
		} catch (error) {
			assert.strictEqual(error.status, 404);
		}
	});

	await t.test("should validate broadcast channel object", async () => {
		const mockConnector = mockUtils.connectors.createMockConnectorWithResponse(
			"DELETE",
			"/1/apps/com.example.app/channels",
			{
				headers: { "apns-request-id": "valid-delete-123" },
				status: 200,
			},
		);

		// Test with invalid channel object
		await assert.rejects(
			() => deleteChannel(mockConnector, null, { useSandbox: true }),
			/INVALID_BROADCAST_CHANNEL_ERROR/,
		);

		await assert.rejects(
			() => deleteChannel(mockConnector, {}, { useSandbox: true }),
			/INVALID_BROADCAST_CHANNEL_ERROR/,
		);

		await assert.rejects(
			() => deleteChannel(mockConnector, { channelId: "test" }, { useSandbox: true }),
			/INVALID_BROADCAST_CHANNEL_ERROR/,
		);
	});

	await t.test("should handle different bundle ID formats", async () => {
		const bundleIds = [
			"com.example.app",
			"com.company-name.app-name",
			"com.enterprise.internal.app",
			"org.opensource.project",
		];

		for (const bundleId of bundleIds) {
			const mockConnector = mockUtils.broadcastChannels.mockReadAllChannels(bundleId, []);

			const channels = await readAllChannels(mockConnector, bundleId);
			assert.strictEqual(channels.length, 0);

			const lastRequest = mockUtils.assertions.getLastRequest(mockConnector);
			assert.ok(lastRequest.requestPath.includes(`/1/apps/${bundleId}/all-channels`));
		}
	});

	await t.test("should handle network errors gracefully", async () => {
		const mockConnector = mockUtils.networkErrors.timeout("/1/apps/com.example.app/all-channels");

		await assert.rejects(
			() => readAllChannels(mockConnector, "com.example.app"),
			/Network timeout/,
		);
	});

	await t.test("should handle malformed response data", async () => {
		const mockConnector = mockUtils.connectors.createMockConnectorWithResponse(
			"GET",
			"/1/apps/com.example.app/all-channels",
			{
				headers: { "apns-id": "malformed-123" },
				status: 200,
				body: {
					json: async () => ({ invalid: "format" }),
				},
			},
		);

		// Should throw an error when channels property is missing
		await assert.rejects(() => readAllChannels(mockConnector, "com.example.app"), /TypeError/);
	});
});
