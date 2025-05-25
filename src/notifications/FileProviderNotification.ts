import type { Notification, NotificationBody, NotificationHeaders } from "./notification.js";

/**
 * Empty interface on purpose to allow for TS
 * autocompletion to be extended by the user.
 * Must be exported to allow extending in the user's code.
 */
export interface NotificationCustomData {}

type NotificationData = NotificationHeaders &
	NotificationBody<Record<string, string>, NotificationCustomData>;

const TOPIC_SUFFIX = ".pushkit.fileprovider";

/**
 * Creates a notification about an update to a file provider extension.
 *
 * @param topic The topic of the notification. It will be suffixed, if needed, with `.pushkit.fileprovider`.
 * @param data
 * @returns
 */
export function FileProviderNotification(
	topic: string,
	data: NotificationData,
): Notification<Record<string, string>> {
	if (!topic || typeof topic !== "string") {
		throw new TypeError("Cannot create notification: topic must be a non-empty string.");
	}

	const { expiration = 0, collapseID, priority = 10 } = data;

	return {
		pushType: "fileprovider",
		get topic() {
			if (topic.endsWith(TOPIC_SUFFIX)) {
				return topic;
			}

			return `${topic}${TOPIC_SUFFIX}`;
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
