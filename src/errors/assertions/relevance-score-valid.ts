import { defineError } from "../define.js";

const INVALID_RELEVANCE_SCORE_RANGE_ERROR = defineError(
	"INVALID_RELEVANCE_SCORE_RANGE_ERROR",
	"Cannot create notification: Invalid relevance score. Must be between %s and %s. Received: %s",
);

const INVALID_RELEVANCE_SCORE_TYPE_ERROR = defineError(
	"INVALID_RELEVANCE_SCORE_TYPE_ERROR",
	"Cannot create notification: Invalid relevance score. Not a number.",
);

export function assertRelevanceScoreValid(
	relevanceScore: unknown,
	min: number,
	max: number,
): asserts relevanceScore is number | undefined {
	if (!relevanceScore) {
		return;
	}

	if (typeof relevanceScore !== "number") {
		throw new INVALID_RELEVANCE_SCORE_TYPE_ERROR();
	}

	if (relevanceScore < min || relevanceScore > max) {
		throw new INVALID_RELEVANCE_SCORE_RANGE_ERROR(min, max, relevanceScore);
	}
}
