import type { Notification, NotificationBody, NotificationHeaders } from "./notification.js";

/**
 * Empty interface on purpose to allow for TS
 * autocompletion to be extended by the user.
 * Must be exported to allow extending in the user's code.
 */
export interface NotificationCustomData {}

type AlertField = string | { "loc-key": string; "loc-args"?: string[] };

type LiveActivityNotificationBody = {
	/**
	 * The UNIX timestamp that represents the date at which a Live Activity
	 * becomes stale, or out of date.
	 *
	 * For more information, see [Displaying live data with Live Activities](https://developer.apple.com/documentation/ActivityKit/displaying-live-data-with-live-activities).
	 */
	staleDate?: number;

	/**
	 * A number that the system uses to sort the
	 * notifications from your app.
	 *
	 * The highest score gets featured in the notification summary.
	 * See relevanceScore.
	 *
	 * If your remote notification updates a Live Activity, you can
	 * set any `Double` value; for example, 25, 50, 75, or 100.
	 */

	relevanceScore?: number;

	/**
	 * The UNIX timestamp that marks the time when you send the remote
	 * notification that updates or ends a Live Activity.
	 *
	 * For more information, see `Updating and ending your Live Activity
	 * with ActivityKit push notifications`.
	 *
	 * ---
	 *
	 * Implementation note: this is optional: if not provided, it will
	 * fallback to `Date.now()`. This could be useful if you are sending
	 * frequent updates and might not be able to ensure an order.
	 *
	 * Please also note that Push Notification console requires it
	 * when sending a start event, so this library allows it for all
	 * the kinds.
	 */
	timestamp?: number;

	/**
	 * The updated or final content for a Live Activity. The content of
	 * this dictionary must match the data you describe with your custom
	 * [ActivityAttributes](https://developer.apple.com/documentation/ActivityKit/ActivityAttributes) implementation.
	 *
	 * For more information, see `Updating and ending your Live Activity
	 * with ActivityKit push notifications`.
	 *
	 * ---
	 *
	 * Implementation note:
	 */
	contentState: Record<string, unknown>;
} & (
	| {
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

			event: "end";

			/**
			 * The UNIX timestamp that represents the date at which the system
			 * ends a Live Activity and removes it from the Dynamic Island and
			 * the Lock Screen.
			 *
			 * For more information, see `Updating and ending
			 * your Live Activity with ActivityKit push notifications`.
			 *
			 * Default: 4 hours (system default).
			 *
			 * @see https://developer.apple.com/documentation/activitykit/starting-and-updating-live-activities-with-activitykit-push-notifications#End-the-Live-Activity-with-a-custom-dismissal-date
			 */
			dismissalDate?: number;

			/**
			 * Alert will light up the device in case of critical notifications and play
			 * a sound, if provided.
			 *
			 * Title and body are shown as a traditional alert notification on the devices
			 * that do not support Live Activities. Both are mandatory for a notification
			 * to run.
			 */
			alert?: {
				title: AlertField;
				body: AlertField;

				/**
				 * The exact filename of the sound file to play when the
				 * notification is received.
				 *
				 * Please note that, for Live Activities, you cannot
				 * specify other details (just like classic Alert notifications).
				 *
				 * If not specified, the system will play the default sound
				 * (like you specified "default" as value).
				 */
				sound?: string;
			};
	  }
	| {
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
			event: "update";

			/**
			 * Alert will light up the device in case of critical notifications and play
			 * a sound, if provided.
			 *
			 * Title and body are shown as a traditional alert notification on the devices
			 * that do not support Live Activities. Both are mandatory for a notification
			 * to run.
			 */
			alert?: {
				title: AlertField;
				body: AlertField;

				/**
				 * The exact filename of the sound file to play when the
				 * notification is received.
				 *
				 * Please note that, for Live Activities, you cannot
				 * specify other details (just like classic Alert notifications).
				 *
				 * If not specified, the system will play the default sound
				 * (like you specified "default" as value).
				 */
				sound?: string;
			};
	  }
	| {
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
			event: "start";

			/**
			 * A string you use when you start a Live Activity with a remote
			 * push notification. It must match the name of the structure that
			 * describes the dynamic data that appears in a Live Activity.
			 *
			 * For more information, see `Updating and ending your Live Activity
			 * with ActivityKit push notifications`.
			 */
			attributesType: string;

			/**
			 * The dictionary that contains data you pass to a Live Activity
			 * that you start with a remote push notification.
			 *
			 * For more information, see `Updating and ending your Live Activity
			 * with ActivityKit push notifications`.
			 */
			attributes: Record<string, unknown>;

			/**
			 * Alert will light up the device in case of critical notifications and play
			 * a sound, if provided.
			 *
			 * Title and body are shown as a traditional alert notification on the devices
			 * that do not support Live Activities. Both are mandatory for a notification
			 * to run.
			 */
			alert: {
				title: AlertField;
				body: AlertField;

				/**
				 * The exact filename of the sound file to play when the
				 * notification is received.
				 *
				 * Please note that, for Live Activities, you cannot
				 * specify other details (just like classic Alert notifications).
				 *
				 * If not specified, the system will play the default sound
				 * (like you specified "default" as value).
				 */
				sound?: string;
			};
	  }
);

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

	const { expiration = 0, collapseID, priority = 10, payload } = data;
	const { event, staleDate, timestamp = Date.now(), relevanceScore, contentState, alert } = payload;

	return {
		pushType: "liveactivity",
		get topic() {
			if (topic.endsWith(TOPIC_SUFFIX)) {
				return topic;
			}

			return `${topic}${TOPIC_SUFFIX}`;
		},
		get body() {
			if (event === "start") {
				const { attributesType, attributes } = payload;

				return {
					aps: {
						event,
						"stale-date": staleDate,
						"attributes-type": attributesType,
						attributes,
						"relevance-score": relevanceScore,
						"content-state": contentState,
						timestamp,
						alert: {
							title: payload.alert?.title,
							body: payload.alert?.body,
							sound: payload.alert?.sound || "default",
						},
					} satisfies Notification<LiveActivityNotificationBody>["body"]["aps"],
				};
			}

			if (event === "end") {
				const { dismissalDate } = payload;

				const notificationBody = {
					aps: {
						event,
						"stale-date": staleDate,
						"content-state": contentState,
						timestamp,
						"relevance-score": relevanceScore,
						"dismissal-date": dismissalDate,
						alert: createNotificationAlertBody(alert),
					} satisfies Notification<LiveActivityNotificationBody>["body"]["aps"],
				};

				return notificationBody;
			}

			const notificationBody = {
				aps: {
					event,
					"stale-date": staleDate,
					"content-state": contentState,
					"relevance-score": relevanceScore,
					timestamp,
					alert: createNotificationAlertBody(alert),
				} satisfies Notification<LiveActivityNotificationBody>["body"]["aps"],
			};

			return notificationBody;
		},
		expiration,
		collapseID,
		priority: Math.max(5, Math.min(priority, 10)) as 5 | 10,
	};
}

function validateAlertField(content: AlertField): AlertField | undefined {
	if (typeof content === "string") {
		return content;
	}

	if (typeof content !== "object" || !content["loc-key"]) {
		return undefined;
	}

	const nextBody: AlertField = {
		"loc-key": content["loc-key"],
		"loc-args": content["loc-args"],
	};

	if (Array.isArray(content["loc-args"])) {
		nextBody["loc-args"] = content["loc-args"].filter((arg) => typeof arg === "string");
	}

	return nextBody;
}

function createNotificationAlertBody(
	alert: LiveActivityNotificationBody["alert"] | undefined,
): LiveActivityNotificationBody["alert"] {
	if (!alert) {
		return undefined;
	}

	if (typeof alert !== "object") {
		throw new TypeError(
			"Alert must be a string or an object with 'title' and 'body' properties. Cannot create live notification.",
		);
	}

	const title = validateAlertField(alert.title);
	const body = validateAlertField(alert.body);

	if (!title || !body) {
		throw new TypeError(
			"Alert object specified but either 'title' or 'body' are invalid strings or objects. Cannot create live notification.",
		);
	}

	return {
		title,
		body,
		sound: alert.sound || "default",
	};
}
