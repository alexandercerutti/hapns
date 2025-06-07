/**
 * Example took and manually rewrote from CreateWithSwift
 * @see https://www.createwithswift.com/implementing-live-activities-in-a-swiftui-app/
 */

import ActivityKit
import Foundation

struct PrintingAttributes: ActivityAttributes {
	var printName: String
	var estimatedDuration: TimeInterval
	var startTime: TimeInterval
	
	public struct ContentState: Codable, Hashable {
		var progress: Double
		var statusMessage: String
	}
}
