//
//  LocalPrintingActivityActor.swift
//  printing-application
//
//  Created by Alexander on 29/06/25.
//

import Foundation
import ActivityKit

class LocalPrintingActivityActor: PrintingActivityActor {
    private var timer = PrintingActivityTimer()
    let activityType: PrintingActivityType = .local
    
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
        
        do {
            printActivity = try Activity.request(
                attributes: attributes,
                content: ActivityContent(
                    state: initialState,
                    staleDate: nil
                ),
            )
        } catch {
            print("Error starting live activity: \(error)")
            return false
        }

        timer.start { [weak self] in
            if $0 >= self?.estimatedPrintDuration ?? 0 {
                await self?.endActivity()
                onActivityCompletion?()
                return
            }
            
            await self?.updateLiveActivity(
                progress: min($0 / (self?.estimatedPrintDuration ?? 1), 1.0)
            )
        }

        return true
    }
    
    private func terminateActivity(
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
        
        await self.terminateActivity(
            terminationMessage: "Print canceled",
            lastProgress: progress
        )
    }

    func endActivity() async {
        if printActivity == nil {
            print("No local printing activity to end")
            return
        }
        
        await self.terminateActivity(
            terminationMessage: "Print completed successfully!",
            lastProgress: 1.0
        )
    }
    
    func updateLiveActivity(progress: TimeInterval) async {
        let statusMessage = switch (progress) {
            case 0 ..< 0.3: "Heating bed and extruder..."
            case 0.3 ..< 0.6: "Printing base layers..."
            case 0.6 ..< 0.9: "Printing details..."
            default: "Finishing print..."
        }
        
        self.progress = progress
        
        let updatedState = ActivityContent(
            state: PrintingAttributes.ContentState(
                progress: progress,
                statusMessage: statusMessage
            ),
            staleDate: nil
        )
        
        await printActivity?.update(updatedState)
    }
}
