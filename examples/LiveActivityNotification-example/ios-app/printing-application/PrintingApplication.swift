/**
 * Example took, manually rewrote and updated from CreateWithSwift
 * @see https://www.createwithswift.com/implementing-live-activities-in-a-swiftui-app/
 */

import SwiftUI

@main
struct PrintingApplication: App {
    @StateObject private var printingActivityTimer: PrintingActivityTimer = PrintingActivityTimer()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(printingActivityTimer)
        }
    }
}
