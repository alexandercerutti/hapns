import { Connector } from "../connectors/connector.js";
import { assertExpirationValid } from "../errors/assertions/expiration-valid.js";
import { assertTopicProvided } from "../errors/assertions/topic-provided.js";
import type { APSBody, Notification, NotificationHeaders } from "./notification.js";

/**
 * "If the location query requires an immediate response from the
 * Location Push Service Extension, set notification apns-priority
 * to 10; otherwise, use 5"
 */
type LocationAllowedPriorities = 5 | 10;

type NotificationData = NotificationHeaders<LocationAllowedPriorities>;
type NotificationObject = Notification<APSBody<Record<string, string>>, LocationAllowedPriorities>;

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
): NotificationObject {
	assertTopicProvided(appBundleId);

	const { expiration = 0, collapseID, priority = 5 } = data;

	assertExpirationValid(expiration);

	const body: NotificationObject["body"] = {
		aps: {},
	};

	return {
		pushType: "location",
		supportedConnectors: Connector.Token,
		get topic() {
			if (appBundleId.endsWith(TOPIC_SUFFIX)) {
				return appBundleId;
			}

			return `${appBundleId}${TOPIC_SUFFIX}`;
		},
		body,
		expiration,
		collapseID,
		priority,
	};
}
