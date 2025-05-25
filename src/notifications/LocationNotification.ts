import type { Notification, NotificationDetails } from "./notification.js";
/**
 * Empty interface on purpose to allow for TS
 * autocompletion to be extended by the user.
 * Must be exported to allow extending in the user's code.
 */
export interface NotificationCustomData {}

export function LocationNotification(
	topic: string,
	data: NotificationDetails<Record<string, string>, NotificationCustomData>,
): Notification<Record<string, string>, NotificationCustomData> {
	const { expiration = 0, collapseID, priority = 10 } = data;

	return {
		pushType: "location",
		get topic() {
			if (typeof topic !== "string") {
				throw new TypeError("Topic must be a string");
			}

			if (topic.endsWith(".location-query")) {
				return topic;
			}

			return `${topic}.location-query`;
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
