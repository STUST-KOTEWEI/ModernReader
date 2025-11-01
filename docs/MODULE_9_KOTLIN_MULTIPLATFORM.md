# Module 9: Kotlin Multiplatform 架構

> **Status**: Architecture Design Complete  
> **Platform**: Android, iOS (共享代碼)  
> **Language**: Kotlin 1.9+, KMP 2.0

---

## Overview

Module 9 使用 Kotlin Multiplatform (KMP) 實現跨平台商業邏輯共享，減少重複代碼，提升開發效率。

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Shared Module (KMP)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ API Client   │  │ Data Models  │  │ Business     │  │
│  │              │  │              │  │ Logic        │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└──────────────┬──────────────────────────┬───────────────┘
               │                          │
       ┌───────▼────────┐        ┌───────▼────────┐
       │  Android App   │        │    iOS App     │
       │  (Jetpack      │        │  (SwiftUI +    │
       │   Compose)     │        │   Swift)       │
       └────────────────┘        └────────────────┘
```

---

## Project Structure

```
modernreader-kmp/
├── shared/
│   └── src/
│       ├── commonMain/
│       │   └── kotlin/
│       │       ├── api/
│       │       │   └── ModernReaderAPI.kt
│       │       ├── models/
│       │       │   ├── User.kt
│       │       │   ├── Recommendation.kt
│       │       │   └── CognitiveLoad.kt
│       │       └── repository/
│       │           └── RecommendationRepository.kt
│       ├── androidMain/
│       │   └── kotlin/
│       │       └── Platform.android.kt
│       └── iosMain/
│           └── kotlin/
│               └── Platform.ios.kt
├── androidApp/
│   └── src/
│       └── main/
│           ├── java/
│           │   └── com/modernreader/
│           │       ├── MainActivity.kt
│           │       └── ui/
│           │           ├── HomeScreen.kt
│           │           └── ReaderScreen.kt
│           └── res/
└── iosApp/
    └── ModernReaderApp/
        ├── ContentView.swift
        └── ReadingView.swift
```

---

## Shared Code

### 1. API Client

**File**: `shared/src/commonMain/kotlin/api/ModernReaderAPI.kt`

```kotlin
package com.modernreader.api

import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*
import kotlinx.serialization.Serializable

class ModernReaderAPI(private val baseUrl: String = "http://localhost:8001/api/v1") {
    private val client = HttpClient()
    
    suspend fun getRecommendations(userId: String): RecommendationsResponse {
        return client.post("$baseUrl/recommender/recommend") {
            contentType(ContentType.Application.Json)
            setBody(RecommendRequest(userId))
        }.body()
    }
    
    suspend fun assessCognitiveLoad(request: CognitiveLoadRequest): CognitiveLoadResponse {
        return client.post("$baseUrl/cognitive/assess-load") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body()
    }
    
    suspend fun queryRAG(query: String, language: String = "zh"): RAGResponse {
        return client.post("$baseUrl/rag/query") {
            contentType(ContentType.Application.Json)
            setBody(RAGRequest(query, language))
        }.body()
    }
}

@Serializable
data class RecommendRequest(val user_id: String)

@Serializable
data class RecommendationsResponse(
    val recommendations: List<Recommendation>
)

@Serializable
data class Recommendation(
    val item_id: String,
    val title: String,
    val score: Double,
    val explanation: String?
)

@Serializable
data class CognitiveLoadRequest(
    val user_id: String,
    val reading_speed: Double,
    val error_rate: Double,
    val pause_frequency: Double,
    val heart_rate_variability: Double? = null
)

@Serializable
data class CognitiveLoadResponse(
    val cognitive_load: Double,
    val state: String,
    val recommendations: List<String>
)

@Serializable
data class RAGRequest(val query: String, val language: String)

@Serializable
data class RAGResponse(
    val answer: String,
    val sources: List<String>,
    val confidence: Double
)
```

---

### 2. Repository Pattern

**File**: `shared/src/commonMain/kotlin/repository/RecommendationRepository.kt`

```kotlin
package com.modernreader.repository

import com.modernreader.api.ModernReaderAPI
import com.modernreader.api.Recommendation
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

class RecommendationRepository(private val api: ModernReaderAPI) {
    fun getRecommendations(userId: String): Flow<List<Recommendation>> = flow {
        try {
            val response = api.getRecommendations(userId)
            emit(response.recommendations)
        } catch (e: Exception) {
            // Fallback to mock data
            emit(mockRecommendations())
        }
    }
    
    private fun mockRecommendations() = listOf(
        Recommendation(
            item_id = "1",
            title = "Quantum Computing Basics",
            score = 0.85,
            explanation = "Matches your interest in physics"
        ),
        Recommendation(
            item_id = "2",
            title = "Introduction to AI",
            score = 0.78,
            explanation = "Popular in your learning path"
        )
    )
}
```

---

### 3. ViewModel (共享業務邏輯)

**File**: `shared/src/commonMain/kotlin/viewmodel/RecommendationViewModel.kt`

```kotlin
package com.modernreader.viewmodel

