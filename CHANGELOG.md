# Changelog

### 1.0.1 (27 Aug 25) - settling-in phase

- Fixed `BroadcastChannel` delivery path;
- Set `LiveActivityNotification` payload to have, on a `start` event, `input-push-token` and `input-push-channel` mutually exclusive;
- Renamed broadcast methods to `readBroadcastChannel`, `readAllBroadcastChannels`, `deleteBroadcastChannel` to improve the meaningfulness when reading the methods;
- Added `debug` setting to `readBroadcastChannel`, `readAllBroadcastChannels`, `deleteBroadcastChannel` and `createBroadcastChannel`;
