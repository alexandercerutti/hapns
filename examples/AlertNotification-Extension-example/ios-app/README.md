# iOS App Example Modifying notification

This is a sample example application that supports the APNs registration and notification receiving, along with content editing and layout changing with `NotificationServiceExtension`s and `NotificationContentExtension`s.

# Running with the extension

In order to run the application using the extension, `NotificationService` scheme should be selected. Xcode will prompt and ask for the application to use.

In order to change the path of server registration, you'll need to change the Environmental variable on all the schemes.

# Execution order

- `NotificationServiceExtension` (NSE) will run as soon as the application is received;
- `NotificationContentExtension` (NCE) wil run as soon as the notification is long-pressed (ex 3D-Touch);

Therefore, in order to debug the NCE, put the breakpoints, send the notification and then long press. Breakpoints will trigger.

NSE will be able to run only for up to 30 seconds.
