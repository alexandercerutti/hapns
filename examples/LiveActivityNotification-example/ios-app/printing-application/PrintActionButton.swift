//
//  PrintActionButton.swift
//  la-example
//
//  Created by Alexander on 03/06/25.
//

import Foundation
import SwiftUI

struct PrintButtonStyle: ButtonStyle {
    let isActive: Bool
    let backgroundColor: Color

    func makeBody(configuration: Self.Configuration) -> some View {
        PrintButtonStyleView(configuration: configuration, isActive: isActive, backgroundColor: backgroundColor)
    }
}

private extension PrintButtonStyle {
    struct PrintButtonStyleView: View {
        @Environment(\.isEnabled) var isEnabled
        
        let configuration: PrintButtonStyle.Configuration
        let isActive: Bool
        let backgroundColor: Color
        
        var body: some View {
            return configuration.label
                .frame(width: 200, height: 50)
                .background(determineBackgroundColor())
                .clipShape(
                    RoundedRectangle(cornerRadius: 10)
                )
        }
        
        private func determineBackgroundColor() -> Color {
            if isActive {
                return .red
            }
            
            if !isEnabled {
                return .gray
            }
            
            return backgroundColor
        }
    }
}

struct PrintActionButton: View {
    let title: String
    @Binding var isActive: Bool
    let backgroundColor: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(self.title)
                .font(.headline)
                .foregroundStyle(.white)
        }
        .buttonStyle(
            PrintButtonStyle(
                isActive: isActive,
                backgroundColor: backgroundColor
            )
        )
    }
}
