import type { NotificationDetails } from "./notification.js";
/**
 * Empty interface on purpose to allow for TS
 * autocompletion to be extended by the user.
 * Must be exported to allow extending in the user's code.
 */
export interface NotificationCustomData {}

export function MDMNotification(
	topic: string,
	data: NotificationDetails<Record<string, string>, NotificationCustomData>,
): void {}
