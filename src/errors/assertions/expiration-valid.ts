import { defineError } from "../defineError.js";

const EXPIRATION_NAN_ERROR = defineError(
	"EXPIRATION_NAN",
	"Cannot create notification: expiration time must be a number. Received: %s",
);

export function assertExpirationValid(expiration: unknown): asserts expiration is number {
	if (typeof expiration === "undefined") {
		return;
	}

	if (typeof expiration !== "number") {
		throw new EXPIRATION_NAN_ERROR(expiration);
	}
}
