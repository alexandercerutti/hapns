/**
 * Example took, manually rewrote and updated from CreateWithSwift
 * @see https://www.createwithswift.com/implementing-live-activities-in-a-swiftui-app/
 */

import ActivityKit
import Foundation

@Observable
/** We have to use class in order to use @Observable */
class PrintingActivityViewModel {
    let printDuration: TimeInterval = 60
    var printName = "Benchy Boat"
    var progress: Double = 0
    var printActivity: Activity<PrintingAttributes>? = nil
    
    init(printName: String = "Benchy Boat", progress: Double = 0, printActivity: Activity<PrintingAttributes>? = nil) {
        self.printName = printName
        self.progress = progress
        self.printActivity = printActivity
        
        var lastPushToStartTokenString: String = "";
        
        Task {
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
                
                if (lastPushToStartTokenString != pushTokenString) {
                    print("New Push To Start Token issued:", pushTokenString);
                    lastPushToStartTokenString = pushTokenString
                }
            }
        }
        
        Task {
            for await activityData in Activity<PrintingAttributes>.activityUpdates {
                print("New activity update", activityData);
                
                for await tokenData in activityData.pushTokenUpdates {
                    let token = tokenData.map { String(format: "%02x", $0) }.joined()
                    print("[UPDATE] PrintingAttributes [\(activityData)] : \(token)")
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
    
    func startLiveActivity(_ pushType: PushType? = nil) {
        progress = 0
        
        print("Start Date:", Date.now)
        
        let attributes = PrintingAttributes(
            printName: printName,
            estimatedDuration: printDuration,
            startTime: Date.now.timeIntervalSince1970
        )
        
        let initialState = PrintingAttributes.ContentState(
            progress: 0.0,
            statusMessage: "Starting print..."
        )
        
        do {
            printActivity = try Activity.request(
                attributes: attributes,
                content: ActivityContent(
                    state: initialState,
                    staleDate: nil
                ),
                pushType: pushType
            )
            
            if (pushType == .token && printActivity != nil) {
                Task {
                    for await pushToken in printActivity!.pushTokenUpdates {
                        let pushTokenString = pushToken.reduce("") {
                              $0 + String(format: "%02x", $1)
                        }
                        
                        print("New PUSH TOKEN for the current Live Activity:", pushTokenString)
                    }
                }
            }
        } catch {
            print("Error starting live activity: \(error)")
        }
    }
    
    func updateLiveActivity() {
        let statusMessage = switch (progress) {
            case 0 ..< 0.3: "Heating bed and extruder..."
            case 0.3 ..< 0.6: "Printing base layers..."
            case 0.6 ..< 0.9: "Printing details..."
            default: "Finishing print..."
        }
        
        let updatedState = ActivityContent(
            state: PrintingAttributes.ContentState(
                progress: progress,
                statusMessage: statusMessage
            ),
            staleDate: nil
        )
        
        Task {
            await printActivity?.update(updatedState)
        }
    }
    
    func endLiveActivity(success: Bool = false) {
        let finalMessage = success ? "Print completed successfuly!" : "Print canceled"
        
        let finalState = PrintingAttributes.ContentState(
            progress: success ? 1.0 : progress,
            statusMessage: finalMessage
        )
        
        Task {
            await printActivity?.end(
                ActivityContent(
                    state: finalState,
                    staleDate: nil
                ),
                dismissalPolicy: .default
            )
        }
    }
}
