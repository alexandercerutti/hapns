import { createSigner } from "fast-jwt";
import { Pool } from "undici";
import type { ConnectorProtocol } from "./connector.js";
import { getApnsErrorByReasonString } from "./apns-errors/index.js";
import { createError } from "../errors/create.js";

/**
 * 2 minutes earlier. This should let us avoid
 * any kind of error from expired token from the server.
 */
const TOKEN_VALIDITY_TIME_1H = 58 * 60 * 1000;

const INVALID_KEY_ERROR = createError(
	"INVALID_KEY_ERROR",
	"Cannot setup token connector: field 'key' is missing or is not an Uint8Array.",
);

const INVALID_KEY_ID_ERROR = createError(
	"INVALID_KEY_ID_ERROR",
	"Cannot setup token connector: field 'keyId' is invalid (missing or not a string).",
);

const INVALID_TEAM_IDENTIFIER_ERROR = createError(
	"INVALID_TEAM_IDENTIFIER_ERROR",
	"Cannot setup token connector: field 'teamIdentifier' is missing or is not a string.",
);

const INVALID_HEADERS_ERROR = createError(
	"INVALID_HEADERS_ERROR",
	"Cannot send request: payload headers are missing or are not an object.",
);

const INVALID_BODY_ERROR = createError(
	"INVALID_BODY_ERROR",
	"Cannot send request: payload body is missing or is not an object.",
);

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
		throw new INVALID_KEY_ERROR();
	}

	if (!details.keyId || typeof details.keyId !== "string") {
		throw new INVALID_KEY_ID_ERROR();
	}

	if (!details.teamIdentifier || typeof details.teamIdentifier !== "string") {
		throw new INVALID_TEAM_IDENTIFIER_ERROR();
	}

	let tokenMemory: TokenMemory | undefined = undefined;

	const pools = new Map<string, Pool>();

	return {
		async send(payload) {
			if (!payload.headers || typeof payload.headers !== "object") {
				throw new INVALID_HEADERS_ERROR();
			}

			if (!payload.body || typeof payload.body !== "object") {
				throw new INVALID_BODY_ERROR();
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

			const poolId = `${payload.method || "POST"} ${payload.baseUrl}`;
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
	return Date.now() >= tokenMemory.issuedAt + TOKEN_VALIDITY_TIME_1H;
}

function createToken(details: TokenConnectorData): TokenMemory {
	const signer = createSigner({
		algorithm: "ES256",
		kid: details.keyId,
		key: new TextDecoder().decode(details.key),
	});

	const token = signer({
		iss: details.teamIdentifier,
	});

	return {
		token,
		issuedAt: Date.now(),
	};
}
