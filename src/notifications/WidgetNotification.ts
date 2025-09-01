import { Connector } from "../connectors/connector.js";
import { assertValidAppData } from "../errors/assertions/appdata-exists.js";
import { assertTopicProvided } from "../errors/assertions/topic-provided.js";
import { freeze } from "./notification.js";
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

type NotificationData = NotificationHeaders &
	Omit<NotificationBody<Record<string, string>, NotificationCustomAppData>, "payload">;

type NotificationObject = Notification<
	APSBody<{
		contentChanged: 1;
	}>
>;

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

	const { expiration = 0, collapseID, appData, priority = 5 } = data;

	assertValidAppData(appData);

	const body: NotificationObject["body"] = {
		...(appData || {}),
		aps: {
			"content-changed": 1,
		},
	};

	return freeze({
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
		priority,
		body,
	});
}
