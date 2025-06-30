//
//  RemotePrintService.swift
//  printing-application
//
//  Created by Alexander on 28/06/25.
//

import Foundation
import ActivityKit

struct RemotePrintService {
    let tokenServiceEndpoint: String
    var updateTask: Task<Void, Error>?
    let baseURL: URL? = URL(string: "http://172.20.10.2:3000")
    
    init(tokenServiceEndpoint: String) {
        self.tokenServiceEndpoint = tokenServiceEndpoint
    }
    
    mutating func startService() async throws {
        if baseURL == nil {
            print("RemotePrintService: Base URL is not set or is not a valid URL.")
            return
        }
        
        guard let url = baseURL?.appendingPathComponent(tokenServiceEndpoint) else {
            print("RemotePrintService: Invalid endpoint URL.")
            return
        }
        
        updateTask = Task {
            /**
             * Push To Start (PTS) Tokens are required to allow starting Live Activities
             * through Push Notifications (event: "start").
             *
             * This might take a few seconds to be generated after starting the application.
             *
             * For updating and ending, you'll need the `pushTokenUpdates`
             * from the activity that has been started.
             */
            for await pushToken in Activity<PrintingAttributes>.pushToStartTokenUpdates {
                let pushTokenString = pushToken.reduce("") {
                    $0 + String(format: "%02x", $1)
                }

                print("New Push To Start Token issued:", pushTokenString)
            
                var request = URLRequest(url: url)
                request.httpMethod = "POST"
                request.setValue(
                    "application/json",
                    forHTTPHeaderField: "Content-Type"
                )
                
                let json: [String: String] = [
                    "token": pushTokenString,
                ]
                let jsonData = try! JSONSerialization.data(withJSONObject: json)

                request.httpBody = jsonData;
                
                let (data, urlResponse) = try await URLSession.shared.data(for: request)
                
                print("Response from server:", urlResponse)
            }
        }
    }
    
    mutating func stopService() {
        if updateTask == nil {
            return
        }
        
        updateTask?.cancel()
        updateTask = nil
    }
}
