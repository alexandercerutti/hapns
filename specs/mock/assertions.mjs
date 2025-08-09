/**
 * Assertion utilities for mock connectors
 */

/**
 * Assert the number of requests made
 */
export function assertRequestCount(connector, expected) {
	const actual = connector.requests.length;
	if (actual !== expected) {
		throw new Error(`Expected ${expected} requests, but got ${actual}`);
	}
}

/**
 * Assert the last request path
 */
export function assertLastRequestPath(connector, expectedPath) {
	const lastRequest = connector.requests[connector.requests.length - 1];
	if (!lastRequest) {
		throw new Error("No requests recorded");
	}

	const actualPath = lastRequest.requestPath || lastRequest.path || "";
	if (!actualPath.includes(expectedPath)) {
		throw new Error(`Expected path to include "${expectedPath}", but got "${actualPath}"`);
	}
}

/**
 * Assert headers in the last request
 */
export function assertLastRequestHeaders(connector, expectedHeaders) {
	const lastRequest = connector.requests[connector.requests.length - 1];
	if (!lastRequest) {
		throw new Error("No requests recorded");
	}

	for (const [key, value] of Object.entries(expectedHeaders)) {
		if (lastRequest.headers[key] !== value) {
			throw new Error(
				`Expected header "${key}" to be "${value}", but got "${lastRequest.headers[key]}"`,
			);
		}
	}
}

/**
 * Assert the body of the last request
 */
export function assertLastRequestBody(connector, expectedBody) {
	const lastRequest = connector.requests[connector.requests.length - 1];
	if (!lastRequest) {
		throw new Error("No requests recorded");
	}

	const actualBody =
		typeof lastRequest.body === "string" ? JSON.parse(lastRequest.body) : lastRequest.body;

	if (JSON.stringify(actualBody) !== JSON.stringify(expectedBody)) {
		throw new Error(
			`Expected body to match.\nActual: ${JSON.stringify(actualBody, null, 2)}\nExpected: ${JSON.stringify(expectedBody, null, 2)}`,
		);
	}
}

/**
 * Get the last request made
 */
export function getLastRequest(connector) {
	return connector.requests[connector.requests.length - 1];
}

/**
 * Get all requests made
 */
export function getRequests(connector) {
	return [...connector.requests];
}

/**
 * Get requests to a specific path
 */
export function getRequestsToPath(connector, path) {
	return connector.requests.filter((req) => (req.requestPath || req.path || "").includes(path));
}
