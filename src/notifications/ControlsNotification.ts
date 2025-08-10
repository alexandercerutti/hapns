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

type NotificationData = NotificationHeaders &
	NotificationBody<Record<string, string>, NotificationCustomAppData>;
type NotificationObject = Notification<APSBody<Record<string, string>>>;

/**
 * Creates a notification about the need of controls to be reloaded.
 *
 * @param appBundleId The topic of the notification.
 * @param data
 * @returns
 */
export function ControlsNotification(
	appBundleId: string,
	data: NotificationData,
): NotificationObject {
	assertTopicProvided(appBundleId);

	const { expiration = 0, collapseID, priority = 10 } = data;

	return {
		pushType: "controls",
		supportedConnectors: Connector.Certificate | Connector.Token,
		topic: appBundleId,
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
