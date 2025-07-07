// @ts-check

/**
 * This is the client that allows to the printer actor to receive
 * commands from the network, from the iOS Application.
 *
 * This is meant to represent printing design upload.
 *
 * This means, that the iOS application will actually start the LiveActivity,
 * but the printer will emit updates and an end notifications.
 */

/**
 * @typedef {() => Promise<void>} StartJob
 */

/**
 * @param {import("fastify").FastifyInstance} fastifyInstance
 */
export default async function setupHttpProvider(fastifyInstance, opts) {
	fastifyInstance.post("/jobs/start", async (request, reply) => {
		// @ts-ignore
		const { subscriptionUrl } = request.body;

		const jobId = opts.startPrintingJob(subscriptionUrl);
		reply.status(200).send({ jobId });
	});
}
