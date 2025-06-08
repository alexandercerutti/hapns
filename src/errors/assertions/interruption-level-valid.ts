import { createError } from "../create.js";

export type InterruptionLevel = "passive" | "active" | "time-sensitive" | "critical";

const INVALID_INTERRUPTION_LEVEL_ERROR = createError(
	"INVALID_INTERRUPTION_LEVEL_ERROR",
	"Cannot create notification: Invalid interruption level. Must be one of: 'passive', 'active', 'time-sensitive' or 'critical'. Received: %s",
);

function isInterruptionLevelStandard(
	interruptionLevel: unknown,
): interruptionLevel is InterruptionLevel {
	return ["passive", "active", "time-sensitive", "critical"].includes(
		interruptionLevel as InterruptionLevel,
	);
}

export function assertInterruptionLevelValid(
	interruptionLevel: unknown,
): asserts interruptionLevel is InterruptionLevel | undefined {
	if (!interruptionLevel) {
		return;
	}

	if (typeof interruptionLevel !== "string") {
		throw new INVALID_INTERRUPTION_LEVEL_ERROR(interruptionLevel);
	}

	if (!isInterruptionLevelStandard(interruptionLevel)) {
		throw new INVALID_INTERRUPTION_LEVEL_ERROR(interruptionLevel);
	}
}
