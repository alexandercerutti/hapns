import type { NotificationTarget } from "./target.d.ts";

const DEVICE_DELIVERY_PATH = "/3/device/";

export function Device(deviceToken: string): NotificationTarget {
	if (typeof deviceToken !== "string") {
		throw new Error("Device token must be a string");
	}

	return {
		requestPath: `${DEVICE_DELIVERY_PATH}${deviceToken}`,
	};
}
