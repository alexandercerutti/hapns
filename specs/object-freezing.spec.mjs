import { strict as assert } from "node:assert";
import test from "node:test";
import { AlertNotification } from "../lib/notifications/AlertNotification.js";
import { BackgroundNotification } from "../lib/notifications/BackgroundNotification.js";
import { ComplicationNotification } from "../lib/notifications/ComplicationNotification.js";
import { VoipNotification } from "../lib/notifications/VoipNotification.js";
import { WidgetNotification } from "../lib/notifications/WidgetNotification.js";

test("Object Freezing", async (t) => {
	await t.test("AlertNotification should create frozen objects", () => {
		const notification = AlertNotification("com.example.app", {
			payload: {
				alert: "Test message",
				badge: 5,
				sound: "default",
			},
		});

		// Test that body object is frozen
		assert.ok(Object.isFrozen(notification.body));
		assert.ok(Object.isFrozen(notification.body.aps));

		// Test that we cannot modify the frozen objects
		assert.throws(() => {
			notification.body.newProperty = "should fail";
		}, /TypeError|Cannot add property/);

		assert.throws(() => {
			notification.body.aps.newProperty = "should fail";
		}, /TypeError|Cannot add property/);

		assert.throws(() => {
			notification.body.aps.badge = 999;
		}, /TypeError|Cannot assign to read only property/);
	});

	await t.test("BackgroundNotification should create frozen objects", () => {
		const notification = BackgroundNotification("com.example.app", {});

		assert.ok(Object.isFrozen(notification.body));
		assert.ok(Object.isFrozen(notification.body.aps));

		assert.throws(() => {
			notification.body.aps["content-available"] = 0;
		}, /TypeError|Cannot assign to read only property/);
	});

	await t.test("ComplicationNotification should create frozen objects", () => {
		const notification = ComplicationNotification("com.example.app", {});

		assert.ok(Object.isFrozen(notification.body));
		assert.ok(Object.isFrozen(notification.body.aps));

		assert.throws(() => {
			notification.body.aps.newProperty = "should fail";
		}, /TypeError|Cannot add property/);
	});

	await t.test("VoipNotification should create frozen objects", () => {
		const notification = VoipNotification("com.example.app.voip", {});

		assert.ok(Object.isFrozen(notification.body));
		assert.ok(Object.isFrozen(notification.body.aps));
	});

	await t.test("WidgetNotification should create frozen objects", () => {
		const notification = WidgetNotification("com.example.app", {
			appData: { customKey: "customValue" },
		});

		assert.ok(Object.isFrozen(notification.body));
		assert.ok(Object.isFrozen(notification.body.aps));

		// Test that appData is included but body is still frozen
		assert.strictEqual(notification.body.customKey, "customValue");
		assert.throws(() => {
			notification.body.customKey = "modified";
		}, /TypeError|Cannot assign to read only property/);
	});

	await t.test("AlertNotification with appData should merge and freeze correctly", () => {
		const notification = AlertNotification("com.example.app", {
			payload: {
				alert: "Test",
			},
			appData: {
				customKey: "customValue",
				nestedObject: { prop: "value" },
			},
		});

		assert.ok(Object.isFrozen(notification.body));
		assert.ok(Object.isFrozen(notification.body.aps));

		// Test that appData is merged correctly
		assert.strictEqual(notification.body.customKey, "customValue");
		assert.deepStrictEqual(notification.body.nestedObject, { prop: "value" });

		// Test that we cannot modify merged properties
		assert.throws(() => {
			notification.body.customKey = "modified";
		}, /TypeError|Cannot assign to read only property/);

		// With deep freezing, nested objects from appData are also frozen
		assert.throws(() => {
			notification.body.nestedObject.prop = "modified";
		}, /TypeError|Cannot assign to read only property/);
	});

	await t.test("Empty alert should create frozen objects", () => {
		const notification = AlertNotification("com.example.app", {
			payload: {
				alert: {},
			},
		});

		assert.ok(Object.isFrozen(notification.body));
		assert.ok(Object.isFrozen(notification.body.aps));
		assert.ok(Object.isFrozen(notification.body.aps.alert));
	});
});
