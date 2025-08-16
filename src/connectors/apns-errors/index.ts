type Reasons =
	| "BadCollapseId"
	| "BadDeviceToken"
	| "BadExpirationDate"
	| "BadMessageId"
	| "BadPriority"
	| "BadTopic"
	| "DeviceTokenNotForTopic"
	| "DuplicateHeaders"
	| "IdleTimeout"
	| "InvalidPushType"
	| "MissingDeviceToken"
	| "MissingTopic"
	| "PayloadEmpty"
	| "TopicDisallowed"
	| "BadCertificate"
	| "BadCertificateEnvironment"
	| "ExpiredProviderToken"
	| "Forbidden"
	| "InvalidProviderToken"
	| "MissingProviderToken"
	| "UnrelatedKeyIdInToken"
	| "BadPath"
	| "MethodNotAllowed"
	| "ExpiredToken"
	| "Unregistered"
	| "PayloadTooLarge"
	| "TooManyProviderTokenUpdates"
	| "TooManyRequests"
	| "InternalServerError"
	| "ServiceUnavailable"
	| "Shutdown"

	// Broadcast only
	| "FeatureNotEnabled"
	| "MissingChannelId"
	| "BadChannelId"
	| "ChannelNotRegistered"
	| "BadRequestParams"
	| "BadRequestPayload"
	| "MissingPushType"
	| "CannotCreateChannelConfig"
	| "TopicMismatch"
	| "Service"
	// undocumented - This happens when message-storage-policy is send as `undefined` or an invalid value
	| "MissingChannelQueueSize"

	// Final fallback
	| "UnknownError";

type ReasonsWithError = {
	[Reason in Reasons]: Reason extends `${string}Error` ? Reason : `${Reason}Error`;
}[Reasons];

type ApnsErrorConstructor = new (apnsId: string) => Error;

const ApnsErrorMap = new Map<ReasonsWithError, ApnsErrorConstructor>();

export function getApnsErrorByReasonString(reason: string): ApnsErrorConstructor {
	const ApnsError = ApnsErrorMap.get(
		(reason.endsWith("Error") ? reason : `${reason}Error`) as ReasonsWithError,
	);

	if (!ApnsError) {
		throw new Error(`Unknown APNs error reason received: ${reason}`);
	}

	return ApnsError;
}

function BuildApnsError(
	reason: ReasonsWithError,
	httpStatusCode: number,
	message: string,
): ApnsErrorConstructor {
	class APNsErrorForReason extends Error {
		public readonly statusCode: number;
		public readonly apnsId: string;

		constructor(apnsId: string) {
			super(message);
			this.name = reason;
			this.statusCode = httpStatusCode;
			this.apnsId = apnsId;
		}
	}

	ApnsErrorMap.set(reason, APNsErrorForReason);

	return APNsErrorForReason;
}

BuildApnsError(
	"BadCollapseIdError",
	400,
	"The collapse identifier exceeded the maximum allowed size.",
);
BuildApnsError(
	"BadDeviceTokenError",
	400,
	"The specified device token is invalid. Verify that the request contains a valid token and that the token matches the environment.",
);
BuildApnsError("BadExpirationDateError", 400, "The apns-expiration value is invalid.");
BuildApnsError("BadMessageIdError", 400, "The apns-id value is invalid.");
BuildApnsError("BadPriorityError", 400, "The apns-priority value is invalid.");
BuildApnsError("BadTopicError", 400, "The apns-topic value is invalid.");
BuildApnsError(
	"DeviceTokenNotForTopicError",
	400,
	"The device token doesn’t match the specified topic.",
);
BuildApnsError("DuplicateHeadersError", 400, "One or more headers are repeated.");
BuildApnsError("IdleTimeoutError", 400, "Idle timeout.");
BuildApnsError("InvalidPushTypeError", 400, "The apns-push-type value is invalid.");
BuildApnsError(
	"MissingDeviceTokenError",
	400,
	"The device token isn’t specified in the request :path. Verify that the :path header contains the device token.",
);
BuildApnsError(
	"MissingTopicError",
	400,
	"The apns-topic header of the request isn’t specified and is required. The apns-topic header is mandatory when the client is connected using a certificate that supports multiple topics.",
);
BuildApnsError("PayloadEmptyError", 400, "The message payload is empty.");
BuildApnsError("TopicDisallowedError", 400, "Pushing to this topic is not allowed.");
BuildApnsError("BadCertificateError", 403, "The certificate is invalid.");
BuildApnsError(
	"BadCertificateEnvironmentError",
	403,
	"The client certificate is forthe wrong environment.",
);
BuildApnsError(
	"ExpiredProviderTokenError",
	403,
	"The provider token is stale and a new token should be generated.",
);
BuildApnsError("ForbiddenError", 403, "The specified action is not allowed.");
BuildApnsError(
	"InvalidProviderTokenError",
	403,
	"The provider token is not valid, or the token signature can’t be verified.",
);
BuildApnsError(
	"MissingProviderTokenError",
	403,
	"No provider certificate was used to connect to APNs, and the authorization header is missing or no provider token is specified.",
);
BuildApnsError(
	"UnrelatedKeyIdInTokenError",
	403,
	"The key ID in the provider token isn’t related to the key ID of the token used in the first push of this connection. To use this token, open a new connection.",
);
BuildApnsError("BadPathError", 404, "The request contained an invalid :path value.");
BuildApnsError("MethodNotAllowedError", 405, "The specified :method value isn’t POST.");
BuildApnsError("ExpiredTokenError", 410, "The device token has expired.");
BuildApnsError(
	"UnregisteredError",
	410,
	"The device token is inactive for the specified topic. There is no need to send further pushes to the same device token, unless your application retrieves the same device token, refer to Registering your app with APNs",
);
BuildApnsError(
	"PayloadTooLargeError",
	413,
	"The message payload is too large. For information about the allowed payload size, refer to Create a POST request to APNs in Sending notification requests to APNs.",
);
BuildApnsError(
	"TooManyProviderTokenUpdatesError",
	429,
	"The provider’s authentication token is being updated too often. Update the authentication token no more than once every 20 minutes.",
);
BuildApnsError(
	"TooManyRequestsError",
	429,
	"Too many requests were made consecutively to the same device token.",
);
BuildApnsError("InternalServerError", 500, "An internal server error occurred.");
BuildApnsError("ServiceUnavailableError", 503, "The service is unavailable.");
BuildApnsError("ShutdownError", 503, "The APNs server is shutting down.");

