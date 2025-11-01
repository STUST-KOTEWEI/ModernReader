# Module 6: iOS / Swift Integration Architecture

> **Status**: Architecture Design Complete  
> **Platform**: iOS 17+, watchOS 10+  
> **Language**: Swift 5.9+

---

## Overview

Module 6 整合 Apple 生態系統的健康數據與認知負荷監測，透過 HealthKit 與 WatchConnectivity 實現跨裝置的生理指標追蹤。

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  iOS App (iPhone)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  ReadingView │  │HealthKit     │  │ WatchSession │  │
│  │              │  │ Manager      │  │ Manager      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │           │
│         └─────────────────┴─────────────────┘           │
│                          │                               │
│                  ┌───────▼────────┐                      │
│                  │  ModernReader  │                      │
│                  │  API Client    │                      │
│                  └───────┬────────┘                      │
└──────────────────────────┼──────────────────────────────┘
                           │
                           │ HTTPS
                           ▼
┌──────────────────────────────────────────────────────────┐
│           Backend API (FastAPI)                          │
│  /api/v1/cognitive/assess-load                           │
│  /api/v1/cognitive/adapt-content                         │
└──────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. HealthKit Manager

**File**: `Sources/ModernReader/Managers/HealthKitManager.swift`

**Capabilities**:
- Request HealthKit permissions
- Read Heart Rate Variability (HRV)
- Read Heart Rate (resting, active)
- Read Sleep Analysis
- Track Reading Sessions with Workout API

**Code Snippet**:
```swift
import HealthKit

class HealthKitManager: ObservableObject {
    private let healthStore = HKHealthStore()
    @Published var hrvValue: Double?
    @Published var heartRate: Double?
    
    let typesToRead: Set<HKObjectType> = [
        HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN)!,
        HKObjectType.quantityType(forIdentifier: .heartRate)!,
        HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!
    ]
    
    func requestAuthorization() async throws {
        try await healthStore.requestAuthorization(toShare: [], read: typesToRead)
    }
    
    func fetchLatestHRV() async throws -> Double {
        let hrvType = HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN)!
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        let query = HKSampleQuery(sampleType: hrvType, predicate: nil, limit: 1, sortDescriptors: [sortDescriptor]) { _, samples, error in
            guard let sample = samples?.first as? HKQuantitySample else { return }
            let hrv = sample.quantity.doubleValue(for: HKUnit.secondUnit(with: .milli))
            DispatchQueue.main.async {
                self.hrvValue = hrv
            }
        }
        healthStore.execute(query)
        return hrvValue ?? 0.0
    }
}
```

---

### 2. Watch Connectivity Manager

**File**: `Sources/ModernReader/Managers/WatchConnectivityManager.swift`

**Capabilities**:
- Real-time data sync between iPhone ↔ Apple Watch
- Send cognitive load updates to watch
- Receive HRV data from watch sensors
- Background message handling

**Code Snippet**:
```swift
import WatchConnectivity

class WatchConnectivityManager: NSObject, ObservableObject {
    static let shared = WatchConnectivityManager()
    private let session = WCSession.default
    
    @Published var cognitiveLoad: Double = 0.0
    @Published var isWatchConnected = false
    
    override private init() {
        super.init()
        if WCSession.isSupported() {
            session.delegate = self
            session.activate()
        }
    }
    
    func sendCognitiveLoad(_ load: Double) {
        guard session.isReachable else { return }
        let message = ["cognitiveLoad": load]
        session.sendMessage(message, replyHandler: nil)
    }
    
    func requestHRVData() {
        guard session.isReachable else { return }
        session.sendMessage(["request": "hrv"], replyHandler: { response in
            if let hrv = response["hrv"] as? Double {
                DispatchQueue.main.async {
                    // Process HRV data
                }
            }
        })
    }
}

extension WatchConnectivityManager: WCSessionDelegate {
    func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        if let hrv = message["hrv"] as? Double {
            DispatchQueue.main.async {
                // Update HRV value
            }
        }
    }
    
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        DispatchQueue.main.async {
            self.isWatchConnected = (activationState == .activated)
        }
    }
    
    #if os(iOS)
    func sessionDidBecomeInactive(_ session: WCSession) {}
    func sessionDidDeactivate(_ session: WCSession) {}
    #endif
}
```

