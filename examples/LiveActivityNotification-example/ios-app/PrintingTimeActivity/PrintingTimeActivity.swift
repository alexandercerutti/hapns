/**
 * Example took, manually rewrote and updated from CreateWithSwift
 * @see https://www.createwithswift.com/implementing-live-activities-in-a-swiftui-app/
 */

import SwiftUI
import WidgetKit
import ActivityKit

struct PrintingTimeActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: PrintingAttributes.self) { context in
            /**
             * Defined below
             */
            LiveActivityView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: "printer.fill")
                        .padding()
                }
                
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Elapsed")
                        .font(.footnote)
                        .padding(.trailing)
                        .frame(alignment: .leading)
                    Text(Date(timeIntervalSince1970: context.attributes.startTime), style: .timer)
                        .monospacedDigit()
                        .multilineTextAlignment(.trailing) // omg
                        .padding(.trailing)
                }
                
                DynamicIslandExpandedRegion(.center) {
                    VStack(){
                        Text(context.state.statusMessage)
                            .fixedSize(horizontal: true, vertical: true)
                            .bold()
                    }
                }
                
                DynamicIslandExpandedRegion(.bottom) {
                    Gauge(value: context.state.progress) {
                    } currentValueLabel: {
                        Text("\(Int(context.state.progress * 100))%")
                    }
                    .gaugeStyle(.accessoryLinear)
                    .padding(.vertical, 24)
                }
                
            } compactLeading: {
                Image(systemName: "printer.fill")
                    
            } compactTrailing: {
                Text("\(Int(context.state.progress * 100))%")
                    
            } minimal: {
                Image(systemName: "printer.fill")
            }
        }
    }
}

struct LiveActivityView: View {
    let context: ActivityViewContext<PrintingAttributes>
    
    var body: some View {
        VStack {
            HStack {
                Image(systemName: "printer.fill")
                    .font(.title2)
                
                VStack(alignment: .leading) {
                    Text("3D Printing")
                        .font(.headline)
                    Text(context.attributes.printName)
                        .font(.subheadline)
                }
                
                Spacer()

                HStack(alignment: .center) {
                    VStack(alignment: .trailing) {
                        Text("Elapsed")
                            .font(.footnote)
                            .foregroundColor(.secondary)
                        Text(Date(timeIntervalSince1970: context.attributes.startTime), style: .timer)
                            .font(.footnote)
                            .monospacedDigit()
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.trailing) // omg
                    }

                    VStack(alignment: .trailing) {
                        Text("Estimated")
                            .font(.footnote)
                            .foregroundColor(.secondary)
                        Text(timeString(from: context.attributes.estimatedDuration))
                            .font(.footnote)
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            Gauge(value: context.state.progress) {
                EmptyView()
            } currentValueLabel: {
                Text("\(Int(context.state.progress * 100))%")
            }
            .gaugeStyle(.accessoryLinear)
            .tint(.blue)
            
            Text(context.state.statusMessage)
                .font(.callout)
                .multilineTextAlignment(.center)
        }
        .padding()
    }
}

func timeString(from seconds: TimeInterval) -> String {
    let minutes = Int(seconds) / 60
    let seconds = Int(seconds) % 60
    return String(format: "%02d:%02d", minutes, seconds)
}

#Preview(as: .dynamicIsland(.expanded), using: PrintingAttributes.init(printName: "Benchy", estimatedDuration: 20, startTime: Date().timeIntervalSince1970)) {
    PrintingTimeActivity()
} contentStates: {
    PrintingAttributes.ContentState(progress: 0.5, statusMessage: "Printing...")
    PrintingAttributes.ContentState(progress: 0.5, statusMessage: "Heating bed and extruder...")
}


