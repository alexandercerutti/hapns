import { createError } from "../create.js";

const INVALID_APP_DATA_ERROR = createError(
	"INVALID_APP_DATA_ERROR",
	"Cannot create notification: App data were provided but is invalid. Must be an object.",
);

export function assertValidAppData(appData: unknown): asserts appData is Record<string, string> {
	if (appData && typeof appData !== "object") {
		throw new INVALID_APP_DATA_ERROR();
	}
}
