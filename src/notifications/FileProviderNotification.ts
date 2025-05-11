import type { NotificationDetails } from "./notification";

/**
 * Empty interface on purpose to allow for TS
 * autocompletion to be extended by the user
 */
interface NotificationCustomData {}

export function FileProviderNotification(
	topic: string,
	data: NotificationDetails<Record<string, string>, NotificationCustomData>,
): void {}
