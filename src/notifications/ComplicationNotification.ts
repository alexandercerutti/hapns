import { Connector } from "../connectors/connector.js";
import { assertExpirationValid } from "../errors/assertions/expiration-valid.js";
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

type NotificationData = NotificationHeaders &
	NotificationBody<Record<string, string>, NotificationCustomAppData>;
type NotificationObject = Notification<APSBody<Record<string, string>>>;

const TOPIC_SUFFIX = ".complication";

/**
 * Creates a notification for a WatchOS app complications to update.
 *
 * @param appBundleId The topic of the notification. It will be suffixed, if needed, with `.complication`.
 * @param data
 * @returns
 */
export function ComplicationNotification(
	appBundleId: string,
	data: NotificationData,
): NotificationObject {
	assertTopicProvided(appBundleId);

	const { expiration = 0, collapseID, priority = 10 } = data;

	assertExpirationValid(expiration);

	return {
		pushType: "complication",
		supportedConnectors: Connector.Certificate | Connector.Token,
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
