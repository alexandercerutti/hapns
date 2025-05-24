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

import { BackgroundNotification } from "hapns/notifications/BackgroundNotification";
import { Device } from "hapns/targets/device";
import { TokenConnector } from "hapns/connectors/token";
import { send } from "hapns/send";
import fs from "node:fs";

/**
 * @TODO Obtain the device token from the registration of the pass.
 */
const DEVICE_TOKEN = "";

/**
 * @TODO This topic is the identifier of the app.
 */
const APNS_TOPIC = "";

const TOKEN_KEY_PATH = "../certificates/token/APNS_AuthKey_6WB99KX6YJ.p8";

const KEY_ID = "6WB99KX6YJ";
const TEAM_ID = "F53WB8AE67";

const USE_SANDBOX = true;

/******/

const device = Device(DEVICE_TOKEN);

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

const notification = BackgroundNotification(APNS_TOPIC, {
	appData: {
		myCustomData: "Hello World",
	},
});

const sendReply = await send(connector, notification, device, USE_SANDBOX);

console.log(sendReply);
