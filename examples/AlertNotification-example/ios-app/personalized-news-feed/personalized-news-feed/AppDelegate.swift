//
//  AppDelegate.swift
//  personalized-news-feed
//
//  Created by Alexander on 25/05/25.
//

import UIKit
import UserNotifications

@MainActor
class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    var testId: String?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        let notificationCenter = UNUserNotificationCenter.current()
        
        Task {
            if try await notificationCenter.requestAuthorization(options: [.alert]) {
                DispatchQueue.main.async {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            }
            
        }
        
        return true;
    }
    
    /**
     * This will handle the device token you'll have to use when running
     * the server example. Take the deviceToken and paste it in the server example.
     *
     * In a realistic scenario, you should send this to your backend application and save it for the user
     * in a database. Later, you should read it from such database from the serveer application to send the notification.
     *
     * In order for this to work, you should enable 'Push Notifications' capability in the project settings.
     */
    
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        let deviceTokenString = deviceToken.map { String(format: "%02.2hhx", $0) }.joined();
        print("DEVICE TOKEN IS: \(deviceTokenString)");

        // The TEST_ID is passed as a launch argument from the UI test.
        // If available, we want to register the device to the test server.
        guard let testId = ProcessInfo.processInfo.environment["TEST_ID"] else {
            print("Test ID not set. Cannot send token to server.")
            return
        }
        
        self.testId = testId
        
        guard let apnsTopic = Bundle.main.bundleIdentifier else {
            print("Could not get bundle identifier")
            return
        }
        
        self.sendTokenToTestServer(testId, token: deviceTokenString, apnsTopic: apnsTopic)
    }

    func sendTokenToTestServer(_ testId: String, token: String, apnsTopic: String) {
        let url = URL(string: "http://localhost:8571/tests/\(testId)/device-advertising")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: String] = ["deviceToken": token, "apnsTopic": apnsTopic]
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body, options: [])
        } catch {
            print("Error creating JSON body: \(error)")
            return
        }
        
        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("Error sending token to server: \(error)")
                return
            }
            guard let httpResponse = response as? HTTPURLResponse,
                  (200...299).contains(httpResponse.statusCode) else {
                print("Server returned non-200 status code")
                return
            }
            print("Successfully registered token with test server.")
        }
        
        task.resume()
    }
    
    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("Failed to register for remote notifications: \(error)")
    }
    
    /**
     * This will apply when app is open and receives a notification.
     * Apparently there is no way of receiving a notification when app is in background.
     */
    func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any]) async -> UIBackgroundFetchResult {
        print("Received a notification", userInfo);
        return UIBackgroundFetchResult.noData;
    }
    
    /**
     * This method is needed, especially in the tests. Otherwise, the notification will not be shown
     * when the app is open (but we need them to be shown in order to intercept and resolve the test).
     */
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        
        // Tell iOS to show the notification as a banner and play a sound.
        // Without this, the notification will be silent when the app is open.
        completionHandler([.banner, .list, .sound])
    }
}
