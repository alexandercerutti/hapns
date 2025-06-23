//
//  ContentView.swift
//  printing-application
//
//  Created by Alexander on 05/06/25.
//

import SwiftUI
import ActivityKit

enum PrintActivity {
    case local
    case remote
    case none
}

struct ContentView: View {
    @State private var printActivity: PrintActivity = .none;
    @State var viewModel = PrintingActivityViewModel()
    @ObservedObject var timer = PrintingActivityTimer()
    
    var isLocalPrinting: Binding<Bool> {
        Binding<Bool>(
            get: { printActivity == .local },
            set: { _ in
            }
        )
    }
    
    var isRemotePrinting: Binding<Bool> {
        Binding<Bool>(
            get: { printActivity == .remote },
            set: { _ in
            }
        )
    }

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "printer.fill.and.paper.fill")
                .font(.system(size: 80))
                .foregroundColor(printActivity != .none ? .blue : .gray)
            
            Text(printActivity != .none ? "Printing in progress..." : "Ready to print")
                .font(.title)
                .fontWeight(.bold)
            
            if printActivity != .none {
                VStack(spacing: 15) {
                    Text("Printing: \(viewModel.printName)")
                        .font(.headline)
                    
                    HStack {
                        Text(String(format: "%02d:%02d", Int(timer.elapsedTime) / 60, Int(timer.elapsedTime) % 60))
                        Text("/")
                        Text(String(format: "%02d:%02d", Int(viewModel.printDuration) / 60, Int(viewModel.printDuration) % 60))
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

            PrintActionButton(title: printActivity == .local ? "Stop local printing" : "Start local printing", isActive: isLocalPrinting, backgroundColor: .yellow) {
                if (printActivity == .local) {
                    stopPrint()
                } else if (printActivity == .none) {
                    startLocalPrint()
                }
            }
            .disabled(printActivity == .remote)
            
            PrintActionButton(title: printActivity == .remote ? "Stop remote printing" : "Start remote print", isActive: isRemotePrinting, backgroundColor: .blue) {
                if (printActivity == .remote) {
                    stopPrint()
                } else if (printActivity == .none) {
                    startRemotePrint()
                }
            }
            .disabled(printActivity == .local)
            
        }
        .padding()
    }
    
    func startLocalPrint() {
        printActivity = .local
        viewModel.startLiveActivity(.none)

        timer.start {
            viewModel.updateLiveActivity(
                progress: min($0 / viewModel.printDuration, 1.0)
            )
            
            if $0 >= viewModel.printDuration {
                stopPrint(success: true)
            }
        }
    }
    
    func startRemotePrint() {
        printActivity = .remote
        viewModel.startLiveActivity(.token)
        timer.start()
    }
    
    func stopPrint(success: Bool = false) {
        printActivity = .none
        timer.stop()
        viewModel.endLiveActivity(success: success)
    }
}

#Preview {
    ContentView()
}
