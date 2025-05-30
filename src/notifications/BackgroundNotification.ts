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
	topic: string,
	data: NotificationData,
): Notification<BackgroundNotificationBody> {
	if (!topic || typeof topic !== "string") {
		throw new TypeError("Cannot create notification: topic must be a non-empty string.");
	}

	const { expiration = 0, collapseID, appData } = data;

	return {
		pushType: "background",
		topic,
		expiration,
		collapseID,
		priority: 5,
		get body() {
			return {
				...appData,
				aps: {
					"content-available": 1,
				} satisfies Notification<BackgroundNotificationBody>["body"]["aps"],
			};
		},
	};
}
