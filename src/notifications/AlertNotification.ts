import type { NotificationDetails, Notification, Sound } from "./notification.js";

/**
 * Empty interface on purpose to allow for TS
 * autocompletion to be extended by the user
 */
interface NotificationCustomData {}

interface AlertLocalizableTitle {
	/**
	 * The key for a localized title string. Specify this key instead of the
	 * title key to retrieve the title from your app’s Localizable.strings
	 * files. The value must contain the name of a key in your strings file.
	 *
	 * ---
	 *
	 * Mutually exclusive with `title` property.
	 */
	"title-loc-key": string;

	/**
	 * An array of strings containing replacement values for variables in your
	 * title string. Each %@ character in the string specified by the
	 * `title-loc-key` is replaced by a value from this array. The first item
	 * in the array replaces the first instance of the %@ character in the
	 * string, the second item replaces the second instance, and so on.
	 *
	 * ---
	 *
	 * Mutually exclusive with `title` property.
	 */
	"title-loc-args"?: string[];
}

type AlertTitle = {
	/**
	 * The title of the notification. Apple Watch displays this string in the
	 * short look notification interface.
	 * Specify a string that’s quickly understood by the user.
	 *
	 * ---
	 *
	 * Mutually exclusive with `title-loc-key` and `title-loc-args`.
	 */
	title?: string;
	"title-loc-key"?: never;
	"title-loc-args"?: never;
};

interface AlertLocalizableSubtitle {
	/**
	 * The key for a localized subtitle string. Use this key, instead of the
	 * subtitle key, to retrieve the subtitle from your app’s
	 * Localizable.strings file. The value must contain the name of a key in
	 * your strings file.
	 *
	 * ---
	 *
	 * Mutually exclusive with `subtitle` property.
	 */
	"subtitle-loc-key": string;

	/**
	 * An array of strings containing replacement values for variables in
	 * your title string. Each %@ character in the string specified by
	 * subtitle-loc-key is replaced by a value from this array. The first
	 * item in the array replaces the first instance of the %@ character in
	 * the string, the second item replaces the second instance, and so on.
	 *
	 * ---
	 *
	 * Mutually exclusive with `subtitle` property.
	 */
	"subtitle-loc-args"?: string[];
}

type AlertSubtitle = {
	/**
	 * Additional information that explains the purpose of the notification.
	 *
	 * ---
	 *
	 * Mutually exclusive with `subtitle-loc-key` and `subtitle-loc-args`.
	 */
	subtitle?: string;
	"subtitle-loc-key"?: never;
	"subtitle-loc-args"?: never;
};

interface AlertLocalizableBody {
	/**
	 * The key for a localized message string. Use this key, instead of
	 * the body key, to retrieve the message text from your app’s
	 * Localizable.strings file. The value must contain the name of a key
	 * in your strings file.
	 *
	 * ---
	 *
	 * Mutually exclusive with `body`.
	 */
	"loc-key": string;

	/**
	 * An array of strings containing replacement values for variables in
	 * your message text. Each %@ character in the string specified by loc-key
	 * is replaced by a value from this array. The first item in the array
	 * replaces the first instance of the %@ character in the string, the
	 * second item replaces the second instance, and so on.
	 *
	 * ---
	 *
	 * Mutually exclusive with `body`.
	 */
	"loc-args"?: string[];
}

type AlertBody = {
	/**
	 * The content of the alert message.
	 *
	 * ---
	 *
	 * Mutually exclusive with `loc-key` and `loc-args`.
	 */
	body?: string;
	"loc-key"?: never;
	"loc-args"?: never;
};

type InterruptionLevel = "passive" | "active" | "time-sensitive" | "critical";

/**
 * Empty alert is possible, but doesn't allow badge or sound.
 */

type EmptyAlert = Record<never, never>;

