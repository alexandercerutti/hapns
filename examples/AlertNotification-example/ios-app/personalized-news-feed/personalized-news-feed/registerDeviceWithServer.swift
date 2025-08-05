//
//  registerDeviceWithServer.swift
//  personalized-news-feed
//
//  Created by Alexander on 19/07/25.
//

import Foundation
import UIKit
import os.log

func registerDeviceWithServer(address: URL, token: String, apnsTopic: String) {
    let logger = Logger(subsystem: Bundle.main.bundleIdentifier!, category: "AppDelegate")
    var request = URLRequest(url: address)

    request.httpMethod = "POST"
    request.addValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let body: [String: String] = [
        "deviceId": UIDevice.current.identifierForVendor?.uuidString ?? "",
        "deviceToken": token,
        "apnsTopic": apnsTopic
    ]

    do {
        request.httpBody = try JSONSerialization.data(withJSONObject: body, options: [])
    } catch {
        print("Error creating JSON body: \(error)")
        logger.error("Error creating JSON body: \(error.localizedDescription)")
        return
    }
    
    let task = URLSession.shared.dataTask(with: request) { data, response, error in
        if let error = error {
            print("Error sending token to server: \(error)")
            logger.error("Error sending token to server: \(error.localizedDescription)")
            return
        }
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            print("Server returned non-200 status code")
            logger.error("Server returned a non-200 status code")
            return
        }
        print("Successfully registered token with server.")
        logger.error("Successfully registered token with server at \(address.absoluteString)")
    }
    
    task.resume()
}
