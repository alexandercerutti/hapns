import { test } from "node:test";
import assert from "node:assert";
import path from "node:path";
import fs from "node:fs";
import * as simulator from "./utils/ios-simulator.mjs";
import * as client from "./utils/test-client.mjs";
import { send } from "hapns/send";
import { AlertNotification } from "hapns/notifications/AlertNotification";
import { Device } from "hapns/targets/device";
import { TokenConnector } from "hapns/connectors/token";

const TEST_CONFIG = {
	simulatorName: "hapns-test-iphone",
	deviceType: "com.apple.CoreSimulator.SimDeviceType.iPhone-15-Pro",
	project: path.resolve(
		import.meta.dirname,
		"../examples/AlertNotification-example/ios-app/personalized-news-feed/personalized-news-feed.xcodeproj",
	),
	appBundleIdentifier: "com.alexandercerutti.personalized-news-feed",
	scheme: "personalized-news-feed",
	language: "en",
	locale: "en_US",
};

if (!fs.existsSync(TEST_CONFIG.project)) {
	throw new Error(`Project path not found: ${TEST_CONFIG.project}`);
}

test("Alert Notification End-to-End Test", { timeout: 5 * 60 * 1000 }, async (t) => {
	if (!(await simulator.canRun())) {
		t.skip("Simulator tests can only run on macOS with Xcode installed.");
		return;
	}

	let sim;
	let testId;
	let testRunnerProcess;

	t.before(async () => {
		await client.checkServer();

		const session = await client.createTestSession();
		testId = session.testId;
		console.log(`ℹ️ Test session started with ID: ${testId}`);

		sim = await simulator.create(TEST_CONFIG.simulatorName, TEST_CONFIG.deviceType);
		await simulator.boot(sim);
	});

	t.after(async () => {
		if (testRunnerProcess && !testRunnerProcess.killed) {
			testRunnerProcess.kill();
		}
		if (testId) {
			await client.completeTestSession(testId);
		}

		await simulator.deleteSimulator(sim);
	});

	await t.test("should receive a push notification on the simulator", async () => {
		await simulator.setLanguage(sim, TEST_CONFIG.language, TEST_CONFIG.locale);

		await simulator.build(sim, {
			project: TEST_CONFIG.project,
			scheme: TEST_CONFIG.scheme,
			testId,
		});

		console.log("🛠️ Starting UI tests for test id:", testId);
		testRunnerProcess = await simulator.run(sim, {
			project: TEST_CONFIG.project,
			scheme: TEST_CONFIG.scheme,
			testId,
		});

		const { simulatorUdid } = await client.waitForSimulatorRegistration(testId);

		// simulator.streamLogs(simulatorUdid);

		const { deviceToken, apnsTopic } = await client.waitForDeviceRegistration(testId);

		const {
			APNS_KEY_ID = "6WB99KX6YJ",
			APNS_TEAM_ID = "F53WB8AE67",
			APNS_TOKEN_KEY = fs.readFileSync("../certificates/token/APNS_AuthKey_6WB99KX6YJ.p8"),
			USE_SANDBOX = "true",
		} = process.env;

		const connector = TokenConnector({
			key: new Uint8Array(APNS_TOKEN_KEY),
			keyId: APNS_KEY_ID,
			teamIdentifier: APNS_TEAM_ID,
		});

		const notification = AlertNotification(apnsTopic, {
			payload: {
				alert: {
					title: "Hello from hapns test",
					body: "This is a test notification from the E2E test suite.",
				},
			},
		});

		const device = Device(deviceToken);

		let attempts = 5;

		while (attempts > 0) {
			console.log("🛠️ Sending notification...");

			try {
				console.log(
					await send(connector, notification, device, {
						useSandbox: USE_SANDBOX === "true",
					}),
				);

				console.log("✅ Notification sent successfully.");
				break;
			} catch (error) {
				console.error("❌ Error sending notification:", error);
				await new Promise((resolve) => setTimeout(resolve, 2000));
				attempts -= 1;
				continue;
			}
		}

		if (!attempts) {
			assert.fail("Failed to send notification after multiple attempts.");
		}

		const assertionData = await client.waitForNotificationVerification(testId);

		const { notificationTitle: title, notificationBody: body } = assertionData;

		assert.strictEqual(title, "Hello from hapns test");
		assert.strictEqual(body, "This is a test notification from the E2E test suite.");
	});
});
