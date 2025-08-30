//
//  BroadcastChannelManager.swift
//  broadcasting-application
//
//  Created by Alexander on 17/08/25.
//

import Foundation
import ActivityKit
import UIKit.UIDevice

class SubscriptionManager {
    public let deviceId = UIDevice.current.identifierForVendor?.uuidString ?? ""
    
    init() {
        Task {
            await self.observePushToStartTokenUpdates()
        }
    }
    
    func observePushToStartTokenUpdates() async {
        let baseUrl = getServerBaseURLFromEnv()
        let port = getServerPortFromEnv()
        
        guard let url = URL(string: "\(baseUrl):\(port)/registration") else {
            fatalError("SubscriptionManager: Invalid endpoint URL.")
        }
        
        if Activity<BroadcastActivityAttributes>.pushToStartToken != nil, Activity<BroadcastActivityAttributes>.pushToStartToken?.isEmpty == false {

            let pushTokenString = Activity<BroadcastActivityAttributes>.pushToStartToken?.reduce("") {
                $0 + String(format: "%02x", $1)
            }
                
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue(
                "application/json",
                forHTTPHeaderField: "Content-Type"
            )

            let json: [String: String] = [
                "deviceId": self.deviceId,
                "pushToStartToken": pushTokenString ?? "",
            ]

            let jsonData = try! JSONSerialization.data(withJSONObject: json)

            request.httpBody = jsonData;
            
            do {
                let (_, urlResponse) = try await URLSession.shared.data(for: request)
                print("Response from server:", urlResponse)
            } catch {}
        }

        /**
         * Push To Start (PTS) Tokens are required to allow starting Live Activities
         * through Push Notifications (event: "start").
         *
         * This might take a few seconds to be generated after starting the application.
         *
         * For updating and ending, you'll need the `pushTokenUpdates`
         * from the activity that has been started.
         */
        for await pushToken in Activity<BroadcastActivityAttributes>.pushToStartTokenUpdates {
            let pushTokenString = pushToken.reduce("") {
                $0 + String(format: "%02x", $1)
            }

            print("New Push To Start Token issued:", pushTokenString);
            
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue(
                "application/json",
                forHTTPHeaderField: "Content-Type"
            )
            
            let json: [String: String] = [
                "deviceId": await UIDevice.current.identifierForVendor?.uuidString ?? "",
                "pushToStartToken": pushTokenString,
            ]
            let jsonData = try! JSONSerialization.data(withJSONObject: json)

            request.httpBody = jsonData;
            
            do {
                let (_, urlResponse) = try await URLSession.shared.data(for: request)
                print("Response from server:", urlResponse)
            } catch {}
        }
    }
}
