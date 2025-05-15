import { createSigner } from "fast-jwt";
import type { ConnectorProtocol } from "./connectors.d.ts";

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

	/**
	 * Set to true to use the development APNs server.
	 * Otherwise, the production server is used.
	 *
	 * @default false
	 */
	useSandbox?: boolean;
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
	if (!details.key || ArrayBuffer.isView(details.key)) {
		throw new Error("Token connector field 'key' is missing or is not an Uint8Array.");
	}

	if (!details.keyId) {
		throw new Error("Token connector field 'keyId' is missing.");
	}

	if (!details.teamIdentifier) {
		throw new Error("Token connector field 'teamIdentifier' is missing.");
	}

	let tokenMemory: TokenMemory | undefined = undefined;

	return {
		async send(payload) {
			if (!tokenMemory || isTokenExpired(tokenMemory)) {
				tokenMemory = createToken(details);
			}

			const { token } = tokenMemory;

			/**
			 * @TODO implement sending the notification
			 */
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
