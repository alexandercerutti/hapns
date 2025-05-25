//
//  AppDelegate.swift
//  personalized-news-feed
//
//  Created by Alexander on 25/05/25.
//

import UIKit
import UserNotifications

@MainActor
class AppDelegate: NSObject, UIApplicationDelegate  {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
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
}
