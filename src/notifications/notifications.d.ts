type APNPushType =
	| "alert"
	| "background"
	| "controls"
	| "fileprovider"
	| "liveactivity"
	| "location"
	| "mdm"
	| "complication"
	| "voip"
	| "pushtotalk";

type ToDashedKey<T extends string> = T extends `${infer FirstLetter}${infer Rest}`
	? Rest extends `${Uppercase<string>}${string}`
		? `${Lowercase<FirstLetter>}-${Lowercase<ToDashedKey<Rest>>}`
		: `${Lowercase<FirstLetter>}${ToDashedKey<Rest>}`
	: Lowercase<T>;

type ToDashed<T extends object> = {
	[K in keyof T as K extends string ? ToDashedKey<K> : K]: T[K];
};

type APNNotificationBody<APSBody extends object, UserData extends object> = {
	aps: ToDashed<APSBody>;
} & UserData;

export interface Notification<Body extends object, UserData extends object> {
	readonly pushType: APNPushType;
	readonly topic: string;
	get body(): APNNotificationBody<Body, UserData>;
}

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
