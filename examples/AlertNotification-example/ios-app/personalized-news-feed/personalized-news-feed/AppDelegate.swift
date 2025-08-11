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

        guard let apnsTopic = Bundle.main.bundleIdentifier else {
            print("Could not get bundle identifier")
            return
        }
        
        registerDeviceWithServer(
            address: URL(string: deviceRegistrationAddress)!,
            token: deviceTokenString,
            apnsTopic: apnsTopic
        )
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
