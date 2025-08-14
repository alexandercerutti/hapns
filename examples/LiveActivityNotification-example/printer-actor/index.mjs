// @ts-check

/**
 * This is the main entry point for the printer actor.
 * Its role is to simulate a 3D printer connected to the network
 * that can receive commands either from the CLI or from the iOS application (http).
 */

import { setTimeout } from "node:timers";
import { setInterval } from "node:timers/promises";
import Fastify from "fastify";

const SERVER_ADDRESS = "http://localhost:3000";

async function checkServerAvailability(serverAddress) {
	if (!serverAddress) {
		throw new Error("Server address is not provided");
	}

	try {
		const response = await fetch(`${serverAddress}/health`, { method: "HEAD" });

		if (!response.ok) {
			throw new Error(`Server responded with status ${response.status}`);
		}

		return true;
	} catch (error) {
		await new Promise((resolve) => setTimeout(resolve, 3000));
		return checkServerAvailability(serverAddress);
	}
}

function createPrintingJob() {
	const job = {
		jobId: jobs.length + 1,
		status: "started",

		/**
		 * This is the protocol that the iOS application expects
		 * to receive updates about the printing job in the Live Activity.
		 */
		contentState: {
			progress: 0.0,
			statusMessage: "Starting",
		},
	};

	return job;
}

function updateJobStatus(job, status) {
	Object.assign(job, {
		...job,
		status,
	});
}

function updatePrintingJobData(job, progress, statusMessage) {
	console.log("Updating job", job.jobId, "to progress", progress);

	Object.assign(job, {
		...job,
		contentState: {
			...job.contentState,
			progress,
			statusMessage,
		},
	});
}

async function* startPrintJobUpdateSchedule(job) {
	const updateIntervalMs = 5000;
	let nextProgress = 0.0;

	for await (const _ of setInterval(updateIntervalMs, nextProgress)) {
		nextProgress += 0.23;
		updateJobStatus(job, getJobStatus(nextProgress));

		if (nextProgress >= 1.0) {
			updatePrintingJobData(job, 1.0, "Done");
			console.log(`Job ${job.jobId} completed.`);
			yield job;
			break;
		}

		updatePrintingJobData(job, nextProgress, getProgressMessage(nextProgress));
		yield job;
	}
}

function getProgressMessage(progress) {
	if (progress < 0.3) {
		return "Starting";
	}

	if (progress < 0.7) {
		return "In progress";
	}

	if (progress < 1.0) {
		return "Almost done";
	}

	return "Done";
}

function getJobStatus(progress) {
	if (progress < 0.8) {
		return "started";
	}

	if (progress < 1.0) {
		return "finishing";
	}

	return "completed";
}

// ****************************** //
// *** PRINTER INITIALIZATION *** //
// ****************************** //

console.log(`Checking server availability @ ${SERVER_ADDRESS}...`);
const serverAvailable = await checkServerAvailability(SERVER_ADDRESS);

if (!serverAvailable) {
	console.error("Server is not available and retries exhausted. Exiting.");
	process.exit(1);
}

console.log("Server connected. Starting the printer actor...");

const jobs = [];

const fastify = Fastify();

fastify.get("/jobs/:id", async (request, reply) => {
	const jobId = request.params.id;

	if (!jobId) {
		return reply.status(400).send({
			error: "Job ID is required",
		});
	}

	const job = jobs.find((j) => j.jobId === parseInt(jobId));

	if (!job) {
		return reply.status(404).send({
			error: "Job not found",
		});
	}

	return reply.status(200).send({ job });
});

function startPrintingJob() {
	const job = createPrintingJob();
	jobs.push(job);

	return job;
}

async function startPrintingJobSubscription(job, subscriptionUrl) {
	if (!subscriptionUrl) {
		throw new Error("Subscription URL is required to start a printing job.");
	}

	const scheduledUpdate = startPrintJobUpdateSchedule(job);
	const jobSubscriptionUrl = `${SERVER_ADDRESS}${subscriptionUrl.replace("%jobId%", job.jobId)}`;

	for await (const job of scheduledUpdate) {
		await fetch(jobSubscriptionUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				jobId: job.jobId,
				status: job.status,
				contentState: job.contentState,
			}),
		});

		if (job.status === "completed") {
			break;
		}
	}
}

async function holdCLIUntilJobCompletion(scheduledUpdate, job) {
	/**
	 * This lets the CLI to not accept any other commands
	 * until the job is completed.
	 */
	for await (const _ of scheduledUpdate) {
		if (job.status === "completed") {
			break;
		}
	}
}

await fastify.register(import("./providers/http.mjs"), {
	startPrintingJob: (subscriptionUrl) => {
		const job = startPrintingJob();
		startPrintingJobSubscription(job, subscriptionUrl);
		return job.jobId;
	},
});
const { setupCliProvider } = await import("./providers/cli.mjs");

setupCliProvider(SERVER_ADDRESS, (onFinish) => {
	const job = startPrintingJob();

	holdCLIUntilJobCompletion(startPrintJobUpdateSchedule(job), job).then(onFinish);

	return job.jobId;
});

fastify.listen({ port: 3001, host: "0.0.0.0" });

console.log("Waiting for commands. Press 'CTRL+C' to exit.");
