//
//  RemotePrintingActivityActor.swift
//  printing-application
//
//  Created by Alexander on 29/06/25.
//

import Foundation
import ActivityKit
import UIKit

class RemotePrintingActivityActor: PrintingActivityActor {
    private var timer = PrintingActivityTimer()
    let activityType: PrintingActivityType = .remoteStart

    var elapsedTime: TimeInterval {
        timer.elapsedTime
    }
    
    var estimatedPrintDuration: TimeInterval = 0
    var progress: Double = 0
    var printName = "Benchy Boat"
    var printActivity: Activity<PrintingAttributes>? = nil

    func startActivity(onActivityCompletion: (() -> Void)?) -> Bool {
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
