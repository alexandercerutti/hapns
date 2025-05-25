//
//  ContentView.swift
//  personalized-news-feed
//
//  Created by Alexander on 25/05/25.
//

import SwiftUI

struct ContentView: View { 
    var body: some View {
        ScrollView {
            VStack(spacing: 10) {
                NewsCard(headline: "Push notifications are awesome", subheadline: "Did you know they can happen?", imageUrl: URL(string: "https://plus.unsplash.com/premium_vector-1698192004854-420188f0ef37?q=80&w=1920&h=1080&auto=format&fit=crop"))
                
                NewsCard(headline: "JS sucks nowadays?", subheadline: "The opinion of our experts (spoiler alert: no)", imageUrl: URL(string: "https://plus.unsplash.com/premium_vector-1721762658788-8af51eb930a1?q=80&w=3560&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"))
                
                NewsCard(headline: "Hapns on Nodejs released!", subheadline: "Try it now on Github", imageUrl: URL(string: "https://plus.unsplash.com/premium_vector-1721306577948-82754b6a7905?q=80&w=3560&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"))
                
                NewsCard(headline: "A bunch of reporters things", subheadline: "Guess where? Yes, on a table", imageUrl: URL(string: "https://plus.unsplash.com/premium_vector-1721748240279-2e85f6769e95?q=80&w=3600&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"))
            }
            .padding([Edge.Set.leading, Edge.Set.trailing], 10)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
    }
}

#Preview {
    ContentView()
}