type Alert =
	| string
	| ((
			| ((AlertLocalizableTitle | { title: string }) & AlertBody & AlertSubtitle)
			| ((AlertLocalizableBody | { body: string }) & AlertTitle & AlertSubtitle)
			| ((AlertLocalizableSubtitle | { subtitle: string }) & AlertTitle & AlertBody)
	  ) & {
			/**
			 * The name of the launch image file to display. If the user chooses to
			 * launch your app, the contents of the specified image or storyboard
			 * file are displayed instead of your app’s normal launch image.
			 */
			"launch-image"?: string;
	  });

export type AlertNotificationBody = (
	| {
			/**
			 * The information for displaying an alert. A dictionary
			 * is recommended. If you specify a string, the alert
			 * displays your string as the body text.
			 */
			alert?: EmptyAlert;
			badge?: never;
			sound?: never;
	  }
	| {
			/**
			 * The information for displaying an alert. A dictionary
			 * is recommended. If you specify a string, the alert
			 * displays your string as the body text.
			 */
			alert: Alert;

			/**
			 * The number to display in a badge on your app’s icon.
			 * Specify 0 to remove the current badge, if any.
			 *
			 * ---
			 *
			 * Additionally, in order to update badge for notification, the user must
			 * have the app set to receive notification with explicit support
			 * to `UNAuthorizationOptions.badge`.
			 *
			 * @example
			 *
			 * ```swift
			 * notificationCenter.requestAuthorization(options: [.badge])
			 * ```
			 */
			badge?: number;

			/**
			 * The name of a sound file in your app’s main bundle or in the
			 * Library/Sounds folder of your app’s container directory.
			 *
			 * Specify the string “default” to play the system sound. Use
			 * this key for regular notifications. For critical alerts, use
			 * the sound dictionary instead. For information about how to
			 * prepare sounds, see [UNNotificationSound](https://developer.apple.com/documentation/usernotifications/unnotificationsound).
			 *
			 * ---
			 *
			 * Additionally, to receive a sound for notification, the user must
			 * have the app set to receive notification with explicit support
			 * to `UNAuthorizationOptions.sound`.
			 *
			 * @example
			 *
			 * ```swift
			 * notificationCenter.requestAuthorization(options: [.alert, .badge, .sound])
			 * ```
			 */
			sound?: Sound;
	  }
) & {
	// *************************************************************************** //
	// *** NEXT PROPERTIES ARE ALLOWED IN BOTH ALERTS AND EMPTY ALERTS OBJECTS *** //
	// *************************************************************************** //

	/**
	 * An app-specific identifier for grouping related notifications.
	 * This value corresponds to the [threadIdentifier](https://developer.apple.com/documentation/usernotifications/unmutablenotificationcontent/threadidentifier)
	 * property in the [UNNotificationContent](https://developer.apple.com/documentation/usernotifications/unnotificationcontent) object.
	 */
	threadId?: string;

	/**
	 * The notification’s type. This string must correspond to the
	 * [identifier](https://developer.apple.com/documentation/usernotifications/unnotificationcategory/identifier)
	 * of one of the [UNNotificationCategory](https://developer.apple.com/documentation/usernotifications/unnotificationcategory) objects you
	 * register at launch time. See [Declaring your actionable notification types](https://developer.apple.com/documentation/usernotifications/declaring-your-actionable-notification-types).
	 */
	category?: string;

	/**
	 * The notification service app extension flag. If the value is 1,
	 * the system passes the notification to your notification service
	 * app extension before delivery. Use your extension to modify the
	 * notification’s content. See [Modifying content in newly delivered
	 * notifications](https://developer.apple.com/documentation/usernotifications/modifying-content-in-newly-delivered-notifications).
	 */
	mutableContent?: boolean;

	/**
	 * The identifier of the window brought forward. The value of this
	 * key will be populated on the [UNNotificationContent](https://developer.apple.com/documentation/usernotifications/unnotificationcontent)
	 * object created from the push payload. Access the value using the
	 * [UNNotificationContent](https://developer.apple.com/documentation/usernotifications/unnotificationcontent) object’s [targetContentIdentifier](https://developer.apple.com/documentation/usernotifications/unnotificationcontent/targetcontentidentifier) property.
	 */
	targetContentId?: string;

	/**
	 * The importance and delivery timing of a notification. The string
	 * values `“passive”`, `“active”`, `“time-sensitive”`, or `“critical”`
	 * correspond to the [UNNotificationInterruptionLevel](https://developer.apple.com/documentation/usernotifications/unnotificationinterruptionlevel) enumeration cases.
	 */
	interruptionLevel?: InterruptionLevel;

	/**
	 * The relevance score, a number between 0 and 1, that the system
	 * uses to sort the notifications from your app. The highest score
	 * gets featured in the notification summary. See [relevanceScore](https://developer.apple.com/documentation/usernotifications/unnotificationcontent/relevancescore).
	 *
	 * If your remote notification updates a Live Activity, you can set
	 * any Double value; for example, 25, 50, 75, or 100.
	 */
	relevanceScore?: number;

	/**
	 * The criteria the system evaluates to determine if it displays the
	 * notification in the current Focus.
	 *
	 * For more information, see [SetFocusFilterIntent](https://developer.apple.com/documentation/AppIntents/SetFocusFilterIntent).
	 */
	filterCriteria?: string;
};

