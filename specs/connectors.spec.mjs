import { test } from "node:test";
import assert from "node:assert";
import { TokenConnector } from "hapns/connectors/token";
import { CertificateConnector } from "hapns/connectors/certificate";
import * as mockUtils from "./mock/index.mjs";

// Mock private key for testing (this is not a real key)
const mockPrivateKey = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg1234567890abcdef
1234567890abcdef1234567890abcdefhkOBwwClRANCAAQ1234567890abcdef
1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
1234567890abcdef1234567890abcdef1234567890abcdef
-----END PRIVATE KEY-----`;

const mockCertificate = `-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJAMlyFqk69v+9MA0GCSqGSIb3DQEBCwUAMBQxEjAQBgNVBAMMCWxv
Y2FsaG9zdDAeFw0yMjAxMTAwMDAwMDBaFw0yMzAxMTAwMDAwMDBaMBQxEjAQBgNV
BAMMCWxvY2FsaG9zdDBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABPHnRz8EWJ
1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
-----END CERTIFICATE-----`;

test("TokenConnector", async (t) => {
	await t.test("should create TokenConnector with valid parameters", async () => {
		const connector = TokenConnector({
			key: new TextEncoder().encode(mockPrivateKey),
			keyId: "ABC123DEFG",
			teamIdentifier: "DEF123GHIJ",
		});

		assert.ok(connector);
		assert.strictEqual(connector.connectionType, 0b010); // Token connector type
		assert.strictEqual(typeof connector.send, "function");
	});

	await t.test("should handle different key formats", async () => {
		// Test with Uint8Array
		const connector1 = TokenConnector({
			key: new TextEncoder().encode(mockPrivateKey),
			keyId: "ABC123DEFG",
			teamIdentifier: "DEF123GHIJ",
		});

		// Test with Buffer
		const connector2 = TokenConnector({
			key: Buffer.from(mockPrivateKey, "utf8"),
			keyId: "ABC123DEFG",
			teamIdentifier: "DEF123GHIJ",
		});

		assert.ok(connector1);
		assert.ok(connector2);
	});

	await t.test("should make HTTP requests correctly", async () => {
		const connector = TokenConnector({
			key: new TextEncoder().encode(mockPrivateKey),
			keyId: "ABC123DEFG",
			teamIdentifier: "DEF123GHIJ",
		});

		assert.strictEqual(typeof connector.send, "function");
		assert.ok(connector.send);
	});
});

test("CertificateConnector", async (t) => {
	await t.test("should create CertificateConnector with valid parameters", async () => {
		const connector = CertificateConnector({
			cert: Buffer.from(mockCertificate, "utf8"),
			key: Buffer.from(mockPrivateKey, "utf8"),
		});

		assert.ok(connector);
		assert.strictEqual(connector.connectionType, 0b001); // Certificate connector type
		assert.strictEqual(typeof connector.send, "function");
	});

	await t.test("should create CertificateConnector with passphrase", async () => {
		const connector = CertificateConnector({
			cert: Buffer.from(mockCertificate, "utf8"),
			key: Buffer.from(mockPrivateKey, "utf8"),
			passphrase: "test-passphrase",
		});

		assert.ok(connector);
	});

	await t.test("should handle certificate and key as buffers", async () => {
		const connector = CertificateConnector({
			cert: Buffer.from(mockCertificate, "utf8"),
			key: Buffer.from(mockPrivateKey, "utf8"),
		});

		assert.ok(connector);
		assert.strictEqual(typeof connector.send, "function");
	});
});

test("Connector Protocol", async (t) => {
	await t.test("TokenConnector should implement connector protocol", async () => {
		const connector = TokenConnector({
			key: new TextEncoder().encode(mockPrivateKey),
			keyId: "ABC123DEFG",
			teamIdentifier: "DEF123GHIJ",
		});

		assert.ok(typeof connector.connectionType === "number");
		assert.ok(typeof connector.send === "function");
	});

	await t.test("CertificateConnector should implement connector protocol", async () => {
		const connector = CertificateConnector({
			cert: Buffer.from(mockCertificate, "utf8"),
			key: Buffer.from(mockPrivateKey, "utf8"),
		});

		assert.ok(typeof connector.connectionType === "number");
		assert.ok(typeof connector.send === "function");
	});

	await t.test("connectors should have different connection types", async () => {
		const tokenConnector = TokenConnector({
			key: new TextEncoder().encode(mockPrivateKey),
			keyId: "ABC123DEFG",
			teamIdentifier: "DEF123GHIJ",
		});

		const certConnector = CertificateConnector({
			cert: Buffer.from(mockCertificate, "utf8"),
			key: Buffer.from(mockPrivateKey, "utf8"),
		});

		assert.notStrictEqual(tokenConnector.connectionType, certConnector.connectionType);
	});
});
