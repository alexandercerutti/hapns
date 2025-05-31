<div align="center">
	<br>
	<picture>
		<source media="(prefers-color-scheme: dark)"
			srcset="https://github.com/alexandercerutti/hapns/raw/master/assets/logo-dark.svg?sanitize=true"
			width="600"
		>
		<img
			width="600"
			alt="Passkit-generator logo for light mode"
			src="https://github.com/alexandercerutti/hapns/raw/master/assets/logo-light.svg?sanitize=true"
		>
	</picture>
	<br>
</div>

> [!CAUTION]
> This library is still in development and not production-ready yet. It lacks of support of some functionalities and complete examples, although everything is setup. Feedback and contributions are very welcome.

## Architecture

This library aims allowing creating and shipping APNs (Apple Push Notification service) notifications in a very easy way, providing great a Developer Experience.

This library is organized in modules so that a developer can import exclusively what it needs.

Notifications are organized by _Push-Type_, one function per _Push-Type_, one module per function.

Apple Wallet Passes update support is included.

Broadcast channels (iOS 18) are supported as well, with the functions needed to create, read, delete and get all the channels as per [Apple Developer Documentation](https://developer.apple.com/documentation/usernotifications/setting-up-broadcast-push-notifications).

## API Documentation

An extended API Documentation is available [in the wiki](https://github.com/alexandercerutti/hapns/wiki/API-Documentation-Reference). Where needed, repo folders include README files to specify details.

## Getting started with the right mental model

Other than single notification modules, you will need to import three more modules:

- `send` module
- a `connector` module
- a `NotificationTarget` module.

While the `send` module is a module that exports just the `send()` function to deliver the notification, the `connector` module to be imported depends on the way you want to authorize your delivery operations.

In fact, APNs supports two different way to authorize them, [tokens-based](https://developer.apple.com/documentation/usernotifications/establishing-a-token-based-connection-to-apns) connection and [certificate-based](https://developer.apple.com/documentation/usernotifications/establishing-a-certificate-based-connection-to-apns) connection.

This module exports two possible connectors: a `TokenConnector` and a `CertificateConnector`. A connector is made to accept the minimum required parameters to work.

Such connector will be then provided to the `send()`, along with the notification object, to deliver the notification to a specific `Device` or a `BroadcastChannel`.

Either `Device` and `BroadcastChannel` are valid notification targets exported by this library, which help composing the final APNs request. A `Device` object will accept a push notification token (or device token), while a `BroadcastChannel` will accept the `channelId`.

## Usage example

More complete examples, with iOS Apps, are available in the `example` folder in this repository. Refer to that for specific use cases, like Apple Wallet Passes update.

```js
import { AlertNotification } from "hapns/notifications/AlertNotification";
import { Device } from "hapns/targets/device";
import { TokenConnector } from "hapns/connectors/token";
import { send } from "hapns/send";

const TOKEN_KEY_PATH = "<your key path>";
const KEY_ID = "<your key id>";
const TEAM_ID = "<your team identifier>";
const DEVICE_TOKEN = "...";
const APNS_TOPIC = "<app bundle id>";
const USE_SANDBOX = true;

const p8key = new Uint8Array(fs.readFileSync(TOKEN_KEY_PATH));

const connector = TokenConnector({
	key: p8key,
	keyId: KEY_ID,
	teamIdentifier: TEAM_ID,
});

const device = Device(DEVICE_TOKEN);

const notification = AlertNotification(APNS_TOPIC, {
	payload: {
		alert: {
			title: "Hello World",
			body: "This is a test notification",
		},
		sound: "default",
		badge: 0,
	},
	appData: {
		myCustomData: "Hello World",
	},
	priority: 10,
});

const deliveryResponse = await send(connector, notification, device, USE_SANDBOX);

console.log(deliveryResponse);
```
