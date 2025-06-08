import { assertValidAppData } from "../errors/assertions/appdata-exists.js";
import { assertTopicProvided } from "../errors/assertions/topic-provided.js";
import type { Notification, NotificationBody, NotificationHeaders } from "./notification.js";

/**
 * Empty interface on purpose to allow for TS
 * autocompletion to be extended by the user.
 * Must be exported to allow extending in the user's code.
 */
export interface NotificationCustomData {}

interface BackgroundNotificationBody {
	contentAvailable: 1;
}

type NotificationData = NotificationHeaders &
	Omit<
		NotificationBody<BackgroundNotificationBody, NotificationCustomData>,
		"priority" | "payload"
	>;

export function BackgroundNotification(
	appBundleId: string,
	data: NotificationData,
): Notification<BackgroundNotificationBody> {
	assertTopicProvided(appBundleId);

	const { expiration = 0, collapseID, appData } = data;

	assertValidAppData(appData);

	return {
		pushType: "background",
		topic: appBundleId,
		expiration,
		collapseID,
		priority: 5,
		get body() {
			return {
				...(appData || {}),
				aps: {
					"content-available": 1,
				} satisfies Notification<BackgroundNotificationBody>["body"]["aps"],
			};
		},
	};
}
