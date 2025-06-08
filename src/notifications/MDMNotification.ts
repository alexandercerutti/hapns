import { assertValidPayload } from "../errors/assertions/payload-exists.js";
import { assertTopicProvided } from "../errors/assertions/topic-provided.js";
import type { Notification, NotificationBody, NotificationHeaders } from "./notification.js";
/**
 * Empty interface on purpose to allow for TS
 * autocompletion to be extended by the user.
 * Must be exported to allow extending in the user's code.
 */
export interface NotificationCustomAppData {}

/**
 * @see https://developer.apple.com/documentation/devicemanagement/sending-mdm-commands-to-a-device#Initiate-Polling-for-MDM-Commands
 */
interface MDMNotificationBody {
	mdm: string;
}

type NotificationData = NotificationHeaders &
	NotificationBody<Record<string, string>, NotificationCustomAppData>;
type NotificationObject = Notification<MDMNotificationBody>;

export function MDMNotification(mdmUid: string, data: NotificationData): NotificationObject {
	assertTopicProvided(mdmUid);
	assertValidPayload(data.payload);

	const { expiration = 0, collapseID, priority = 10 } = data;

	return {
		pushType: "mdm",
		topic: mdmUid,
		body: {
			mdm: data.payload.mdm,
		},
		expiration,
		collapseID,
		priority,
	};
}
