import type { Dispatcher } from "undici";

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

interface ConnectorSendPayload<Headers extends object> {
	method: "POST" | "GET" | "DELETE";
	baseUrl: string;
	requestPath: string;
	headers: Headers;
	body: Record<string, unknown>;
}

interface DeliveryResult {
	apnsId: string;
	apnsUniqueId?: string | undefined;
}

interface ConnectorProtocol {
	send<Headers extends object>(
		payload: ConnectorSendPayload<Headers>,
	): Promise<Dispatcher.ResponseData<null>>;
}
