/**
 * Example took from CreateWithSwift, and entirely manually rewrote
 * @see https://www.createwithswift.com/implementing-live-activities-in-a-swiftui-app/
 */

import ActivityKit
import Foundation
import UIKit

@Observable
/** We have to use class in order to use @Observable */
class PrintingActivityViewModel {
    private var printingActivityActor: PrintingActivityActor?
    private var deviceRegistrationTask: Task<Void, Never>?
    private let baseURL: URL? = URL(string: "http://192.168.1.89:3000")
    private let registerDeviceEndpoint: String = "/register-device"
    
    var activityType: PrintingActivityType {
        printingActivityActor?.activityType ?? .none
    }
    
    var elapsedTime: TimeInterval {
        printingActivityActor?.elapsedTime ?? 0
    }
    
    var printName: String {
        printingActivityActor?.printName ?? ""
    }
    
    var estimatedPrintDuration: TimeInterval {
        printingActivityActor?.estimatedPrintDuration ?? 0
    }
    
    var progress: Double {
        printingActivityActor?.progress ?? 0
    }
    
    init() {
        deviceRegistrationTask = Task {
            await startDeviceRegistration()
        }
    }
    
    deinit {
        deviceRegistrationTask?.cancel()
    }
    
    private func startDeviceRegistration() async {
        guard let url = self.baseURL?.appendingPathComponent(self.registerDeviceEndpoint) else {
            print("RemotePrintService: Invalid endpoint URL.")
            return
        }

        await withTaskGroup(of: Void.self) { group in
            group.addTask {
                /**
                 * Checking if a push to start token is already available.
                 */
                if Activity<PrintingAttributes>.pushToStartToken != nil, Activity<PrintingAttributes>.pushToStartToken?.isEmpty == false {
                    let pushTokenString = Activity<PrintingAttributes>.pushToStartToken?.reduce("") {
                        $0 + String(format: "%02x", $1)
                    }
                        
                    var request = URLRequest(url: url)
                    request.httpMethod = "POST"
                    request.setValue(
                        "application/json",
                        forHTTPHeaderField: "Content-Type"
                    )

                    let json: [String: String] = [
                        "deviceId": await UIDevice.current.identifierForVendor?.uuidString ?? "",
                        "pushToStartToken": pushTokenString ?? "",
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
                        "deviceId": await UIDevice.current.identifierForVendor?.uuidString ?? "",
                        "pushToStartToken": pushTokenString,
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
                            "deviceId": await UIDevice.current.identifierForVendor?.uuidString ?? "",
                            "deviceToken": token,
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
        }
    }
    
    func startActivity(type: PrintingActivityType, onActivityCompletion: (() -> Void)? = nil) -> Bool {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            print("Activities are not enabled.")
            return false
        }

        if printingActivityActor != nil {
            print("Printing activity already started")
            return false
        }
        
        switch type {
            case .local:
                printingActivityActor = LocalPrintingActivityActor()
            case .remoteUpdates:
                printingActivityActor = RemoteUpdatesPrintingActivityActor()
            case .remoteStart:
                printingActivityActor = RemotePrintingActivityActor()
            case .none:
                print("Cannot start activity of type none")
                return false
        }
        
        return printingActivityActor?.startActivity {
            self.printingActivityActor = nil
            onActivityCompletion?()
        } ?? false
    }
    
    func endActivity(success: Bool = false) async {
        if printingActivityActor == nil {
            print("No printing activity to end")
            return
        }

        if success {
            await printingActivityActor?.endActivity()
        } else {
            await printingActivityActor?.cancelActivity()
        }
        
        printingActivityActor = nil
    }
}
