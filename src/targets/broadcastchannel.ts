import type { NotificationTarget } from "./target.js";

const BROADCAST_DELIVERY_PATH = "/4/device/";

export interface BroadcastChannel extends NotificationTarget {
	channelId: string;
	bundleId: string;
}

export function BroadcastChannel(channelId: string, bundleId: string): BroadcastChannel {
	if (typeof channelId !== "string") {
		throw new Error("Broadcast channel id not provided.");
	}

	if (!bundleId || typeof bundleId !== "string") {
		throw new Error("Bundle ID is missing or is not a string.");
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
