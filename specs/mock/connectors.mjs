/**
 * Mock connector utilities for APNs testing
 * Provides functional approach to creating mock connectors
 */

/**
 * Create a basic mock connector function
 */
export function createMockConnector(options = {}) {
	const requests = [];
	const {
		connectionType = 0b010, // Token connector type by default
		defaultStatus = 200,
		defaultHeaders = { "apns-id": "mock-apns-id-123" },
	} = options;

	const responses = new Map();

	const connector = {
		connectionType,
		requests,
		responses,
		async send(payload) {
			// Record the request
			requests.push(structuredClone(payload));

			// Check if we have a specific response for this method/path combination
			const key = `${payload.method}:${payload.requestPath || payload.path || ""}`;
			if (responses.has(key)) {
				const response = responses.get(key);
				if (response.shouldThrow) {
					throw new Error(response.error || "Network error");
				}
				return response;
			}

			// Return basic successful response
			return {
				status: defaultStatus,
				headers: defaultHeaders,
				body: {
					json: async () => ({}),
				},
			};
		},
		mockResponse(method, path, response) {
			const key = `${method}:${path}`;
			responses.set(key, response);
		},
	};

	return connector;
}

/**
 * Create a mock connector that returns a specific response
 */
export function createMockConnectorWithResponse(method, path, response) {
	const connector = createMockConnector();
	connector.mockResponse(method, path, response);
	return connector;
}

/**
 * Create a mock connector that throws an error
 */
export function createMockConnectorWithError(errorMessage, path = null) {
	const connector = createMockConnector();

	connector.send = async function (payload) {
		// Still record the request
		connector.requests.push(structuredClone(payload));

		// If a specific path is provided, only throw error for that path
		if (path && !payload.requestPath?.includes(path) && !payload.path?.includes(path)) {
			// For other paths, return success
			return {
				status: 200,
				headers: { "apns-id": "mock-apns-id-123" },
				body: {
					json: async () => ({}),
				},
			};
		}

		throw new Error(errorMessage);
	};

	return connector;
}

/**
 * Create a mock connector that returns an APNs error
 */
export function createMockConnectorWithApnsError(
	method,
	pathPattern,
	status,
	reason,
	timestamp = Date.now(),
) {
	const connector = createMockConnector();

	// Override send to throw an error for paths matching the pattern
	connector.send = async function (payload) {
		// Record the request
		connector.requests.push(structuredClone(payload));

		const requestPath = payload.requestPath || payload.path || "";

		// Check if the request path matches the pattern (for device paths, just check if it contains the pattern)
		const matchesPattern =
			pathPattern === "*" ||
			requestPath.includes(pathPattern) ||
			(pathPattern.startsWith("/3/device/") && requestPath.startsWith("/3/device/"));

		if (payload.method === method && matchesPattern) {
			const error = new Error(`HTTP ${status}`);
			error.status = status;
			error.response = {
				status,
				headers: { "apns-id": `error-${Date.now()}` },
				body: {
					json: async () => ({ reason, timestamp }),
				},
			};
			throw error;
		}

		// For other paths, return success
		return {
			status: 200,
			headers: { "apns-id": "mock-apns-id-123" },
			body: {
				json: async () => ({}),
			},
		};
	};

	return connector;
}
