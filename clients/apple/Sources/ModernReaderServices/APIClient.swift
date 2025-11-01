import Foundation

public struct APIClient {
    public enum Endpoint {
        case login
        case catalogSearch
        case recommend
        case sessionEvent
        case senses

        var path: String {
            switch self {
            case .login: return "/api/v1/auth/login"
            case .catalogSearch: return "/api/v1/catalog/search"
            case .recommend: return "/api/v1/recommend/books"
            case .sessionEvent: return "/api/v1/sessions/events"
            case .senses: return "/api/v1/senses/command"
            }
        }
    }

    public var baseURL: URL
    private let session: URLSession

    public init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    public func request<T: Codable, U: Codable>(_ endpoint: Endpoint, payload: T) async throws -> U {
        var request = URLRequest(url: baseURL.appendingPathComponent(endpoint.path))
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(payload)

        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
        return try JSONDecoder().decode(U.self, from: data)
    }
}
