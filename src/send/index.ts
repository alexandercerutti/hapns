import type { APNsHeaders, ConnectorProtocol, DeliveryResult } from "../connectors/connector.js";
import { createError } from "../errors/create.js";
import type { Notification } from "../notifications/notification.js";
import type { NotificationTarget } from "../targets/target.js";

const CONNECTOR_INVALID_ERROR = createError(
	"CONNECTOR_INVALID_ERROR",
	"Cannot send notification: Connector is missing or is not a valid connector.",
);

const NOTIFICATION_INVALID_ERROR = createError(
	"NOTIFICATION_INVALID_ERROR",
	"Cannot send notification: Notification is missing or is not a valid notification.",
);

const TOPIC_PUSH_TYPE_INVALID_ERROR = createError(
	"TOPIC_PUSH_TYPE_INVALID_ERROR",
	"Cannot send notification: Provided notification object is not a valid notification as is missing topic or push type.",
);

const TARGET_INVALID_ERROR = createError(
	"TARGET_INVALID_ERROR",
	"Cannot send notification: Target is missing or is not a valid target.",
);

export async function send(
	connector: ConnectorProtocol,
	notification: Notification<object>,
	target: NotificationTarget,
	useSandbox: boolean = false,
): Promise<DeliveryResult> {
	if (!connector || typeof connector.send !== "function") {
		throw new CONNECTOR_INVALID_ERROR();
	}

	if (!notification || typeof notification !== "object") {
		throw new NOTIFICATION_INVALID_ERROR();
	}

	if (!notification.topic || !notification.pushType) {
		throw new TOPIC_PUSH_TYPE_INVALID_ERROR();
	}

	if (!target || typeof target !== "object") {
		throw new TARGET_INVALID_ERROR();
	}

	const headers = {
		"apns-expiration": String(notification.expiration || 0),
		"apns-priority": String(notification.priority || 1),
		"apns-topic": notification.topic,
		"apns-push-type": notification.pushType,
		"apns-collapse-id": notification.collapseID,
		"apns-channel-id": undefined,
		"apns-request-id": undefined,
		...(target.headers || {}),
	} satisfies APNsHeaders;

	const body = {
		...notification.body,
		...(target.body || {}),
	};

	/**
	 * @developmentonly Will be removed when the code will reach v1.0.0
	 */
	console.log("APNS request body:", body);

	const response = await connector.send({
		method: "POST",
		baseUrl: target.getBaseUrl(useSandbox),
		requestPath: target.requestPath,
		headers,
		body,
	});

	const {
		"apns-id": apnsId,
		// Only for broadcast
		"apns-request-id": apnsRequestId,
		"apns-unique-id": apnsUniqueId,
	} = response.headers as Record<string, string>;

	return {
		apnsId: apnsId || apnsRequestId,
		apnsUniqueId,
	};
}
