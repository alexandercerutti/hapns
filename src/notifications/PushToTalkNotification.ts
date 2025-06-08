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

const TOPIC_SUFFIX = ".voip-ptt";

/**
 * Create a Push-to-Talk notification.
 *
 * @param appBundleId The topic of the notification. It will be suffixed, if needed, with `.voip-ptt`.
 * @param data
 * @returns
 */
export function PushToTalkNotification(
	appBundleId: string,
	data: NotificationData,
): Notification<Record<string, string>> {
	assertTopicProvided(appBundleId);

	const { expiration = 0, collapseID, priority = 10 } = data;

	return {
		pushType: "pushtotalk",
		get topic() {
			if (appBundleId.endsWith(TOPIC_SUFFIX)) {
				return appBundleId;
			}

			return `${appBundleId}${TOPIC_SUFFIX}`;
		},
		body: {
			aps: {},
		},
		expiration,
		collapseID,
		priority,
	};
}
