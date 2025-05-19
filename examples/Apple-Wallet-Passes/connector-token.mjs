// @ts-check

/**
 * This example requires setting up, first, a server that integrates with
 * Apple Wallet Web Services. You can use one of the samples provided in
 * [passkit-webservice-toolkit](https://github.com/alexandercerutti/passkit-webservice-toolkit),
 * through fastify or express, to make it work. Samples might be placed in
 * the `specs` folder.
 *
 * Logs will print the pushToken, which will have to be the one against which
 * you will send the notification.
 *
 * Push token should be set in the `DEVICE_TOKEN` constant below.
 *
 * Then, change the topic to APNS topic to reflect the passTypeIdentifier
 * of the pass you are going to update.
 *
 * Serial numbers will be provided by the server process you set up.
 */

import { AlertNotification } from "hapns/notifications/AlertNotification";
import { Device } from "hapns/targets/device";
import { TokenConnector } from "hapns/connectors/token";
import { send } from "hapns/send";
import fs from "node:fs";

/**
 * @TODO Obtain the device token from the registration of the pass.
 */
const DEVICE_TOKEN = "";

/**
 * This topic is the `passTypeIdentifier` of the pass.
 */
const APNS_TOPIC = "pass.com.passkitgenerator";

/******/

const device = Device(DEVICE_TOKEN);

const connector = TokenConnector({
	/**
	 * This is the key you generated in the Apple Developer Portal
	 *
	 * @see https://developer.apple.com/documentation/usernotifications/establishing-a-token-based-connection-to-apns
	 * @see https://developer.apple.com/account/resources/authkeys/list
	 */
	key: new Uint8Array(fs.readFileSync("../certificates/token/APNS_AuthKey_6WB99KX6YJ.p8")),
	keyId: "6WB99KX6YJ",
	teamIdentifier: "F53WB8AE67",
});

const notification = AlertNotification(APNS_TOPIC, {});

/**
 * A set timeout here is set to give you some time
 * to breathe before sending the notification.
 *
 * I used this time to record the screen and the
 * iPhone receiving the notification.
 */
setTimeout(async () => {
	console.log(await send(connector, notification, device));
}, 3000);
