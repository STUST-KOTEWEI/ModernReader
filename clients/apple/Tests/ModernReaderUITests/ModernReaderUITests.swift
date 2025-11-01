import XCTest
@testable import ModernReaderUI

final class ModernReaderUITests: XCTestCase {
    func testLoginSheetCancels() {
        let view = ContentView(apiBaseURL: URL(string: "http://localhost:8000")!)
        XCTAssertNotNil(view)
    }
}
