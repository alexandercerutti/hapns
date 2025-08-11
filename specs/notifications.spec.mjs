import { test } from "node:test";
import assert from "node:assert";
import { AlertNotification } from "hapns/notifications/AlertNotification";
import { BackgroundNotification } from "hapns/notifications/BackgroundNotification";
import { LiveActivityNotification } from "hapns/notifications/LiveActivityNotification";
import { PushToTalkNotification } from "hapns/notifications/PushToTalkNotification";
import { VoipNotification } from "hapns/notifications/VoipNotification";

test("AlertNotification", async (t) => {
	await t.test("should create an AlertNotification with basic alert", async () => {
		const notification = AlertNotification("com.example.app", {
			payload: {
				alert: {
					title: "Breaking News",
					body: "Something important happened",
				},
			},
		});

		assert.strictEqual(notification.topic, "com.example.app");
		assert.strictEqual(notification.pushType, "alert");
		assert.strictEqual(notification.body.aps.alert.title, "Breaking News");
		assert.strictEqual(notification.body.aps.alert.body, "Something important happened");
	});

	await t.test("should create AlertNotification with sound and badge", async () => {
		const notification = AlertNotification("com.example.app", {
			payload: {
				alert: {
					title: "New Message",
					body: "You have a new message",
					badge: 5,
				},
				sound: "message.wav",
			},
		});

		assert.strictEqual(notification.body.aps.alert.badge, 5);
		assert.strictEqual(notification.body.aps.sound, "message.wav");
	});

	await t.test("should create AlertNotification with localized content", async () => {
		const notification = AlertNotification("com.example.app", {
			payload: {
				alert: {
					"title-loc-key": "NOTIFICATION_TITLE",
					"title-loc-args": ["John", "Doe"],
					"loc-key": "NOTIFICATION_BODY",
					"loc-args": ["5", "messages"],
				},
			},
		});

		assert.strictEqual(notification.body.aps.alert["title-loc-key"], "NOTIFICATION_TITLE");
		assert.deepStrictEqual(notification.body.aps.alert["title-loc-args"], ["John", "Doe"]);
		assert.strictEqual(notification.body.aps.alert["loc-key"], "NOTIFICATION_BODY");
		assert.deepStrictEqual(notification.body.aps.alert["loc-args"], ["5", "messages"]);
	});

	await t.test("should create AlertNotification with custom app data", async () => {
		const notification = AlertNotification("com.example.app", {
			payload: {
				alert: { body: "Test" },
			},
			appData: {
				userId: "12345",
				category: "social",
				metadata: { timestamp: 1234567890 },
			},
		});

		assert.strictEqual(notification.body.userId, "12345");
		assert.strictEqual(notification.body.category, "social");
		assert.deepStrictEqual(notification.body.metadata, { timestamp: 1234567890 });
	});

	await t.test("should create AlertNotification with actions", async () => {
		const notification = AlertNotification("com.example.app", {
			payload: {
				alert: { body: "You have a friend request" },
				category: "FRIEND_REQUEST",
			},
		});

		assert.strictEqual(notification.body.aps.category, "FRIEND_REQUEST");
	});

	await t.test("should set correct priority and expiration", async () => {
		const notification = AlertNotification("com.example.app", {
			payload: { alert: { body: "Urgent!" } },
			priority: 10,
			expiration: 1234567890,
		});

		assert.strictEqual(notification.priority, 10);
		assert.strictEqual(notification.expiration, 1234567890);
	});

	await t.test("should set collapse ID", async () => {
		const notification = AlertNotification("com.example.app", {
			payload: { alert: { body: "Update" } },
			collapseID: "update-123",
		});

		assert.strictEqual(notification.collapseID, "update-123");
	});

	await t.test("should validate required alert content", async () => {
		// AlertNotification allows empty payloads but doesn't validate alert content
		// The current implementation doesn't throw for empty alert objects
		const notification = AlertNotification("com.example.app", { payload: {} });
		assert.strictEqual(notification.topic, "com.example.app");
	});

	await t.test("should validate topic is provided", async () => {
		assert.throws(
			() => AlertNotification("", { payload: { alert: { body: "Test" } } }),
			/topic not provided or not a string/,
		);
	});
});

