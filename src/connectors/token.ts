import type { ConnectorProtocol } from "./connectors.d.ts";

export interface TokenConnectorData {
	/**
	 * PKCS 8 file path to be read and used as the private key.
	 */
	key: string;

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
	creationTimestamp: number;
}

/**
 * Helps establishing a token based connection to APNs.
 * @see https://developer.apple.com/documentation/usernotifications/establishing-a-token-based-connection-to-apns
 *
 * @param details
 */

export function TokenConnector(details: TokenConnectorData): ConnectorProtocol {
	const tokenMemory: TokenMemory = {
		token: "",
		creationTimestamp: 0,
	};

	return {
		async send(notification, target) {},
	};
}