/// ************************ ///
/// *** BROADCAST ERRORS *** ///
/// ************************ ///

BuildApnsError(
	"FeatureNotEnabledError",
	400,
	"Broadcast feature is not enabled for this topic. Refer to Setting up broadcast push notifications to enable broadcast capabilities. (https://developer.apple.com/documentation/usernotifications/setting-up-broadcast-push-notifications)",
);
BuildApnsError("MissingChannelIdError", 400, "The apns-channel-id header is missing.");
BuildApnsError(
	"BadChannelIdError",
	400,
	"The apns-channel-id header isn’t properly encoded, or it’s greater than the allowed length.",
);
BuildApnsError(
	"ChannelNotRegisteredError",
	400,
	"The apns-channel-id header used in the request doesn’t exist.",
);
BuildApnsError(
	"BadRequestParamsError",
	400,
	"The JSON Request payload contained an unrecognizable attribute.",
);
BuildApnsError("BadRequestPayloadError", 400, "The JSON Request payload is unparseable.");
BuildApnsError(
	"PayloadEmptyError",
	400,
	"The push notification request didn’t include a notification payload.",
);
BuildApnsError("BadMessageIdError", 400, "The apns-id value is invalid.");
BuildApnsError("MissingPushTypeError", 400, "The apns-push-type attribute is missing.");
BuildApnsError(
	"InvalidPushTypeError",
	400,
	"The apns-push-type attribute is set to an incorrect value. The only allowed value is LiveActivity.",
);
BuildApnsError(
	"CannotCreateChannelConfigError",
	400,
	"You have reached the maximum channel limit for your application. Delete channels that you no longer use.",
);
BuildApnsError(
	"BadExpirationDateError",
	400,
	"The apns-expiration header is an invalid epoch timestamp. For channels with a No Messages Stored storage policy, you can only specify a 0 expiration value.",
);
BuildApnsError(
	"TopicDisallowedError",
	400,
	"The topic is not allowed. Ensure that no push type suffix is added to the bundle ID.",
);
BuildApnsError("BadPriorityError", 400, "The apns-priority header is an invalid value.");

// Undocumented - This happens when `message-storage-policy` is sent as undefined
BuildApnsError(
	"MissingChannelQueueSizeError",
	400,
	"'message-storage-policy' parameter has not been provided.",
);

BuildApnsError("BadCertificateError", 403, "The certificate is invalid.");
BuildApnsError(
	"BadCertificateEnvironmentError",
	403,
	"The client certificate is for the wrong environment.",
);
BuildApnsError(
	"TopicMismatchError",
	403,
	"The bundle IDs parsed from your token or certificate don’t include the topic present in the path.",
);
BuildApnsError("MissingProviderTokenError", 403, "No certificate or JWT token provided.");
BuildApnsError("ExpiredProviderTokenError", 403, "The JWT Token is expired.");
BuildApnsError("InvalidProviderTokenError", 403, "The JWT Token is invalid.");
BuildApnsError(
	"BadPathError",
	404,
	"The URL is invalid. Either the HTTP/2 method or the HTTP/2 path is incorrect.",
);
BuildApnsError("MethodNotAllowedError", 405, "The specified :method value isn’t allowed.");
BuildApnsError(
	"PayloadTooLargeError",
	413,
	"The message payload is too large. For information about the allowed payload size, refer to Sending broadcast push notification requests to APNs.",
);
BuildApnsError(
	"TooManyRequestsError",
	429,
	"The request was throttled because too many requests were received.",
);
BuildApnsError(
	"TooManyProviderTokenUpdatesError",
	429,
	"The provider’s authentication token is being updated too often. Update the authentication token no more than once every 20 minutes.",
);
BuildApnsError("InternalServerError", 500, "An unexpected error occurred.");
BuildApnsError("ServiceError", 503, "Unavailable The service is unavailable");
BuildApnsError("ShutdownError", 503, "The server is shutting down and unavailable.");

/// ********************** ///
/// *** FINAL FALLBACK *** ///
/// ********************** ///

BuildApnsError("UnknownError", -1, "An unknown error occurred.");
