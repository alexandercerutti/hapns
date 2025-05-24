# Apple Wallet Notification Example

This is an example for usage of `hapns`' `AlertNotification` with the purpose of updating an Apple Wallet pass.

The example is made of two different Node.JS server application that showcase how to update a pass using both tokens and certificates.

The server file contains the instructions to set up the example on the server side.

Run the following commands to run the server. This project uses [`pnpm`](https://pnpm.io/) to assume `hapns` comes from the same repository (workspace).

```sh
$ pnpm install
$ pnpm run:example:token // or
$ pnpm run:example:certificates
```
