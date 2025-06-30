//
//  ContentView.swift
//  printing-application
//
//  Created by Alexander on 05/06/25.
//

import SwiftUI
import ActivityKit

struct ContentView: View {
    @State var viewModel = PrintingActivityViewModel()
    @State private var isRemoteStartingPrintingEnabled = false
    
    var isLocalPrinting: Binding<Bool> {
        Binding<Bool>(
            get: { viewModel.activityType == .local },
            set: { _ in
            }
        )
    }
    
    var isRemotePrinting: Binding<Bool> {
        Binding<Bool>(
            get: { viewModel.activityType == .remoteStart || viewModel.activityType == .remoteUpdates },
            set: { _ in
            }
        )
    }

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "printer.fill.and.paper.fill")
                .font(.system(size: 80))
                .foregroundColor(viewModel.activityType != .none ? .blue : .gray)
            
            Text(viewModel.activityType != .none ? "Printing in progress..." : "Ready to print")
                .font(.title)
                .fontWeight(.bold)
            
            if viewModel.activityType != .none {
                VStack(spacing: 15) {
                    Text("Printing: \(viewModel.printName)")
                        .font(.headline)
                    
                    HStack {
                        Text(String(format: "%02d:%02d", Int(viewModel.elapsedTime) / 60, Int(viewModel.elapsedTime) % 60))
                        Text("/")
                        Text(String(format: "%02d:%02d", Int(viewModel.estimatedPrintDuration) / 60, Int(viewModel.estimatedPrintDuration) % 60))
                    }
                    
                    Gauge(value: viewModel.progress) {
                        Text("Progress")
                    } currentValueLabel: {
                        Text("\(Int(viewModel.progress * 100))%")
                    }
                    .gaugeStyle(.accessoryLinear)
                    .tint(.blue)
                }
                .padding()
                .background(RoundedRectangle(cornerRadius: 12).fill(Color(.systemBackground)))
                .shadow(radius: 3)
            }

            PrintActionButton(title: viewModel.activityType == .local ? "Stop local printing" : "Start local printing", isActive: isLocalPrinting, backgroundColor: .yellow) {
                if (viewModel.activityType == .local) {
                    stopPrint()
                } else if (viewModel.activityType == .none) {
                    viewModel.startActivity(type: .local)
                }
            }
            .disabled(viewModel.activityType == .remoteStart || viewModel.activityType == .remoteUpdates)
            
            Divider()
            
            PrintActionButton(title: viewModel.activityType == .remoteStart || viewModel.activityType == .remoteUpdates ? "Stop remote printing" : "Start remote print", isActive: isRemotePrinting, backgroundColor: .blue) {
                if (viewModel.activityType == .remoteStart || viewModel.activityType == .remoteUpdates) {
                    stopPrint()
                } else if (viewModel.activityType == .none) {
                    if (isRemoteStartingPrintingEnabled) {
                        startRemotelyActivatedPrint()
                        return
                    }

                    viewModel.startActivity(type: .remoteUpdates)
                }
            }
            .disabled(viewModel.activityType == .local)
            
            Toggle("Enable remote start", isOn: $isRemoteStartingPrintingEnabled)
                .toggleStyle(.switch)
                .disabled(viewModel.activityType != .none)
        }
        .padding()
    }
    
    func stopPrint(success: Bool = false) {
        Task {
            print("View Model activity type is", viewModel.activityType)
            await viewModel.endActivity(success: success)
            print("View Model activity type is", viewModel.activityType)
        }
    }
    
    func startRemotelyActivatedPrint() -> Bool {
        return viewModel.startActivity(type: .remoteStart)
    }
    
    func sendRemoteRequest(url: URL) async throws {
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        
        let (data, urlResponse) = try await URLSession.shared.data(for: request)
        
        print("Response from server:", urlResponse)
        
        if let responseString = String(data: data, encoding: .utf8) {
            print("Response from server: \(responseString)")
        } else {
            print("Failed to decode response")
        }
    }
}

#Preview {
    ContentView()
}
