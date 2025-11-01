import Foundation
import ModernReaderServices

public final class EmotionSummaryModel: ObservableObject {
    @Published public private(set) var lastEmotion: String = "neutral"

    private let apiClient: APIClient

    public init(apiClient: APIClient) {
        self.apiClient = apiClient
    }

    public func refresh(sessionId: String) async {
        // Placeholder: call session events when endpoint is available
        await MainActor.run {
            self.lastEmotion = ["curious", "focused", "confused"].randomElement() ?? "neutral"
        }
    }
}
