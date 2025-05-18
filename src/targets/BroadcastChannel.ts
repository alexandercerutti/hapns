import type { NotificationTarget } from "./target.js";

const BROADCAST_DELIVERY_PATH = "/4/device/";

export function BroadcastChannel(channelId: string, bundleId: string): NotificationTarget {
	if (typeof channelId !== "string") {
		throw new Error("Broadcast channel id not provided.");
	}

	return {
		getBaseUrl(useSandbox: boolean = false) {
			return useSandbox ? "https://api.sandbox.push.apple.com" : "https://api.push.apple.com";
		},
		requestPath: `${BROADCAST_DELIVERY_PATH}${bundleId}`,
		headers: {
			"apns-channel-id": channelId,
		},
	};
}
