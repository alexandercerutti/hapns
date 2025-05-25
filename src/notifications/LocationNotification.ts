import type { Notification, NotificationBody, NotificationHeaders } from "./notification.js";
/**
 * Empty interface on purpose to allow for TS
 * autocompletion to be extended by the user.
 * Must be exported to allow extending in the user's code.
 */
export interface NotificationCustomData {}

/**
 * "If the location query requires an immediate response from the
 * Location Push Service Extension, set notification apns-priority
 * to 10; otherwise, use 5"
 */
type LocationAllowedPriorities = 5 | 10;

type NotificationData = NotificationHeaders<LocationAllowedPriorities> &
	NotificationBody<Record<string, string>, NotificationCustomData>;

export function LocationNotification(
	topic: string,
	data: NotificationData,
): Notification<Record<string, string>, LocationAllowedPriorities> {
	const { expiration = 0, collapseID, priority = 5 } = data;

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