---

### 3. Cognitive Load Tracker

**File**: `Sources/ModernReader/Services/CognitiveLoadTracker.swift`

**Capabilities**:
- Combine HealthKit data + reading behavior
- Calculate real-time cognitive load
- Send updates to backend `/api/v1/cognitive/assess-load`
- Trigger adaptive content adjustments

**Code Snippet**:
```swift
import Foundation

class CognitiveLoadTracker: ObservableObject {
    @Published var currentLoad: Double = 0.0
    @Published var loadState: LoadState = .optimal
    
    private let healthKitManager = HealthKitManager()
    private let apiClient = ModernReaderAPIClient.shared
    
    enum LoadState {
        case underload, optimal, overload
    }
    
    func assessLoad(readingSpeed: Double, errorRate: Double, pauseFrequency: Double) async {
        do {
            let hrv = try await healthKitManager.fetchLatestHRV()
            
            let response = try await apiClient.assessCognitiveLoad(
                readingSpeed: readingSpeed,
                errorRate: errorRate,
                pauseFrequency: pauseFrequency,
                heartRateVariability: hrv
            )
            
            DispatchQueue.main.async {
                self.currentLoad = response.cognitiveLoad
                self.loadState = self.determineState(load: response.cognitiveLoad)
                
                // Send to watch
                WatchConnectivityManager.shared.sendCognitiveLoad(response.cognitiveLoad)
            }
        } catch {
            print("Failed to assess cognitive load: \\(error)")
        }
    }
    
    private func determineState(load: Double) -> LoadState {
        if load < 0.4 {
            return .underload
        } else if load > 0.7 {
            return .overload
        } else {
            return .optimal
        }
    }
}
```

---

### 4. API Client

**File**: `Sources/ModernReader/Networking/ModernReaderAPIClient.swift`

**Endpoints**:
```swift
import Foundation

class ModernReaderAPIClient {
    static let shared = ModernReaderAPIClient()
    private let baseURL = "http://localhost:8001/api/v1"
    
    func assessCognitiveLoad(
        readingSpeed: Double,
        errorRate: Double,
        pauseFrequency: Double,
        heartRateVariability: Double
    ) async throws -> CognitiveLoadResponse {
        let url = URL(string: "\\(baseURL)/cognitive/assess-load")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = CognitiveLoadRequest(
            user_id: "demo-user",
            reading_speed: readingSpeed,
            error_rate: errorRate,
            pause_frequency: pauseFrequency,
            heart_rate_variability: heartRateVariability
        )
        
        request.httpBody = try JSONEncoder().encode(body)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode(CognitiveLoadResponse.self, from: data)
    }
    
    func getRecommendations() async throws -> RecommendationsResponse {
        // Similar implementation for /recommender/recommend
    }
    
    func queryRAG(query: String) async throws -> RAGResponse {
        // Similar implementation for /rag/query
    }
}

// MARK: - Models
struct CognitiveLoadRequest: Codable {
    let user_id: String
    let reading_speed: Double
    let error_rate: Double
    let pause_frequency: Double
    let heart_rate_variability: Double
}

struct CognitiveLoadResponse: Codable {
    let cognitive_load: Double
    let state: String
    let recommendations: [String]
}
```

---

## UI Components

### 1. Reading View with Real-time Monitoring

**File**: `Sources/ModernReader/Views/ReadingView.swift`

```swift
import SwiftUI

struct ReadingView: View {
    @StateObject private var cognitiveTracker = CognitiveLoadTracker()
    @StateObject private var healthKitManager = HealthKitManager()
    @State private var content: String = ""
    @State private var readingSpeed: Double = 180.0
    
    var body: some View {
        VStack {
            // Cognitive Load Indicator
            HStack {
                Text("Cognitive Load:")
                ProgressView(value: cognitiveTracker.currentLoad)
                    .tint(loadColor)
                Text("\\(Int(cognitiveTracker.currentLoad * 100))%")
            }
            .padding()
            
            // Reading Content
            ScrollView {
                Text(content)
                    .font(.body)
                    .padding()
            }
            
            // Controls
            HStack {
                Button("Assess Load") {
                    Task {
                        await cognitiveTracker.assessLoad(
                            readingSpeed: readingSpeed,
                            errorRate: 0.05,
                            pauseFrequency: 5.0
                        )
                    }
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .navigationTitle("Reading")
        .task {
            try? await healthKitManager.requestAuthorization()
        }
    }
    
    private var loadColor: Color {
        switch cognitiveTracker.loadState {
        case .underload: return .blue
        case .optimal: return .green
        case .overload: return .red
        }
    }
}
```

