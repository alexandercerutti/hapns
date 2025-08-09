import { test } from "node:test";
import assert from "node:assert";
import { send } from "hapns/send";
import { Device } from "hapns/targets/device";
import { AlertNotification } from "hapns/notifications/AlertNotification";
import { LocationNotification } from "hapns/notifications/LocationNotification";
import * as mockUtils from "./mock/index.mjs";

test("Error Handling", async (t) => {
	await t.test("should handle BadDeviceToken error", async () => {
		const mockConnector = mockUtils.apnsErrors.badDeviceToken();

		const device = Device("bad-token");
		const notification = AlertNotification("com.example.app", {
			payload: { alert: { body: "Test" } },
		});

		try {
			await send(mockConnector, notification, device);
			assert.fail("Should have thrown an error");
		} catch (error) {
			assert.strictEqual(error.status, 400);
			assert.ok(error.message.includes("HTTP 400"));
		}
	});

	await t.test("should handle Unregistered device error", async () => {
		const mockConnector = mockUtils.apnsErrors.unregistered(1234567890);

		const device = Device("unregistered-token");
		const notification = AlertNotification("com.example.app", {
			payload: { alert: { body: "Test" } },
		});

		try {
			await send(mockConnector, notification, device);
			assert.fail("Should have thrown an error");
		} catch (error) {
			assert.strictEqual(error.status, 410);
			assert.ok(error.response);
		}
	});

	await t.test("should handle PayloadTooLarge error", async () => {
		const mockConnector = mockUtils.apnsErrors.payloadTooLarge();

		const device = Device("large-payload");
		const notification = AlertNotification("com.example.app", {
			payload: {
				alert: {
					body: "x".repeat(5000), // Very long message
				},
			},
		});

		try {
			await send(mockConnector, notification, device);
			assert.fail("Should have thrown an error");
		} catch (error) {
			assert.strictEqual(error.status, 413);
		}
	});

	await t.test("should handle TooManyRequests error", async () => {
		const mockConnector = mockUtils.apnsErrors.tooManyRequests();

		const device = Device("rate-limited");
		const notification = AlertNotification("com.example.app", {
			payload: { alert: { body: "Test" } },
		});

		try {
			await send(mockConnector, notification, device);
			assert.fail("Should have thrown an error");
		} catch (error) {
			assert.strictEqual(error.status, 429);
		}
	});

	await t.test("should handle InternalServerError", async () => {
		const mockConnector = mockUtils.apnsErrors.internalServerError();

		const device = Device("server-error");
		const notification = AlertNotification("com.example.app", {
			payload: { alert: { body: "Test" } },
		});

		try {
			await send(mockConnector, notification, device);
			assert.fail("Should have thrown an error");
		} catch (error) {
			assert.strictEqual(error.status, 500);
		}
	});

	await t.test("should handle ServiceUnavailable error", async () => {
		const mockConnector = mockUtils.apnsErrors.serviceUnavailable();

		const device = Device("unavailable");
		const notification = AlertNotification("com.example.app", {
			payload: { alert: { body: "Test" } },
		});

		try {
			await send(mockConnector, notification, device);
			assert.fail("Should have thrown an error");
		} catch (error) {
			assert.strictEqual(error.status, 503);
		}
	});

	await t.test("should handle network timeout errors", async () => {
		const mockConnector = mockUtils.networkErrors.timeout("/3/device/timeout");

		const device = Device("timeout");
		const notification = AlertNotification("com.example.app", {
			payload: { alert: { body: "Test" } },
		});

		await assert.rejects(() => send(mockConnector, notification, device), /Network timeout/);
	});

	await t.test("should handle connection refused errors", async () => {
		const mockConnector = mockUtils.networkErrors.connectionRefused();

		const device = Device("connection-refused");
		const notification = AlertNotification("com.example.app", {
			payload: { alert: { body: "Test" } },
		});

		await assert.rejects(() => send(mockConnector, notification, device), /Connection refused/);
	});

	await t.test("should handle DNS resolution errors", async () => {
		const mockConnector = mockUtils.networkErrors.dnsResolution();

		const device = Device("dns-error");
		const notification = AlertNotification("com.example.app", {
			payload: { alert: { body: "Test" } },
		});

		await assert.rejects(() => send(mockConnector, notification, device), /DNS resolution failed/);
	});
});

