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

func reportProgressToStepsGuard(deviceRegistrationAddress: String, stepName: String, metadata: [String: Any]? = nil) {
    let logger = Logger(subsystem: Bundle.main.bundleIdentifier!, category: "StepsGuard")
    
    // Strip the /registration endpoint and replace with steps-guard endpoint
    var baseAddress = deviceRegistrationAddress
    if baseAddress.hasSuffix("/registration") {
        baseAddress = String(baseAddress.dropLast("/registration".count))
    }
    
    guard let baseURL = URL(string: baseAddress) else {
        print("Invalid device registration address: \(deviceRegistrationAddress)")
        logger.error("Invalid device registration address: \(deviceRegistrationAddress)")
        return
    }
    
    // Construct the steps-guard endpoint URL
    let stepsGuardURL = baseURL.appendingPathComponent("steps-guard").appendingPathComponent("progress")
    
    var request = URLRequest(url: stepsGuardURL)
    request.httpMethod = "POST"
    request.addValue("application/json", forHTTPHeaderField: "Content-Type")
    
    var body: [String: Any] = [
        "deviceId": UIDevice.current.identifierForVendor?.uuidString ?? "",
        "stepName": stepName,
        "timestamp": ISO8601DateFormatter().string(from: Date())
    ]
    
    // Add optional metadata if provided
    if let metadata = metadata {
        body["metadata"] = metadata
    }
    
    do {
        request.httpBody = try JSONSerialization.data(withJSONObject: body, options: [])
    } catch {
        print("Error creating JSON body for steps-guard: \(error)")
        logger.error("Error creating JSON body for steps-guard: \(error.localizedDescription)")
        return
    }
    
    let task = URLSession.shared.dataTask(with: request) { data, response, error in
        if let error = error {
            print("Error sending progress to steps-guard: \(error)")
            logger.error("Error sending progress to steps-guard: \(error.localizedDescription)")
            return
        }
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            print("Steps-guard returned non-200 status code")
            logger.error("Steps-guard returned a non-200 status code")
            return
        }
        print("Successfully reported progress '\(stepName)' to steps-guard.")
        logger.info("Successfully reported progress '\(stepName)' to steps-guard at \(stepsGuardURL.absoluteString)")
    }
    
    task.resume()
}
