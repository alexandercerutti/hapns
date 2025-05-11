import type { Connector } from "../connectors/connectors.d.ts";
import type { Notification } from "../notifications/notifications.d.ts";
import type { NotificationTarget } from "../targets/target.js";

export async function send(
	connector: Connector,
	notification: Notification,
	target: NotificationTarget,
): Promise<void> {}
