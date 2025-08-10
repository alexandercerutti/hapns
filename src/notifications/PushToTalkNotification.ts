import { Connector } from "../connectors/connector.js";
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

/**
 * Expiration is automatically set to 0 and
 * priority to 10, as per Apple requirements / suggestions.
 *
 * @see https://developer.apple.com/documentation/pushtotalk/creating-a-push-to-talk-app#Receive-audio
 */
type NotificationData = Omit<NotificationHeaders, "expiration" | "priority"> &
	NotificationBody<Record<string, string>, NotificationCustomAppData>;
type NotificationObject = Notification<APSBody<Record<string, string>>>;

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
): NotificationObject {
	assertTopicProvided(appBundleId);

	const { collapseID } = data;

	return {
		pushType: "pushtotalk",
		supportedConnectors: Connector.Certificate | Connector.Token,
		get topic() {
			if (appBundleId.endsWith(TOPIC_SUFFIX)) {
				return appBundleId;
			}

			return `${appBundleId}${TOPIC_SUFFIX}`;
		},
		body: Object.create(null, {
			aps: {
				enumerable: true,
				value: {},
			},
		}),
		collapseID,
		expiration: 0,
		priority: 10,
	};
}
