import XCTest

class NotificationAppearanceUITest: XCTestCase {
    var app: XCUIApplication!
    var springboard: XCUIApplication!
    var testId: String!
    var pingTimer: Timer?
    var serverBaseURL = "http://localhost:8571"

    override func setUpWithError() throws {
        try super.setUpWithError()
        continueAfterFailure = false
        
        guard let udid = ProcessInfo.processInfo.environment["SIMULATOR_UDID"] else {
            XCTFail("SIMULATOR_UDID not found in environment variables")
            return
        }

        springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")

        // When "default-test-id" is used, it is because this is being run through Xcode
        // When has different settings - you can set it through the schemas
        self.testId = ProcessInfo.processInfo.environment["TEST_ID"] ?? "default-test-id"
        
        guard let deviceRegistrationAddress = ProcessInfo.processInfo.environment["DEVICE_REGISTRATION_ADDRESS"] else {
            XCTFail("DEVICE_REGISTRATION_ADDRESS not found in environment variables")
            return;
        }
        
        app = XCUIApplication()
        app.launchEnvironment = [
            "TEST_ID": self.testId,
            "DEVICE_REGISTRATION_ADDRESS": deviceRegistrationAddress
        ]
        
        registerSimulatorToServer(testId: self.testId, udid: udid)

        app.launch()

        startPingTimer()
    }

    override func tearDownWithError() throws {
        stopPingTimer()
        try super.tearDownWithError()
    }

    func startPingTimer() {
        pingTimer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { [weak self] timer in
            guard let self = self else {
                timer.invalidate()
                return
            }
            
            self.sendPingToServer()
        }
    }

    func stopPingTimer() {
        pingTimer?.invalidate()
        pingTimer = nil
    }

    func sendPingToServer() {
        let url = URL(string: "\(serverBaseURL)/tests/\(self.testId!)/ping")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"

        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("Failed to send ping: \(error.localizedDescription)")
                return
            }
            
            guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
                print("Server returned non-200 status code for ping.")
                return
            }
        }
        task.resume()
    }

    func registerSimulatorToServer(testId: String, udid: String) {
        let expectation = self.expectation(description: "Register simulator with server")
        
        let url = URL(string: "\(serverBaseURL)/tests/\(testId)/register-simulator")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["udid": udid]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body, options: [])

        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                XCTFail("Failed to register simulator: \(error.localizedDescription)")
                return;
            }
            
            if let httpResponse = response as? HTTPURLResponse, !(200...299).contains(httpResponse.statusCode) {
                XCTFail("Server returned non-200 status code for simulator registration.")
                return;
            }

            print("Successfully registered simulator with the server.")
            expectation.fulfill()
        }
        
        task.resume()
        
        waitForExpectations(timeout: 10) { error in
            if let error = error {
                XCTFail("Timeout waiting for simulator registration: \(error)")
            }
        }
    }

    func testReceiveNotificationAndVerify() {
        print("Waiting for permission to appear");

        let interruptionMonitor = addUIInterruptionMonitor(withDescription: "Notification Permission Alert") { (alert) -> Bool in
            let allowButton = alert.buttons["Allow"]
            if allowButton.exists {
                print("Permission alert appeared. Tapping 'Allow'.")
                allowButton.tap()
                return true
            }
            print("Permission alert did not have an 'Allow' button.")
            return false
        }

        // The app needs to be interacted with to trigger the interruption monitor.
        app.tap()

        print("Waiting for notification to appear on the home screen...")

        // Wait for the notification to appear on the SpringBoard.
        let notification = springboard.otherElements.descendants(matching: .any)["NotificationShortLookView"]
        XCTAssertTrue(notification.waitForExistence(timeout: 10000), "Notification did not appear on the screen.")

        // Get the notification's content by position.
        let notificationTitle = notification.staticTexts.element(boundBy: 0)
        let notificationBody = notification.staticTexts.element(boundBy: 1)
        
        // Wait up to 30 seconds for the notification to appear. If it doesn't, the test fails.
        XCTAssertTrue(notificationTitle.exists, "Notification title is incorrect or not found.")
        XCTAssertTrue(notificationBody.exists, "Notification body is incorrect or not found.")

        print("SUCCESS: Notification found on screen.")

        signalVerificationToServer(notificationTitle: notificationTitle.label, notificationBody: notificationBody.label)
        
        removeUIInterruptionMonitor(interruptionMonitor)
    }

    func signalVerificationToServer(notificationTitle: String, notificationBody: String) {
        let expectation = self.expectation(description: "Signal verification to server")
        
        let url = URL(string: "\(serverBaseURL)/tests/\(self.testId!)/assert-notification")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = [
            "notificationTitle": notificationTitle,
            "notificationBody": notificationBody
        ]

        request.httpBody = try? JSONSerialization.data(withJSONObject: body, options: [])
        
        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                XCTFail("Failed to send verification signal: \(error.localizedDescription)")
            } else if let httpResponse = response as? HTTPURLResponse, !(200...299).contains(httpResponse.statusCode) {
                XCTFail("Server returned non-200 status code for verification signal.")
            } else {
                print("Successfully signaled notification verification to the server.")
            }
            expectation.fulfill()
        }
        
        task.resume()
        
        waitForExpectations(timeout: 10) { error in
            if let error = error {
                XCTFail("Timeout waiting for verification signal: \(error)")
            }
        }
    }
}
