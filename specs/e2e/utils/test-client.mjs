const SERVER_URL = "http://localhost:8571";

/**
 * Continuously polls the test server's /health endpoint until it is running.
 * @returns {Promise<void>}
 */
export async function checkServer() {
	console.log("🛠️ Checking for test server...");

	while (true) {
		try {
			const response = await fetch(`${SERVER_URL}/health`);
			if (response.ok) {
				console.log("ℹ️ Test server is running.");
				return;
			}
		} catch (e) {
			// Ignore fetch errors
		}
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}
}

/**
 * Polls the test server to get the device token and APNs topic for a given test session.
 * @param {string} testId The ID of the test session.
 * @returns {Promise<{deviceToken: string, apnsTopic: string}>}
 */
export async function waitForDeviceRegistration(testId) {
	console.log("🛠️ Waiting for device registration...");
	/**
	 * Poll for 300 seconds (150 attempts * 2s interval)
	 * This amount is less or equal to the test timeout threshold
	 */
	for (let i = 0; i < 150; i++) {
		const response = await fetch(`${SERVER_URL}/tests/${testId}/registered-devices`);

		if (response.ok) {
			const data = await response.json();

			if (data.deviceToken) {
				console.log("✅ Device token received.");
				return data;
			}
		}
		await new Promise((resolve) => setTimeout(resolve, 2000));
	}
	throw new Error("Timed out waiting for device token.");
}

/**
 * Polls the server until the UI test signals that it has verified the notification.
 * @param {string} testId The ID of the test session.
 * @returns {Promise<object>} The assertion data from the UI test.
 */
export async function waitForNotificationVerification(testId) {
	console.log("🛠️ Waiting for notification verification from UI test...");

	for (let i = 0; i < 45; i++) {
		const response = await fetch(`${SERVER_URL}/tests/${testId}/verification-status`);

		if (response.ok) {
			const data = await response.json();

			if (data.uiTestCompleted) {
				console.log("✅ Notification verification received.");
				console.log("ℹ️ Assertion Data:", data.assertionData);
				return data.assertionData;
			}
		}

		await new Promise((resolve) => setTimeout(resolve, 1000));
	}
	throw new Error("Timed out waiting for notification verification.");
}

/**
 * Creates a new test session on the server.
 * @returns {Promise<{testId: string}>}
 */
export async function createTestSession() {
	const response = await fetch(`${SERVER_URL}/tests`, { method: "POST" });
	return response.json();
}

/**
 * Signals the server that a test session is complete.
 * @param {string} testId The ID of the test session to complete.
 * @returns {Promise<void>}
 */
export async function completeTestSession(testId) {
	await fetch(`${SERVER_URL}/tests/${testId}/complete`, { method: "POST" });
	console.log("🎉 Test session marked as complete.");
}

/**
 * Polls the test server until the UI test running on the simulator has registered its UDID.
 *
 * This is necessary because `xcodebuild` may run tests on a cloned simulator with a different
 * UDID than the one originally created.
 *
 * The UI test captures the actual UDID from its environment and sends it to the server.
 *
 * This function retrieves it, allowing the main test script to know the exact device the test
 * is running on.
 *
 * @param {string} testId The ID of the test session.
 * @returns {Promise<{simulatorUdid: string}>}
 */
export async function waitForSimulatorRegistration(testId) {
	console.log(`🛠️ [client] Waiting for simulator to register for test: ${testId}`);

	while (true) {
		try {
			const response = await fetch(`${SERVER_URL}/tests/${testId}/simulator-udid`);

			if (response.status === 200) {
				const data = await response.json();

				if (data.simulatorUdid) {
					console.log(`✅ [client] Simulator registered with UDID: ${data.simulatorUdid}`);
					return { simulatorUdid: data.simulatorUdid };
				}
			}
		} catch (error) {
			// Ignore connection errors, server might not be ready
		}

		await new Promise((resolve) => setTimeout(resolve, 1000));
	}
}

export async function waitForNotification(testId) {
	console.log(`🛠️ [client] Waiting for notification for test: ${testId}`);

	while (true) {
		try {
			const response = await fetch(`${SERVER_URL}/tests/${testId}/notification`);
			if (response.status === 200) {
				const data = await response.json();
				if (data.notification) {
					console.log(`✅ [client] Notification received: ${data.notification}`);
					return { notification: data.notification };
				}
			}
		} catch (error) {
			// Ignore connection errors, server might not be ready
		}
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}
}
