import type { APNsHeaders } from "../connectors/connector.js";

export interface NotificationTarget {
	getBaseUrl(useSandbox: boolean): string;
	requestPath: string;
	headers?: Partial<APNsHeaders>;
	body?: Record<string, string>;
}
