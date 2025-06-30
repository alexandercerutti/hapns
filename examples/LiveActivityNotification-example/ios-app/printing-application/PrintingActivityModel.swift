/**
 * Example took from CreateWithSwift, and entirely manually rewrote
 * @see https://www.createwithswift.com/implementing-live-activities-in-a-swiftui-app/
 */

import ActivityKit
import Foundation

@Observable
/** We have to use class in order to use @Observable */
class PrintingActivityViewModel {
    private var printingActivityActor: PrintingActivityActor?
    
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
