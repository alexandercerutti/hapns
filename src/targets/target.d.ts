import type { ConnectorSendPayload } from "../connectors/connectors.d.ts";

export interface NotificationTarget {
	getBaseUrl(useSandbox: boolean): string;
	requestPath: string;
	headers?: Partial<ConnectorSendPayload["headers"]>;
	body?: ConnectorSendPayload["body"];
}
