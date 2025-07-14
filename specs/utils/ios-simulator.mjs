import { exec, spawn } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

/**
 * Checks if `xcrun` is installed and the environment is macOS.
 * @returns {Promise<boolean>} `true` if `xcrun` is found and OS is darwin, otherwise `false`.
 */
export async function canRun() {
	if (process.platform !== "darwin") {
		return false;
	}

	try {
		await execAsync("command -v xcrun");
		return true;
	} catch {
		return false;
	}
}

/**
 * Creates a new iOS simulator.
 * @param {string} name The name for the new simulator (e.g., "Test-iPhone").
 * @param {string} deviceType The device type identifier (e.g., "com.apple.CoreSimulator.SimDeviceType.iPhone-15-Pro").
 * @returns {Promise<{name: string, udid: string, deviceType: string}>} A simulator object with its name, UDID, and device type.
 */
export async function create(name, deviceType) {
	console.log(`Creating simulator: ${name}`);

	const { stdout } = await execAsync(`xcrun simctl create "${name}" "${deviceType}"`);

	const udid = stdout.trim();

	console.log(`Simulator created with UDID: ${udid}`);

	return {
		name,
		udid,
		deviceType,
	};
}

/**
 * Boots a specific iOS simulator.
 * @param {{ name: string; udid: string }} simulator The simulator object to boot.
 * @returns {Promise<void>}
 */
export async function boot(simulator) {
	console.log(`Booting simulator: ${simulator.name} (${simulator.udid})`);
	await execAsync(`xcrun simctl boot "${simulator.udid}"`);
	console.log("Simulator booted.");
}

/**
 * Installs an application on a simulator.
 * @param {{ name: string; udid: string }} simulator The simulator object.
 * @param {string} appPath The file path to the application bundle (.app).
 * @returns {Promise<void>}
 */
export async function install(simulator, appPath) {
	console.log(`Installing app at ${appPath} on ${simulator.name}`);
	await execAsync(`xcrun simctl install "${simulator.udid}" "${appPath}"`);
	console.log("App installed.");
}

/**
 * Sets the language and locale for a simulator.
 * @param {{ udid: string }} simulator The simulator object.
 * @param {string} language The language identifier (e.g., "en").
 * @param {string} locale The locale identifier (e.g., "en_US").
 * @returns {Promise<void>}
 */
export async function setLanguage(simulator, language, locale) {
	console.log(`Setting simulator language to '${language}' and locale to '${locale}'...`);

	const AppleLanguagesCommandArgs = [
		`"${simulator.udid}"`,
		"defaults",
		"write",
		`"Apple Global Domain"`,
		"AppleLanguages",
		"-array",
		`"${language}"`,
	];

	const AppleLanguagesCommandArgsString = AppleLanguagesCommandArgs.join("\x20");

	await execAsync(`xcrun simctl spawn ${AppleLanguagesCommandArgsString}`);

	const AppleLocaleCommandArgs = [
		`"${simulator.udid}"`,
		"defaults",
		"write",
		`"Apple Global Domain"`,
		"AppleLocale",
		"-string",
		`"${locale}"`,
	];

	const AppleLocaleCommandArgsString = AppleLocaleCommandArgs.join("\x20");

	await execAsync(`xcrun simctl spawn ${AppleLocaleCommandArgsString}`);

	// ************************************************************* //
	// *** SPRINGBOARD START TO LANGUAGES CHANGES TO TAKE EFFECT *** //
	// ************************************************************* //

	/**
	 * We need to restart SpringBoard to apply the language and locale changes.
	 * Because otherwise UI Tests won't be able to find the notification permission
	 * button of the prompt because of the locale language.
	 *
	 * So, we use English by
	 * default for everything.
	 */

	const SpringboardRestartCommandArgs = [
		`"${simulator.udid}"`,
		"launchctl",
		"stop",
		"com.apple.SpringBoard",
	];

	const SpringboardRestartCommandArgsString = SpringboardRestartCommandArgs.join("\x20");

	await execAsync(`xcrun simctl spawn ${SpringboardRestartCommandArgsString}`);

	console.log("Simulator language set.");
}

