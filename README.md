# ArcDraft

ArcDraft ist eine Demo-Plattform für AI-generierte Proposals bestehend aus einem React-Frontend und einem Node/Express-Backend.

## Features
- JWT-basiertes Auth-System mit Demo-User
- Template-Management inkl. strukturierter Sections & Variablen
- AI-Proposal-Generierung (Mock-Integration mit n8n-Webhooks)
- Proposal-Verwaltung inkl. Public Links, Passcode-Schutz & Statuswechsel
- Öffentliche Proposal-Ansicht mit E-Signatur und Analytics-Tracking
- Analytics-Dashboards (Overview & Proposal-spezifisch)
- Branding-, Security- und Automation-Einstellungen
- Integration Hooks (`emitIntegrationEvent`) für zukünftige Integrationen

## Entwicklung starten
### Backend
```bash
cd backend
npm install # bereits ausgeführt
npm run dev
```
Der Server läuft anschließend auf `http://localhost:4000`.

### Frontend
```bash
cd frontend
npm install # bereits ausgeführt
npm run dev -- --host
```
Die SPA läuft standardmäßig auf `http://localhost:5173` und nutzt `VITE_API_URL` (Default: `http://localhost:4000`).

## Demo Login
```
Email: demo@arcdraft.app
Passwort: password123
```

## Weitere Hinweise
- Die Daten werden In-Memory gehalten (kein Persistenzlayer)
- AI-Generierung ruft einen Mock statt eines echten n8n-Webhooks auf
- Signaturen werden als Base64 (gezeichnet) oder Text gespeichert und erzeugen Audit-Events

Viel Spaß beim Erkunden der ArcDraft Demo!
