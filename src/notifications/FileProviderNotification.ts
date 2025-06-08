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

const TOPIC_SUFFIX = ".pushkit.fileprovider";

/**
 * Creates a notification about an update to a file provider extension.
 *
 * @param appBundleId It will be suffixed, if needed, with `.pushkit.fileprovider`.
 * @param data
 * @returns
 */
export function FileProviderNotification(
	appBundleId: string,
	data: NotificationData,
): NotificationObject {
	assertTopicProvided(appBundleId);

	const { expiration = 0, collapseID, priority = 10 } = data;

	return {
		pushType: "fileprovider",
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
