//
//  NotificationService.swift
//  ExampleNotificationService
//
//  Created by Alexander on 31/08/25.
//

import UserNotifications
import CryptoKit
import Foundation

struct EncryptedData {
    let data: String
    let iv: String
    let authTag: String
    
    static func from(userInfo: [AnyHashable: Any]) -> EncryptedData? {
        guard
            let encryptedDict = userInfo["encrypted"] as? [String: String],
            let data = encryptedDict["data"],
            let iv = encryptedDict["iv"],
            let authTag = encryptedDict["authTag"]
        else {
            return nil
        }
        
        return EncryptedData(data: data, iv: iv, authTag: authTag)
    }
}

class NotificationService: UNNotificationServiceExtension {

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?

    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        self.contentHandler = contentHandler
        bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
        
        if let bestAttemptContent = bestAttemptContent {
            guard let encryptedContent = EncryptedData.from(userInfo: bestAttemptContent.userInfo) else {
                contentHandler(bestAttemptContent)
                return
            }
            
            let decryptedContent = decryptMessage(encryptedContent)
            
            guard let decryptedContent = decryptedContent else {
                print("Couldn't decrypt content :/")
                contentHandler(bestAttemptContent)
                return
            }
            
            bestAttemptContent.subtitle = String("Decrypted user content: \(decryptedContent)")
            bestAttemptContent.title = "\(bestAttemptContent.title) - [modified]"
            bestAttemptContent.body = "✨ Awesome ✨"

            contentHandler(bestAttemptContent)
        }
    }
    
    override func serviceExtensionTimeWillExpire() {
        // Called just before the extension will be terminated by the system.
        // Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
        if let contentHandler = contentHandler, let bestAttemptContent =  bestAttemptContent {
            contentHandler(bestAttemptContent)
        }
    }
    
    private func decryptMessage(_ encrypted: EncryptedData) -> String? {
        let secretKey = "my-32-character-ultra-secret-key!"
        
        guard
            let encryptedData = Data(base64Encoded: encrypted.data),
            let ivData = Data(base64Encoded: encrypted.iv),
            let authTagData = Data(base64Encoded: encrypted.authTag)
        else {
            return nil
        }
        
        let keyData = SHA256.hash(data: secretKey.data(using: .utf8)!)
        let key = SymmetricKey(data: keyData)
            
        do {
            let nonce = try AES.GCM.Nonce(data: ivData)
            let sealedBox = try AES.GCM.SealedBox(nonce: nonce, ciphertext: encryptedData, tag: authTagData)
            let decrypted = try AES.GCM.open(sealedBox, using: key)
            return String(data: decrypted, encoding: .utf8)
        } catch {
            return nil
        }
    }
}
