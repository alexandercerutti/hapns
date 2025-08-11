import { createMockConnector } from "./connectors.mjs";

/**
 * Broadcast channel utilities
 */

/**
 * Create a connector that mocks reading all channels
 */
export function mockReadAllChannels(bundleId, channels = []) {
	const connector = createMockConnector();
	connector.mockResponse("GET", `/1/apps/${bundleId}/all-channels`, {
		headers: { "apns-id": "mock-apns-id-123" },
		status: 200,
		body: {
			json: async () => ({ channels }),
		},
	});
	return connector;
}

/**
 * Create a connector that mocks channel creation
 */
export function mockChannelCreation(bundleId, channelId) {
	const connector = createMockConnector();
	connector.mockResponse("POST", `/1/apps/${bundleId}/channels`, {
		headers: {
			"apns-id": "mock-apns-id-123",
			"apns-channel-id": channelId,
		},
		status: 200,
		body: {
			json: async () => ({}),
		},
	});
	return connector;
}

/**
 * Create a connector that mocks channel deletion
 */
export function mockChannelDeletion(bundleId, requestId) {
	const connector = createMockConnector();
	connector.mockResponse("DELETE", `/1/apps/${bundleId}/channels`, {
		headers: { "apns-request-id": requestId },
		status: 200,
		body: {
			json: async () => ({ success: true, apnsRequestId: requestId }),
		},
	});
	return connector;
}
