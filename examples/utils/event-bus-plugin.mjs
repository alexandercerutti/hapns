import { FastifySSEPlugin } from "fastify-sse-v2";
import { EventEmitter } from "node:events";

/**
 * This plugin provides a centralized event bus
 * for emitting and listening to events across
 * several event emitters in the application.
 */

export function EventBusPlugin(fastifyInstance) {
	if (!fastifyInstance.hasDecorator("eventBus")) {
		throw new Error(
			"DeviceRegistrationPlugin requires the EventBusDecorator to be registered first.",
		);
	}

	debugger;

	const eventBus = fastifyInstance.getDecorator("eventBus");

	fastifyInstance.register(FastifySSEPlugin);

	fastifyInstance.addHook("onClose", (_request, _reply, done) => {
		eventBus.removeAllListeners();
		done();
	});

	/**
	 * This function cannot be `async` because it
	 * is used to handle Server-Sent Events (SSE).
	 * If it were `async`, it would return a Promise,
	 * which is not compatible with the SSE protocol,
	 * as `fastify` expects for a reply to be sent.
	 */
	fastifyInstance.get("/events", (_request, reply) => {
		function listener({ type, ...eventData }) {
			reply.sse({
				event: type,
				data: JSON.stringify(eventData),
			});
		}

		eventBus.on("event", listener);
	});

	return fastifyInstance;
}

export function eventBusDecorator(fastifyInstance) {
	const eventBus = new EventEmitter();

	fastifyInstance.decorate("emitEvent", (eventName, data) => {
		eventBus.emit(eventName, data);
	});

	fastifyInstance.decorate("eventBus", eventBus);
}
