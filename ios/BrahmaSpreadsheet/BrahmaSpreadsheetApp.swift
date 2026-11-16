import SwiftUI
import WebKit

@main
struct BrahmaSpreadsheetApp: App {
    var body: some Scene {
        WindowGroup { FarmWebView() }
    }
}

struct FarmWebView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let controller = WKUserContentController()
        controller.add(context.coordinator, name: "brahma")
        let configuration = WKWebViewConfiguration()
        configuration.userContentController = controller
        configuration.websiteDataStore = .default()
        let view = WKWebView(frame: .zero, configuration: configuration)
        view.navigationDelegate = context.coordinator
        view.uiDelegate = context.coordinator
        view.isOpaque = false
        view.backgroundColor = UIColor(red: 0.969, green: 0.973, blue: 0.957, alpha: 1)
        view.scrollView.contentInsetAdjustmentBehavior = .never
        if let index = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "dist") {
            view.loadFileURL(index, allowingReadAccessTo: index.deletingLastPathComponent())
        }
        return view
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKScriptMessageHandler, WKNavigationDelegate, WKUIDelegate {
        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.name == "brahma",
                  let payload = message.body as? [String: Any],
                  payload["action"] as? String == "saveFile",
                  let content = payload["content"] as? String,
                  content.utf8.count <= 20_000_000 else { return }
            let suggestedName = payload["filename"] as? String ?? "brahmafarm-records.csv"
            let safeName = suggestedName.range(of: #"^[a-zA-Z0-9._-]+\.(csv|json)$"#, options: .regularExpression) != nil
                ? suggestedName : "brahmafarm-records.csv"
            let url = FileManager.default.temporaryDirectory.appendingPathComponent(safeName)
            do {
                try content.write(to: url, atomically: true, encoding: .utf8)
                DispatchQueue.main.async {
                    guard let root = UIApplication.shared.connectedScenes
                        .compactMap({ $0 as? UIWindowScene })
                        .flatMap({ $0.windows })
                        .first(where: { $0.isKeyWindow })?.rootViewController else { return }
                    let share = UIActivityViewController(activityItems: [url], applicationActivities: nil)
                    share.popoverPresentationController?.sourceView = root.view
                    share.popoverPresentationController?.sourceRect = CGRect(x: root.view.bounds.midX, y: root.view.bounds.maxY - 30, width: 1, height: 1)
                    root.present(share, animated: true)
                }
            } catch { print("CSV export failed: \(error)") }
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            if let url = navigationAction.request.url,
               let scheme = url.scheme,
               ["http", "https"].contains(scheme),
               navigationAction.navigationType == .linkActivated {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
            } else {
                decisionHandler(.allow)
            }
        }

        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                     for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if let url = navigationAction.request.url, ["http", "https"].contains(url.scheme ?? "") {
                UIApplication.shared.open(url)
            }
            return nil
        }
    }
}
