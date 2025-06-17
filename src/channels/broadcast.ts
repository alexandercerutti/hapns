import type { ConnectorProtocol } from "../connectors/connector.js";
import { createError } from "../errors/create.js";
import { BroadcastChannel } from "../targets/broadcastchannel.js";

type WithRequestId<T extends object> = T & {
	apnsRequestId?: string;
};

type WithSandbox<T extends object> = T & {
	useSandbox?: boolean;
};

interface BroadcastChannelSettings {
	bundleId: string;
	messageStoragePolicy?: 1 | 0;
}

const BROADCAST_SANDBOX_BASE_URL = "https://api-manage-broadcast.sandbox.push.apple.com:2195";
const BROADCAST_PRODUCTION_BASE_URL = "https://api-manage-broadcast.push.apple.com:2196";

const CONNECTOR_INVALID_ERROR = createError(
	"CONNECTOR_INVALID_ERROR",
	"Cannot manage broadcast channel: Connector is missing or is not a valid connector.",
);

const BUNDLE_ID_MISSING_ERROR = createError(
	"BUNDLE_ID_MISSING_ERROR",
	"Cannot manage broadcast channel: bundleId is missing or is not a string.",
);

const INVALID_SETTINGS_OBJ_ERROR = createError(
	"INVALID_SETTINGS_OBJ_ERROR",
	"Cannot manage broadcast channel: settings are missing or are not a valid settings object.",
);

const INVALID_BROADCAST_CHANNEL_ERROR = createError(
	"INVALID_BROADCAST_CHANNEL_ERROR",
	"Cannot manage broadcast channel: BroadcastChannel is missing or is not a valid BroadcastChannel object.",
);

export async function createBroadcastChannel(
	connector: ConnectorProtocol,
	settings: WithSandbox<WithRequestId<BroadcastChannelSettings>>,
): Promise<BroadcastChannel> {
	if (!connector || typeof connector.send !== "function") {
		throw new CONNECTOR_INVALID_ERROR();
	}

	if (!settings || typeof settings !== "object") {
		throw new INVALID_SETTINGS_OBJ_ERROR();
	}

	if (!settings.bundleId || typeof settings.bundleId !== "string") {
		throw new BUNDLE_ID_MISSING_ERROR();
	}

	const { useSandbox = false, apnsRequestId, bundleId, messageStoragePolicy } = settings;

	const baseUrl = useSandbox ? BROADCAST_SANDBOX_BASE_URL : BROADCAST_PRODUCTION_BASE_URL;

	const channelHeaders = {
		"apns-request-id": apnsRequestId,
	};

	const storagePolicy = messageStoragePolicy
		? Math.max(0, Math.min(messageStoragePolicy, 1))
		: undefined;

	const channelCreationResponse = await connector.send({
		method: "POST",
		baseUrl,
		requestPath: `/1/apps/${bundleId}/channels`,
		headers: channelHeaders,
		body: {
			"message-storage-policy": storagePolicy,
			"push-type": "LiveActivity",
		},
	});

	const { headers } = channelCreationResponse;

	const { "apns-channel-id": channelId } = headers as Record<string, string>;

	return BroadcastChannel(channelId, bundleId);
}

interface SourceChannelReadResponseBody {
	"message-storage-policy": number;
	"push-type": string;
}

interface ChannelReadResponseBody {
	messageStoragePolicy: number;
	pushType: string;
}

type ChannelReadSettings = WithSandbox<WithRequestId<{}>>;

export async function readChannel(
	connector: ConnectorProtocol,
	bChannel: BroadcastChannel,
	settings: ChannelReadSettings = {},
): Promise<ChannelReadResponseBody> {
	if (!connector || typeof connector.send !== "function") {
		throw new CONNECTOR_INVALID_ERROR();
	}

	if (!isBroadcastChannel(bChannel)) {
		throw new INVALID_BROADCAST_CHANNEL_ERROR();
	}

	const { channelId, bundleId } = bChannel;
	const { useSandbox = false, apnsRequestId } = settings ?? {};

	const baseUrl = useSandbox ? BROADCAST_SANDBOX_BASE_URL : BROADCAST_PRODUCTION_BASE_URL;

	const channelHeaders = {
		"apns-channel-id": channelId,
		"apns-request-id": apnsRequestId,
	};

	const channelReadResponse = await connector.send({
		method: "GET",
		baseUrl,
		requestPath: `/1/apps/${bundleId}/channels`,
		headers: channelHeaders,
	});

	const { "message-storage-policy": messageStoragePolicy, "push-type": pushType } =
		(await channelReadResponse.body.json()) as SourceChannelReadResponseBody;

	return {
		messageStoragePolicy,
		pushType,
	};
}

type ChannelDeleteSettings = WithSandbox<WithRequestId<{}>>;

/**
 * Sends a request to delete an existing broadcast channel.
 *
 * @param connector
 * @param channelId
 * @param bundleId
 */
export async function deleteChannel(
	connector: ConnectorProtocol,
	bChannel: BroadcastChannel,
	settings: ChannelDeleteSettings = {},
): Promise<{ success: true; apnsRequestId: string }> {
	if (!connector || typeof connector.send !== "function") {
		throw new CONNECTOR_INVALID_ERROR();
	}

	if (!isBroadcastChannel(bChannel)) {
		throw new INVALID_BROADCAST_CHANNEL_ERROR();
	}

	const { channelId, bundleId } = bChannel;
	const { useSandbox = false, apnsRequestId } = settings ?? {};

	const baseUrl = useSandbox ? BROADCAST_SANDBOX_BASE_URL : BROADCAST_PRODUCTION_BASE_URL;

	const channelDeleteResponse = await connector.send({
		method: "DELETE",
		baseUrl,
		requestPath: `/1/apps/${bundleId}/channels`,
		headers: {
			"apns-channel-id": channelId,
			"apns-request-id": apnsRequestId,
		},
	});

	const { "apns-request-id": requestId } = channelDeleteResponse.headers as Record<string, string>;

	return {
		success: true,
		apnsRequestId: requestId,
	};
}

function isBroadcastChannel(channel: {}): channel is BroadcastChannel {
	return (
		(channel && typeof channel === "object" && "channelId" in channel && "bundleId" in channel) ||
		false
	);
}

/**
 * Reads all channels for a given bundle ID.
 * Creates an array of valid targets against which notifications can be sent.
 *
 * @param connector
 * @param bundleId
 * @param useSandbox
 * @returns
 */
export async function readAllChannels(
	connector: ConnectorProtocol,
	bundleId: string,
	settings: ChannelReadSettings = {},
): Promise<BroadcastChannel[]> {
	if (!connector || typeof connector.send !== "function") {
		throw new CONNECTOR_INVALID_ERROR();
	}

	if (!bundleId || typeof bundleId !== "string") {
		throw new BUNDLE_ID_MISSING_ERROR();
	}

	const { useSandbox = false, apnsRequestId } = settings ?? {};

	const baseUrl = useSandbox ? BROADCAST_SANDBOX_BASE_URL : BROADCAST_PRODUCTION_BASE_URL;

	const channelReadResponse = await connector.send({
		method: "GET",
		baseUrl,
		requestPath: `/1/apps/${bundleId}/all-channels`,
		headers: {
			"apns-request-id": apnsRequestId,
		},
	});

	const { channels } = (await channelReadResponse.body.json()) as { channels: string[] };

	return channels.map((channelId) => BroadcastChannel(channelId, bundleId));
}
