//
//  AppDelegate.swift
//  personalized-news-feed
//
//  Created by Alexander on 25/05/25.
//

import UIKit
import UserNotifications
import os.log

@MainActor
class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    private let logger = Logger(subsystem: Bundle.main.bundleIdentifier!, category: "AppDelegate")

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        let notificationCenter = UNUserNotificationCenter.current()
        
        Task {
            let testId = ProcessInfo.processInfo.environment["TEST_ID"] ?? "default-test-id";

            reportProgressToStepsGuard(deviceRegistrationAddress: "http://localhost:8571/tests/\(testId)", stepName: "didFinishLaunchingWithOptions", metadata: ["launchOptions": "\(String(describing: launchOptions))"]);
            
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
        let testId = ProcessInfo.processInfo.environment["TEST_ID"] ?? "default-test-id";
        
        reportProgressToStepsGuard(deviceRegistrationAddress: "http://localhost:8571/tests/\(testId)", stepName: "didRegisterForRemoteNotificationsWithDeviceToken")

        /**
         * Address is provided through the environment variable.
         * Should setting it before running the app, because if we run it on a device,
         * it cannot be, ofc, 'localhost'.
         *
         * Go to 'Product' -> 'Scheme' -> 'Edit Scheme...' -> 'Run' -> 'Arguments' -> 'Environment Variables'
         */
        guard let deviceRegistrationAddress = ProcessInfo.processInfo.environment["DEVICE_REGISTRATION_ADDRESS"] else {
            
            print("Device Registration Address not found in the environment. Provide one in order to send a request containing the token.");
            return;
        }

        reportProgressToStepsGuard(deviceRegistrationAddress: deviceRegistrationAddress, stepName: "device_registration");

        let deviceTokenString = deviceToken.map { String(format: "%02.2hhx", $0) }.joined();
        print("DEVICE TOKEN IS: \(deviceTokenString)");
        logger.info("Device token registered: \(deviceTokenString)");
            logger.error("Device registration address not found in the environment. Provide one in order to send a request containing the token.");
        
        reportProgressToStepsGuard(deviceRegistrationAddress: deviceRegistrationAddress, stepName: "pre-apns-topic");

        guard let apnsTopic = Bundle.main.bundleIdentifier else {
            print("Could not get bundle identifier")
            logger.error("Could not get bundle identifier");
            return
        }
        
        reportProgressToStepsGuard(deviceRegistrationAddress: deviceRegistrationAddress, stepName: "post-apns-topic");
        
        registerDeviceWithServer(
            address: URL(string: deviceRegistrationAddress)!,
            token: deviceTokenString,
            apnsTopic: apnsTopic
        )
    }
    
    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("Failed to register for remote notifications: \(error)")
        logger.error("Failed to register for remote notifications: \(error.localizedDescription)");
        
        let testId = ProcessInfo.processInfo.environment["TEST_ID"] ?? "default-test-id";

        reportProgressToStepsGuard(deviceRegistrationAddress: "http://localhost:8571/tests/\(testId)", stepName: "registration-failure", metadata: ["error": error.localizedDescription]);
    }
    
    /**
     * This will apply when app is open and receives a notification..
     */
    func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any]) async -> UIBackgroundFetchResult {
        print("Received a notification", userInfo);
        logger.error("Received a notification");
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
