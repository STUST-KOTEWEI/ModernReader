# Module 7: ARKit 全感官體驗架構

> **Status**: Architecture Design Complete  
> **Platform**: iOS 17+, visionOS 1.0+  
> **Technologies**: ARKit 6, RealityKit 4, Haptics

---

## Overview

Module 7 提供沉浸式 AR 閱讀體驗，將文化場景、3D 圖騰與觸覺回饋整合到學習流程中。

---

## Core Features

### 1. AR Scene Management
- 文化場景渲染（台灣原住民文化）
- 3D 文字浮現效果
- 環境光適應
- 空間音訊定位

### 2. Haptic Feedback
- 閱讀里程碑觸覺回饋
- 認知負荷警告振動
- 手勢操作觸覺確認

### 3. Cultural Artifact Display
- 3D 圖騰模型
- 互動式文物介紹
- 語音導覽

---

## Architecture

```swift
// File: Sources/ModernReader/AR/ARSessionManager.swift
import ARKit
import RealityKit

class ARSessionManager: ObservableObject {
    @Published var arView: ARView?
    @Published var currentScene: ARScene?
    
    func loadCulturalScene(name: String) async throws {
        let scene = try await Entity.load(named: name)
        arView?.scene.addAnchor(scene)
    }
    
    func displayFloatingText(text: String, at position: SIMD3<Float>) {
        let textEntity = ModelEntity(mesh: .generateText(text))
        textEntity.position = position
        arView?.scene.addAnchor(textEntity)
    }
}
```

---

## 3D Asset Requirements

### Models
- **Format**: USDZ, Reality Composer scenes
- **Textures**: PBR materials (BaseColor, Normal, Metallic, Roughness)
- **Polygon count**: < 50k triangles per model
- **File size**: < 10MB compressed

### Example Assets
1. `taiwanese_totem_01.usdz` - 泰雅族圖騰
2. `reading_space_forest.rcproject` - 森林閱讀空間
3. `ocean_learning_env.rcproject` - 海洋學習環境

---

## Haptic Patterns

```swift
// File: Sources/ModernReader/Haptics/HapticManager.swift
import CoreHaptics

class HapticManager {
    private var engine: CHHapticEngine?
    
    func playMilestoneHaptic() {
        // Success pattern: 短促脈衝 x3
        let events = [
            CHHapticEvent(eventType: .hapticTransient, parameters: [], relativeTime: 0),
            CHHapticEvent(eventType: .hapticTransient, parameters: [], relativeTime: 0.2),
            CHHapticEvent(eventType: .hapticTransient, parameters: [], relativeTime: 0.4)
        ]
        playPattern(events)
    }
    
    func playOverloadWarning() {
        // Warning pattern: 持續振動 2 秒
        let event = CHHapticEvent(
            eventType: .hapticContinuous,
            parameters: [
                CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.8),
                CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.5)
            ],
            relativeTime: 0,
            duration: 2.0
        )
        playPattern([event])
    }
}
```

---

## visionOS Integration

```swift
// File: Sources/ModernReader/Vision/ImmersiveReadingSpace.swift
#if os(visionOS)
import SwiftUI
import RealityKit

struct ImmersiveReadingSpace: View {
    @State private var immersionStyle: ImmersionStyle = .mixed
    
    var body: some View {
        RealityView { content in
            // Load 3D reading environment
            let scene = try await Entity.load(named: "ReadingSpace")
            content.add(scene)
        }
        .immersionStyle(selection: $immersionStyle, in: .mixed, .progressive, .full)
    }
}
#endif
```

---

## Setup Instructions

### 1. Add ARKit Capability
- Xcode → Target → Signing & Capabilities
- Add "ARKit" capability

### 2. Info.plist
```xml
<key>NSCameraUsageDescription</key>
<string>ModernReader uses AR to create immersive reading experiences.</string>
<key>UIRequiredDeviceCapabilities</key>
<array>
    <string>arkit</string>
</array>
```

### 3. Import 3D Assets
1. Add `.usdz` files to Xcode project
2. Or use Reality Composer to create scenes
3. Export as `.rcproject` or `.reality` files

---

## Future Enhancements

- [ ] Multi-user AR reading sessions
- [ ] Persistent AR anchors (Cloud Anchors)
- [ ] AI-generated 3D scenes
- [ ] Hand tracking for gesture-based navigation

---

_Module 7 Architecture - 2025年11月1日_
