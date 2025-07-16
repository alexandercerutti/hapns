import fastify from "fastify";
import { randomUUID } from "node:crypto";

const app = fastify({ logger: true });
const tests = new Map();

function checkIfTestExistsPlugin(req, reply, done) {
	const testId = req.params.testId;

	if (!tests.has(testId)) {
		return reply.status(404).send({ error: "Test not found" });
	}

	done();
}

/**
 * Step 1: Each test is assigned a unique ID.
 * This allows us to run several tests in parallel.
 */
app.post("/tests", async (request, reply) => {
	const testId = randomUUID();

	tests.set(testId, {
		deviceToken: null,
		apnsTopic: null,
		completed: false,
		uiTestCompleted: false,
		lastPing: new Date(),
	});

	reply.send({ testId });
});

/**
 * Step 2: application gets built and is run. When test
 * runs, the application advertises its device token and topic.
 */
app.post("/tests/:testId/device-advertising", {
	preHandler: checkIfTestExistsPlugin,
	handler: async (request, reply) => {
		const { testId } = request.params;
		const { deviceToken, apnsTopic } = request.body;

		console.log("ℹ️ Device advertised with token:", deviceToken, "and topic:", apnsTopic);

		const test = tests.get(testId);
		test.deviceToken = deviceToken;
		test.apnsTopic = apnsTopic;
		test.lastPing = new Date();

		reply.status(204).send();
	},
});

/**
 * Step 3: the test has to know if the device has been advertised
 * and issued a device token, so that it can continue by sending the
 * notification.
 *
 * During the test, something like 3 simulators gets run and it is
 * not said the test will be run on the first simulator.
 *
 * Application is launched and closed several times, so we'll get
 * sooner or later a response.
 */
app.get("/tests/:testId/device-token", {
	preHandler: checkIfTestExistsPlugin,
	handler: async (request, reply) => {
		const { testId } = request.params;

		const test = tests.get(testId);

		if (!test.deviceToken) {
			return reply.status(404).send({ error: "Device token not yet advertised" });
		}

		reply.send({
			deviceToken: test.deviceToken,
			apnsTopic: test.apnsTopic,
		});
	},
});

/**
 * Step 4: UI Test pings the server to indicate it is still running.
 */
app.post("/tests/:testId/ping", {
	preHandler: checkIfTestExistsPlugin,
	handler: async (request, reply) => {
		const { testId } = request.params;

		const test = tests.get(testId);
		test.lastPing = new Date();

		reply.status(204).send();
	},
});

/**
 * Step 5: Application should receive a notification and will
 * confirm to the server with generic data for assertions.
 */
app.post("/tests/:testId/assert-notification", {
	preHandler: checkIfTestExistsPlugin,
	handler: async (request, reply) => {
		const { testId } = request.params;
		const test = tests.get(testId);

		test.uiTestCompleted = true;
		test.assertionData = request.body || {};

		reply.send({
			success: true,
		});
	},
});

app.get("/tests/:testId/verification-status", {
	preHandler: checkIfTestExistsPlugin,
	handler: async (request, reply) => {
		const { testId } = request.params;
		const test = tests.get(testId);

		if (test.uiTestCompleted) {
			reply.send({
				uiTestCompleted: test.uiTestCompleted,
				assertionData: test.assertionData || {},
			});
		} else {
			reply.send({
				uiTestCompleted: false,
			});
		}
	},
});

/**
 * Step 7: Test is completed and the server is notified.
 */
app.post("/tests/:testId/complete", {
	preHandler: checkIfTestExistsPlugin,
	handler: async (request, reply) => {
		const { testId } = request.params;
		const test = tests.get(testId);
		test.completed = true;

		reply.status(204).send();
	},
});

/**
 * Simulator is ready and test have started.
 */
app.post("/tests/:testId/register-simulator", {
	preHandler: checkIfTestExistsPlugin,
	handler: async (request, reply) => {
		const { testId } = request.params;
		const { udid } = request.body;
		const test = tests.get(testId);

		test.simulatorUdid = udid;
		console.log(`ℹ️ [server] Simulator UDID for test ${testId} is ${udid}`);

		reply.status(200).send({
			ok: true,
		});
	},
});

/**
 * Test waits for the simulator UDID to be registered.
 * This is needed in order to know when the test can start
 * sending notifications to the simulator.
 */
app.get("/tests/:testId/simulator-udid", {
	preHandler: checkIfTestExistsPlugin,
	handler: async (request, reply) => {
		const { testId } = request.params;

		for (let i = 0; i < 60; i++) {
			const test = tests.get(testId);

			if (test.simulatorUdid) {
				return reply.status(200).send({
					simulatorUdid: test.simulatorUdid,
				});
			}

			await new Promise((resolve) => setTimeout(resolve, 1000));
		}

		return reply.status(404).send({
			error: "Simulator UDID not found. Send again the request.",
		});
	},
});

// Health check for CI
app.get("/health", async (_request, reply) => {
	reply.send({ status: "ok" });
});

try {
	await app.listen({
		port: 8571,
		host: "0.0.0.0",
	});
} catch (err) {
	app.log.error(err);
	process.exit(1);
}
