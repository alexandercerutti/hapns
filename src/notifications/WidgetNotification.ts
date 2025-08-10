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

interface WidgetNotificationBody {
	contentChanged: true;
}

type NotificationData = NotificationHeaders &
	Omit<NotificationBody<WidgetNotificationBody, NotificationCustomAppData>, "priority" | "payload">;

type NotificationObject = Notification<APSBody<WidgetNotificationBody>>;

const TOPIC_SUFFIX = ".push-type.widgets";

/**
 *
 * @param appBundleId
 * @param data
 * @returns
 *
 * @since iOS 26.0
 * @see https://developer.apple.com/documentation/widgetkit/updating-widgets-with-widgetkit-push-notifications
 */

export function WidgetNotification(
	appBundleId: string,
	data: NotificationData,
): NotificationObject {
	assertTopicProvided(appBundleId);

	const { expiration = 0, collapseID, appData } = data;

	assertValidAppData(appData);

	const body = Object.create<Record<string, string>, NotificationObject["body"]>(appData || {}, {
		aps: {
			enumerable: true,
			value: {
				"content-changed": true,
			},
		},
	});

	return {
		pushType: "widgets",
		supportedConnectors: Connector.Token,
		get topic() {
			if (appBundleId.endsWith(TOPIC_SUFFIX)) {
				return appBundleId;
			}

			return `${appBundleId}${TOPIC_SUFFIX}`;
		},
		expiration,
		collapseID,
		priority: 5,
		body,
	};
}
