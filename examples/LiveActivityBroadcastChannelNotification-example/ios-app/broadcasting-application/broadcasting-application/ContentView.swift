//
//  ContentView.swift
//  broadcasting-application
//
//  Created by Alexander on 16/08/25.
//

import SwiftUI
import UIKit.UIDevice

struct BroadcastChannel: Identifiable, Equatable {
    let id: String
    let name: String
}

struct ContentView: View {
    @State private var broadcastChannels: [BroadcastChannel] = []
    @State private var selectedChannel: BroadcastChannel? = nil
    private let subscriptionManager = SubscriptionManager()

    var body: some View {
        VStack(spacing: 20) {
            if broadcastChannels.isEmpty {
                GeometryReader { geometry in
                    ScrollView(.vertical) {
                        VStack {
                            Text("No Broadcast Channels Available.")
                            Text("Create some by interacting with the server. Then pull to refresh")
                        }
                        .padding()
                        .multilineTextAlignment(.center)
                        .foregroundColor(.gray)
                        .font(.headline)
                        .frame(width: geometry.size.width)
                        .frame(minHeight: geometry.size.height)
                    }
                    .refreshable {
                        fetchChannels()
                    }
                }
            } else {
                List(broadcastChannels) { item in
                    let itemSelected = item == selectedChannel
                    
                    VStack(alignment: .leading, ) {
                        Text(item.name)
                            .foregroundColor(itemSelected ? .white : .black)
                        Text(item.id)
                            .font(.caption)
                            .foregroundColor(itemSelected ? .white : .black)

                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                    .contentShape(Rectangle())
                    .onTapGesture {
                        selectedChannel = item
                        print("Selected channel: \(item.name) with ID: \(item.id)")
                        
                        let deviceId = subscriptionManager.deviceId
                        
                        Task {
                            try await startActivityForChannel(
                                channelId: item.id,
                                deviceId: deviceId,
                            )
                        }
                    }
                    .listRowBackground(itemSelected ? Color.blue.opacity(0.5) : .white)
                }
                Text("Select a Broadcast Channel. Pull to refresh")
                    .foregroundColor(.listText)
            }
        }
        .onAppear {
            fetchChannels()
        }
        .refreshable {
            fetchChannels()
        }
    }
    
    func fetchChannels() {
        Task {
            let channels = try await fetchAvailableBroadcastChannels()

            broadcastChannels = channels
        }
    }
}

#Preview {
    ContentView()
}
