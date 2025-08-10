import { Connector } from "../connectors/connector.js";
import { assertExpirationValid } from "../errors/assertions/expiration-valid.js";
import { assertValidPayload } from "../errors/assertions/payload-exists.js";
import { assertRelevanceScoreValid } from "../errors/assertions/relevance-score-valid.js";
import { assertTopicProvided } from "../errors/assertions/topic-provided.js";
import { defineError } from "../errors/defineError.js";
import type {
	APSBody,
	Notification,
	NotificationBody,
	NotificationHeaders,
} from "./notification.js";

const ALERT_PROPERTY_REQUIRED_ERROR = defineError(
	"ALERT_PROPERTY_REQUIRED_ERROR",
	"Alert property is required in order to send a 'start' event.",
);

const ALERT_FIELD_INVALID_ERROR = defineError(
	"ALERT_FIELD_INVALID_ERROR",
	"Invalid alert field: must be a string or an object with 'loc-key' property.",
);

const ALERT_OBJECT_INVALID_ERROR = defineError(
	"ALERT_OBJECT_INVALID_ERROR",
	"Alert must be an object with 'title' and 'body' properties. Cannot create live notification.",
);

const ALERT_TITLE_BODY_INVALID_ERROR = defineError(
	"ALERT_TITLE_BODY_INVALID_ERROR",
	"Alert object specified but either 'title' or 'body' are invalid strings or objects. Cannot create live notification.",
);

/**
 * Empty interface on purpose to allow for TS
 * autocompletion to be extended by the user.
 * Must be exported to allow extending in the user's code.
 */
export interface NotificationCustomAppData {}

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
			 * When provided, it will make your app to generate a new push token
			 * for the Live Activity after starting the new live activity.
			 *
			 * @see https://developer.apple.com/documentation/ActivityKit/starting-and-updating-live-activities-with-activitykit-push-notifications#Construct-the-payload-that-starts-a-Live-Activity
			 */
			inputPushToken?: 1;

			/**
			 * Provide a broadcast channel identifier to start the live activity
			 * and listen for updates on that channel.
			 *
			 * @see https://developer.apple.com/documentation/usernotifications/sending-channel-management-requests-to-apns
			 * @see https://developer.apple.com/documentation/ActivityKit/starting-and-updating-live-activities-with-activitykit-push-notifications#Construct-the-payload-that-starts-a-Live-Activity
			 */
			inputPushChannel?: string;

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
	NotificationBody<LiveActivityNotificationBody, NotificationCustomAppData>;

type NotificationObject = Notification<APSBody<LiveActivityNotificationBody>>;

const TOPIC_SUFFIX = ".push-type.liveactivity";

/**
 * Creates a notification about an ongoing Live Activity
 *
 * @param appBundleId The topic of the notification. It will be suffixed, if needed, with `.push-type.liveactivity`.
 * @param data
 * @returns
 */
export function LiveActivityNotification(
	appBundleId: string,
	data: NotificationData,
): NotificationObject {
	assertTopicProvided(appBundleId);

	const { expiration = 0, collapseID, priority = 10, payload } = data;

	assertValidPayload(payload);
	assertRelevanceScoreValid(payload.relevanceScore, 0, Infinity);
	assertExpirationValid(expiration);

	const { event, staleDate, timestamp = Date.now(), relevanceScore, contentState, alert } = payload;

	return {
		pushType: "liveactivity",
		supportedConnectors: Connector.Certificate | Connector.Token,
		get topic() {
			if (appBundleId.endsWith(TOPIC_SUFFIX)) {
				return appBundleId;
			}

			return `${appBundleId}${TOPIC_SUFFIX}`;
		},
		get body() {
			if (event === "start") {
				const { attributesType, attributes, inputPushToken, inputPushChannel } = payload;

				return {
					aps: {
						event,
						"stale-date": staleDate,
						"attributes-type": attributesType,
						attributes,
						"relevance-score": relevanceScore,
						"content-state": contentState,
						"input-push-token": inputPushToken,
						"input-push-channel": inputPushChannel,
						timestamp,
						alert: createNotificationAlertBody(mandatoryAlert(alert)),
					} satisfies NotificationObject["body"]["aps"],
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
					} satisfies NotificationObject["body"]["aps"],
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
				} satisfies NotificationObject["body"]["aps"],
			};

			return notificationBody;
		},
		expiration,
		collapseID,
		priority: Math.max(5, Math.min(priority, 10)) as 5 | 10,
	};
}

function validateAlertField(content: AlertField): AlertField | undefined {
	if (!content) {
		return undefined;
	}

	if (typeof content === "string") {
		return content;
	}

	if (typeof content !== "object" || !content["loc-key"]) {
		throw new ALERT_FIELD_INVALID_ERROR();
	}

	const nextBody: AlertField = {
		"loc-key": content["loc-key"],
		"loc-args": undefined,
	};

	if (Array.isArray(content["loc-args"])) {
		nextBody["loc-args"] = content["loc-args"].filter((arg) => typeof arg === "string");

		if (nextBody["loc-args"].length !== content["loc-args"].length) {
			console.warn("Warning: some 'loc-args' were not strings and were filtered out.");
		}
	}

	return nextBody;
}

function mandatoryAlert(
	alert: LiveActivityNotificationBody["alert"] | undefined,
): LiveActivityNotificationBody["alert"] {
	if (!alert) {
		throw new ALERT_PROPERTY_REQUIRED_ERROR();
	}

	return alert;
}

function createNotificationAlertBody(
	alert: LiveActivityNotificationBody["alert"] | undefined,
): LiveActivityNotificationBody["alert"] {
	if (!alert) {
		return undefined;
	}

	if (typeof alert !== "object") {
		throw new ALERT_OBJECT_INVALID_ERROR();
	}

	const title = validateAlertField(alert.title);
	const body = validateAlertField(alert.body);

	if (!title || !body) {
		throw new ALERT_TITLE_BODY_INVALID_ERROR();
	}

	return {
		title,
		body,
		sound: alert.sound || "default",
	};
}
