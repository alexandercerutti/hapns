import type { Notification, NotificationDetails } from "./notification.js";

/**
 * Empty interface on purpose to allow for TS
 * autocompletion to be extended by the user
 */
interface NotificationCustomData {}

interface BackgroundNotificationBody {
	contentAvailable: 1;
}

export function BackgroundNotification(
	topic: string,
	data: Omit<
		NotificationDetails<Record<string, string>, NotificationCustomData>,
		"priority" | "payload"
	>,
): Notification<BackgroundNotificationBody, NotificationCustomData> {
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
				} satisfies Notification<BackgroundNotificationBody, NotificationCustomData>["body"]["aps"],
			};
		},
	};
}
