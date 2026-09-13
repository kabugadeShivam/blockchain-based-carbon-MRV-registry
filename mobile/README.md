# Mobile field app blueprint

The SIH proposal calls for a React Native mobile app with offline + low-bandwidth support. This folder defines the field-app contract without forcing the web MVP to depend on a second runtime.

## Field workflow

1. NGO/Panchayat signs in with OTP.
2. Select project or create a new project.
3. Capture GPS coordinates and accuracy.
4. Capture timestamped photos/evidence.
5. Enter measurement observations.
6. Build an offline upload pack containing metadata + local evidence hashes.
7. When connectivity returns, sync the pack to `/api/evidence/hash`, `/api/projects` and `/api/mrv`.
8. Show sync status and verifier feedback.

## Planned sensor adapter

The app should accept future telemetry from soil-moisture and salinity sensors using a simple adapter interface:

`SensorReading { sensorId, projectId, metric, value, unit, capturedAt, latitude, longitude }`

Hardware integration is intentionally decoupled from the core registry so the SIH software demo remains runnable without physical devices.

## Low-bandwidth principles

- Compress images before upload.
- Queue evidence locally.
- Send metadata before large files.
- Retry failed uploads.
- Never put raw photos or large sensor payloads on-chain.
- Anchor only cryptographic proofs and final verification outcomes.
