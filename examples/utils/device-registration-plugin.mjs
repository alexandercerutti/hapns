/**
 * Hello. If you are maintaining this file, I'm pleased to
 * let you know this file conforms to a protocol that is
 * shared with the test suite.
 *
 * So, both files contain the same things in order to
 * reuse the example applications to perform end-to-end tests.
 */

export const DEVICE_REGISTRATION_ENDPOINT = "/registration";

export function DeviceRegistrationPlugin(fastifyInstance) {
	if (!fastifyInstance.hasDecorator("emitEvent")) {
		throw new Error("DeviceRegistrationPlugin requires the EventBusPlugin to be registered first.");
	}

	const emitEvent = fastifyInstance.getDecorator("emitEvent");

	fastifyInstance.addHook("onClose", (_request, _reply, done) => {
		done();
	});

	fastifyInstance.post(DEVICE_REGISTRATION_ENDPOINT, async (request, reply) => {
		const { deviceId, ...deviceData } = request.body;

		if (!deviceId) {
			return reply.status(400).send({ error: "Missing deviceId, deviceToken or apnsTopic" });
		}

		const additionalEventData = fastifyInstance.hasRequestDecorator("additionalEventData")
			? request.additionalEventData
			: {};

		const payload = {
			deviceId,
			...deviceData,
			...additionalEventData,
		};

		emitEvent("device-registration", payload);

		return reply.status(201).send({ success: true });
	});

	fastifyInstance.delete(DEVICE_REGISTRATION_ENDPOINT, async (request, reply) => {
		const { deviceId } = request.body;

		if (!deviceId) {
			return reply.status(400).send({ error: "Missing deviceId" });
		}

		emitEvent("device-unregistration", { deviceId });

		return reply.status(204).send();
	});

	return fastifyInstance;
}