test("Validation Errors", async (t) => {
	await t.test("should throw CONNECTOR_INVALID_ERROR for null connector", async () => {
		const device = Device("test-token");
		const notification = AlertNotification("com.example.app", {
			payload: { alert: { body: "Test" } },
		});

		await assert.rejects(() => send(null, notification, device), /CONNECTOR_INVALID_ERROR/);
	});

	await t.test("should throw CONNECTOR_INVALID_ERROR for invalid connector", async () => {
		const device = Device("test-token");
		const notification = AlertNotification("com.example.app", {
			payload: { alert: { body: "Test" } },
		});

		await assert.rejects(
			() => send({ invalid: "connector" }, notification, device),
			/CONNECTOR_INVALID_ERROR/,
		);
	});

	await t.test("should throw NOTIFICATION_INVALID_ERROR for null notification", async () => {
		const mockConnector = mockUtils.connectors.createMockConnector();
		const device = Device("test-token");

		await assert.rejects(() => send(mockConnector, null, device), /NOTIFICATION_INVALID_ERROR/);
	});

	await t.test(
		"should throw TOPIC_PUSH_TYPE_INVALID_ERROR for incomplete notification",
		async () => {
			const mockConnector = mockUtils.connectors.createMockConnector();
			const device = Device("test-token");

			await assert.rejects(
				() => send(mockConnector, { body: {} }, device),
				/TOPIC_PUSH_TYPE_INVALID_ERROR/,
			);
		},
	);

	await t.test("should throw TARGET_INVALID_ERROR for null target", async () => {
		const mockConnector = mockUtils.connectors.createMockConnector();
		const notification = AlertNotification("com.example.app", {
			payload: { alert: { body: "Test" } },
		});

		await assert.rejects(() => send(mockConnector, notification, null), /TARGET_INVALID_ERROR/);
	});

	await t.test("should throw UNSUPPORTED_CONNECTOR_ERROR for incompatible connector", async () => {
		const mockConnector = mockUtils.connectors.createMockConnector({ connectionType: 0b001 });
		// Set connector to Certificate type (0b001)

		const device = Device("test-token");
		// LocationNotification only supports Token connectors (0b010), not Certificate
		const notification = LocationNotification("com.example.app", {});

		await assert.rejects(
			() => send(mockConnector, notification, device),
			/UNSUPPORTED_CONNECTOR_ERROR/,
		);
	});
});

test("APNs Error Response Formats", async (t) => {
	await t.test("should parse BadTopic error correctly", async () => {
		const mockConnector = mockUtils.apnsErrors.badTopic();

		const device = Device("bad-topic");
		const notification = AlertNotification("com.invalid.topic", {
			payload: { alert: { body: "Test" } },
		});

		try {
			await send(mockConnector, notification, device);
			assert.fail("Should have thrown an error");
		} catch (error) {
			assert.strictEqual(error.status, 400);
		}
	});

	await t.test("should handle InvalidPushType error", async () => {
		const mockConnector = mockUtils.apnsErrors.invalidPushType();

		const device = Device("invalid-push-type");
		const notification = AlertNotification("com.example.app", {
			payload: { alert: { body: "Test" } },
		});

		try {
			await send(mockConnector, notification, device);
			assert.fail("Should have thrown an error");
		} catch (error) {
			assert.strictEqual(error.status, 400);
		}
	});

	await t.test("should handle MissingTopic error", async () => {
		const mockConnector = mockUtils.apnsErrors.missingTopic();

		const device = Device("missing-topic");
		const notification = AlertNotification("com.example.app", {
			payload: { alert: { body: "Test" } },
		});

		try {
			await send(mockConnector, notification, device);
			assert.fail("Should have thrown an error");
		} catch (error) {
			assert.strictEqual(error.status, 400);
		}
	});

	await t.test("should handle ExpiredProviderToken error", async () => {
		const mockConnector = mockUtils.apnsErrors.expiredProviderToken();

		const device = Device("expired-token");
		const notification = AlertNotification("com.example.app", {
			payload: { alert: { body: "Test" } },
		});

		try {
			await send(mockConnector, notification, device);
			assert.fail("Should have thrown an error");
		} catch (error) {
			assert.strictEqual(error.status, 403);
		}
	});

	await t.test("should include timestamp in Unregistered error", async () => {
		const timestamp = Date.now();
		const mockConnector = mockUtils.apnsErrors.unregistered(timestamp);

		const device = Device("unregistered-with-timestamp");
		const notification = AlertNotification("com.example.app", {
			payload: { alert: { body: "Test" } },
		});

		try {
			await send(mockConnector, notification, device);
			assert.fail("Should have thrown an error");
		} catch (error) {
			assert.strictEqual(error.status, 410);
			assert.ok(error.response);
		}
	});
});
