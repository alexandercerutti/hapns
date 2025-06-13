import type { NotificationTarget } from "./target.js";

const DEVICE_DELIVERY_PATH = "/3/device/";

export function Device(deviceToken: string): NotificationTarget {
	if (typeof deviceToken !== "string") {
		throw new Error("Device token must be a string");
	}

	return {
		getBaseUrl(useSandbox: boolean = false) {
			return useSandbox ? "https://api.sandbox.push.apple.com" : "https://api.push.apple.com";
		},
		requestPath: `${DEVICE_DELIVERY_PATH}${deviceToken}`,
	};
}
