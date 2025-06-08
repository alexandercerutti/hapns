import type { Dispatcher } from "undici";

export const Connector = {
	Certificate: 0b001,
	Token: /***/ 0b010,
} as const;
export type Connector = (typeof Connector)[keyof typeof Connector];

export interface APNsHeaders {
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

export interface ConnectorSendPayload<Headers extends Record<string, string | undefined>> {
	method: "POST" | "GET" | "DELETE";
	baseUrl: string;
	requestPath: string;
	headers: Headers;
	body: Record<string, unknown>;
}

export interface DeliveryResult {
	apnsId: string;
	apnsUniqueId?: string | undefined;
}

export interface ConnectorProtocol {
	readonly connectionType: Connector;
	send<Headers extends Record<string, string | undefined>>(
		payload: ConnectorSendPayload<Headers>,
	): Promise<Dispatcher.ResponseData<null>>;
}