export function AlertNotification(
	topic: string,
	data: NotificationDetails<AlertNotificationBody, NotificationCustomData>,
): Notification<AlertNotificationBody, NotificationCustomData> {
	const { payload, expiration, appData, collapseID, priority } = data;

	if (payload) {
		if (typeof payload !== "object") {
			throw new Error("Cannot build notification: payload must be an object");
		}

		const { interruptionLevel, relevanceScore } = payload;

		if (interruptionLevel && !isInterruptionLevelStandard(interruptionLevel)) {
			throw new Error(
				"Invalid interruption level: must be one of: 'passive', 'active', 'time-sensitive' or 'critical'. Received: " +
					interruptionLevel,
			);
		}

		if (relevanceScore && (relevanceScore < 0 || relevanceScore > 1)) {
			throw new Error(
				"Invalid relevance score: must be between 0 and 1. Received: " + relevanceScore,
			);
		}
	}

	if (appData && typeof appData !== "object") {
		throw new Error("User data must be an object");
	}

	return {
		pushType: "alert",
		topic,
		expiration: expiration ?? 0,
		collapseID: collapseID ?? undefined,
		priority: priority ?? 10,
		get body() {
			const { payload, appData } = data;

			if (!payload) {
				return {
					...appData,
					aps: {},
				};
			}

			const {
				threadId,
				category,
				mutableContent,
				filterCriteria,
				interruptionLevel,
				relevanceScore,
				targetContentId,
			} = payload;

			if (!payload.alert || isEmptyAlert(payload.alert)) {
				return {
					...appData,
					aps: {
						alert: {},
						category: category,
						"thread-id": threadId,
						"mutable-content": mutableContent,
						"target-content-id": targetContentId,
						"interruption-level": interruptionLevel,
						"relevance-score": relevanceScore,
						"filter-criteria": filterCriteria,
					} satisfies Notification<AlertNotificationBody, NotificationCustomData>["body"]["aps"],
				};
			}

			const { alert, badge, sound } = payload;

			return {
				...appData,
				aps: {
					alert,
					badge: badge ? Math.max(0, badge) : undefined,
					sound,
					category,
					"thread-id": threadId,
					"mutable-content": mutableContent,
					"target-content-id": targetContentId,
					"interruption-level": interruptionLevel,
					"relevance-score": relevanceScore,
					"filter-criteria": filterCriteria,
				} satisfies Notification<AlertNotificationBody, NotificationCustomData>["body"]["aps"],
			};
		},
	} satisfies Notification<AlertNotificationBody, NotificationCustomData>;
}

function isInterruptionLevelStandard(
	interruptionLevel: unknown,
): interruptionLevel is InterruptionLevel {
	return ["passive", "active", "time-sensitive", "critical"].includes(
		interruptionLevel as InterruptionLevel,
	);
}

function isEmptyAlert(alert: Alert | EmptyAlert): alert is EmptyAlert {
	return typeof alert === "object" && alert !== null && !Object.keys(alert).length;
}
