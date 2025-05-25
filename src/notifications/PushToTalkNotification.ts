import type { Notification, NotificationBody, NotificationHeaders } from "./notification.js";
/**
 * Empty interface on purpose to allow for TS
 * autocompletion to be extended by the user.
 * Must be exported to allow extending in the user's code.
 */
export interface NotificationCustomData {}

type NotificationData = NotificationHeaders &
	NotificationBody<Record<string, string>, NotificationCustomData>;

/**
 * Create a Push-to-Talk notification.
 *
 * @param topic The topic of the notification. It will be suffixed, if needed, with `.voip-ptt`.
 * @param data
 * @returns
 */
export function PushToTalkNotification(
	topic: string,
	data: NotificationData,
): Notification<Record<string, string>> {
	const { expiration = 0, collapseID, priority = 10 } = data;

	return {
		pushType: "pushtotalk",
		get topic() {
			if (typeof topic !== "string") {
				throw new TypeError("Topic must be a string");
			}

			if (topic.endsWith(".voip-ptt")) {
				return topic;
			}

			return `${topic}.voip-ptt`;
		},
		body: {
			aps: {},
		},
		expiration,
		collapseID,
		priority,
	};
}
