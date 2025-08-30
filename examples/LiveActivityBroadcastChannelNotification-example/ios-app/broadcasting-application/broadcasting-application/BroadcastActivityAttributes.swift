//
//  BroadcastActivityAttributes.swift
//  broadcasting-application
//
//  Created by Alexander on 19/08/25.
//

import Foundation
import ActivityKit

struct BroadcastActivityAttributes: ActivityAttributes {
    var homeTeam: String
    var awayTeam: String
    var gameType: String
    var venue: String
    var startTime: String
    
    public struct ContentState: Codable, Hashable {
        var homeScore: Int
        var awayScore: Int
        var quarter: Int
        var status: String
        var lastPlay: String
    }
}
