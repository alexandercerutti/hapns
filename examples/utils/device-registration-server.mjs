import { FastifySSEPlugin } from "fastify-sse-v2";
import { EventEmitter } from "node:events";

/**
 * Hello. If you are maintaining this file, I'm pleased to
 * let you know this file conforms to a protocol that is
 * shared with the test suite.
 *
 * So, both files contain the same things in order to
 * reuse the example applications to perform end-to-end tests.
 */

export const HOST = "0.0.0.0";
export const PORT = 3000;
export const DEVICE_REGISTRATION_ENDPOINT = "/registration";

const deviceEvents = new EventEmitter();

/**
 * @typedef {string} DeviceId
 * @type {Map<DeviceId, { deviceToken: string, apnsTopic: string }>}
 */
const registeredDevices = new Map();

deviceEvents.on("device-registration", (eventData) => {
	registeredDevices.set(eventData.deviceId, {
		deviceToken: eventData.deviceToken,
		apnsTopic: eventData.apnsTopic,
	});
});

export function DeviceRegistrationPlugin(fastifyInstance) {
	fastifyInstance.register(FastifySSEPlugin);

	fastifyInstance.addHook("onClose", (_request, _reply, done) => {
		deviceEvents.removeAllListeners("device-registration");
		done();
	});

	/**
	 * This function cannot be `async` because it
	 * is used to handle Server-Sent Events (SSE).
	 *
	 * If it were `async`, it would return a Promise,
	 * which is not compatible with the SSE protocol,
	 * as `fastify` expects for a reply to be sent.
	 */
	fastifyInstance.get(`${DEVICE_REGISTRATION_ENDPOINT}/events`, (request, reply) => {
		function listener(eventData) {
			reply.sse({
				event: "device-registration",
				data: JSON.stringify(eventData),
			});
		}

		deviceEvents.on("device-registration", listener);
	});

	fastifyInstance.post(DEVICE_REGISTRATION_ENDPOINT, async (request, reply) => {
		const { deviceId, deviceToken, apnsTopic } = request.body;

		if (!deviceId || !deviceToken || !apnsTopic) {
			return reply.status(400).send({ error: "Missing deviceId, deviceToken or apnsTopic" });
		}

		deviceEvents.emit("device-registration", {
			deviceId,
			deviceToken,
			apnsTopic,
		});

		return reply.status(201).send({ success: true });
	});

	fastifyInstance.delete(DEVICE_REGISTRATION_ENDPOINT, async (request, reply) => {
		const { deviceId } = request.body;

		if (!deviceId) {
			return reply.status(400).send({ error: "Missing deviceId" });
		}

		if (!registeredDevices.has(deviceId)) {
			return reply.status(404).send({ error: "Device not found" });
		}

		registeredDevices.delete(deviceId);
		return reply.status(204).send();
	});

	return fastifyInstance;
}
