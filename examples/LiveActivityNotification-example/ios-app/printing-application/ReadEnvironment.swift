//
//  ReadEnvironment.swift
//  printing-application
//
//  Created by Alexander on 14/08/25.
//

import Foundation

func getServerBaseURLFromEnv() -> String {
    guard let serverBaseURL = ProcessInfo.processInfo.environment["SERVER_BASE_URL"] else {
        fatalError("RemotePrintService: SERVER_BASE_URL environment variable is not set.")
    }

    return serverBaseURL
}

func getServerPortFromEnv() -> String {
    return ProcessInfo.processInfo.environment["SERVER_PORT"] ?? "3000"
}
