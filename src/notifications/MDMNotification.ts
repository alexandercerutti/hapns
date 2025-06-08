import { assertTopicProvided } from "../errors/assertions/topic-provided.js";
import type { Notification, NotificationBody, NotificationHeaders } from "./notification.js";
/**
 * Empty interface on purpose to allow for TS
 * autocompletion to be extended by the user.
 * Must be exported to allow extending in the user's code.
 */
export interface NotificationCustomAppData {}

type NotificationData = NotificationHeaders &
	NotificationBody<Record<string, string>, NotificationCustomAppData>;
type NotificationObject = Notification<Record<string, string>>;

export function MDMNotification(
	mdmUid: string,
	data: NotificationData,
): NotificationObject {
	assertTopicProvided(mdmUid);

	const { expiration = 0, collapseID, priority = 10 } = data;

	return {
		pushType: "mdm",
		topic: mdmUid,
		body: {
			aps: {},
		},
		expiration,
		collapseID,
		priority,
	};
}
