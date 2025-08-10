type IncludesString<
	T extends string,
	U extends string,
> = T extends `${infer _Start}${U}${infer _End}` ? true : false;

type NonEmptyArray<T> = [T, ...T[]];

type HapnsErrorConstructor<Message extends string> =
	IncludesString<Message, "%s"> extends true
		? new (...args: NonEmptyArray<unknown>) => Error
		: new () => Error;

export function defineError<Message extends string>(
	name: string,
	message: Message,
): HapnsErrorConstructor<Message> {
	class HapnsError extends Error {
		constructor(...args: unknown[]) {
			super(message);
			this.name = name;
			this.message = message;

			if (args.length && message.includes("%s")) {
				for (const arg of args) {
					this.message = this.message.replace("%s", String(arg));
				}
			}
		}
	}

	return HapnsError;
}
