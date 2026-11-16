# BrahmaFarm product roadmap

## 1. Farm ledger and analysis — current release

Fields, dated farm activity, water, costs, revenue, health observations, CSV backup, month and crop views, and evidence-labelled guidance are implemented. The shared interface runs on web, Android Java, iOS Swift, and Windows WPF.

## 2. Cloud foundation

Firebase Auth, farm membership and roles, Firestore sync, offline conflict handling, audit history, attachments, and automated backup. This stage starts when the Firebase project and app registrations are available.

## 3. Crop-cycle operations

Link each planting, input, irrigation, health event, harvest, and sale to a crop cycle and field. Add inventory, recurring tasks, labour, equipment, expenses, soil tests, and field-level yield. Provide cost per acre, profit per cycle, yield per acre, and water per harvested kilogram with coverage warnings.

## 4. Decision support

Weather and evapotranspiration data, local market prices, crop calendars, soil constraints, and user-entered irrigation capacity. Separate **observed** results, **scenario estimates**, and **forecasts**. Show the source, date, geographic scope, and uncertainty of each input. Compare candidate crops by expected net margin and downside risk, including a “not enough data” result.

## 5. AI and deep research

Server-side research agent with source retrieval, farm-record references, citations, and a review trail. It should challenge weak plans, acknowledge when a choice is already sound, and ask for missing field facts. Agronomy or pesticide recommendations require reliable regional sources and human review.

## 6. Sensors and advanced operations

Optional soil moisture and irrigation meter ingestion, satellite imagery, photo observations, alerts, and multi-farm reporting. Add these only after the ledger and cloud identity are reliable.

## Quality gates

- No fabricated prices, diagnoses, or weather data.
- Every recommendation identifies the records and sources it used.
- Missing values stay unknown; the UI never silently treats them as measurements.
- Costs and sales are attributed to crop cycles before calling a crop “profitable.”
- Backups, auditability, and permissions are verified before company-wide use.
