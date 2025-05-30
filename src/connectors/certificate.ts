import { Pool } from "undici";
import type { ConnectorProtocol } from "./connector.js";
import { getApnsErrorByReasonString } from "./apns-errors/index.js";

export interface CertificateConnectorData {
	/**
	 * Certificate file buffer to be read sent when
	 * establishing an HTTP/2 connection to APNs.
	 *
	 * When sending notifications for Apple Wallet,
	 * this should be the certificate used to sign
	 * the pass itself.
	 *
	 * @see https://developer.apple.com/documentation/walletpasses/adding-a-web-service-to-update-passes#Send-a-Push-Notification
	 */
	cert: Uint8Array;

	/**
	 * The private key file buffer for the certificate.
	 *
	 * When sending notifications for Apple Wallet,
	 * this should be the private key used to sign the
	 * pass itself.
	 *
	 * @see https://developer.apple.com/documentation/walletpasses/adding-a-web-service-to-update-passes#Send-a-Push-Notification
	 */
	key: Uint8Array;

	/**
	 * The passphrase for the private key.
	 * If omitted and the key is encrypted,
	 * error `ERR_OSSL_BAD_DECRYPT` might get
	 * thrown.
	 */
	passphrase?: string;
}

/**
 * Helps establishing a certificate based connection to APNs.
 * @see https://developer.apple.com/documentation/usernotifications/establishing-a-certificate-based-connection-to-apns
 *
 * @param details
 */

export function CertificateConnector(details: CertificateConnectorData): ConnectorProtocol {
	if (!details.cert || !ArrayBuffer.isView(details.cert)) {
		throw new Error("Certificate connector field 'cert' is missing or is not an Uint8Array.");
	}

	if (!details.key || !ArrayBuffer.isView(details.key)) {
		throw new Error("Certificate connector field 'key' is missing or is not an Uint8Array.");
	}

	const pools = new Map<string, Pool>();

	return {
		async send(payload) {
			if (!payload.headers || typeof payload.headers !== "object") {
				throw new Error("Payload headers are missing or are not an object.");
			}

			if (!payload.body || typeof payload.body !== "object") {
				throw new Error("Payload body is missing or is not an object.");
			}

			const body = JSON.stringify(payload.body);

			const poolId = `${payload.method || "POST"} ${payload.baseUrl}`;
			let pool = pools.get(poolId);

			if (!pool) {
				const decoder = new TextDecoder();

				pool = new Pool(payload.baseUrl, {
					allowH2: true,
					/**
					 * @TODO evaluate if we should increase the number of connections
					 * to the APNs server. Might be interesting or useful if user is
					 * sending a lot of notifications at once.
					 */
					pipelining: 1,
					connect: {
						cert: decoder.decode(details.cert),
						key: decoder.decode(details.key),
						passphrase: details.passphrase,
					},
				});

				pools.set(poolId, pool);
			}

			const response = await pool.request({
				method: payload.method,
				path: payload.requestPath,
				headers: payload.headers,
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
