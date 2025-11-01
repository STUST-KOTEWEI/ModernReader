import SwiftUI
import ModernReaderServices

public struct ContentView: View {
    @StateObject private var authStore: AuthStore
    @State private var recommendations: [Recommendation] = []
    @State private var isShowingLogin = false
    @State private var errorMessage: String?

    public init(apiBaseURL: URL) {
        let apiClient = APIClient(baseURL: apiBaseURL)
        _authStore = StateObject(wrappedValue: AuthStore(apiClient: apiClient))
    }

    public var body: some View {
        NavigationSplitView {
            List(recommendations) { item in
                VStack(alignment: .leading, spacing: 4) {
                    Text(item.title)
                        .font(.headline)
                    Text(item.rationale)
                        .font(.subheadline)
                    ProgressView(value: item.confidence)
                }
                .padding(8)
            }
            .navigationTitle("Recommended")
            .toolbar {
                Button(action: { isShowingLogin = true }) {
                    Image(systemName: authStore.token == nil ? "person.crop.circle" : "person.crop.circle.fill")
                }
            }
            .task(id: authStore.token) {
                await loadRecommendations()
            }
            .sheet(isPresented: $isShowingLogin) {
                LoginSheet(authStore: authStore, isPresented: $isShowingLogin, onError: { error in
                    errorMessage = error
                })
                .presentationDetents([.medium])
            }
            .alert(item: $errorMessage) { message in
                Alert(title: Text("Error"), message: Text(message), dismissButton: .default(Text("OK")))
            }
        } detail: {
            Text("Select a recommendation to view details")
        }
    }

    private func loadRecommendations() async {
        guard let _ = authStore.token else { return }
        do {
            let api = APIClient(baseURL: URL(string: "http://localhost:8000")!)
            let payload = RecommendationPayload(userId: "demo-user")
            let response: RecommendationResponse = try await api.request(.recommend, payload: payload)
            await MainActor.run {
                recommendations = response.recommendations
            }
        } catch {
            await MainActor.run {
                errorMessage = "Failed to load recommendations"
            }
        }
    }
}

private struct LoginSheet: View {
    @ObservedObject var authStore: AuthStore
    @Binding var isPresented: Bool
    @State private var email: String = ""
    @State private var password: String = ""
    @State private var isLoading = false
    var onError: (String) -> Void

    var body: some View {
        NavigationStack {
            Form {
                TextField("Email", text: $email)
                    .textInputAutocapitalization(.never)
                SecureField("Password", text: $password)
                if isLoading {
                    ProgressView()
                }
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { isPresented = false }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Sign In") { Task { await login() } }
                        .disabled(email.isEmpty || password.isEmpty)
                }
            }
        }
    }

    private func login() async {
        isLoading = true
        do {
            try await authStore.login(email: email, password: password)
            isPresented = false
        } catch {
            onError("Login failed")
        }
        isLoading = false
    }
}

private extension String: Identifiable {
    public var id: String { self }
}
