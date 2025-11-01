# Alert Notification example

This is an example for usage of `hapns`' `AlertNotification`.
It is accompanied with an example iOS App that showcases how the notification is received and used by the application itself.

The example is made of a Node.JS server application and an iOS application.

Some variables can be configured in the `server.mjs` file. It will automatically create a local
server which will communicate with the example app.

More details are available as comments in the `server.mjs`.

Run the following commands to run the server. This project uses [`pnpm`](https://pnpm.io/) to assume `hapns` comes from the same repository (workspace).

```sh
$ pnpm run:setup
$ pnpm run:example
```

Open the iOS application in Xcode. Go to 'Product' -> 'Scheme' -> 'Edit Scheme...' -> 'Run' -> 'Arguments' -> 'Environment Variables' and proceed adding the following environmental variable:

- key: `DEVICE_REGISTRATION_ADDRESS`
- value: The address of where your server is running. If you are running the app on the simulator, you can use `http://localhost:8571`. Otherwise you can use Bonjour address, like `http://\<bonjour\>.local:8571` or your machine NAT IP. Server automatically serves on port `8571`, so you'll always need to specify it.
