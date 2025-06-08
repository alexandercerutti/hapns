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

export function MDMNotification(
	topic: string,
	data: NotificationData,
): Notification<Record<string, string>> {
	assertTopicProvided(topic);

	const { expiration = 0, collapseID, priority = 10 } = data;

	return {
		pushType: "mdm",
		topic,
		body: {
			aps: {},
		},
		expiration,
		collapseID,
		priority,
	};
}
