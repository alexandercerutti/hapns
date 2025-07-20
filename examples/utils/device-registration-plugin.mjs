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

export function DeviceRegistrationPlugin(fastifyInstance) {
	/**
	 * @typedef {string} DeviceId
	 * @type {Map<DeviceId, { deviceToken: string, apnsTopic: string }>}
	 */
	const registeredDevices = new Map();

	if (!fastifyInstance.hasDecorator("emitEvent")) {
		throw new Error("DeviceRegistrationPlugin requires the EventBusPlugin to be registered first.");
	}

	const emitEvent = fastifyInstance.getDecorator("emitEvent");

	fastifyInstance.addHook("onClose", (_request, _reply, done) => {
		registeredDevices.clear();
		done();
	});

	fastifyInstance.post(DEVICE_REGISTRATION_ENDPOINT, async (request, reply) => {
		const { deviceId, deviceToken, apnsTopic } = request.body;

		if (!deviceId || !deviceToken || !apnsTopic) {
			return reply.status(400).send({ error: "Missing deviceId, deviceToken or apnsTopic" });
		}

		emitEvent("event", {
			type: "device-registration",
			deviceId,
			deviceToken,
			apnsTopic,
		});

		registeredDevices.set(deviceId, {
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
