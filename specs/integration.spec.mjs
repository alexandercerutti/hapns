import { test } from "node:test";
import assert from "node:assert";
import { send } from "hapns/send";
import { Device } from "hapns/targets/device";
import { BroadcastChannel } from "hapns/targets/broadcastchannel";
import { AlertNotification } from "hapns/notifications/AlertNotification";
import { BackgroundNotification } from "hapns/notifications/BackgroundNotification";
import { LiveActivityNotification } from "hapns/notifications/LiveActivityNotification";
import * as mockUtils from "./mock/index.mjs";

// Integration Tests - Testing components working together
test("Integration Tests", async (t) => {
	await t.test("should send alert notification to device successfully", async () => {
		// Setup
		const mockConnector = mockUtils.connectors.createMockConnector();
		const device = Device("abc123def456");
		const notification = AlertNotification("com.example.app", {
			payload: {
				alert: {
					title: "Breaking News",
					body: "Something important happened",
					badge: 5,
				},
				sound: "default",
			},
			priority: 10,
			expiration: Date.now() + 3600000, // 1 hour from now
		});

		// Execute
		const result = await send(mockConnector, notification, device, {
			useSandbox: true,
			apnsId: "integration-test-123",
		});

		// Verify
		assert.strictEqual(result.apnsId, "mock-apns-id-123");

		const request = mockUtils.assertions.getLastRequest(mockConnector);
		assert.strictEqual(request.method, "POST");
		assert.strictEqual(request.requestPath, "/3/device/abc123def456");
		assert.ok(request.baseUrl.includes("sandbox"));

		// Verify headers
		assert.strictEqual(request.headers["apns-topic"], "com.example.app");
		assert.strictEqual(request.headers["apns-push-type"], "alert");
		assert.strictEqual(request.headers["apns-priority"], "10");
		assert.strictEqual(request.headers["apns-id"], "integration-test-123");

		// Verify payload
		const payload = typeof request.body === "string" ? JSON.parse(request.body) : request.body;

		assert.deepStrictEqual(payload.aps.alert, {
			title: "Breaking News",
			body: "Something important happened",
			badge: 5,
		});
		assert.strictEqual(payload.aps.sound, "default");
		assert.strictEqual(payload["Simulator Target Bundle"], "com.example.app");
	});

	await t.test("should send background notification in production", async () => {
		const mockConnector = mockUtils.connectors.createMockConnector();
		const device = Device("prod123def456");
		const notification = BackgroundNotification("com.example.app", {
			appData: {
				updateType: "content",
				version: "2.1.0",
				metadata: { timestamp: Date.now() },
			},
			priority: 5,
		});

		const result = await send(mockConnector, notification, device, {
			useSandbox: false,
		});

		assert.strictEqual(result.apnsId, "mock-apns-id-123");

		const request = mockUtils.assertions.getLastRequest(mockConnector);
		assert.ok(!request.baseUrl.includes("sandbox"));
		assert.strictEqual(request.headers["apns-push-type"], "background");
		assert.strictEqual(request.headers["apns-priority"], "5");

		const payload = typeof request.body === "string" ? JSON.parse(request.body) : request.body;

		assert.strictEqual(payload.aps["content-available"], 1);
		assert.strictEqual(payload.updateType, "content");
		assert.strictEqual(payload.version, "2.1.0");
		assert.strictEqual(payload["Simulator Target Bundle"], undefined);
	});

	await t.test("should send live activity notification with update", async () => {
		const mockConnector = mockUtils.connectors.createMockConnector();
		const device = Device("liveactivity123");
		const notification = LiveActivityNotification("com.example.delivery", {
			payload: {
				event: "update",
				contentState: {
					driverName: "John Doe",
					estimatedDeliveryTime: Date.now() + 1800000, // 30 minutes
					currentLocation: "Downtown",
				},
				alert: {
					title: "Delivery Update",
					body: "Your driver is 5 minutes away",
				},
			},
		});

		const result = await send(mockConnector, notification, device);

		assert.strictEqual(result.apnsId, "mock-apns-id-123");

		const request = mockUtils.assertions.getLastRequest(mockConnector);
		assert.strictEqual(request.headers["apns-push-type"], "liveactivity");

		const payload = typeof request.body === "string" ? JSON.parse(request.body) : request.body;

		assert.strictEqual(payload.aps.event, "update");
		assert.deepStrictEqual(payload.aps["content-state"], {
			driverName: "John Doe",
			estimatedDeliveryTime: notification.body.aps["content-state"].estimatedDeliveryTime,
			currentLocation: "Downtown",
		});
		assert.deepStrictEqual(payload.aps.alert, {
			title: "Delivery Update",
			body: "Your driver is 5 minutes away",
			sound: "default",
		});
	});

	await t.test("should handle multiple notifications to same device", async () => {
		const mockConnector = mockUtils.connectors.createMockConnector();
		const device = Device("multi123");

		// First notification
		const notification1 = AlertNotification("com.example.app", {
			payload: { alert: { body: "First message" } },
		});

		// Second notification
		const notification2 = AlertNotification("com.example.app", {
			payload: { alert: { body: "Second message" } },
		});

		const result1 = await send(mockConnector, notification1, device);
		const result2 = await send(mockConnector, notification2, device);

		assert.strictEqual(result1.apnsId, "mock-apns-id-123");
		assert.strictEqual(result2.apnsId, "mock-apns-id-123");
		mockUtils.assertions.assertRequestCount(mockConnector, 2);

		const requests = mockUtils.assertions.getRequests(mockConnector);
		assert.strictEqual(requests[0].requestPath, "/3/device/multi123");
		assert.strictEqual(requests[1].requestPath, "/3/device/multi123");
	});

	await t.test("should handle broadcast channel creation and notification", async () => {
		// Note: This test simulates the workflow, actual broadcast channel notifications
		// would require the channel to be created first
		const mockConnector = mockUtils.connectors.createMockConnector();
		const channelId = "Y2hhbm5lbC0xMjM=";
		const bundleId = "com.example.app";

		const channel = BroadcastChannel(channelId, bundleId);
		const notification = AlertNotification(bundleId, {
			payload: {
				alert: {
					title: "Broadcast Update",
					body: "New content available for all users",
				},
			},
		});

		const result = await send(mockConnector, notification, channel);

		assert.strictEqual(result.apnsId, "mock-apns-id-123");

		const request = mockUtils.assertions.getLastRequest(mockConnector);
		assert.strictEqual(request.requestPath, "/4/device/com.example.app");
		assert.strictEqual(request.headers["apns-channel-id"], channelId);
		assert.strictEqual(request.headers["apns-topic"], bundleId);
	});

	await t.test("should handle error scenarios gracefully", async () => {
		// Setup error scenario
		const mockConnector = mockUtils.apnsErrors.badDeviceToken();

		const device = Device("error-device");
		const notification = AlertNotification("com.example.app", {
			payload: {
				alert: {
					body: "Test",
				},
			},
		});

		// Should throw error but not crash
		try {
			await send(mockConnector, notification, device);
			assert.fail("Should have thrown an error");
		} catch (error) {
			assert.strictEqual(error.status, 400);

			// Verify request was still made
			const request = mockUtils.assertions.getLastRequest(mockConnector);
			assert.ok(request.requestPath.includes("/3/device/"));
		}
	});

	await t.test("should validate complete workflow with custom settings", async () => {
		const mockConnector = mockUtils.connectors.createMockConnector();
		const device = Device("workflow123");
		const notification = AlertNotification("com.example.workflow", {
			payload: {
				alert: {
					title: "Workflow Test",
					body: "Testing complete workflow",
					badge: 1,
				},
				sound: "notification.wav",
				category: "WORKFLOW_CATEGORY",
			},
			priority: 10,
			expiration: Date.now() + 7200000, // 2 hours
			collapseID: "workflow-update",
		});

		const customSettings = {
			useSandbox: true,
			apnsId: "custom-workflow-id-456",
		};

		const result = await send(mockConnector, notification, device, customSettings);

		assert.strictEqual(result.apnsId, "mock-apns-id-123");

		const request = mockUtils.assertions.getLastRequest(mockConnector);

		// Verify all settings were applied
		assert.ok(request.baseUrl.includes("sandbox"));
		assert.strictEqual(request.headers["apns-id"], "custom-workflow-id-456");
		assert.strictEqual(request.headers["apns-priority"], "10");
		assert.strictEqual(request.headers["apns-collapse-id"], "workflow-update");
		assert.strictEqual(request.headers["apns-expiration"], String(notification.expiration));

		const payload = typeof request.body === "string" ? JSON.parse(request.body) : request.body;

		assert.strictEqual(payload.aps.category, "WORKFLOW_CATEGORY");
		assert.strictEqual(payload.aps.sound, "notification.wav");
		assert.strictEqual(payload.aps.alert.badge, 1);
	});
});

