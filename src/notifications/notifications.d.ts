/**
 * @TODO determine the shared protocol for a notification
 */

export interface Notification {}

export type Sound =
	| string
	| {
			critical?: 0 | 1;

			/**
			 * The name of a sound file in your app’s main bundle or in the Library/Sounds folder of your app’s container directory.
			 * Specify the string “default” to play the system sound.
			 * For information about how to prepare sounds, see [UNNotificationSound](https://developer.apple.com/documentation/usernotifications/unnotificationsound).
			 */
			name: string;

			/**
			 * The volume for the critical alert’s sound.
			 * Set this to a value between 0 (silent) and 1 (full volume).
			 */
			volume?: number;
	  };