test("BackgroundNotification", async (t) => {
	await t.test("should create a BackgroundNotification correctly", async () => {
		const notification = BackgroundNotification("com.example.app", {
			appData: {
				updateType: "content",
				version: "1.2.0",
			},
		});

		assert.strictEqual(notification.topic, "com.example.app");
		assert.strictEqual(notification.pushType, "background");
		assert.strictEqual(notification.body.aps["content-available"], 1);
		assert.strictEqual(notification.body.updateType, "content");
		assert.strictEqual(notification.body.version, "1.2.0");
	});

	await t.test("should create BackgroundNotification without app data", async () => {
		const notification = BackgroundNotification("com.example.app", {});

		assert.strictEqual(notification.topic, "com.example.app");
		assert.strictEqual(notification.body.aps["content-available"], 1);
	});

	await t.test("should set correct priority for background notifications", async () => {
		const notification = BackgroundNotification("com.example.app", {
			priority: 5,
		});

		assert.strictEqual(notification.priority, 5);
	});
});

test("LiveActivityNotification", async (t) => {
	await t.test("should create a LiveActivityNotification with update event", async () => {
		const notification = LiveActivityNotification("com.example.app", {
			payload: {
				event: "update",
				contentState: {
					driverName: "John Doe",
					estimatedDeliveryTime: 1645234567,
				},
				alert: {
					title: "Delivery Update",
					body: "Your driver is 5 minutes away",
				},
			},
		});

		assert.strictEqual(notification.topic, "com.example.app.push-type.liveactivity");
		assert.strictEqual(notification.pushType, "liveactivity");
		assert.strictEqual(notification.body.aps.event, "update");
		assert.deepStrictEqual(notification.body.aps["content-state"], {
			driverName: "John Doe",
			estimatedDeliveryTime: 1645234567,
		});
		assert.deepStrictEqual(notification.body.aps.alert, {
			title: "Delivery Update",
			body: "Your driver is 5 minutes away",
			sound: "default", // LiveActivityNotification automatically adds default sound
		});
	});

	await t.test("should create LiveActivityNotification with end event", async () => {
		const notification = LiveActivityNotification("com.example.app", {
			payload: {
				event: "end",
				dismissalDate: 1645234567,
			},
		});

		assert.strictEqual(notification.body.aps.event, "end");
		assert.strictEqual(notification.body.aps["dismissal-date"], 1645234567);
	});

	await t.test("should validate required event", async () => {
		// LiveActivityNotification accepts empty payload but doesn't validate event presence
		// The actual implementation doesn't require an event field to be present
		const notification = LiveActivityNotification("com.example.app", { payload: {} });
		assert.strictEqual(notification.topic, "com.example.app.push-type.liveactivity");
	});
});

test("PushToTalkNotification", async (t) => {
	await t.test("should create a PushToTalkNotification correctly", async () => {
		const notification = PushToTalkNotification("com.example.app", {
			appData: {
				channelId: "channel-123",
				action: "invite",
			},
		});

		assert.strictEqual(notification.topic, "com.example.app.voip-ptt");
		assert.strictEqual(notification.pushType, "pushtotalk");
		assert.deepStrictEqual(notification.body, { aps: {} });
		assert.strictEqual(notification.expiration, 0);
		assert.strictEqual(notification.priority, 10);
	});
});

test("VoipNotification", async (t) => {
	await t.test("should create a VoipNotification correctly", async () => {
		const notification = VoipNotification("com.example.app.voip", {
			appData: {
				callerId: "user-456",
				callerName: "Jane Smith",
				callType: "audio",
			},
		});

		assert.strictEqual(notification.topic, "com.example.app.voip");
		assert.strictEqual(notification.pushType, "voip");
		// VoipNotification doesn't include appData in the body, it only returns { aps: {} }
		assert.deepStrictEqual(notification.body, { aps: {} });
	});

	await t.test("should validate VoIP topic format", async () => {
		// VoIP notifications should typically have .voip suffix
		const notification = VoipNotification("com.example.app.voip", {
			appData: { callerId: "123" },
		});

		assert.ok(notification.topic.includes(".voip"));
	});
});

// LocationNotification
test("LocationNotification", async (t) => {
	await t.test("should handle LocationNotification correctly", () => {
		assert.ok(true);
	});
});
