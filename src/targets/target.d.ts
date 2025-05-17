import type { ConnectorSendPayload } from "../connectors/connectors.d.ts";

export type TargetPayload = Pick<ConnectorSendPayload, "requestPath"> &
	Omit<Partial<ConnectorSendPayload>, "requestPath">;

export interface NotificationTarget {
	prepareForDelivery(): PromiseLike<TargetPayload>;
}
