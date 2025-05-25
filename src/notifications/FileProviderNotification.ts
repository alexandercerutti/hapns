import type { Notification, NotificationDetails } from "./notification.js";

/**
 * Empty interface on purpose to allow for TS
 * autocompletion to be extended by the user.
 * Must be exported to allow extending in the user's code.
 */
export interface NotificationCustomData {}

/**
 * @param topic The topic of the notification. It will be suffixed, if needed, with `.pushkit.fileprovider`.
 * @param data
 * @returns
 */
export function FileProviderNotification(
	topic: string,
	data: NotificationDetails<Record<string, string>, NotificationCustomData>,
): Notification<Record<string, string>, NotificationCustomData> {
	const { expiration = 0, collapseID, priority = 10 } = data;

	return {
		pushType: "fileprovider",
		get topic() {
			if (typeof topic !== "string") {
				throw new TypeError("Topic must be a string");
			}

			if (topic.endsWith(".pushkit.fileprovider")) {
				return topic;
			}

			return `${topic}.pushkit.fileprovider`;
		},
		get body() {
			return {
				aps: {},
			};
		},
		expiration,
		collapseID,
		priority,
	};
}
