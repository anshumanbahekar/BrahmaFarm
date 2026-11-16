# Firebase integration plan

Firebase configuration will be added after the client apps are reviewed. This document fixes the data and security design in advance, without embedding project credentials or claiming that sync is active.

## Services

1. **Firebase Authentication:** sign in with email or a supported identity provider. Anonymous accounts should not be used for company records because they cannot reliably identify a person across devices.
2. **Cloud Firestore:** the source of truth for farms, membership, fields, records, crop cycles, tasks, and audit events. Enable offline persistence for web and native clients, then reconcile changes when online.
3. **Cloud Storage:** photos, soil reports, invoices, and research attachments. Validate file type and size server-side.
4. **Cloud Functions:** trusted operations for invitations, imports, weather/market ingestion, and AI research. Model keys remain server-side.
5. **App Check:** abuse protection once the client platforms are registered.

## Proposed collections

```text
farms/{farmId}                      ownerUid, name, currency, timezone, createdAt
farms/{farmId}/members/{uid}        role: owner | manager | editor | viewer
farms/{farmId}/fields/{fieldId}     name, areaAcres, soil, waterSource
farms/{farmId}/records/{recordId}   date, fieldId, crop, activity, quantity, unit,
                                   cycleId, waterLitres, costINR, revenueINR, health, notes,
                                   createdBy, createdAt, updatedAt, revision
farms/{farmId}/cropCycles/{cycleId} fieldId, crop, plantingDate, harvestDate, status
farms/{farmId}/tasks/{taskId}       title, fieldId, dueDate, status, assigneeUid
farms/{farmId}/plans/{planId}       crop, fieldId, month, area, yield, price, cost,
                                   waterBudget, savedBy, savedAt
farms/{farmId}/research/{reportId} question, evidenceRefs, sources, answer, caveats
farms/{farmId}/audit/{eventId}      actorUid, action, documentPath, timestamp
```

`recordId` is a client-generated UUID. Each record needs `updatedAt` and `revision` for conflict handling. Local financial analysis already attributes linked costs, water, harvest, and sales to crop cycles. The month matrix groups dated entries and is labelled as historical recorded cash flow.

## Migration from this release

1. Export complete JSON backups from every device before enabling sync. CSV omits cycle links, tasks, and saved plans.
2. Create a farm and its owner membership using a trusted bootstrap flow.
3. Import fields, records, cycles, tasks, and plans; map field names to stable `fieldId` values. Preserve local IDs where possible, validate cycle links, and deduplicate overlapping device backups with user review.
4. Add a sync adapter behind the current `load`/`save` boundary. Keep a local queue for offline edits and show sync status in the UI.
5. Test conflicts, permission changes, account recovery, and sign-out on all four platforms before turning on production sync.

## Security

The draft `firebase/firestore.rules` restricts farm data to members and writes to owner, manager, or editor roles. It has **not been deployed or tested against a Firebase project**. Expand it with document validation and Storage rules before production. Never trust a client-supplied role or a client-side AI answer for authorization.

## AI research

A Cloud Function can assemble the user's question, selected crop cycles, weather and market observations, and fetched research sources. It should return a structured answer containing: recommendation, evidence from farm records, external citations, missing information, confidence/limits, and safer next checks. It should state when evidence is insufficient. Do not auto-apply pesticide, irrigation, or financial decisions from model output. Keep model calls and source retrieval on the server; log source URLs and timestamps for review.
