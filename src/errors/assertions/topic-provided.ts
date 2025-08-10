import { defineError } from "../defineError.js";

const INVALID_TOPIC_ERROR = defineError(
	"INVALID_TOPIC_ERROR",
	"Cannot create notification: topic not provided or not a string.",
);

export function assertTopicProvided(topic: unknown): asserts topic is string {
	if (!topic || typeof topic !== "string") {
		throw new INVALID_TOPIC_ERROR();
	}
}
