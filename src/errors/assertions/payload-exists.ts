import { defineError } from "../define.js";

const INVALID_PAYLOAD_ERROR = defineError(
	"INVALID_PAYLOAD_ERROR",
	"Cannot create notification: payload is invalid (missing or not an object).",
);

export function assertValidPayload(payload: unknown): asserts payload is Record<string, unknown> {
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
		throw new INVALID_PAYLOAD_ERROR();
	}
}
