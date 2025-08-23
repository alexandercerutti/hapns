import type { APSBody, Notification } from "../notifications/notification.js";

type APSObject = APSBody<Record<string, string>>;

interface ApnsFileContent extends APSObject {
	"Simulator Target Bundle": string;
}

/**
 * This function generates the content of an .apns file
 * ready for the Simulator. The only step missing is writing
 * on a file to be either pushed or dragged.
 *
 * Although, this seems to be working only for alert notifications.
 *
 * @see https://developer.apple.com/documentation/watchos-apps/testing-custom-notification-interfaces#Create-a-payload-file
 *
 * Please note that, starting Xcode 14, Simulator supports
 * notifications through APNS in the sandbox environment.
 *
 * @see https://developer.apple.com/documentation/xcode-release-notes/xcode-14-release-notes#Simulator
 */

export function apns<N extends Notification<APSObject>>(notification: N): string {
	const body: ApnsFileContent = {
		...notification.body,
		"Simulator Target Bundle": notification.topic,
	};

	return JSON.stringify(body);
}