/**
 * Runs the UI tests for a given scheme on a simulator.
 * @param {{ name: string; udid: string }} simulator The simulator object.
 * @param {object} options The run options.
 * @param {string} options.scheme The Xcode scheme to run.
 * @param {string} [options.project] The path to the .xcodeproj directory.
 * @param {string} options.testId The test session ID to pass to the app as a launch argument.
 * @returns {import('node:child_process').ChildProcess} The spawned child process running the xcodebuild command.
 */
export function run(simulator, { scheme, project, testId }) {
	const commandArgs = new Map([
		["-project", project],
		["-scheme", scheme],
		["-sdk", "iphonesimulator"],
		["-destination", `platform=\"iOS Simulator,id=${simulator.udid},arch=arm64\"`],
		["-configuration", "Debug"],
	]);

	const commandArgsString = Array.from(commandArgs.entries())
		.map(([key, value]) => `${key} ${value}`)
		.join(" ");

	const command = `xcodebuild test-without-building ${commandArgsString}`;

	const testRunProcess = exec(command, {
		env: {
			/**
			 * `xcodebuild test` requires the custom env variables to be provided
			 * with prefix `TEST_RUNNER_`. However, this variable will not be
			 * provided automatically to the app. We have to map it manually in
			 * the Swift code.
			 */
			TEST_RUNNER_TEST_ID: testId,
		},
	});

	testRunProcess.stdout.pipe(process.stdout);
	testRunProcess.stderr.pipe(process.stderr);

	return testRunProcess;
}

/**
 * Builds the iOS app for a given scheme on a simulator.
 * @param {{ name: string; udid: string }} simulator The simulator object.
 * @param {object} options The build options.
 * @param {string} options.scheme The Xcode scheme to build.
 * @param {string} [options.workspace] The path to the .xcworkspace directory.
 * @param {string} [options.project] The path to the .xcodeproj directory.
 * @returns {Promise<void>}
 */
export async function build(simulator, options) {
	const { scheme, project, testId } = options;

	if (!project || !scheme || !testId) {
		throw new Error("You must provide a project, scheme, and testId to build.");
	}

	const commandArgs = new Map([
		["-project", project],
		["-scheme", scheme],
		["-sdk", "iphonesimulator"],
		["-destination", `platform=\"iOS Simulator,id=${simulator.udid},arch=arm64\"`],
		["-configuration", "Debug"],
	]);

	const commandArgsString = Array.from(commandArgs.entries())
		.map(([key, value]) => `${key} ${value}`)
		.join(" ");

	const command = `xcodebuild clean build-for-testing ${commandArgsString}`;

	console.log(`Building scheme ${scheme} for ${simulator.name}`);

	try {
		const { stdout, stderr } = await execAsync(command);

		console.log(stdout);

		if (stderr) {
			console.error(stderr);
		}

		console.log("Build completed successfully.");
	} catch (error) {
		console.error(`[xcodebuild build stderr]: ${error.stderr}`);
		throw new Error(`xcodebuild failed for scheme ${scheme}. Full output in logs.`);
	}
}

export function streamLogs(udid) {
	console.log(`[ios-simulator] Attaching log stream for device ${udid}...`);

	// This command streams logs from the simulator, filtering for messages from our app,
	// the test runner, and the home screen (SpringBoard) to see notifications.
	const logProcess = spawn("xcrun", [
		"simctl",
		"spawn",
		udid,
		"log",
		"stream",
		"--level=debug",
		"--style=compact",
		// Filter logs to only show relevant entries from our app and the test runner
		"--predicate",
		'process IN {"personalized-news-feed", "UITests-Runner"}',
	]);

	// Pipe the simulator's log output to our main process's output
	logProcess.stdout.pipe(process.stdout);
	logProcess.stderr.pipe(process.stderr);

	logProcess.on("close", (code) => {
		if (code !== 0) {
			console.warn(
				`[ios-simulator] Log stream process exited with code ${code}. This is often normal.`,
			);
		}
	});

	return logProcess;
}
