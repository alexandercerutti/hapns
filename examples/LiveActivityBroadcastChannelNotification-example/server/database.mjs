import * as path from "node:path";
import * as process from "node:process";
import * as fs from "node:fs";

const CHANNELS_DB_PATH = path.join(process.cwd(), "channels.json");

export function loadChannelsDB() {
	try {
		if (fs.existsSync(CHANNELS_DB_PATH)) {
			const data = fs.readFileSync(CHANNELS_DB_PATH, "utf8");
			return JSON.parse(data);
		}
		return {};
	} catch (error) {
		console.warn(`⚠️ Warning: Could not load channels database: ${error.message}`);
		return {};
	}
}

export function saveChannelsDB(channelsData) {
	try {
		fs.writeFileSync(CHANNELS_DB_PATH, JSON.stringify(channelsData, null, 2), "utf8");
	} catch (error) {
		console.error(`❌ Failed to save channels database: ${error.message}`);
	}
}

export function addChannel(channelId, name, bundleId) {
	const db = loadChannelsDB();

	db[channelId] = {
		name,
		bundleId,
		createdAt: new Date().toISOString(),
	};

	saveChannelsDB(db);
}

export function removeChannel(channelId) {
	const db = loadChannelsDB();
	delete db[channelId];
	saveChannelsDB(db);
}

export function getChannel(channelId) {
	const db = loadChannelsDB();
	return db[channelId] || null;
}
