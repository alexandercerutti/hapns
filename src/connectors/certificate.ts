export interface CertificateConnectorData {
	/**
	 * Certificate file path to be read sent when
	 * establishing an HTTP/2 connection to APNs.
	 */
	cert: string;

	/**
	 * The private key file path for the certificate
	 */
	key: string;
}

/**
 * Helps establishing a token based connection to APNs.
 * @see https://developer.apple.com/documentation/usernotifications/establishing-a-certificate-based-connection-to-apns
 *
 * @param details
 */

export function CertificateConnector(details: CertificateConnectorData): void {}
