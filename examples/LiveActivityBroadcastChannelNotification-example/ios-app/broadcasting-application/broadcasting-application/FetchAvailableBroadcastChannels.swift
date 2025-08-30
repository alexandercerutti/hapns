//
//  FetchAvailableBroadcastChannels.swift
//  broadcasting-application
//
//  Created by Alexander on 16/08/25.
//

import Foundation

struct ChannelResponseItem: Codable {
    let channelId: String
    let name: String
}

func fetchAvailableBroadcastChannels() async throws -> [BroadcastChannel] {
    let baseURL = getServerBaseURLFromEnv()
    let port = getServerPortFromEnv()
    
    guard let url = URL(string: "\(baseURL):\(port)/channels") else {
        fatalError("Invalid URL for fetching broadcast channels.")
    }
    
    var urlRequest = URLRequest(url: url)
    urlRequest.httpMethod = "GET"
    
    let (data, response) = try await URLSession.shared.data(for: urlRequest)
    
    if (response as? HTTPURLResponse)?.statusCode != 200 {
        throw URLError(.badServerResponse)
    }
    
    let decoder = JSONDecoder()
    do {
        let channelItems = try decoder.decode([ChannelResponseItem].self, from: data)
        return channelItems.map { BroadcastChannel(id: $0.channelId, name: $0.name) }
    } catch {
        print("Failed to decode channel response: \(error.localizedDescription)")
    }
    
    return []
}

