import { defineError } from "../errors/defineError.js";
import type { NotificationTarget } from "./target.js";

const DEVICE_TOKEN_INVALID = defineError(
	"DEVICE_TOKEN_INVALID",
	"Cannot create device target: 'deviceToken' is missing or is not a string. Received: '%s'.",
);

const DEVICE_DELIVERY_PATH = "/3/device/";

export function Device(deviceToken: string): NotificationTarget {
	if (!deviceToken || typeof deviceToken !== "string") {
		throw new DEVICE_TOKEN_INVALID(deviceToken);
	}

	return {
		getBaseUrl(useSandbox: boolean = false) {
			return useSandbox ? "https://api.sandbox.push.apple.com" : "https://api.push.apple.com";
		},
		requestPath: `${DEVICE_DELIVERY_PATH}${deviceToken}`,
	};
}
