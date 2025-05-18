import { createSigner } from "fast-jwt";
import { Pool } from "undici";
import type { ConnectorProtocol } from "./connector.js";
import { getApnsErrorByReasonString } from "./apns-errors/index.js";

/**
 * 2 minutes earlier. This should let us avoid
 * any kind of error from expired token from the server.
 */
const TOKEN_VALIDITY_TIME_1H = 58 * 60 * 1000;

export interface TokenConnectorData {
	/**
	 * PKCS 8 file content to be read and used as the private key.
	 */
	key: Uint8Array;

	/**
	 * A 10-character string Key ID provided by Apple.
	 */
	keyId: string;

	/**
	 * The team ID of the Apple Developer Account.
	 */
	teamIdentifier: string;
}

interface TokenMemory {
	token: string;
	issuedAt: number;
}

/**
 * Helps establishing a token based connection to APNs.
 * @see https://developer.apple.com/documentation/usernotifications/establishing-a-token-based-connection-to-apns
 *
 * @param details
 */

export function TokenConnector(details: TokenConnectorData): ConnectorProtocol {
	if (!details.key || !ArrayBuffer.isView(details.key)) {
		throw new Error("Token connector field 'key' is missing or is not an Uint8Array.");
	}

	if (!details.keyId) {
		throw new Error("Token connector field 'keyId' is missing.");
	}

	if (!details.teamIdentifier) {
		throw new Error("Token connector field 'teamIdentifier' is missing.");
	}

	let tokenMemory: TokenMemory | undefined = undefined;

	const pools = new Map<string, Pool>();

	return {
		async send(payload) {
			if (!payload.headers || typeof payload.headers !== "object") {
				throw new Error("Payload headers are missing or are not an object.");
			}

			if (!payload.body || typeof payload.body !== "object") {
				throw new Error("Payload body is missing or is not an object.");
			}

			if (!tokenMemory || isTokenExpired(tokenMemory)) {
				tokenMemory = createToken(details);
			}

			const { token } = tokenMemory;

			const headers: typeof payload.headers & { authorization: string } = {
				...payload.headers,
				authorization: `Bearer ${token}`,
			};

			const body = JSON.stringify(payload.body);

			const poolId = `${payload.baseUrl}+${payload.method || "POST"}`;
			let pool = pools.get(poolId);

			if (!pool) {
				pool = new Pool(payload.baseUrl, {
					allowH2: true,
					/**
					 * @TODO evaluate if we should increase the number of connections
					 * to the APNs server. Might be interesting or useful if user is
					 * sending a lot of notifications at once.
					 */
					pipelining: 1,
				});

				pools.set(poolId, pool);
			}

			const response = await pool.request({
				method: payload.method,
				path: payload.requestPath,
				headers,
				body,
			});

			if (response.statusCode !== 200) {
				const { reason } = (await response.body.json()) as { reason: string; timestamp?: number };
				const { "apns-id": apnsId, "apns-request-id": apnsRequestId } = response.headers as Record<
					string,
					string
				>;

				const ApnsErrorForReason = getApnsErrorByReasonString(reason);

				throw new ApnsErrorForReason(apnsId || apnsRequestId || "");
			}

			return response;
		},
	};
}

function isTokenExpired(tokenMemory: TokenMemory): boolean {
	return tokenMemory.issuedAt + TOKEN_VALIDITY_TIME_1H >= Date.now();
}

function createToken(details: TokenConnectorData): TokenMemory {
	const signer = createSigner({
		algorithm: "ES256",
		kid: details.keyId,
		iss: details.teamIdentifier,
	});

	const token = signer({
		iss: details.teamIdentifier,
	});

	return {
		token,
		issuedAt: Date.now(),
	};
}
