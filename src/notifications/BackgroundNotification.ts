import type { NotificationDetails } from "./notification";

export function BackgroundNotification(
	topic: string,
	data: Omit<NotificationDetails, "priority">,
): void {}
