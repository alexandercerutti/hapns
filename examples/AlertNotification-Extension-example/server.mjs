// @ts-check

/**
 * @instructions
 *
 * This example requires setting up, first, an application that registers
 * for push notifications. You can use one provided in the examples folder.
 *
 * Both APNS Topic and Device Token will be provided to this server upon
 * app device registration.
 *
 * Device registration will happen on the start of the example application.
 * The address of the server is set as an environment variable in the Swift
 * application, in order for the app to use the same protocol as tests.
 *
 * You'll also need to set, in the configuration area below, the path to
 * the token key you generated from Apple Developer portal, not provided
 * with the examples (ofc).
 *
 * Right now, it is set to an actual path (in author's machine), relative to
 * the project and current file.
 *
 * The key ID and team ID are also required. Key ID will be provided with token
 * generation.
 *
 * Finally, if you are running an application through Xcode, you'll likely
 * be forced using the sandbox environment (development). For this reason,
 * the flag USE_SANDBOX is set to true by default.
 */

import { AlertNotification } from "hapns/notifications/AlertNotification";
import { Device } from "hapns/targets/device";
import { TokenConnector } from "hapns/connectors/token";
import { send } from "hapns/send";
import fs from "node:fs";
import Fastify from "fastify";
import { DeviceRegistrationPlugin } from "@hapns-internal/utils/device-registration";
import { EventBusPlugin } from "@hapns-internal/utils/event-bus";
import { createCipheriv, createHash, randomBytes } from "node:crypto";

// ************************** //
// *** CONFIGURATION AREA *** //
// ************************** //

const TOKEN_KEY_PATH = "../../certificates/token/APNS_AuthKey_6WB99KX6YJ.p8";

const KEY_ID = "6WB99KX6YJ";
const TEAM_ID = "F53WB8AE67";

const USE_SANDBOX = true;

// ****************************** //
// *** END CONFIGURATION AREA *** //
// ****************************** //

const fastify = Fastify({
	logger: true,
});

await fastify.register(EventBusPlugin);
await fastify.register(DeviceRegistrationPlugin);

try {
	await fastify.listen({ host: "0.0.0.0", port: 8571 });
	console.log(`Device registration server is running at http://0.0.0.0:8571`);
} catch (err) {
	console.error(err);
	process.exit(1);
}

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

const eventBus = fastify.getDecorator("eventBus");

eventBus.on("device-registration", async (data) => {
	console.log(`Device registered: ${data.deviceId} with token ${data.deviceToken}`, data);

	const device = Device(data.deviceToken);

	const notification = AlertNotification(data.apnsTopic, {
		payload: {
			alert: {
				title: "Hello World",
				body: "This is a test notification",
			},
			sound: "default",
			badge: 0,
			/**
			 * This is needed for Notification Service Extension to activate
			 */
			mutableContent: true,
			/**
			 * This is the category identifier for the notification
			 * needed for Notification Extension to activate
			 */
			category: "MY_REGISTERED_CATEGORY_1",
		},
		appData: {
			encrypted: encryptMessage("Hapns is great!"),
		},
		priority: 10,
	});

	const sendReply = await send(connector, notification, device, { useSandbox: USE_SANDBOX });

	console.log(sendReply);
});

const SECRET_KEY_32B_AES256 = "my-32-character-ultra-secret-key!";
const key = createHash("sha256").update(String(SECRET_KEY_32B_AES256)).digest().subarray(0, 32);

/**
 * @param {string} text
 * @returns {{ data: string, iv: string, authTag: string }}
 */
function encryptMessage(text) {
	const iv = randomBytes(12);
	const cipher = createCipheriv("aes-256-gcm", key, iv);

	let encrypted = cipher.update(text, "utf8", "base64");
	encrypted += cipher.final("base64");

	const authTag = cipher.getAuthTag();

	return {
		data: encrypted,
		iv: iv.toString("base64"),
		authTag: authTag.toString("base64"),
	};
}
