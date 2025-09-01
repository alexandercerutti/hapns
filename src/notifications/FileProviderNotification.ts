import { Connector } from "../connectors/connector.js";
import { assertExpirationValid } from "../errors/assertions/expiration-valid.js";
import { assertValidPayload } from "../errors/assertions/payload-exists.js";
import { assertTopicProvided } from "../errors/assertions/topic-provided.js";
import { freeze } from "./notification.js";
import type {
	Notification,
	NotificationBody,
	NotificationHeaders,
	ToDashed,
} from "./notification.js";

/**
 * Empty interface on purpose to allow for TS
 * autocompletion to be extended by the user.
 * Must be exported to allow extending in the user's code.
 */
export interface NotificationCustomAppData {}

type NotificationData = NotificationHeaders &
	NotificationBody<FileProviderNotificationBody, NotificationCustomAppData>;
type NotificationObject = Notification<ToDashed<FileProviderNotificationBody>>;

const TOPIC_SUFFIX = ".pushkit.fileprovider";

interface FileProviderNotificationBody {
	contentIdentifier:
		| string
		| "NSFileProviderRootContainerItemIdentifier"
		| "NSFileProviderWorkingSetContainerItemIdentifier";
	domain: string;
}

/**
 * Creates a notification about an update to a file provider extension.
 *
 * @param appBundleId It will be suffixed, if needed, with `.pushkit.fileprovider`.
 * @param data
 * @returns
 *
 * @see https://developer.apple.com/documentation/FileProvider/using-push-notifications-to-signal-changes
 */
export function FileProviderNotification(
	appBundleId: string,
	data: NotificationData,
): NotificationObject {
	assertTopicProvided(appBundleId);

	const { expiration = 0, collapseID, priority = 10, payload } = data;

	assertExpirationValid(expiration);
	assertValidPayload(payload);

	const body: NotificationObject["body"] = {
		"content-identifier": payload.contentIdentifier,
		domain: payload.domain,
	};

	return freeze({
		pushType: "fileprovider",
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
	});
}
