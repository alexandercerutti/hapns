import type { ConnectorSendPayload } from "../connectors/connectors.d.ts";

export interface NotificationTarget {
	requestPath: string;
	headers?: Partial<ConnectorSendPayload["headers"]>;
	body?: ConnectorSendPayload["body"];
}
