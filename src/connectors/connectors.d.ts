interface APNsHeaders {
	authorization: string;
	"apns-request-id"?: string;
	"apns-expiration": number;
	"apns-priority": number;
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
	url: string;
	headers: APNsHeaders;
	body: Record<string, unknown>;
}

export interface ConnectorProtocol {
	send(payload: ConnectorSendPayload): Promise<void>;
}
