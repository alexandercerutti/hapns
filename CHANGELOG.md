# Changelog

### 1.0.2 (02 Sep 25)

- Improved `WidgetNotification` payload by removing useless parameter to be provided and added support for parametric priority;
- Added validation for `appData` in `VoipNotification`;
- Added validation for `appData` in `PushToTalkNotification`;
- Changed supported connectors for `PushToTalkNotification` (based on documentation example);
- Fixed payload for `FileProviderNotification` – wasn't compliant with the documentation;
- Fixed supported connectors for `FileProviderNotification`;
- Set `mutable-content` payload to be available only when a non-empty `AlertNotification` is built;

---

### 1.0.1 (27 Aug 25) - settling-in phase

- Fixed `BroadcastChannel` delivery path;
- Set `LiveActivityNotification` payload to have, on a `start` event, `input-push-token` and `input-push-channel` mutually exclusive;
- Renamed broadcast methods to `readBroadcastChannel`, `readAllBroadcastChannels`, `deleteBroadcastChannel` to improve the meaningfulness when reading the methods;
- Added `debug` setting to `readBroadcastChannel`, `readAllBroadcastChannels`, `deleteBroadcastChannel` and `createBroadcastChannel`;
