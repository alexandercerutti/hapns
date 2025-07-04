import { Connector } from "../connectors/connector.js";
import { assertValidAppData } from "../errors/assertions/appdata-exists.js";
import { assertTopicProvided } from "../errors/assertions/topic-provided.js";
import type {
	APSBody,
	Notification,
	NotificationBody,
	NotificationHeaders,
} from "./notification.js";

/**
 * Empty interface on purpose to allow for TS
 * autocompletion to be extended by the user.
 * Must be exported to allow extending in the user's code.
 */
export interface NotificationCustomAppData {}

interface BackgroundNotificationBody {
	contentAvailable: 1;
}

type NotificationData = NotificationHeaders &
	Omit<
		NotificationBody<BackgroundNotificationBody, NotificationCustomAppData>,
		"priority" | "payload"
	>;

type NotificationObject = Notification<APSBody<BackgroundNotificationBody>>;

export function BackgroundNotification(
	appBundleId: string,
	data: NotificationData,
): NotificationObject {
	assertTopicProvided(appBundleId);

	const { expiration = 0, collapseID, appData } = data;

	assertValidAppData(appData);

	return {
		pushType: "background",
		supportedConnectors: Connector.Certificate | Connector.Token,
		topic: appBundleId,
		expiration,
		collapseID,
		priority: 5,
		get body() {
			return {
				...(appData || {}),
				aps: {
					"content-available": 1,
				} satisfies NotificationObject["body"]["aps"],
			};
		},
	};
}
