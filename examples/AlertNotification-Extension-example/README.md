# (modified) Alert Notification example

This is an example for usage of `hapns`' `AlertNotification` for a notification that will get changed by a Notification extension (see https://developer.apple.com/documentation/usernotifications/modifying-content-in-newly-delivered-notifications).

It is accompanied with an example iOS App that showcases how the notification is received and used by the application itself.

The example is made of a Node.JS server application and an iOS application.
The server file contains the instructions to set up the example on the server side.

Run the following commands to run the server. This project uses [`pnpm`](https://pnpm.io/) to assume `hapns` comes from the same repository (workspace).

```sh
$ pnpm run:setup
$ pnpm run:example
```

Open the iOS application in Xcode. Go to 'Product' -> 'Scheme' -> 'Edit Scheme...' -> 'Run' -> 'Arguments' -> 'Environment Variables' and proceed adding the following environmental variable:

- key: `DEVICE_REGISTRATION_ADDRESS`
- value: The address of where your server is running. If you are running the app on the simulator, you can use `http://localhost:8571`. Otherwise you can use Bonjour address, like `http://\<bonjour\>.local:8571` or your machine NAT IP. Server automatically serves on port `8571`, so you'll always need to specify it.
