# BrahmaSpreadsheet

BrahmaSpreadsheet is the first working part of BrahmaFarm: a shared, offline-capable farm ledger and analysis interface for web, Android (Java), iOS (Swift), and Windows (.NET). The same `dist/` app runs on all four platforms, so the columns, calculations, and workflows stay consistent.

## What works now

- Editable spreadsheet of dated farm records: field, crop, activity, quantity, water, cost, revenue, health, and notes.
- Add and remove fields; add, edit, filter, search, and delete records.
- Complete JSON backup/restore for fields and records, plus CSV import/export for spreadsheet exchange between devices.
- Dashboard with recorded profit, revenue, water, health, recent activity, and monthly profit.
- Crop by month profit matrix, crop comparisons, and recommendations with the record counts behind them.
- Research briefs that summarize relevant farm records, show missing evidence, and link to searches in FAO, ICAR, and Google Scholar.
- Installable web PWA and bundled Android, iOS, and Windows apps.

The initial dataset is **illustrative** and is labelled inside the app. Use **Start with my farm** to clear it. The advice engine is deterministic and based on entered records. It does not currently call an AI model, diagnose plant disease, forecast market prices, or fetch live weather. The research desk is a structured helper, not a live deep-research agent.

## Data and privacy

Until Firebase is connected, each installation stores its own records locally. The web app uses browser storage; native packages use their embedded web view's persistent storage. Records **do not sync across devices yet**. Export a complete JSON backup regularly. Do not clear browser/app data without a backup. The app has no account system in this version.

The CSV column order is `date,field,crop,activity,quantity,unit,water,cost,revenue,health,notes`. It contains records only; use JSON for a complete backup including field areas. Dates use `YYYY-MM-DD`; empty numeric cells mean unknown. Costs and revenue are in INR, water in litres, and harvest efficiency requires a `Harvest` row with quantity in `kg`.

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

[docs/ROADMAP.md](docs/ROADMAP.md) lays out the next farm modules and the evidence standards for AI advice. This release establishes the ledger and analysis foundation; it is not a complete farm ERP or agronomy decision system.
