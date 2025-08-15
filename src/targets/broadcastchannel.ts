import { defineError } from "../errors/defineError.js";
import type { NotificationTarget } from "./target.js";

const CHANNEL_ID_INVALID = defineError(
	"CHANNEL_ID_INVALID",
	"Cannot create broadcast channel: channelId is missing or is not a string. Received: '%s'.",
);

const BUNDLE_ID_INVALID = defineError(
	"BUNDLE_ID_INVALID",
	"Cannot create broadcast channel: bundleId is missing or is not a string. Received: '%s'.",
);

const BROADCAST_DELIVERY_PATH = "/4/device/";

export interface BroadcastChannel extends NotificationTarget {
	channelId: string;
	bundleId: string;
}

export function BroadcastChannel(channelId: string, bundleId: string): BroadcastChannel {
	if (!channelId || typeof channelId !== "string") {
		throw new CHANNEL_ID_INVALID(channelId);
	}

	if (!bundleId || typeof bundleId !== "string") {
		throw new BUNDLE_ID_INVALID(bundleId);
	}

	return {
		channelId,
		bundleId,
		getBaseUrl(useSandbox: boolean = false) {
			return useSandbox ? "https://api.sandbox.push.apple.com" : "https://api.push.apple.com";
		},
		requestPath: `${BROADCAST_DELIVERY_PATH}${bundleId}`,
		headers: {
			"apns-channel-id": channelId,
		},
	};
}
