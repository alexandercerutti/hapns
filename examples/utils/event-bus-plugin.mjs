// @ts-check

import fastifyPlugin from "fastify-plugin";
import { EventEmitter } from "node:events";

/**
 * This plugin provides a centralized event bus
 * for emitting and listening to events across
 * several event emitters in the application.
 */

/**
 * Done like this to break the encapsulation
 * and expose the event bus to the rest of the application.
 *
 * @param {import("fastify").FastifyInstance} fastifyInstance
 * @returns
 */
export const EventBusPlugin = fastifyPlugin((fastifyInstance, _opts, done) => {
	const eventBus = new EventEmitter();

	fastifyInstance.decorate("emitEvent", (eventName, data) => {
		eventBus.emit(eventName, data);
	});

	fastifyInstance.decorate("eventBus", eventBus);

	fastifyInstance.addHook("onClose", (_request, _reply, done) => {
		eventBus.removeAllListeners();
		done();
	});

	done();
});
