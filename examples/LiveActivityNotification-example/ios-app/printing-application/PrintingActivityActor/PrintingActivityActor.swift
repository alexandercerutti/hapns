//
//  PrintActivityActor.swift
//  printing-application
//
//  Created by Alexander on 29/06/25.
//

enum PrintingActivityType {
    case none
    case local
    case remoteUpdates
    case remoteStart
}

protocol PrintingActivityActor {
    var activityType: PrintingActivityType { get }
    var elapsedTime: Double { get }
    var printName: String { get }
    var estimatedPrintDuration: Double { get }
    var progress: Double { get }
    
    mutating func startActivity(onActivityCompletion: (() -> Void)?) -> Bool
    mutating func cancelActivity() async -> Void
    mutating func endActivity() async -> Void
}

