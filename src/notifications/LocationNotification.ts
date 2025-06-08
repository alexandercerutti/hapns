import { assertTopicProvided } from "../errors/assertions/topic-provided.js";
import type { Notification, NotificationBody, NotificationHeaders } from "./notification.js";

/**
 * "If the location query requires an immediate response from the
 * Location Push Service Extension, set notification apns-priority
 * to 10; otherwise, use 5"
 */
type LocationAllowedPriorities = 5 | 10;

type NotificationData = NotificationHeaders<LocationAllowedPriorities>;

const TOPIC_SUFFIX = ".location-query";

/**
 * Creates a notification about a location query of the user.
 *
 * @param appBundleId The topic of the notification. It will be suffixed, if needed, with `.location-query`.
 * @param data
 * @returns
 */
export function LocationNotification(
	appBundleId: string,
	data: NotificationData,
): Notification<Record<string, string>, LocationAllowedPriorities> {
	assertTopicProvided(appBundleId);

	const { expiration = 0, collapseID, priority = 5 } = data;

	return {
		pushType: "location",
		get topic() {
			if (appBundleId.endsWith(TOPIC_SUFFIX)) {
				return appBundleId;
			}

			return `${appBundleId}${TOPIC_SUFFIX}`;
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