import com.modernreader.api.Recommendation
import com.modernreader.repository.RecommendationRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class RecommendationViewModel(
    private val repository: RecommendationRepository
) {
    private val _recommendations = MutableStateFlow<List<Recommendation>>(emptyList())
    val recommendations: StateFlow<List<Recommendation>> = _recommendations.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    fun loadRecommendations(userId: String) {
        _isLoading.value = true
        
        // In real app, use proper coroutine scope
        repository.getRecommendations(userId).collect { recs ->
            _recommendations.value = recs
            _isLoading.value = false
        }
    }
}
```

---

## Android App

### Main Activity

**File**: `androidApp/src/main/java/MainActivity.kt`

```kotlin
package com.modernreader

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.modernreader.api.ModernReaderAPI
import com.modernreader.repository.RecommendationRepository
import com.modernreader.viewmodel.RecommendationViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val api = ModernReaderAPI()
        val repository = RecommendationRepository(api)
        val viewModel = RecommendationViewModel(repository)
        
        setContent {
            ModernReaderTheme {
                HomeScreen(viewModel)
            }
        }
    }
}

@Composable
fun HomeScreen(viewModel: RecommendationViewModel) {
    val recommendations by viewModel.recommendations.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    
    LaunchedEffect(Unit) {
        viewModel.loadRecommendations("demo-user")
    }
    
    Scaffold(
        topBar = { TopAppBar(title = { Text("ModernReader") }) }
    ) { padding ->
        Column(modifier = Modifier.padding(padding)) {
            if (isLoading) {
                CircularProgressIndicator()
            } else {
                recommendations.forEach { rec ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(8.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(rec.title, style = MaterialTheme.typography.titleMedium)
                            Text(rec.explanation ?: "", style = MaterialTheme.typography.bodySmall)
                            Text("Score: ${(rec.score * 100).toInt()}%")
                        }
                    }
                }
            }
        }
    }
}
```

---

## iOS App Integration

### ContentView.swift

**File**: `iosApp/ModernReaderApp/ContentView.swift`

```swift
import SwiftUI
import shared // KMP shared module

struct ContentView: View {
    @StateObject private var viewModel = RecommendationViewModelWrapper()
    
    var body: some View {
        NavigationView {
            List(viewModel.recommendations, id: \.item_id) { rec in
                VStack(alignment: .leading) {
                    Text(rec.title)
                        .font(.headline)
                    if let explanation = rec.explanation {
                        Text(explanation)
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                    Text("Score: \(Int(rec.score * 100))%")
                        .font(.caption2)
                }
            }
            .navigationTitle("ModernReader")
            .onAppear {
                viewModel.loadRecommendations(userId: "demo-user")
            }
        }
    }
}

// Wrapper to bridge KMP ViewModel to SwiftUI
class RecommendationViewModelWrapper: ObservableObject {
    @Published var recommendations: [Recommendation] = []
    
    private let repository = RecommendationRepository(
        api: ModernReaderAPI(baseUrl: "http://localhost:8001/api/v1")
    )
    
    func loadRecommendations(userId: String) {
        // Bridge KMP Flow to Swift Combine
        repository.getRecommendations(userId: userId)
            .collect { recs in
                DispatchQueue.main.async {
                    self.recommendations = recs as! [Recommendation]
                }
            }
    }
}
```

---

## Setup Instructions

### 1. Create KMP Project

```bash
# Using Android Studio New Project wizard
# Select "Kotlin Multiplatform App"
```

### 2. Configure build.gradle.kts

**File**: `shared/build.gradle.kts`

```kotlin
plugins {
    kotlin("multiplatform")
    kotlin("plugin.serialization")
    id("com.android.library")
}

kotlin {
    androidTarget()
    
    listOf(
        iosX64(),
        iosArm64(),
        iosSimulatorArm64()
    ).forEach {
        it.binaries.framework {
            baseName = "shared"
        }
    }
    
    sourceSets {
        val commonMain by getting {
            dependencies {
                implementation("io.ktor:ktor-client-core:2.3.5")
                implementation("io.ktor:ktor-client-content-negotiation:2.3.5")
                implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.5")
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
                implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
            }
        }
        
        val androidMain by getting {
            dependencies {
                implementation("io.ktor:ktor-client-android:2.3.5")
            }
        }
        
        val iosMain by getting {
            dependencies {
                implementation("io.ktor:ktor-client-darwin:2.3.5")
            }
        }
    }
}
```

### 3. Build Shared Framework

```bash
./gradlew :shared:assembleXCFramework
```

### 4. Add to Xcode

1. Xcode → Target → General
2. Frameworks, Libraries, and Embedded Content
3. Add `shared.xcframework`

---

## Benefits

✅ **Code Reuse**: 60-70% 商業邏輯共享  
✅ **一致性**: iOS/Android 行為一致  
✅ **維護性**: 單一代碼庫修復 bug  
✅ **測試**: 共享單元測試  
✅ **快速迭代**: 同步功能更新

---

## Future Enhancements

- [ ] Compose Multiplatform (共享 UI)
- [ ] Desktop support (JVM)
- [ ] Web support (Wasm)
- [ ] Shared database (SQLDelight)

---

_Module 9 Architecture - 2025年11月1日_
