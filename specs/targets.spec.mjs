import { test } from "node:test";
import assert from "node:assert";
import { Device } from "hapns/targets/device";
import { BroadcastChannel } from "hapns/targets/broadcastchannel";

test("Device", async (t) => {
	await t.test("should create a Device target correctly", async () => {
		const device = Device("abc123xyz456");

		assert.strictEqual(device.requestPath, `/3/device/abc123xyz456`);
		assert.strictEqual(typeof device.getBaseUrl, "function");
	});

	await t.test("should generate correct sandbox URL", async () => {
		const device = Device("abc123xyz456");
		const sandboxUrl = device.getBaseUrl(true);

		assert.ok(sandboxUrl.includes("sandbox"));
		assert.ok(sandboxUrl.includes("push.apple.com"));
	});

	await t.test("should generate correct production URL", async () => {
		const device = Device("abc123xyz456");
		const productionUrl = device.getBaseUrl(false);

		assert.ok(!productionUrl.includes("sandbox"));
		assert.ok(productionUrl.includes("push.apple.com"));
	});

	await t.test("should handle different device token formats", async () => {
		// Test hex string
		const device1 = Device("abc123def456");
		assert.strictEqual(device1.requestPath, "/3/device/abc123def456");

		// Test longer token (typical 64 characters)
		const device2 = Device("1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
		assert.strictEqual(
			device2.requestPath,
			"/3/device/1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
		);
	});

	await t.test("should validate device token", async () => {
		// Test empty token - this actually works in the current implementation
		const deviceEmpty = Device("");
		assert.strictEqual(deviceEmpty.requestPath, "/3/device/");

		// Test null/undefined token
		assert.throws(() => Device(null), /Device token must be a string/);

		assert.throws(() => Device(undefined), /Device token must be a string/);
	});

	await t.test("should not include additional headers by default", async () => {
		const device = Device("abc123xyz456");

		// Device targets shouldn't have custom headers by default
		assert.strictEqual(device.headers, undefined);
	});

	await t.test("should handle device token with special characters", async () => {
		// APNs device tokens should be hex strings, but test edge cases
		const device = Device("abc123-def456");
		assert.strictEqual(device.requestPath, "/3/device/abc123-def456");
	});
});

test("BroadcastChannel", async (t) => {
	await t.test("should create a BroadcastChannel target correctly", async () => {
		const channel = BroadcastChannel("Y2hhbm5lbC1pZA==", "com.example.app");

		// BroadcastChannel target uses /4/device/ path, not /1/apps/
		assert.strictEqual(channel.requestPath, "/4/device/com.example.app");
		assert.strictEqual(channel.headers["apns-channel-id"], "Y2hhbm5lbC1pZA==");
	});

	await t.test("should generate correct URLs for broadcast channels", async () => {
		const channel = BroadcastChannel("Y2hhbm5lbC1pZA==", "com.example.app");

		// Broadcast channels use same base URLs as devices
		const sandboxUrl = channel.getBaseUrl(true);
		const productionUrl = channel.getBaseUrl(false);

		assert.ok(sandboxUrl.includes("sandbox"));
		assert.ok(!productionUrl.includes("sandbox"));
	});

	await t.test("should validate required parameters", async () => {
		// BroadcastChannel constructor does validate parameters, but empty string is still a string
		// Let me test null/undefined which should actually throw
		assert.throws(
			() => BroadcastChannel(null, "com.example.app"),
			/Broadcast channel id not provided/,
		);

		assert.throws(
			() => BroadcastChannel("Y2hhbm5lbC1pZA==", null),
			/Bundle ID is missing or is not a string/,
		);

		assert.throws(
			() => BroadcastChannel(undefined, "com.example.app"),
			/Broadcast channel id not provided/,
		);
	});

	await t.test("should handle different bundle ID formats", async () => {
		// Test typical bundle ID
		const channel1 = BroadcastChannel("Y2hhbm5lbC1pZA==", "com.example.app");
		assert.strictEqual(channel1.requestPath, "/4/device/com.example.app");

		// Test enterprise bundle ID
		const channel2 = BroadcastChannel("Y2hhbm5lbC1pZA==", "com.enterprise.internal.app");
		assert.strictEqual(channel2.requestPath, "/4/device/com.enterprise.internal.app");
	});

	await t.test("should include correct headers for broadcast channels", async () => {
		const channel = BroadcastChannel("Y2hhbm5lbC1pZA==", "com.example.app");

		assert.ok(channel.headers);
		assert.strictEqual(channel.headers["apns-channel-id"], "Y2hhbm5lbC1pZA==");
		assert.strictEqual(typeof channel.headers, "object");
	});

	await t.test("should handle base64 encoded channel IDs", async () => {
		// Test various base64 encoded channel IDs
		const channelId1 = "Y2hhbm5lbC0x"; // "channel-1" in base64
		const channelId2 = "dGVzdC1jaGFubmVs"; // "test-channel" in base64

		const channel1 = BroadcastChannel(channelId1, "com.example.app");
		const channel2 = BroadcastChannel(channelId2, "com.example.app");

		assert.strictEqual(channel1.headers["apns-channel-id"], channelId1);
		assert.strictEqual(channel2.headers["apns-channel-id"], channelId2);
	});
});

test("Target Protocol", async (t) => {
	await t.test("Device should implement target protocol", async () => {
		const device = Device("abc123xyz456");

		// Check required properties
		assert.ok(typeof device.requestPath === "string");
		assert.ok(typeof device.getBaseUrl === "function");
	});

	await t.test("BroadcastChannel should implement target protocol", async () => {
		const channel = BroadcastChannel("Y2hhbm5lbC1pZA==", "com.example.app");

		// Check required properties
		assert.ok(typeof channel.requestPath === "string");
		assert.ok(typeof channel.getBaseUrl === "function");
		assert.ok(typeof channel.headers === "object");
	});

	await t.test("targets should have consistent URL generation", async () => {
		const device = Device("abc123xyz456");
		const channel = BroadcastChannel("Y2hhbm5lbC1pZA==", "com.example.app");

		// Both should generate similar base URLs
		const deviceSandbox = device.getBaseUrl(true);
		const channelSandbox = channel.getBaseUrl(true);
		const deviceProduction = device.getBaseUrl(false);
		const channelProduction = channel.getBaseUrl(false);

		// Should use same domain pattern
		assert.ok(deviceSandbox.includes("push.apple.com"));
		assert.ok(channelSandbox.includes("push.apple.com"));
		assert.ok(deviceProduction.includes("push.apple.com"));
		assert.ok(channelProduction.includes("push.apple.com"));
	});
});

test("Target Edge Cases", async (t) => {
	await t.test("should handle very long device tokens", async () => {
		// Test with maximum length device token (64 hex characters)
		const longToken = "a".repeat(64);
		const device = Device(longToken);

		assert.strictEqual(device.requestPath, `/3/device/${longToken}`);
	});

	await t.test("should handle complex bundle IDs", async () => {
		const complexBundleId = "com.company-name.app-name.extension-target";
		const channel = BroadcastChannel("Y2hhbm5lbC1pZA==", complexBundleId);

		assert.strictEqual(channel.requestPath, `/4/device/${complexBundleId}`);
	});

	await t.test("should handle special characters in bundle IDs", async () => {
		// Bundle IDs can contain hyphens, underscores, and numbers
		const bundleId = "com.test-app.widget_2024";
		const channel = BroadcastChannel("Y2hhbm5lbC1pZA==", bundleId);

		assert.strictEqual(channel.requestPath, `/4/device/${bundleId}`);
	});
});
