# BrahmaFarm product roadmap

## 1. Farm ledger and analysis — implemented locally

Fields, dated farm activity, water, costs, revenue, health observations, CSV and JSON backup, month and crop views, and evidence-labelled guidance are implemented. The shared interface runs on web, Android Java, iOS Swift, and Windows WPF.

## 2. Cloud foundation

Firebase Auth, farm membership and roles, Firestore sync, offline conflict handling, audit history, attachments, and automated backup. This stage starts when the Firebase project and app registrations are available.

## 3. Crop-cycle operations — foundation implemented

Crop cycles now link farm activities to fields and show recorded revenue, costs, net, water, harvest weight, and yield per acre. The workboard handles dated tasks and priorities. Next: inventory, recurring tasks, labour, equipment, detailed expenses, soil tests, and cycle-level coverage checks.

## 4. Decision support — scenario calculator implemented

The current planner computes break-even, expected net, water budget, and a downside case from the user's own inputs. Next: weather and evapotranspiration data, local market prices, crop calendars, soil constraints, irrigation capacity, and source-labelled comparisons across crops. Keep **observed** results, **scenario estimates**, and **forecasts** distinct.

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