// Performance and Edge Case Tests
test("Performance and Edge Cases", async (t) => {
	await t.test("should handle large notification payloads", async () => {
		const mockConnector = mockUtils.connectors.createMockConnector();
		const device = Device("large-payload");

		// Create a notification with large custom data
		const largeData = {
			items: Array.from({ length: 100 }, (_, i) => ({
				id: i,
				name: `Item ${i}`,
				description: `This is a detailed description for item ${i}`.repeat(5),
			})),
		};

		const notification = AlertNotification("com.example.app", {
			payload: { alert: { body: "Large payload test" } },
			appData: largeData,
		});

		const result = await send(mockConnector, notification, device);
		assert.strictEqual(result.apnsId, "mock-apns-id-123");

		const request = mockUtils.assertions.getLastRequest(mockConnector);
		const payload = typeof request.body === "string" ? JSON.parse(request.body) : request.body;

		assert.strictEqual(payload.items.length, 100);
	});

	await t.test("should handle concurrent notifications", async () => {
		const mockConnector = mockUtils.connectors.createMockConnector();
		const devices = [Device("concurrent1"), Device("concurrent2"), Device("concurrent3")];

		const notification = AlertNotification("com.example.app", {
			payload: { alert: { body: "Concurrent test" } },
		});

		// Send notifications concurrently
		const promises = devices.map((device) => send(mockConnector, notification, device));

		const results = await Promise.all(promises);

		assert.strictEqual(results.length, 3);
		results.forEach((result) => {
			assert.strictEqual(result.apnsId, "mock-apns-id-123");
		});

		mockUtils.assertions.assertRequestCount(mockConnector, 3);
	});

	await t.test("should handle various device token formats", async () => {
		const mockConnector = mockUtils.connectors.createMockConnector();
		const tokenFormats = [
			"abc123def456", // Short hex
			"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", // 64 char hex
			"ABCDEF1234567890abcdef1234567890ABCDEF1234567890abcdef1234567890", // Mixed case
		];

		const notification = AlertNotification("com.example.app", {
			payload: { alert: { body: "Token format test" } },
		});

		for (const token of tokenFormats) {
			const device = Device(token);
			const result = await send(mockConnector, notification, device);

			assert.strictEqual(result.apnsId, "mock-apns-id-123");

			const request = mockUtils.assertions.getLastRequest(mockConnector);
			assert.strictEqual(request.requestPath, `/3/device/${token}`);
		}
	});
});
