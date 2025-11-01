import Foundation

@MainActor
public final class AuthStore: ObservableObject {
    @Published public private(set) var token: String?
    @Published public private(set) var userEmail: String?

    private let apiClient: APIClient

    public init(apiClient: APIClient) {
        self.apiClient = apiClient
    }

    public struct LoginPayload: Codable {
        public let email: String
        public let password: String
    }

    public func login(email: String, password: String) async throws {
        let payload = LoginPayload(email: email, password: password)
        let response: AuthResponse = try await apiClient.request(.login, payload: payload)
        token = response.accessToken
        userEmail = email
    }

    public func logout() {
        token = nil
        userEmail = nil
    }
}
