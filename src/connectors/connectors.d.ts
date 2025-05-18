interface APNsHeaders {
	"apns-request-id"?: string;
	"apns-expiration": string;
	"apns-priority": string;
	"apns-push-type": string;

	/**
	 * Only broadcast notifications
	 */
	"apns-channel-id"?: string;

	/**
	 * Only classic notifications,
	 * not broaadcast ones.
	 */
	"apns-topic"?: string;
	"apns-collapse-id"?: string;
}

interface ConnectorSendPayload {
	baseUrl: string;
	requestPath: string;
	headers: APNsHeaders;
	body: Record<string, unknown>;
}

interface DeliveryResult {
	apnsId: string;
	apnsUniqueId?: string | undefined;
}

export interface ConnectorProtocol {
	send(payload: ConnectorSendPayload): Promise<DeliveryResult>;
}
