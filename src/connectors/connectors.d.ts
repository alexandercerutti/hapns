import type { Notification } from "../notifications/notifications";
import type { NotificationTarget } from "../targets/target";

/**
 * @TODO determine the protocol for a connector
 */
export interface ConnectorProtocol {
	send(notification: Notification<object, object>, target: NotificationTarget): Promise<void>;
}
