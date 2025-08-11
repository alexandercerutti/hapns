import { createMockConnectorWithApnsError } from "./connectors.mjs";

/**
 * Common APNs error scenarios
 */

export function badDeviceToken() {
	return createMockConnectorWithApnsError("POST", "/3/device/", 400, "BadDeviceToken");
}

export function unregistered(timestamp) {
	return createMockConnectorWithApnsError("POST", "/3/device/", 410, "Unregistered", timestamp);
}

export function payloadTooLarge() {
	return createMockConnectorWithApnsError("POST", "/3/device/", 413, "PayloadTooLarge");
}

export function tooManyRequests() {
	return createMockConnectorWithApnsError("POST", "/3/device/", 429, "TooManyRequests");
}

export function internalServerError() {
	return createMockConnectorWithApnsError("POST", "/3/device/", 500, "InternalServerError");
}

export function serviceUnavailable() {
	return createMockConnectorWithApnsError("POST", "/3/device/", 503, "ServiceUnavailable");
}

export function badTopic() {
	return createMockConnectorWithApnsError("POST", "/3/device/", 400, "BadTopic");
}

export function invalidPushType() {
	return createMockConnectorWithApnsError("POST", "/3/device/", 400, "InvalidPushType");
}

export function missingTopic() {
	return createMockConnectorWithApnsError("POST", "/3/device/", 400, "MissingTopic");
}

export function expiredProviderToken() {
	return createMockConnectorWithApnsError("POST", "/3/device/", 403, "ExpiredProviderToken");
}

/**
 * Create a mock connector that returns a 400 Bad Request error
 */
export function badRequest(method = "POST", path = "/3/device/") {
	return createMockConnectorWithApnsError(method, path, 400, "BadRequest");
}
