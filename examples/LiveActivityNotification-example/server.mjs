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

import Fastify from "fastify";

import fs from "node:fs";

const fastify = Fastify({
	logger: true,
});

function createActivity() {
	return {
		contentState: {
			progress: 0.0,
			statusMessage: "Starting",
		},
		update(progress, statusMessage = this.statusMessage) {
			return Object.create(this, {
				contentState: {
					value: {
						progress,
						statusMessage,
					},
					enumerable: true,
				},
			});
		},
	};
}

/**
 * Obtain the push to start token from the request for push to start
 * live activity in the application. In example app, it will
 * be printed in the console after a few seconds of running the app.
 *
 * PTS usage is subject to a budget per device per bundle id (around 10 usages)
 * before the reset, which is scheduled and cannot - at the moment - be forced.
 *
 * @see https://developer.apple.com/documentation/activitykit/starting-and-updating-live-activities-with-activitykit-push-notifications#Start-new-Live-Activities-with-ActivityKit-push-notifications
 *
 * @param {string} pushToStartToken
 * @param {*} activity
 * @returns
 *
 */
function withPTST(pushToStartToken, activity) {
	return Object.create(activity, {
		pushToStartToken: {
			value: pushToStartToken,
			enumerable: true,
		},
	});
}

/**
 * @TODO Obtain the device token from the request for
 * the live activity in the application. It will be sent
 * through a POST request to this server.
 *
 * @param {string} deviceToken
 * @param {*} activity
 * @returns
 */

function withDeviceToken(deviceToken, activity) {
	return Object.create(activity, {
		deviceToken: {
			value: deviceToken,
			enumerable: true,
		},
	});
}

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

/******/

let CURRENT_ACTIVITY = null;

console.log("Server app is listening for requests.");
console.log(
	"Start iOS App and start the activity. You can send both the commands to start remote activity or local activity that is updated remotely.",
);
console.log(
	"Starting the server will make the application to send the push tokens to the server. Updates will be sent automatically.",
);

fastify.post("/push-to-start-token", async (request, reply) => {
	reply.status(200).send({
		registered: true,
	});

	// @ts-ignore
	const nextPushToStartToken = request.body.token;

	if (CURRENT_ACTIVITY) {
		const { pushToStartToken } = CURRENT_ACTIVITY;

		if (pushToStartToken !== nextPushToStartToken) {
			CURRENT_ACTIVITY = withPTST(nextPushToStartToken, CURRENT_ACTIVITY);
		}

		if (nextPushToStartToken === pushToStartToken) {
			return;
		}

		CURRENT_ACTIVITY = withPTST(nextPushToStartToken, CURRENT_ACTIVITY);
		console.log("PTST update received. An activity has been already started.");

		return;
	} else {
		console.log("PTST update received. Starting a new activity.");

		CURRENT_ACTIVITY = withPTST(nextPushToStartToken, createActivity());

		/**
		 * Destructuring just to let it show the content of
		 * contentState, which must be the same as the one in the PrintingAttributes
		 */
		const { contentState } = CURRENT_ACTIVITY;
		const { progress, statusMessage } = contentState;

		const notification = LiveActivityNotification(APNS_TOPIC, {
			payload: {
				event: "start",
				attributes: {
					printName: "Bitchy boat",
					estimatedDuration: 65,
					startTime: Date.now() / 1000, // application expect seconds
				},
				contentState: {
					progress,
					statusMessage,
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

		const devicePushToStart = Device(nextPushToStartToken);

		console.log(
			await send(connector, notification, devicePushToStart, { useSandbox: USE_SANDBOX }),
		);
	}
});

fastify.post("/device-token-update", async (request, reply) => {
	reply.status(200).send({
		registered: true,
	});

	console.log("Request.body,", request.body);

	// @ts-ignore
	const nextDeviceToken = request.body.token;

	if (CURRENT_ACTIVITY && CURRENT_ACTIVITY.deviceToken) {
		if (nextDeviceToken === CURRENT_ACTIVITY.deviceToken) {
			return;
		}

		console.log("Device token update received. Activity already started.");
		CURRENT_ACTIVITY = withDeviceToken(nextDeviceToken, CURRENT_ACTIVITY);

		return;
	}

	CURRENT_ACTIVITY = withDeviceToken(nextDeviceToken, createActivity());

	console.log("Dispatching updates in the next seconds...");

	setTimeout(async () => {
		CURRENT_ACTIVITY = CURRENT_ACTIVITY.update(0.3, "In progress");

		const notification = LiveActivityNotification(APNS_TOPIC, {
			payload: {
				event: "update",
				contentState: CURRENT_ACTIVITY.contentState,
				alert: {
					title: "Live Activity Example",
					body: "This is a live activity example.",
					sound: "default",
				},
			},
			priority: 10,
		});

		const device = Device(CURRENT_ACTIVITY.deviceToken);

		console.log(await send(connector, notification, device, { useSandbox: USE_SANDBOX }));
	}, 3000);

	setTimeout(async () => {
		CURRENT_ACTIVITY = CURRENT_ACTIVITY.update(0.7, "In progress");

		const notification = LiveActivityNotification(APNS_TOPIC, {
			payload: {
				event: "update",
				contentState: CURRENT_ACTIVITY.contentState,
				alert: {
					title: "Live Activity Example",
					body: "This is a live activity example.",
					sound: "default",
				},
			},
			priority: 10,
		});

		const device = Device(CURRENT_ACTIVITY.deviceToken);

		console.log(await send(connector, notification, device, { useSandbox: USE_SANDBOX }));
	}, 10000);

	setTimeout(async () => {
		CURRENT_ACTIVITY = CURRENT_ACTIVITY.update(1.0, "Done");

		const notification = LiveActivityNotification(APNS_TOPIC, {
			payload: {
				event: "end",
				contentState: CURRENT_ACTIVITY.contentState,
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

		const device = Device(CURRENT_ACTIVITY.deviceToken);

		console.log(await send(connector, notification, device, { useSandbox: USE_SANDBOX }));

		CURRENT_ACTIVITY = undefined;
	}, 20000);
});

fastify.listen({ port: 3000, host: "0.0.0.0" }, (err, address) => {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}

	fastify.log.info(`Server listening at ${address}`);
});
