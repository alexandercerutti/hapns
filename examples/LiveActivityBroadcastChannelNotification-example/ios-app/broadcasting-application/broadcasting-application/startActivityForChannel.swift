//
//  startActivityForChannel.swift
//  broadcasting-application
//
//  Created by Alexander on 17/08/25.
//

import Foundation
import UIKit.UIDevice
import ActivityKit

func startActivityForChannel(channelId: String, deviceId: String) async throws -> Void {
    let baseUrl = getServerBaseURLFromEnv()
    let serverPort = getServerPortFromEnv()
    
    guard let url = URL(string: "\(baseUrl):\(serverPort)/channels/\(channelId)/subscribe") else {
        fatalError("Invalid url for subscribing to channel updates.")
    }

    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    request.httpBody = try JSONSerialization.data(
        withJSONObject: [
            "deviceId": deviceId,
            "channelId": channelId,
        ],
        options: []
    )

    do {
        let (_, urlResponse) = try await URLSession.shared.data(for: request)
        print("Response from server:", urlResponse)
    } catch {
        print("Error subscribing to channel:", error)
    }
    
    do {
        let _ = try Activity<BroadcastActivityAttributes>.request(
            attributes: BroadcastActivityAttributes(
                homeTeam: "Warriors",
                awayTeam: "Lakers",
                gameType: "football",
                venue: "Any stadium",
                startTime: "Yesterday"
            ),
            content: ActivityContent(
                state: BroadcastActivityAttributes.ContentState(
                    homeScore: 0,
                    awayScore: 0,
                    quarter: 1,
                    status: "Game started",
                    lastPlay: "Tip-off!"
                ),
                staleDate: nil
            ),
            pushType: .channel(channelId)
        )
    } catch {
        print("Error starting activity:", error)
    }
}
