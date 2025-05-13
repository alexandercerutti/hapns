import type { ConnectorProtocol } from "../connectors/connectors.d.ts";
import type { Notification } from "../notifications/notifications.d.ts";
import type { NotificationTarget } from "../targets/target.js";

export async function send(
	connector: ConnectorProtocol,
	notification: Notification<object, object>,
	target: NotificationTarget,
): Promise<void> {}
