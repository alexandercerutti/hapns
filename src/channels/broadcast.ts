import type { ConnectorProtocol } from "../connectors/connector.js";
import { BroadcastChannel } from "../targets/BroadcastChannel.js";

interface BroadcastChannelSettings {
	bundleId: string;
	messageStoragePolicy?: 1 | 0;
	apnsRequestId?: string;
	useSandbox?: boolean;
}

const BROADCAST_SANDBOX_BASE_URL = "https://api-manage-broadcast.sandbox.push.apple.com:2195";
const BROADCAST_PRODUCTION_BASE_URL = "https://api-manage-broadcast.push.apple.com:2196";

const CONNECTOR_INVALID_ERROR = createError(
	"CONNECTOR_INVALID_ERROR",
	"Cannot manage broadcast channel: Connector is missing or is not a valid connector.",
);

export async function createBroadcastChannel(
	connector: ConnectorProtocol,
	settings: BroadcastChannelSettings,
	useSandbox: boolean = false,
): Promise<BroadcastChannel> {
	if (!connector || typeof connector.send !== "function") {
		throw new CONNECTOR_INVALID_ERROR();
	}

	if (!settings || typeof settings !== "object") {
		throw new Error("Settings are missing or are not a valid settings object.");
	}

	if (!settings.bundleId || typeof settings.bundleId !== "string") {
		throw new Error("Settings bundleId is missing or is not a string.");
	}

	const baseUrl = useSandbox ? BROADCAST_SANDBOX_BASE_URL : BROADCAST_PRODUCTION_BASE_URL;

	const channelHeaders = {
		"apns-request-id": settings.apnsRequestId || "",
	};

	const channelCreationResponse = await connector.send({
		method: "POST",
		baseUrl,
		requestPath: `/1/apps/${settings.bundleId}/channels`,
		headers: channelHeaders,
		body: {
			messageStoragePolicy: settings.messageStoragePolicy,
			"push-type": "LiveActivity",
		},
	});

	const { headers } = channelCreationResponse;

	const { "apns-channel-id": channelId } = headers as Record<string, string>;

	return BroadcastChannel(channelId, settings.bundleId);
}

interface SourceChannelReadResponseBody {
	"message-storage-policy": number;
	"push-type": string;
}

interface ChannelReadResponseBody {
	messageStoragePolicy: number;
	pushType: string;
}

export async function readChannel(
	connector: ConnectorProtocol,
	channelId: string,
	bundleId: string,
	useSandbox: boolean = false,
): Promise<ChannelReadResponseBody> {
	if (!connector || typeof connector.send !== "function") {
		throw new CONNECTOR_INVALID_ERROR();
	}

	if (!channelId || typeof channelId !== "string") {
		throw new Error("Channel ID is missing or is not a string.");
	}

	if (!bundleId || typeof bundleId !== "string") {
		throw new Error("Bundle ID is missing or is not a string.");
	}

	const baseUrl = useSandbox ? BROADCAST_SANDBOX_BASE_URL : BROADCAST_PRODUCTION_BASE_URL;

	const channelHeaders = {
		"apns-channel-id": channelId || "",
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

/**
 * Sends a request to delete an existing broadcast channel.
 *
 * @param connector
 * @param channelId
 * @param bundleId
 */
export async function deleteChannel(
	connector: ConnectorProtocol,
	channelId: string,
	bundleId: string,
	useSandbox: boolean = false,
): Promise<{ success: true; apnsRequestId: string }> {
	if (!connector || typeof connector.send !== "function") {
		throw new CONNECTOR_INVALID_ERROR();
	}

	if (!channelId || typeof channelId !== "string") {
		throw new Error("Channel ID is missing or is not a string.");
	}

	if (!bundleId || typeof bundleId !== "string") {
		throw new Error("Bundle ID is missing or is not a string.");
	}

	const baseUrl = useSandbox ? BROADCAST_SANDBOX_BASE_URL : BROADCAST_PRODUCTION_BASE_URL;

	const channelDeleteResponse = await connector.send({
		method: "DELETE",
		baseUrl,
		requestPath: `/1/apps/${bundleId}/channels`,
		headers: {
			"apns-channel-id": channelId,
		},
		body: {},
	});

	const { "apns-request-id": apnsRequestId } = channelDeleteResponse.headers as Record<
		string,
		string
	>;

	return {
		success: true,
		apnsRequestId,
	};
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
	useSandbox: boolean = false,
): Promise<BroadcastChannel[]> {
	if (!connector || typeof connector.send !== "function") {
		throw new CONNECTOR_INVALID_ERROR();
	}

	if (!bundleId || typeof bundleId !== "string") {
		throw new Error("Bundle ID is missing or is not a string.");
	}

	const baseUrl = useSandbox ? BROADCAST_SANDBOX_BASE_URL : BROADCAST_PRODUCTION_BASE_URL;

	const channelReadResponse = await connector.send({
		method: "GET",
		baseUrl,
		requestPath: `/1/apps/${bundleId}/all-channels`,
		headers: {},
	});

	const { channels } = (await channelReadResponse.body.json()) as { channels: string[] };

	return channels.map((channelId) => BroadcastChannel(channelId, bundleId));
}
