import { createError } from "../create.js";

const INVALID_PAYLOAD_ERROR = createError(
	"INVALID_PAYLOAD_ERROR",
	"Cannot create notification: payload is invalid (missing or not an object).",
);

export function assertValidPayload(payload: unknown): asserts payload is Record<string, unknown> {
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
		throw new INVALID_PAYLOAD_ERROR();
	}
}
