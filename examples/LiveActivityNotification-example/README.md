# LiveActivity Notification example

This is an example for usage of `hapns`' `LiveActivityNotification`.

It is accompanied with an example iOS App that showcases how the notification is received and used by the application itself.

The example is made of three components:

- an iOS application to start
- a Node.JS server
- a Node.JS 3D Printer emulator

The purpose is to emulate the connection of a physical 3D printer with an application through a server.

### Running the example

This project uses [`pnpm`](https://pnpm.io/) to assume `hapns` comes from the same repository (workspace).

Install the dependencies by running:

```sh
$ pnpm install
```

Open two terminals and run these two commands:

```sh
$ pnpm run:server
$ pnpm run:printer
```

When the printer process is run, it will start checking for the server. They run respectively on port `3000` and `3001`.

The printer process will accept requests from both the app through the server or through CLI input (it will wait for an "Enter" or whatever).

When the app is started, it will communicate the PushToStart Token (PTTT) to the server (one shot), which will be enough for the printer CLI to start a Live Activity through APNS.

Once the application starts a remote Live Activity, it will actually start it locally but will wait for updates from the server.
