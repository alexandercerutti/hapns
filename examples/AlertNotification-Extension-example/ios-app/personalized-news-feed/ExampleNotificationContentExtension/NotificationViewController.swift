//
//  NotificationViewController.swift
//  ExampleNotificationContentExtension
//
//  Created by Alexander on 31/08/25.
//

import UIKit
import UserNotifications
import UserNotificationsUI

class NotificationViewController: UIViewController, UNNotificationContentExtension {

    @IBOutlet var label: UILabel?
    @IBOutlet var image: UIImageView?
    
    override func viewDidLoad() {
        super.viewDidLoad()
    }
    
    func didReceive(_ notification: UNNotification) {
        self.label?.text = "Notifications own a layout that can be changed!\nThey can also contain notification itself content: \"\(notification.request.content.body)\". Many notification. Very magic. Such Wow ✨"
    }
}
