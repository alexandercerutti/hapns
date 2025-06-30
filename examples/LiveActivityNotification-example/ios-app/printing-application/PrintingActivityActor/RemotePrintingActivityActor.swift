//
//  RemotePrintingActivityActor.swift
//  printing-application
//
//  Created by Alexander on 29/06/25.
//

import Foundation
import ActivityKit

class RemotePrintingActivityActor: PrintingActivityActor {
    private var timer = PrintingActivityTimer()
    let activityType: PrintingActivityType = .remoteStart
    private let baseURL: URL? = URL(string: "http://172.20.10.4:3000")
    private let deviceTokenUpdateEndpoint: String = "/device-token-update"
    private let pushToStartTokenEndpoint: String = "/push-to-start-token"
    
    var elapsedTime: TimeInterval {
        timer.elapsedTime
    }
    
    var estimatedPrintDuration: TimeInterval = 0
    var progress: Double = 0
    var printName = "Benchy Boat"
    var printActivity: Activity<PrintingAttributes>? = nil
    
    init() {
        Task {
            let task = await startPushTokenRetrieveTask()
        }
    }

    func startActivity(onActivityCompletion: (() -> Void)?) -> Bool {
        timer.start()
        
        if baseURL == nil {
            print("RemotePrintService: Base URL is not set or is not a valid URL.")
            return false
        }
        
        return true
    }
    
    private func startPushTokenRetrieveTask() async -> TaskGroup<Void> {
        return await withTaskGroup(of: Void.self) { group in
            group.addTask {
                guard let url = self.baseURL?.appendingPathComponent(self.pushToStartTokenEndpoint) else {
                    print("RemotePrintService: Invalid endpoint URL.")
                    return
                }
                
                if Activity<PrintingAttributes>.pushToStartToken != nil, Activity<PrintingAttributes>.pushToStartToken?.isEmpty == false {
                    let pushTokenString = Activity<PrintingAttributes>.pushToStartToken?.reduce("") {
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
                        "token": pushTokenString!,
                    ]
                    let jsonData = try! JSONSerialization.data(withJSONObject: json)

                    request.httpBody = jsonData;
                    
                    do {
                        let (data, urlResponse) = try await URLSession.shared.data(for: request)
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
                for await pushToken in Activity<PrintingAttributes>.pushToStartTokenUpdates {
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
                        "token": pushTokenString,
                    ]
                    let jsonData = try! JSONSerialization.data(withJSONObject: json)

                    request.httpBody = jsonData;
                    
                    do {
                        let (data, urlResponse) = try await URLSession.shared.data(for: request)
                        print("Response from server:", urlResponse)
                    } catch {}
                }
            }
            
            group.addTask {
                guard let url = self.baseURL?.appendingPathComponent(self.deviceTokenUpdateEndpoint) else {
                    print("RemotePrintService: Invalid endpoint URL.")
                    return
                }
                
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
                        
                        do {
                            let (data, urlResponse) = try await URLSession.shared.data(for: request)
                            print("Response from server:", urlResponse)
                        } catch {}
                    }

                    for await stateUpdate in activityData.activityStateUpdates {
                        print("[STATE] PrintingAttributes [\(activityData)] : \(stateUpdate)")
                    }

                    for await newContent in activityData.contentUpdates {
                        print("[CONTENT] PrintingAttributes [\(activityData)] : \(newContent)")
                    }
                }
            }
            
            return group
        }
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
