import type { APNsHeaders } from "../connectors/connectors.d.ts";

export interface NotificationTarget {
	getBaseUrl(useSandbox: boolean): string;
	requestPath: string;
	headers?: Partial<APNsHeaders>;
	body?: Record<string, string>;
}
