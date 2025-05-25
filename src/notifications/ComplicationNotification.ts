import type { Notification, NotificationBody, NotificationHeaders } from "./notification.js";

/**
 * Empty interface on purpose to allow for TS
 * autocompletion to be extended by the user.
 * Must be exported to allow extending in the user's code.
 */
export interface NotificationCustomData {}

type NotificationData = NotificationHeaders &
	NotificationBody<Record<string, string>, NotificationCustomData>;

const TOPIC_SUFFIX = ".complication";

/**
 * Creates a notification for a WatchOS app complications to update.
 *
 * @param topic The topic of the notification. It will be suffixed, if needed, with `.complication`.
 * @param data
 * @returns
 */
export function ComplicationNotification(
	topic: string,
	data: NotificationData,
): Notification<Record<string, string>> {
	if (!topic || typeof topic !== "string") {
		throw new TypeError("Cannot create notification: topic must be a non-empty string.");
	}

	const { expiration = 0, collapseID, priority = 10 } = data;

	return {
		pushType: "complication",
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