---

## Project Structure

```
ModernReaderApp/
├── Package.swift
├── Sources/
│   └── ModernReader/
│       ├── ModernReaderApp.swift          # App entry point
│       ├── Views/
│       │   ├── ReadingView.swift
│       │   ├── DashboardView.swift
│       │   └── SettingsView.swift
│       ├── Managers/
│       │   ├── HealthKitManager.swift
│       │   └── WatchConnectivityManager.swift
│       ├── Services/
│       │   └── CognitiveLoadTracker.swift
│       ├── Networking/
│       │   └── ModernReaderAPIClient.swift
│       └── Models/
│           ├── CognitiveLoadModels.swift
│           └── RecommendationModels.swift
└── Tests/
    └── ModernReaderTests/
        ├── HealthKitManagerTests.swift
        └── APIClientTests.swift
```

---

## Setup Instructions

### 1. Prerequisites
- Xcode 15+
- iOS 17+ / watchOS 10+ deployment target
- Apple Developer Account (for HealthKit entitlements)

### 2. Create Project
```bash
cd clients/apple
swift package init --type executable --name ModernReaderApp
```

### 3. Update Package.swift
```swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "ModernReaderApp",
    platforms: [
        .iOS(.v17),
        .watchOS(.v10)
    ],
    products: [
        .executable(name: "ModernReaderApp", targets: ["ModernReader"])
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "ModernReader",
            dependencies: []
        ),
        .testTarget(
            name: "ModernReaderTests",
            dependencies: ["ModernReader"]
        )
    ]
)
```

### 4. Add HealthKit Entitlements

In Xcode:
1. Select target → Signing & Capabilities
2. Add "HealthKit" capability
3. Add "Background Modes" → Background fetch

### 5. Info.plist Additions
```xml
<key>NSHealthShareUsageDescription</key>
<string>ModernReader needs access to your health data to optimize reading experience based on cognitive load.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>ModernReader tracks reading sessions as workouts.</string>
```

---

## Testing

### Unit Tests
```swift
import XCTest
@testable import ModernReader

final class CognitiveLoadTrackerTests: XCTestCase {
    func testLoadCalculation() async throws {
        let tracker = CognitiveLoadTracker()
        await tracker.assessLoad(
            readingSpeed: 180,
            errorRate: 0.05,
            pauseFrequency: 5.0
        )
        
        XCTAssertGreaterThan(tracker.currentLoad, 0.0)
        XCTAssertLessThan(tracker.currentLoad, 1.0)
    }
}
```

### Manual Testing
1. Run app on iPhone
2. Start reading session
3. Observe cognitive load indicator
4. Check watch app for sync
5. Verify API calls in backend logs

---

## Integration with Backend

### Expected API Flow

1. **App Launch**
   - Request HealthKit permissions
   - Establish WatchConnectivity session

2. **Reading Session Start**
   - Begin tracking reading metrics
   - Fetch initial HRV from HealthKit
   - POST `/api/v1/cognitive/assess-load`

3. **Continuous Monitoring (every 30s)**
   - Update reading speed, error rate
   - Fetch latest HRV
   - POST assessment to backend
   - Receive adaptive recommendations

4. **Watch Sync**
   - Send cognitive load to watch
   - Display haptic feedback if overload
   - Show breathing exercise if needed

---

## Future Enhancements

- [ ] CoreML on-device cognitive load prediction
- [ ] WidgetKit dashboard widget
- [ ] Live Activities for reading sessions
- [ ] SharePlay for group reading
- [ ] Siri Shortcuts integration

---

## References

- [HealthKit Documentation](https://developer.apple.com/documentation/healthkit)
- [WatchConnectivity Framework](https://developer.apple.com/documentation/watchconnectivity)
- [SwiftUI Lifecycle](https://developer.apple.com/documentation/swiftui/app)

---

_Module 6 Architecture Design - 2025年11月1日_
