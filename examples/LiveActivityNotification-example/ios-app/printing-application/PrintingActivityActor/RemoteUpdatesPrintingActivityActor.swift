//
//  RemoteUpdatesPrintingActivityActor.swift
//  printing-application
//
//  Created by Alexander on 29/06/25.
//

import Foundation
import ActivityKit

class RemoteUpdatesPrintingActivityActor: PrintingActivityActor {
    private var timer = PrintingActivityTimer()
    private var tokenRetrieveTask: Task<Void, Error>? = nil
    private let baseURL: URL? = URL(string: "http://172.20.10.4:3000")
    private let deviceTokenUpdateEndpoint: String = "/device-token-update"

    let activityType: PrintingActivityType = .remoteUpdates
    
    var elapsedTime: TimeInterval {
        timer.elapsedTime
    }
    
    var estimatedPrintDuration: TimeInterval = 60
    var progress: Double = 0
    var printName = "Benchy Boat"
    var printActivity: Activity<PrintingAttributes>? = nil

    func startActivity(onActivityCompletion: (() -> Void)?) -> Bool {
        progress = 0
        print("Start Date:", Date.now)
        
        if baseURL == nil {
            print("RemotePrintService: Base URL is not set or is not a valid URL.")
            return false
        }
        
        guard let url = baseURL?.appendingPathComponent(deviceTokenUpdateEndpoint) else {
            print("RemotePrintService: Invalid endpoint URL.")
            return false
        }

        tokenRetrieveTask = startPushTokenRetrieveTask(url: url)
        
        let attributes = PrintingAttributes(
            printName: printName,
            estimatedDuration: estimatedPrintDuration,
            startTime: Date.now.timeIntervalSince1970
        )
        
        let initialState = PrintingAttributes.ContentState(
            progress: 0.0,
            statusMessage: "Starting local print..."
        )
        
        do {
            printActivity = try Activity.request(
                attributes: attributes,
                content: ActivityContent(
                    state: initialState,
                    staleDate: nil
                ),
                pushType: .token
            )
        } catch {
            print("Error starting live activity: \(error)")
            return false
        }

        timer.start()
        return true
    }
    
    private func startPushTokenRetrieveTask(url: URL) -> Task<Void, Error> {
        return Task {
            for await activityData in Activity<PrintingAttributes>.activityUpdates {
                print("New activity update", activityData);

                for await tokenData in activityData.pushTokenUpdates {
                    let token = tokenData.map { String(format: "%02x", $0) }.joined()
                    print("[UPDATE] PrintingAttributes [\(activityData)] : \(token)")
                    
                    var request = URLRequest(url: url)
                    request.httpMethod = "POST"
                    request.setValue(
                        "application/json",
                        forHTTPHeaderField: "Content-Type"
                    )
                    
                    let json: [String: String] = [
                        "token": token,
                    ]
                    let jsonData = try! JSONSerialization.data(withJSONObject: json)

                    request.httpBody = jsonData;
                    
                    let (data, urlResponse) = try await URLSession.shared.data(for: request)
                    
                    print("Response from server:", urlResponse)
                }

                for await stateUpdate in activityData.activityStateUpdates {
                    print("[STATE] PrintingAttributes [\(activityData)] : \(stateUpdate)")
                }

                for await newContent in activityData.contentUpdates {
                    print("[CONTENT] PrintingAttributes [\(activityData)] : \(newContent)")
                }
            }
        }
    }
    
    private func terminateActivty(
        terminationMessage: String,
        lastProgress: Double
    ) async {
        timer.stop()
        tokenRetrieveTask?.cancel()
        tokenRetrieveTask = nil
        
        let finalState = PrintingAttributes.ContentState(
            progress: lastProgress,
            statusMessage: terminationMessage
        )
        
        await printActivity?.end(
            ActivityContent(
                state: finalState,
                staleDate: nil
            ),
            dismissalPolicy: .default
        )
        
        printActivity = nil
    }
    
    func cancelActivity() async {
        if printActivity == nil {
            print("No local printing activity to abruptly end")
            return
        }

        await self.terminateActivty(
            terminationMessage: "Print canceled",
            lastProgress: progress
        )
    }

    func endActivity() async {
        if printActivity == nil {
            print("No local printing activity to end")
            return
        }

        await self.terminateActivty(
            terminationMessage: "Print completed successfully!",
            lastProgress: 1.0
        )
    }
}
