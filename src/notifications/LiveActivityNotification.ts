import type { Notification, NotificationBody, NotificationHeaders } from "./notification.js";

/**
 * Empty interface on purpose to allow for TS
 * autocompletion to be extended by the user.
 * Must be exported to allow extending in the user's code.
 */
export interface NotificationCustomData {}

interface LiveActivityNotificationBody {
	/**
	 * The UNIX timestamp that represents the date at which a Live Activity
	 * becomes stale, or out of date.
	 *
	 * For more information, see [Displaying live data with Live Activities](https://developer.apple.com/documentation/ActivityKit/displaying-live-data-with-live-activities).
	 */
	"stale-date": number;

	/**
	 * The updated or final content for a Live Activity. The content of
	 * this dictionary must match the data you describe with your custom
	 * [ActivityAttributes](https://developer.apple.com/documentation/ActivityKit/ActivityAttributes) implementation.
	 *
	 * For more information, see `Updating and ending your Live Activity
	 * with ActivityKit push notifications`.
	 */
	"content-state": Record<string, unknown>;

	/**
	 * The UNIX timestamp that marks the time when you send the remote
	 * notification that updates or ends a Live Activity.
	 *
	 * For more information, see `Updating and ending your Live Activity
	 * with ActivityKit push notifications`.
	 */
	timestamp: number;

	/**
	 * The string that describes whether you start, update, or end an
	 * ongoing Live Activity with the remote push notification.
	 *
	 * To start the Live Activity, use `start`.
	 * To update the Live Activity, use `update`.
	 * To end the Live Activity, use `end`.
	 *
	 * For more information, see `Updating and ending your Live Activity
	 * with ActivityKit push notifications`.
	 */
	event: "start" | "update" | "end";

	/**
	 * The UNIX timestamp that represents the date at which the system
	 * ends a Live Activity and removes it from the Dynamic Island and
	 * the Lock Screen.
	 *
	 * For more information, see `Updating and ending
	 * your Live Activity with ActivityKit push notifications`.
	 */
	"dismissal-date": number;

	/**
	 * A string you use when you start a Live Activity with a remote
	 * push notification. It must match the name of the structure that
	 * describes the dynamic data that appears in a Live Activity.
	 *
	 * For more information, see `Updating and ending your Live Activity
	 * with ActivityKit push notifications`.
	 */
	"attributes-type": string;

	/**
	 * The dictionary that contains data you pass to a Live Activity
	 * that you start with a remote push notification.
	 *
	 * For more information, see `Updating and ending your Live Activity
	 * with ActivityKit push notifications`.
	 */
	attributes: Record<string, unknown>;
}

type NotificationData = NotificationHeaders &
	NotificationBody<LiveActivityNotificationBody, NotificationCustomData>;

const TOPIC_SUFFIX = ".push-type.liveactivity";

/**
 * Creates a notification about an ongoing Live Activity
 *
 * @param topic The topic of the notification. It will be suffixed, if needed, with `.push-type.liveactivity`.
 * @param data
 * @returns
 */
export function LiveActivityNotification(
	topic: string,
	data: NotificationData,
): Notification<LiveActivityNotificationBody> {
	if (!topic || typeof topic !== "string") {
		throw new TypeError("Cannot create notification: topic must be a non-empty string.");
	}

	const { expiration = 0, collapseID, priority = 10 } = data;

	return {
		pushType: "liveactivity",
		get topic() {
			if (topic.endsWith(TOPIC_SUFFIX)) {
				return topic;
			}

			return `${topic}${TOPIC_SUFFIX}`;
		},
		body: {
			aps: {},
		},
		expiration,
		collapseID,
		priority,
	};
}
