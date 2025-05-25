//
//  NewsCard.swift
//  personalized-news-feed
//
//  Created by Alexander on 25/05/25.
//

import SwiftUI

struct NewsCard: View {
    var headline: String
    var subheadline: String
    var imageUrl: URL?
    
    var body: some View {
        VStack(alignment: .center) {
            ZStack {
                AsyncImage(
                    url: imageUrl
                ) { image in
                    image.resizable()
                } placeholder: {
                    ProgressView()
                        .frame(idealWidth: .infinity, minHeight: 200, alignment: .center)
                }
            }
            .frame(idealWidth: .infinity, idealHeight: 250, alignment: .topLeading)
                        
            VStack(alignment: .leading) {
                Text(headline)
                    .font(.title2)
                    .bold()
                Text(subheadline)
                    .font(.subheadline)
                    .brightness(-0.2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .foregroundStyle(.white)
        }
        .frame(maxWidth: .infinity, maxHeight: 250)
        .padding()
        .background(.newsCard, in: RoundedRectangle(cornerRadius: 10))
    }
}

#Preview {
    NewsCard(
        headline: "Some news title",
        subheadline: "Some news description",
        imageUrl: URL(string: "https://plus.unsplash.com/premium_vector-1698192004854-420188f0ef37?q=80&w=1920&h=1080&auto=format&fit=crop")!)
    .padding()
}
