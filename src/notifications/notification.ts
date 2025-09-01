type ToDashedKey<T extends string> = T extends `${infer FirstLetter}${infer Rest}`
	? Rest extends `${Uppercase<string>}${string}`
		? `${Lowercase<FirstLetter>}-${Lowercase<ToDashedKey<Rest>>}`
		: `${Lowercase<FirstLetter>}${ToDashedKey<Rest>}`
	: Lowercase<T>;

export type ToDashed<T extends object> = {
	[K in keyof T as K extends string ? ToDashedKey<K> : K]: T[K];
};

/**
 * Recursively freezes an object
 */
export function freeze<T>(obj: T): T {
	if (obj === null || obj === undefined || typeof obj !== "object") {
		return obj;
	}

	const propNames = Object.getOwnPropertyNames(obj);

	for (const name of propNames) {
		const value = (obj as any)[name];

		if (typeof value === "object") {
			freeze(value);
		}
	}

	return Object.freeze(obj);
}

export interface NotificationBody<
	NotificationPayload extends object = Record<string, string>,
	AppPayload extends object = Record<string, string>,
> {
	payload?: NotificationPayload;
	appData?: AppPayload;
}

export interface NotificationHeaders<Priority extends 1 | 5 | 10 = 1 | 5 | 10> {
	expiration?: number;
	collapseID?: string;
	priority?: Priority;
}

export type PushType =
	| "alert"
	| "background"
	| "controls"
	| "fileprovider"
	| "liveactivity"
	| "location"
	| "mdm"
	| "complication"
	| "voip"
	| "pushtotalk"
	| "widgets";

export interface APSBody<BodyProperties extends object> {
	readonly aps: ToDashed<BodyProperties> | Record<never, never>;
}

export interface Notification<Body extends object, Priority extends 1 | 5 | 10 = 1 | 5 | 10>
	extends Omit<NotificationHeaders<Priority>, "payload" | "appData"> {
	readonly supportedConnectors: number;
	readonly pushType: PushType;
	readonly topic: string;
	readonly body: Body;
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
