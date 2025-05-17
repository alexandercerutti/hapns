import type { APNsHeaders, ConnectorProtocol, DeliveryResult } from "../connectors/connectors.d.ts";
import type { Notification } from "../notifications/notifications.d.ts";
import type { NotificationTarget } from "../targets/target.js";

export async function send(
	connector: ConnectorProtocol,
	notification: Notification<object, object>,
	target: NotificationTarget,
): Promise<DeliveryResult> {
	if (!connector || typeof connector.send !== "function") {
		throw new Error("Connector is missing or is not a valid connector.");
	}

	if (!notification || typeof notification !== "object") {
		throw new Error("Notification is missing or is not a valid notification.");
	}

	if (!notification.topic || !notification.pushType) {
		throw new Error(
			"Provided notification is not a valid notification as is missing topic or push type.",
		);
	}

	if (!target || typeof target !== "object") {
		throw new Error("Target is missing or is not a valid target.");
	}

	return target.prepareForDelivery().then(async (payload) => {
		const headers: APNsHeaders = {
			"apns-expiration": String(notification.expiration || 0),
			"apns-priority": String(notification.priority || 1),
			"apns-topic": notification.topic,
			"apns-push-type": notification.pushType,
			"apns-collapse-id": notification.collapseID,
			"apns-channel-id": undefined,
			...(payload.headers || {}),
		};

		const body = {
			...notification.body,
			...(payload.body || {}),
		};

		const deliveryResult = await connector.send({
			requestPath: payload.requestPath,
			headers,
			body,
		});

		return deliveryResult;
	});
}
