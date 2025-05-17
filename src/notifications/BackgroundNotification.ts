import type { NotificationDetails } from "./notifications.d.ts";

/**
 * Empty interface on purpose to allow for TS
 * autocompletion to be extended by the user
 */
interface NotificationCustomData {}

export function BackgroundNotification(
	topic: string,
	data: Omit<NotificationDetails<Record<string, string>, NotificationCustomData>, "priority">,
): void {}
