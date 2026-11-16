# BrahmaFarm

BrahmaFarm is a local-first farm operations app for web, Android (Java), iOS (Swift), and Windows (.NET). The same `dist/` interface runs on all four platforms, so records and calculations stay consistent. BrahmaSpreadsheet is its editable farm ledger.

## What works now

- Editable spreadsheet of dated farm records: field, crop cycle, activity, quantity, water, cost, revenue, health, and notes. Search, filter, import, export, and edit cells in place.
- Crop cycles with linked planting, irrigation, health, harvest, expense, and sale records. Each cycle shows recorded costs, revenue, net, water, harvested weight, and yield per acre. Matching older rows can be linked after review.
- Field and water views with water by field, per-acre water, latest observed health, and field activity.
- Quick logging for irrigation, health checks, harvests, and sales, with required measurements for each activity.
- Farm workboard with due dates, priorities, completion, and reopening.
- Crop planner that calculates estimated net, break-even selling price, water budget, and a fixed downside scenario from **user-entered assumptions**. Plans can be saved and reopened.
- Record quality checks for missing links, area, measured water, harvest weight, and sale amounts.
- Complete JSON backup/restore for fields, records, crop cycles, tasks, and saved plans. CSV import/export exchanges ledger rows.
- Dashboard with recorded net, revenue, water, health, recent activity, and monthly cash flow.
- Crop by month net matrix, crop comparisons, cycle economics, and recommendations with their data basis.
- Research briefs that summarize relevant farm records, show missing evidence, and link to searches in FAO, ICAR, and Google Scholar.
- Installable web PWA and bundled Android, iOS, and Windows apps.

The initial dataset is **illustrative** and labelled inside the app. Use **Start with my farm** to clear it. The advice engine is deterministic and based on entered records. It does not currently call an AI model, diagnose plant disease, forecast market prices, or fetch live weather. The research desk is a structured helper, not a live deep-research agent.

## Data and privacy

Until Firebase is connected, each installation stores its own records locally. The web app uses browser storage; native packages use their embedded web view's persistent storage. Records **do not sync across devices yet**. Export a complete JSON backup regularly. Do not clear browser/app data without a backup. The app has no account system in this version.

The CSV column order is `date,field,crop,activity,quantity,unit,water,cost,revenue,health,notes`. It contains records only and does not carry crop-cycle links; use JSON for a complete backup. Dates use `YYYY-MM-DD`; empty numeric cells mean unknown. Costs and revenue are in INR, water in litres, and harvest efficiency requires a `Harvest` row with quantity in `kg`.

## Run and build

### Web

Serve `dist/` from any static HTTPS host. For local preview:

```sh
python -m http.server 4173 --directory dist
```

Open `http://localhost:4173`. The service worker enables offline launch after the first visit.

### Android

Open `android/` in Android Studio, or run `./gradlew assembleDebug` from that directory with Android SDK 34 and JDK 17 or newer. The Java `MainActivity` uses AndroidX WebViewAssetLoader to serve bundled `dist/` assets from a safe HTTPS-like origin. CSV import uses the system file picker; export uses the system save dialog. A debug APK appears under `android/app/build/outputs/apk/debug/`.

### iOS

Open `ios/BrahmaSpreadsheet.xcodeproj` in Xcode on a Mac and select a simulator or signing team. The SwiftUI app bundles `dist/` in a persistent WKWebView. CSV export opens the iOS share sheet. iOS compilation and device behavior require Xcode and could not be verified on this Windows machine.

### Windows

Run `dotnet build windows/BrahmaSpreadsheet.csproj -c Release` with .NET 10 SDK. Launch the generated `BrahmaSpreadsheet.exe` from `windows/bin/Release/net10.0-windows/`. The WPF app uses WebView2 and maps the bundled app files to a local virtual HTTPS host. CSV export uses the native save dialog. Microsoft Edge WebView2 Runtime must be installed.

## Firebase integration boundary

The intended cloud design is documented in [docs/FIREBASE.md](docs/FIREBASE.md). Add the Firebase project configuration only after the app workflows and security rules are reviewed. Do not put service-account keys or model-provider keys in `dist/` or a native package.

## Product direction

[docs/ROADMAP.md](docs/ROADMAP.md) lists remaining company-scale modules and the evidence standards for future AI advice. This release is a working local farm operations system; cloud sync, live research, sensor feeds, and multi-user controls remain future work.
