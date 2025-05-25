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
 * Create a notification about an incoming VoIP call through PushKit.
 *
 * @param topic The topic of the notification. It will be suffixed, if needed, with `.voip`.
 * @param data
 * @returns
 */
export function VoipNotification(
	topic: string,
	data: NotificationData,
): Notification<Record<string, string>> {
	const { expiration = 0, collapseID, priority = 10 } = data;

	return {
		pushType: "voip",
		get topic() {
			if (typeof topic !== "string") {
				throw new TypeError("Topic must be a string");
			}

			if (topic.endsWith(".voip")) {
				return topic;
			}

			return `${topic}.voip`;
		},
		body: {
			aps: {},
		},
		expiration,
		collapseID,
		priority,
	};
}
