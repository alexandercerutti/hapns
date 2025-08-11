# Alert Notification example

This is an example for usage of `hapns`' `AlertNotification`.
It is accompanied with an example iOS App that showcases how the notification is received and used by the application itself.

The example is made of a Node.JS server application and an iOS application.

Some variables can be configured in the `server.mjs` file. It will automatically create a local
server which will communicate with the example app.

More details are available as comments in the `server.mjs`.

Run the following commands to run the server. This project uses [`pnpm`](https://pnpm.io/) to assume `hapns` comes from the same repository (workspace).

```sh
$ pnpm install
$ pnpm run:example
```
