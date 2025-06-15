import type { Dispatcher } from "undici";
import type { PushType } from "../notifications/notification.js";

export const Connector = {
	Certificate: 0b001,
	Token: /***/ 0b010,
} as const;
export type Connector = (typeof Connector)[keyof typeof Connector];

export interface APNsHeaders {
	"apns-id"?: string;
	"apns-expiration": string;
	"apns-priority": string;
	"apns-push-type": PushType;

	/**
	 * Only broadcast notifications
	 */
	"apns-channel-id"?: string;
	"apns-request-id"?: string;

	/**
	 * Only classic notifications,
	 * not broaadcast ones.
	 */
	"apns-topic"?: string;
	"apns-collapse-id"?: string;
}

export type ConnectorSendPayload<Headers extends Record<string, string | undefined>> = {
	baseUrl: string;
	requestPath: string;
	headers: Headers;
} & (
	| {
			method: "POST";
			body: Record<string, unknown>;
	  }
	| {
			method: "DELETE";
			body?: Record<string, unknown> | undefined;
	  }
	| {
			method: "GET";
	  }
);
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
