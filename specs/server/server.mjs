import Fastify from "fastify";
import { randomUUID } from "node:crypto";
import { DeviceRegistrationPlugin } from "@hapns-internal/utils/device-registration";
import { EventBusPlugin } from "@hapns-internal/utils/event-bus";

const fastify = Fastify({ logger: true });

await fastify.register(EventBusPlugin);

await fastify.register(
	async (fastifyInstance) => {
		fastifyInstance.decorateRequest("additionalEventData");

		fastifyInstance.addHook("onRequest", (req, _res, done) => {
			req.additionalEventData = req.params;
			done();
		});

		await fastifyInstance.register(DeviceRegistrationPlugin, {
			prefix: "/devices",
		});
	},
	{
		prefix: "/tests/:testId",
	},
);

const tests = new Map();

/**
 * @type {import("node:events").EventEmitter}
 */
const eventBus = fastify.getDecorator("eventBus");

eventBus.on("device-registration", (eventData) => {
	console.log(
		`Device registered: ${eventData.deviceId} with token ${eventData.deviceToken}`,
		eventData,
	);

	if (!eventData.testId) {
		throw new Error("Device registration event must contain a testId.");
	}

	const test = tests.get(eventData.testId);

	if (!test) {
		throw new Error(`Test with ID ${eventData.testId} not found.`);
	}

	tests.set(eventData.testId, {
		...test,
		registeredDevices: [...test.registeredDevices, eventData],
	});
});

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
fastify.post("/tests", async (request, reply) => {
	const testId = randomUUID();

	tests.set(testId, {
		deviceToken: null,
		apnsTopic: null,
		completed: false,
		uiTestCompleted: false,
		lastPing: new Date(),
		registeredDevices: [],
	});

	reply.send({ testId });
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
fastify.get("/tests/:testId/registered-devices", {
	preHandler: checkIfTestExistsPlugin,
	handler: async (_request, reply) => {
		const { testId } = _request.params;

		const { registeredDevices } = tests.get(testId);

		if (!registeredDevices.length) {
			console.log("ℹ️ Device token not yet available.");

			return reply.status(404).send({
				error: "No devices registered for this test.",
			});
		}

		return reply.status(200).send(registeredDevices[registeredDevices.length - 1]);
	},
});

/**
 * Step 4: UI Test pings the server to indicate it is still running.
 */
fastify.post("/tests/:testId/ping", {
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
fastify.post("/tests/:testId/assert-notification", {
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

fastify.get("/tests/:testId/verification-status", {
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
fastify.post("/tests/:testId/complete", {
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
fastify.post("/tests/:testId/register-simulator", {
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
fastify.get("/tests/:testId/simulator-udid", {
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
fastify.get("/health", async (_request, reply) => {
	reply.send({ status: "ok" });
});

try {
	await fastify.listen({
		port: 8571,
		host: "0.0.0.0",
	});
} catch (err) {
	fastify.log.error(err);
	process.exit(1);
}
