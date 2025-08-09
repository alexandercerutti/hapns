import { test } from "node:test";
import assert from "node:assert";
import { send } from "hapns/send";
import { Device } from "hapns/targets/device";
import { AlertNotification } from "hapns/notifications/AlertNotification";
import { BackgroundNotification } from "hapns/notifications/BackgroundNotification";
import { LocationNotification } from "hapns/notifications/LocationNotification";
import * as mockUtils from "./mock/index.mjs";

test("Send Function", async (t) => {
	await t.test("should send basic alert notification successfully", async () => {
		const mockConnector = mockUtils.connectors.createMockConnector();
		const device = Device("abc123xyz456");
		const notification = AlertNotification("com.example.app", {
			payload: {
				alert: {
					title: "Test Title",
					body: "Test Body",
				},
			},
		});

		const result = await send(mockConnector, notification, device);

		// Verify result
		assert.strictEqual(result.apnsId, "mock-apns-id-123");
		assert.strictEqual(typeof result.apnsId, "string");

		// Verify request was made correctly
		mockUtils.assertions.assertRequestCount(mockConnector, 1);
		mockUtils.assertions.assertLastRequestPath(mockConnector, "/3/device/abc123xyz456");

		const lastRequest = mockUtils.assertions.getLastRequest(mockConnector);
		assert.strictEqual(lastRequest.method, "POST");
		assert.strictEqual(lastRequest.headers["apns-topic"], "com.example.app");
		assert.strictEqual(lastRequest.headers["apns-push-type"], "alert");

		// Verify payload structure
		const requestBody =
			typeof lastRequest.body === "string" ? JSON.parse(lastRequest.body) : lastRequest.body;
		assert.deepStrictEqual(requestBody.aps.alert, {
			title: "Test Title",
			body: "Test Body",
		});
	});

	await t.test("should send background notification successfully", async () => {
		const mockConnector = mockUtils.connectors.createMockConnector();

		const device = Device("background123");
		const notification = BackgroundNotification("com.example.app", {
			appData: {
				updateType: "content",
				version: "1.2.0",
			},
		});

		const result = await send(mockConnector, notification, device);

		assert.strictEqual(result.apnsId, "mock-apns-id-123");
		mockUtils.assertions.assertRequestCount(mockConnector, 1);
		mockUtils.assertions.assertLastRequestPath(mockConnector, "/3/device/background123");

		const lastRequest = mockUtils.assertions.getLastRequest(mockConnector);
		assert.strictEqual(lastRequest.headers["apns-push-type"], "background");

		const requestBody =
			typeof lastRequest.body === "string" ? JSON.parse(lastRequest.body) : lastRequest.body;

		assert.strictEqual(requestBody.aps["content-available"], 1);
		assert.deepStrictEqual(requestBody.updateType, "content");
		assert.deepStrictEqual(requestBody.version, "1.2.0");
	});
	await t.test("should handle sandbox environment correctly", async () => {
		const mockConnector = mockUtils.connectors.createMockConnector();
		const device = Device("sandbox123");
		const notification = AlertNotification("com.example.app", {
			payload: {
				alert: { body: "Sandbox test" },
			},
		});

		await send(mockConnector, notification, device, { useSandbox: true });

		const lastRequest = mockUtils.assertions.getLastRequest(mockConnector);
		assert.ok(lastRequest.baseUrl.includes("sandbox"));

		// For sandbox alert notifications, should include Simulator Target Bundle
		const requestBody =
			typeof lastRequest.body === "string" ? JSON.parse(lastRequest.body) : lastRequest.body;
		assert.strictEqual(requestBody["Simulator Target Bundle"], "com.example.app");
	});

	await t.test("should handle production environment correctly", async () => {
		const mockConnector = mockUtils.connectors.createMockConnector();
		const device = Device("production123");
		const notification = AlertNotification("com.example.app", {
			payload: {
				alert: { body: "Production test" },
			},
		});

		await send(mockConnector, notification, device, { useSandbox: false });

		const lastRequest = mockUtils.assertions.getLastRequest(mockConnector);
		assert.ok(!lastRequest.baseUrl.includes("sandbox"));

		// Should not include Simulator Target Bundle in production
		const requestBody =
			typeof lastRequest.body === "string" ? JSON.parse(lastRequest.body) : lastRequest.body;

		assert.strictEqual(requestBody["Simulator Target Bundle"], undefined);
	});

	await t.test("should include custom apnsId when provided", async () => {
		const mockConnector = mockUtils.connectors.createMockConnector();
		const device = Device("custom123");
		const notification = AlertNotification("com.example.app", {
			payload: { alert: { body: "Custom ID test" } },
		});
		const customId = "my-custom-id-12345";

		await send(mockConnector, notification, device, { apnsId: customId });

		const lastRequest = mockUtils.assertions.getLastRequest(mockConnector);
		assert.strictEqual(lastRequest.headers["apns-id"], customId);
	});

	await t.test("should set correct notification headers", async () => {
		const mockConnector = mockUtils.connectors.createMockConnector();
		const device = Device("headers123");
		const notification = AlertNotification("com.example.app", {
			payload: { alert: { body: "Headers test" } },
			priority: 10,
			expiration: 1234567890,
			collapseID: "collapse-123",
		});

		await send(mockConnector, notification, device);

		mockUtils.assertions.assertLastRequestHeaders(mockConnector, {
			"apns-topic": "com.example.app",
			"apns-push-type": "alert",
			"apns-priority": "10",
			"apns-expiration": "1234567890",
			"apns-collapse-id": "collapse-123",
		});
	});

	await t.test("should throw error for invalid connector", async () => {
		const device = Device("test123");
		const notification = AlertNotification("com.example.app", {
			payload: { alert: { body: "Test" } },
		});

		await assert.rejects(() => send(null, notification, device), /CONNECTOR_INVALID_ERROR/);

		await assert.rejects(() => send({}, notification, device), /CONNECTOR_INVALID_ERROR/);
	});

	await t.test("should throw error for invalid notification", async () => {
		const mockConnector = mockUtils.connectors.createMockConnector();
		const device = Device("test123");

		await assert.rejects(() => send(mockConnector, null, device), /NOTIFICATION_INVALID_ERROR/);

		await assert.rejects(() => send(mockConnector, {}, device), /TOPIC_PUSH_TYPE_INVALID_ERROR/);
	});

	await t.test("should throw error for invalid target", async () => {
		const mockConnector = mockUtils.connectors.createMockConnector();
		const notification = AlertNotification("com.example.app", {
			payload: { alert: { body: "Test" } },
		});

		await assert.rejects(() => send(mockConnector, notification, null), /TARGET_INVALID_ERROR/);
	});

	await t.test("should throw error for unsupported connector type", async () => {
		// Create a connector with Certificate type (0b001)
		const incompatibleConnector = mockUtils.connectors.createMockConnector();
		incompatibleConnector.connectionType = 0b001;

		const device = Device("test123");
		// LocationNotification only supports Token connectors (0b010), not Certificate
		const notification = LocationNotification("com.example.app", {});

		await assert.rejects(
			() => send(incompatibleConnector, notification, device),
			/UNSUPPORTED_CONNECTOR_ERROR/,
		);
	});

	await t.test("should handle network errors gracefully", async () => {
		const errorConnector = mockUtils.networkErrors.timeout("/3/device/network-error");

		const device = Device("network-error");
		const notification = AlertNotification("com.example.app", {
			payload: { alert: { body: "Test" } },
		});

		await assert.rejects(() => send(errorConnector, notification, device), /Network timeout/);
	});
});
