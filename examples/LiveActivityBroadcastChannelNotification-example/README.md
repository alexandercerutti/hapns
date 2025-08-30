# LiveActivity Notification Broadcast example

This is an example for usage of `hapns`' `LiveActivityNotification` with broadcast.

It is accompanied with an example iOS App that showcases how the notification is received and used by the application itself.

The example is made of two components:

- an iOS application to start
- a Node.JS server

The iOS application asks to the server for available channels and allows subscribing and starting a Local Live Activity by just tapping on an application.
Once the device is registered to the server (pushToStartToken provided to application), it will be possible to start a broadcast live activity through the server.

Once inputted, the server will start a live activity for each device.

### Running the example

This project uses [`pnpm`](https://pnpm.io/) to assume `hapns` comes from the same repository (workspace).

Install the dependencies by running:

```sh
$ pnpm install
```

Then run the server with this command:

```sh
$ pnpm run:server
```

The server will start listening on a port and will give the chance to select some options.
Once the server is run, run the application in order to make it register to the server.

Once the server is started, you will be able to create a channel.

> [!NOTE]
> Broadcast Live Notification design is ugly as hell. I honestly didn't care very much of it. If you want to improve it in order to train yourself, please send a PR!
