//
//  PrintingActivityTimer.swift
//  la-example
//
//  Created by Alexander on 04/06/25.
//

import Foundation

class PrintingActivityTimer: ObservableObject {
  @Published var elapsedTime: TimeInterval = 0
  private var timer: Timer?
    
  func start(onTimeIncrease: (() -> Void)? = nil) {
	elapsedTime = 0;

	timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
	  self.elapsedTime += 1
	  onTimeIncrease?()
	}
  }
  
  func stop() {
	timer?.invalidate()
  }
}
