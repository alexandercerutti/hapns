import { Connector } from "../connectors/connector.js";
import { assertExpirationValid } from "../errors/assertions/expiration-valid.js";
import { assertTopicProvided } from "../errors/assertions/topic-provided.js";
import { defineError } from "../errors/defineError.js";
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

type NotificationData = NotificationHeaders & NotificationBody<never, NotificationCustomAppData>;
type NotificationObject = Notification<APSBody<Record<string, string>>>;

const EXPIRATION_OUT_OF_BOUNDARIES_ERROR = defineError(
	"EXPIRATION_TOO_BIG",
	"Cannot create notification: expiration time for VoIP notifications must be included between 0 and 5 seconds. This artificial limit reflects a requirement from Apple. Received: %s",
);

const TOPIC_SUFFIX = ".voip";

/**
 * Create a notification about an incoming VoIP call through PushKit.
 *
 * `expiration` field is clamped to be lower than 5 seconds as per Apple requirement:
 *
 * ```text
 * Set the value of the apns-expiration header field to 0, or to only a few seconds.
 * Doing so prevents the system from delivering the notification at a much later time.
 * ```
 *
 * @see https://developer.apple.com/documentation/PushKit/responding-to-voip-notifications-from-pushkit#Generate-Push-Notifications-from-Your-Server
 *
 * @param appBundleId The topic of the notification. It will be suffixed, if needed, with `.voip`.
 * @param data
 * @returns
 */
export function VoipNotification(appBundleId: string, data: NotificationData): NotificationObject {
	assertTopicProvided(appBundleId);

	const { expiration = 0, collapseID, priority = 10 } = data;

	assertExpirationVoipValid(expiration);

	return {
		pushType: "voip",
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
		expiration,
		collapseID,
		priority,
	};
}

function assertExpirationVoipValid(expiration: unknown): asserts expiration is number {
	assertExpirationValid(expiration);

	if (expiration < 0 || expiration > 5) {
		throw new EXPIRATION_OUT_OF_BOUNDARIES_ERROR(expiration);
	}
}
