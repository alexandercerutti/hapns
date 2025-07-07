// @ts-check

/**
 * This is the client that allows to the printer actor to receive
 * commands from the CLI, through user interaction.
 *
 * This is meant to represent the printing action happening
 * through the user physically interacting with the printer.
 *
 * This means, that the printer will emit start LiveActivity,
 * updates and an end.
 */

import readline from "node:readline/promises";

/**
 * @typedef {(onFinish: () => void) => unknown} StartJob
 */

/**
 * @param {string} serverAddress
 * @param {StartJob} startPrintJob
 */
export async function setupCliProvider(serverAddress, startPrintJob) {
	if (!serverAddress) {
		throw new Error("Server address is not provided");
	}

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	await rl.question("Press any key to start the print job or perform an http request");

	console.log("Starting the print job...");

	const jobId = startPrintJob(() => {
		/**
		 * Starting again the loop.
		 */
		setupCliProvider(serverAddress, startPrintJob);
	});

	await fetch(`${serverAddress}/start`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			jobId,
		}),
	});
}
