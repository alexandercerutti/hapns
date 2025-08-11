import type { APNsHeaders, ConnectorProtocol, DeliveryResult } from "../connectors/connector.js";
import { defineError } from "../errors/defineError.js";
import type { Notification } from "../notifications/notification.js";
import type { NotificationTarget } from "../targets/target.js";

type WithSandbox<T extends object> = T & {
	useSandbox?: boolean;
};

type WithDebug<T extends object> = T & {
	debug?: boolean;
};

type SendingOptions = WithDebug<
	WithSandbox<{
		apnsId?: string;
	}>
>;

const CONNECTOR_INVALID_ERROR = defineError(
	"CONNECTOR_INVALID_ERROR",
	"Cannot send notification: Connector is missing or is not a valid connector.",
);

const NOTIFICATION_INVALID_ERROR = defineError(
	"NOTIFICATION_INVALID_ERROR",
	"Cannot send notification: Notification is missing or is not a valid notification.",
);

const TOPIC_PUSH_TYPE_INVALID_ERROR = defineError(
	"TOPIC_PUSH_TYPE_INVALID_ERROR",
	"Cannot send notification: Provided notification object is not a valid notification as is missing topic or push type.",
);

const TARGET_INVALID_ERROR = defineError(
	"TARGET_INVALID_ERROR",
	"Cannot send notification: Target is missing or is not a valid target.",
);

const UNSUPPORTED_CONNECTOR_ERROR = defineError(
	"UNSUPPORTED_CONNECTOR_ERROR",
	"Cannot send notification: Notification type does not support the provided connector type.",
);

export async function send(
	connector: ConnectorProtocol,
	notification: Notification<Record<string, string>>,
	target: NotificationTarget,
	settings: SendingOptions = {},
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

	if (!(notification.supportedConnectors & connector.connectionType)) {
		throw new UNSUPPORTED_CONNECTOR_ERROR();
	}

	const { useSandbox = false, apnsId, debug = false } = settings;

	const headers = {
		"apns-expiration": String(Math.max(0, notification.expiration || 0)),
		"apns-priority": String(notification.priority || 1),
		"apns-topic": notification.topic,
		"apns-push-type": notification.pushType,
		"apns-collapse-id": notification.collapseID,
		"apns-channel-id": undefined,
		"apns-request-id": undefined,
		"apns-id": apnsId,
		...(target.headers || {}),
	} satisfies APNsHeaders;

	const apnsBaseUrl = target.getBaseUrl(useSandbox);

	if (debug) {
		console.info("APNS request body:\n\n", notification.body, "\n\n");
		console.info(`Sending APNS request to '${apnsBaseUrl}'...`);
	}

	const response = await connector.send({
		method: "POST",
		baseUrl: apnsBaseUrl,
		requestPath: target.requestPath,
		headers,
		body: notification.body,
	});

	if (debug) {
		console.info("APNS response:\n\n", response, "\n\n");
	}

	const {
		"apns-id": apnsResponseId,
		// Only for broadcast
		"apns-request-id": apnsRequestId,
		"apns-unique-id": apnsUniqueId,
	} = response.headers as Record<string, string>;

	return {
		apnsId: apnsResponseId || apnsRequestId,
		apnsUniqueId,
	};
}
