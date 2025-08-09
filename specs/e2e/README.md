# Notification E2E Test

This folder contains an experiment that aims to test if a notification arrives on a device - specifically an iOS Simulator.

[Starting Xcode 14](https://developer.apple.com/documentation/xcode-release-notes/xcode-14-release-notes#Simulator), iOS Simulators are capable of connecting to APNs and generating a device token.

This test is composed in this way:

- An iOS Application (available in the examples folder), with UITests
- A Node.JS application containing assertions, using `node:test`
- A Node.JS application server through which iOS App and Node.JS test communicates

# How does it work?

This tests creates an iOS emulator, sets its language in English and builds the iOS Application. Once the app is built, the test is run.
UITests in the iOS Application, help make it automatic to approve the permission of sending notifications.

Approving the permission, should make the application to generate the device token and share it with the application.

Once the token is generated, it is sent to the server and polled by the node.js test. Once the device token is received, the notification is sent.

# Can this be run automatically on some triggers?

No, or not yet.
Tests on Github actions have been performed, however:

1. The runner image needed is a `macos-latest-xlarge` (arm64) and this is not compatible with `macos-latest`(Intel) runner image. `xlarge` images are paid per minute of execution, while Intel ones don't. An `arm64` image is required because, according to Xcode 14 changelog, a Mac with Apple Silicon or T2 chip is required.

2. There is something missing in the puzzle: while the whole thing runs smoothless on a physical Macbook M1 2021 machine, the device token seem to not be generated when running the test on Github Action. APNs endpoints are reachable, so the only clue we have, is that the virtualization system used by Github Actions is somehow restricted in accessing certain undisclosed features used by Apple to generate the device token. Or it is very very very very slow.

3. Test runs fine on a self-hosted runner (my mac).

Therefore, the only – untested – solution might be deploying a self-hosted cloud machine that gets activated on demand. However, the risk of finding ourselves in a similar situation is still possible.

Things might change. I really hope we'll be able to run this pretty easily.

# How can I run it?

You need to have installed the Xcode Command Line Tools.

Open `integration.spec.mjs` and change the configuration variables.
Provide a valid certificate somewhere in the folder and update the path accordingly.

Assuming you have installed the dependencies of this project with `pnpm`:

```sh
$ pnpm install
```

Ensure yourself to have two terminals open.

On one terminal, run the server with the following command:

```sh
$ node server/server.js
```

In the other terminal, run the test:

```sh
$ node --test integration.spec.mjs
```

You'll see three iOS Simulator opening on iOS – one named 'hapns-test-iphone'. The other two will get opened by UITests. These will be clones of the first one.

# Do you have any issues?

Open an issue and we'll try figuring this out.
