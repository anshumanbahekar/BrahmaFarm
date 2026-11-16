# BrahmaFarm project instructions

- The working app is in `dist/`. Android Java, iOS Swift, and Windows WPF package these same files. Keep platform shells and the shared app compatible.
- The user's source repository is `https://github.com/anshumanbahekar/BrahmaFarm`. After a verified change, commit and push the updated source to its `main` branch. Keep the private Sites deployment current with the same source state unless the user asks for local-only work.
- Preserve `.openai/hosting.json` and its existing project ID. Do not create a replacement Site for this project.
- Firebase configuration will be supplied later. Keep credentials, service-account files, and model keys out of Git and client bundles.
- Clearly distinguish recorded results from forecasts, research, and sample data. Do not present rules-based advice as live AI analysis.
