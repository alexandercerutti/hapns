import { createMockConnectorWithError } from "./connectors.mjs";

/**
 * Network error scenarios
 */

export function timeout(path = "/3/device/network-error") {
	return createMockConnectorWithError("Network timeout", path);
}

export function connectionRefused(path = "/3/device/connection-refused") {
	return createMockConnectorWithError("Connection refused", path);
}

export function dnsResolution(path = "/3/device/dns-error") {
	return createMockConnectorWithError("DNS resolution failed", path);
}
