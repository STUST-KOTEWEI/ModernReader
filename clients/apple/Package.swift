// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "ModernReaderApple",
    defaultLocalization: "en",
    platforms: [
        .iOS(.v17),
        .macOS(.v14),
        .watchOS(.v10)
    ],
    products: [
        .library(name: "ModernReaderUI", targets: ["ModernReaderUI"]),
        .library(name: "ModernReaderServices", targets: ["ModernReaderServices"]),
        .library(name: "ModernReaderWatch", targets: ["ModernReaderWatch"])
    ],
    targets: [
        .target(
            name: "ModernReaderServices",
            resources: [.process("Resources")]
        ),
        .target(
            name: "ModernReaderUI",
            dependencies: ["ModernReaderServices"]
        ),
        .target(
            name: "ModernReaderWatch",
            dependencies: ["ModernReaderServices"]
        ),
        .testTarget(
            name: "ModernReaderUITests",
            dependencies: ["ModernReaderUI"]
        )
    ]
)
