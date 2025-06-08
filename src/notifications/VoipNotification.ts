import { assertTopicProvided } from "../errors/assertions/topic-provided.js";
import type { Notification, NotificationBody, NotificationHeaders } from "./notification.js";
/**
 * Empty interface on purpose to allow for TS
 * autocompletion to be extended by the user.
 * Must be exported to allow extending in the user's code.
 */
export interface NotificationCustomData {}

type NotificationData = NotificationHeaders &
	NotificationBody<Record<string, string>, NotificationCustomData>;

const TOPIC_SUFFIX = ".voip";

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
	assertTopicProvided(topic);

	const { expiration = 0, collapseID, priority = 10 } = data;

	return {
		pushType: "voip",
		get topic() {
			if (topic.endsWith(TOPIC_SUFFIX)) {
				return topic;
			}

			return `${topic}${TOPIC_SUFFIX}`;
		},
		body: {
			aps: {},
		},
		expiration,
		collapseID,
		priority,
	};
}
