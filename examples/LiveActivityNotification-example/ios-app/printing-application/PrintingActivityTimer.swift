//
//  PrintingActivityTimer.swift
//  la-example
//
//  Created by Alexander on 04/06/25.
//

import Foundation

@Observable
class PrintingActivityTimer: ObservableObject {
  var elapsedTime: TimeInterval = 0
  private var timer: Timer?

	func start(onTimeIncrease: ((_ nextTime: TimeInterval) async -> Void)? = nil) {
		elapsedTime = 0;

		timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
			self.elapsedTime += 1

            Task {
                await onTimeIncrease?(self.elapsedTime)
            }
		}
	}
  
	func stop() {
		elapsedTime = 0;
		timer?.invalidate()
		timer = nil;
	}
}
