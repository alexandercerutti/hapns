# End-to-End iOS Simulator Testing

This directory contains the infrastructure for running automated, end-to-end tests for `hapns` using a real iOS Simulator. This setup is designed to be robust, modular, and runnable both locally and in a CI environment.

## Architecture

The testing process is orchestrated by a Node.js script that manages all the moving parts. This avoids complex shell scripting in the CI workflow and provides a consistent testing experience for developers.

The main components are:

- **Test Runner (`specs/*.spec.mjs`)**:

  - These are the main test files that define the testing logic.
  - They use Node.js's built-in test runner (`node:test`).
  - Each test file is responsible for orchestrating a specific test scenario from start to finish.

- **Test Server (`specs/ci-test-server/server.mjs`)**:

  - A session-based Fastify server that acts as a communication bridge between the test runner and the iOS app running in the simulator.
  - It manages test sessions, receives the device token from the app, and signals the app when the test is complete.

- **iOS Simulator Library (`specs/lib/ios-simulator.mjs`)**:

  - An abstraction layer that wraps all `xcrun simctl` and `xcodebuild` commands into js functions
  - It handles creating, booting, and cleaning up simulators, as well as installing and running the test app.

- **Test Client Library (`specs/lib/test-client.mjs`)**:
  - A client library that encapsulates all `fetch` calls to the test server.
  - This keeps the main test files clean and focused on the test logic.

## Test Flow

The end-to-end test follows a precise sequence of events:

1.  **Environment Check**: Before any tests are run, the script checks if it's on a macOS environment with `xcrun`. If not, the tests are skipped.

2.  **Test Session**: The test runner initiates a new test session. The server generates a unique `testId` for this session.

3.  **Simulator Orchestration**: The test spawns a iOS Simulator instance. This ensures that each test run is isolated.

4.  **App Launch**: The script runs the Xcode UI tests, passing the `testId` as a launch argument.

5.  **Device Registration**:

    - The iOS app, upon launching, detects the `testId`.
    - It then sends a request to the test server with its device token and the `testId`.

6.  **Sending Notification**: Once the device is registered, the test script will run an send notifications via APNs.

## Running the Tests

### Local Development

You can run the entire test suite on your local machine. This is useful for debugging and developing new tests.

**Prerequisites:**

- A macOS machine with Xcode and Node.js installed.
- [pnpm](https://pnpm.io) for dependency management (`npm install -g pnpm`).

**Steps:**

1.  **Install Dependencies**:

    ```sh
    $ pnpm install
    ```

2.  **Set APNs Credentials**:
    The test script requires your APNs credentials to be set as environment variables. You can export them in your shell:

    ```bash
    export APNS_KEY_ID="YOUR_KEY_ID"
    export APNS_TEAM_ID="YOUR_TEAM_ID"
    ```

3.  **Start the Test Server**:
    In a separate terminal window, start the test server:

    ```bash
    node specs/ci-test-server/server.mjs
    ```

4.  **Run the Test Script**:
    In another terminal window, run the desired test file using the Node.js test runner:

    ```bash
    node --test specs/alert-notification.spec.mjs
    ```

    The script will automatically create a new simulator, run the test, and clean up after itself.

### Troubleshooting

#### UI Test Network Access

If you encounter timeouts or errors related to the UI test being unable to communicate with the test server, it might be due to Xcode's network sandboxing for UI test targets. By default, UI tests are not allowed to make network requests.

To fix this, you need to grant the UI test target the necessary entitlement:

1.  **Create an Entitlements File**: Create a new file named `UITests.entitlements` in your `UITests` directory with the following content:

    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
        <key>com.apple.security.network.client</key>
        <true/>
    </dict>
    </plist>
    ```

2.  **Configure Build Settings**: In your Xcode project, go to the "Build Settings" for the `UITests` target and set the "Code Signing Entitlements" setting to the path of your new entitlements file (e.g., `UITests/UITests.entitlements`).

3.  **Ensure Clean Build**: When running tests from the command line, it's crucial to perform a clean build to ensure the new entitlements are applied. The test scripts in this repository are configured to do this automatically by using the `xcodebuild clean test` command.

### CI Environment

The GitHub Actions workflow in `.github/workflows/ios-simulator-tests.yml` automates this process. It performs the same steps as the local setup: starting the server, setting secrets as environment variables, and running the test script.
