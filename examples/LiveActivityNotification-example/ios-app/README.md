# iOS Live Activity Example App

This directory contains an example iOS application that demonstrates how to use Live Activities with a backend service.

### Backend Service

The backend service simulates a 3D printer queue and is responsible for starting, updating, and ending Live Activities.

1.  **Install dependencies:**
    Navigate to the `LiveActivityNotification-example` directory and run:

    ```bash
    $ pnpm install
    ```

2.  **Run the services:**
    You need to open two separate terminal windows from the `LiveActivityNotification-example` root.

    In the first terminal, start the main server:

    ```bash
    $ pnpm run:server
    ```

    In the second terminal, start the printer simulator:

    ```bash
    $ pnpm run:printer
    ```

### iOS Application

The iOS app connects to the backend service to manage Live Activities.

#### 1. Configure Environment Variables

Before running the app, you must configure the server's address in Xcode.

1.  Open `printing-application.xcodeproj` in Xcode.
2.  Go on the tab `Product > "Scheme" > "Edit Scheme..."`
3.  Select the **Run** action from the left sidebar.
4.  Go to the **Arguments** tab.
5.  In the **Environment Variables** section, you will find `SERVER_BASE_URL` and `SERVER_PORT`.
    - **`SERVER_BASE_URL`**: Change the value to your computer's local network IP address or hostname (e.g., `http://192.168.1.10` or `http://your-computer-name.local`).
    - **`SERVER_PORT`**: Ensure this matches the port the server is running on (default is `3000`).

Alternatively, you can directly edit the `printing-application.xcodeproj/xcshareddata/xcschemes/printing-application.xcscheme` file to set these values.

#### 2. Build and Run

Once the environment variables are set, you can build and run the application on a simulator or a physical device directly from Xcode.

### How it Works

This application simulates a 3D printer server that interacts with a companion mobile app. It manages print jobs and communicates their status via Live Activities.

#### Initial Setup

1.  The server must be active before the companion app is started.
2.  When the app starts, it will automatically register with the active server to receive updates. If the app is launched before the server, it will not register.

#### Starting a Print Job

Once the server is running and the app is registered, the printer process can be initiated in two ways:

1.  **CLI Command**: By pressing Enter in the server's console.
2.  **HTTP Request**: By receiving a request from the companion app.

The behavior depends on the "Enable remote start" toggle in the app.

##### 1. CLI Mode (Remote Start Enabled)

This mode simulates a user interacting directly with the printer (e.g., pressing a button on the physical device) or inputting a printing through a third party device.

- **Prerequisite**: The "Enable remote start" toggle must be ON in the app.
- **Action**: A command entered in the server's CLI will start a new print job.
- **Result**: The server initiates, updates, and ends the Live Activity directly on the user's device, keeping it in sync with the printer's status.

##### 2. HTTP Request Mode (Remote Start Disabled)

This mode simulates a user starting a print job from within the companion app.

- **Prerequisite**: The "Enable remote start" toggle must be OFF in the app.
- **Action**: The app sends an HTTP request to the server.
- **Result**: The app itself starts the Live Activity on the device and registers with the server for updates. The server processes the print command and sends progress updates back to the app, which then updates the Live Activity.
