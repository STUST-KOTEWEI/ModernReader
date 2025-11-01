import Foundation

public struct AuthResponse: Codable {
    public let accessToken: String
    public let tokenType: String
    public let expiresAt: Date

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case tokenType = "token_type"
        case expiresAt = "expires_at"
    }
}

public struct Recommendation: Codable, Identifiable {
    public var id: String { bookId }
    public let bookId: String
    public let title: String
    public let rationale: String
    public let confidence: Double
}

public struct RecommendationPayload: Codable {
    public let userId: String
    public let contextBookId: String?
    public let emotionState: String?
    public let limit: Int

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case contextBookId = "context_book_id"
        case emotionState = "emotion_state"
        case limit
    }

    public init(userId: String, contextBookId: String? = nil, emotionState: String? = nil, limit: Int = 5) {
        self.userId = userId
        self.contextBookId = contextBookId
        self.emotionState = emotionState
        self.limit = limit
    }
}

public struct RecommendationResponse: Codable {
    public let recommendations: [Recommendation]
}

public struct SessionEventPayload: Codable {
    public let sessionId: String
    public let userId: String
    public let bookId: String
    public let eventType: String
    public let emotion: String?

    enum CodingKeys: String, CodingKey {
        case sessionId = "session_id"
        case userId = "user_id"
        case bookId = "book_id"
        case eventType = "event_type"
        case emotion
    }

    public init(sessionId: String, userId: String, bookId: String, eventType: String, emotion: String? = nil) {
        self.sessionId = sessionId
        self.userId = userId
        self.bookId = bookId
        self.eventType = eventType
        self.emotion = emotion
    }
}

public struct SessionEventAck: Codable {
    public let sessionId: String
    public let processedAt: Date
    public let actions: [String]

    enum CodingKeys: String, CodingKey {
        case sessionId = "session_id"
        case processedAt = "processed_at"
        case actions
    }
}
