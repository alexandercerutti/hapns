import type { NotificationDetails } from "./notification.js";
/**
 * Empty interface on purpose to allow for TS
 * autocompletion to be extended by the user
 */
interface NotificationCustomData {}

export function LocationNotification(
	topic: string,
	data: NotificationDetails<Record<string, string>, NotificationCustomData>,
): void {}
