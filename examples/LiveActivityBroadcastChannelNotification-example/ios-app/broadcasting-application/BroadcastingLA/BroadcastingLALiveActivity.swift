//
//  BroadcastingLALiveActivity.swift
//  BroadcastingLA
//
//  Created by Alexander on 18/08/25.
//

import ActivityKit
import WidgetKit
import SwiftUI

struct BroadcastingLALiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: BroadcastActivityAttributes.self) { context in

            LiveActivityView(context: context)
                // This gives the translucent effect on the bottom part
                .activityBackgroundTint(Color.widgetBackground.opacity(0.4))

        } dynamicIsland: { context in
						DynamicIsland {
                // Expanded UI goes here.  Compose the expanded UI through
                // various regions, like leading/trailing/center/bottom
							DynamicIslandExpandedRegion(.leading) {
                    Text("Leading")
                }
								DynamicIslandExpandedRegion(.trailing) {
                    Text("Trailing")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Bottom")
                    // more content
                }
            } compactLeading: {
                Text("L")
            } compactTrailing: {
                Text("T ")
            } minimal: {
                Text("mm")
            }
            .widgetURL(URL(string: "http://www.apple.com"))
            .keylineTint(Color.red)
            .contentMargins(.trailing, 8, for: .expanded)
            .contentMargins(.all, 40, for: .expanded)
        }
    }
}

struct LiveActivityView: View {
    let context: ActivityViewContext<BroadcastActivityAttributes>
    
    var body: some View {
        VStack {
            HStack {
                // Away Team
                HStack {
                    Image(systemName: "star.fill")
                        .resizable()
                        .foregroundStyle(.laTextcolor)
                        .aspectRatio(contentMode: .fit)
                    .frame(width: 30, height: 30)
                    
                    VStack {
                        Text(context.attributes.awayTeam)
                            .font(.caption)
                            .foregroundColor(.laTextcolor)
                        Text("\(context.state.awayScore)")
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(.laTextcolor)
                    }
                }
                
                Spacer()
                
                // Game Status
                VStack {
                    HStack {
                        Image(systemName: "arrow.down.circle.fill")
                            .foregroundColor(.gray)
                        Text("7th")
                            .font(.caption)
                            .foregroundColor(.gray)
                        Image(systemName: "diamond.fill")
                            .foregroundColor(.gray)
                        Text("0-0")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                }
                
                Spacer()
                
                // Home Team
                HStack {
                    VStack {
                        Text(context.attributes.homeTeam)
                            .font(.caption)
                            .foregroundColor(.laTextcolor)
                        Text("\(context.state.homeScore)")
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(.laTextcolor)
                    }
                    Image(systemName: "star.fill")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                    .frame(width: 30, height: 30)
                }
            }
            .padding(.horizontal)
            .padding(.vertical)
            .background(.laMainBackground)

            HStack {
                Text("\(context.state.lastPlay)")
                    .font(.caption)
                    .foregroundColor(.laTextcolor)
                    .multilineTextAlignment(.leading)
                
                Spacer()
                
                Rectangle()
                    .fill(Color.orange)
                    .frame(width: 4, height: 40)
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
    }
}

#Preview(
    "Notification",
    as: .content,
    using: BroadcastActivityAttributes.init(
        homeTeam: "Test 1",
        awayTeam: "Test 2",
        gameType: "Football",
        venue: "Test Stadium",
        startTime: "2025-08-18T12:00:00Z",
    )
) {
   BroadcastingLALiveActivity()
} contentStates: {
    BroadcastActivityAttributes.ContentState(
        homeScore: 1,
        awayScore: 2,
        quarter: 2,
        status: "Playing",
        lastPlay: "dunno"
    )
}
