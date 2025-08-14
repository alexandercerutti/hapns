//
//  RemoteUpdatesPrintingActivityActor.swift
//  printing-application
//
//  Created by Alexander on 29/06/25.
//

import Foundation
import ActivityKit
import UIKit

class RemoteUpdatesPrintingActivityActor: PrintingActivityActor {
    private var timer = PrintingActivityTimer()

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

        let attributes = PrintingAttributes(
            printName: printName,
            estimatedDuration: estimatedPrintDuration,
            startTime: Date.now.timeIntervalSince1970
        )
        
        let initialState = PrintingAttributes.ContentState(
            progress: 0.0,
            statusMessage: "Starting local print..."
        )
        
        Task {
            let serverBaseURL = getServerBaseURLFromEnv()
            let serverPort = getServerPortFromEnv()

            guard let baseURL = URL(string: "\(serverBaseURL):\(serverPort)") else {
                fatalError("Cannot start task. Invalid server Base URL.")
            }

            let uuid = await UIDevice.current.identifierForVendor?.uuidString ?? ""
            let url = baseURL.appendingPathComponent("/print")
            var request = URLRequest(url: url)
            
            request.httpMethod = "POST"
            request.setValue(
                "application/json",
                forHTTPHeaderField: "Content-Type"
            )
            
            let json: [String: Any] = [
                "deviceId": uuid,
            ]
            
            request.httpBody = try JSONSerialization.data(withJSONObject: json)
            
            do {
                let (data, urlResponse) = try await URLSession.shared.data(for: request)
                print("Response from server:", urlResponse)
            } catch {}
        }
        
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
    
    private func terminateActivty(
        terminationMessage: String,
        lastProgress: Double
    ) async {
        timer.stop()

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
