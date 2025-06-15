// @ts-check

/**
 * @instructions
 *
 * This example requires setting up, first, an application that registers
 * for push notifications. You can use one provided in the examples folder.
 *
 * Such application must provide a DEVICE_TOKEN. In case of example app,
 * it will be printed in the console.
 *
 * You'll need to set the APNS_TOPIC to the application's bundle identifier.
 *
 * You'll also need to set the path to the token key you generated from
 * Apple Developer portal, not provided with the examples (ofc). Right now,
 * it is set to an actual path (in author's machine), relative to the project
 * and current file.
 *
 * The key ID and team ID are also required. Key ID will be provided with token
 * generation.
 *
 * Finally, if you are running an application through Xcode, you'll likely
 * be forced using the sandbox environment (development). For this reason,
 * the flag USE_SANDBOX is set to true by default.
 *
 */

import { LiveActivityNotification } from "hapns/notifications/LiveActivityNotification";
import { Device } from "hapns/targets/device";
import { TokenConnector } from "hapns/connectors/token";
import { send } from "hapns/send";
import fs from "node:fs";

/**
 * @TODO Obtain the device token from the request for
 * the live activity in the application. In example app, it will
 * be printed in the console.
 */
const DEVICE_TOKEN = "";

/**
 * Obtain the push to start token from the request for push to start
 * live activity in the application. In example app, it will
 * be printed in the console after a few seconds of running the app.
 *
 * PTS usage is subject to a budget per device per bundle id (around 10 usages)
 * before the reset, which is scheduled and cannot - at the moment - be forced.
 *
 * @see https://developer.apple.com/documentation/activitykit/starting-and-updating-live-activities-with-activitykit-push-notifications#Start-new-Live-Activities-with-ActivityKit-push-notifications
 */
const PUSH_TO_START_TOKEN = "";

/**
 * @TODO This topic is the identifier of the app.
 */
const APNS_TOPIC = "com.alexandercerutti.la-example";

const TOKEN_KEY_PATH = "../../certificates/token/APNS_AuthKey_6WB99KX6YJ.p8";

const KEY_ID = "6WB99KX6YJ";
const TEAM_ID = "F53WB8AE67";

const USE_SANDBOX = true;

/******/

const device = Device(DEVICE_TOKEN);
const devicePushToStart = Device(PUSH_TO_START_TOKEN);

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

setTimeout(async () => {
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
		priority: 5,
	});

	console.log(await send(connector, notification, devicePushToStart, { useSandbox: USE_SANDBOX }));
}, 0);

setTimeout(async () => {
	const notification = LiveActivityNotification(APNS_TOPIC, {
		payload: {
			event: "update",
			contentState: {
				progress: 0.3,
				statusMessage: "In progress",
			},
			alert: {
				title: "Live Activity Example",
				body: "This is a live activity example.",
				sound: "default",
			},
		},
		priority: 10,
	});

	console.log(await send(connector, notification, device, { useSandbox: USE_SANDBOX }));
}, 1000);

setTimeout(async () => {
	const notification = LiveActivityNotification(APNS_TOPIC, {
		payload: {
			event: "update",
			contentState: {
				progress: 0.7,
				statusMessage: "In progress",
			},
			alert: {
				title: "Live Activity Example",
				body: "This is a live activity example.",
				sound: "default",
			},
		},
		priority: 10,
	});

	console.log(await send(connector, notification, device, { useSandbox: USE_SANDBOX }));
}, 3000);

setTimeout(async () => {
	const notification = LiveActivityNotification(APNS_TOPIC, {
		payload: {
			event: "end",
			contentState: {
				progress: 1.0,
				statusMessage: "Done",
			},
			relevanceScore: 1.0,
			staleDate: Date.now(),
			dismissalDate: Date.now() - 10,
			alert: {
				title: "Live Activity Example",
				body: "This is a live activity example.",
				sound: "default",
			},
		},
		priority: 10,
	});

	console.log(await send(connector, notification, device, { useSandbox: USE_SANDBOX }));
}, 5000);
