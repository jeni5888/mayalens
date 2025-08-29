# MayaLens

Eine moderne Webanwendung für AI-gestützte Bildgenerierung und -bearbeitung.

## 🚀 Technologie-Stack

### Frontend
- React 18 mit TypeScript
- Vite als Build-Tool
- Tailwind CSS für Styling
- Framer Motion für Animationen
- Zustand für State Management
- React Router für Navigation

### Backend
- Node.js mit Express
- TypeScript
- Prisma ORM
- JWT für Authentifizierung
- Multer für Datei-Uploads
- Sharp für Bildverarbeitung
- Stripe für Zahlungen

## 🛠️ Lokale Entwicklung

### Voraussetzungen
- Node.js 20 oder höher
- npm oder yarn
- PostgreSQL Datenbank

### Installation

1. Repository klonen:
```bash
git clone <repository-url>
cd MayaLens
```

2. Abhängigkeiten installieren:
```bash
npm install
```

3. Umgebungsvariablen konfigurieren:
```bash
cp .env.example .env
# Bearbeiten Sie die .env-Datei mit Ihren Werten
```

4. Datenbank einrichten:
```bash
npm run db:push
```

5. Entwicklungsserver starten:
```bash
npm run dev
```

Die Anwendung ist dann verfügbar unter:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 🚂 Railway Deployment

### Automatisches Deployment über GitHub

1. **Repository zu GitHub pushen:**
```bash
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. **Railway Projekt erstellen:**
   - Gehen Sie zu [Railway](https://railway.app)
   - Klicken Sie auf "New Project"
   - Wählen Sie "Deploy from GitHub repo"
   - Verbinden Sie Ihr GitHub-Repository

3. **Umgebungsvariablen konfigurieren:**
   Fügen Sie folgende Variablen in Railway hinzu:
   ```
   DATABASE_URL=<your-postgresql-url>
   JWT_SECRET=<your-jwt-secret>
   NODE_ENV=production
   FRONTEND_URL=<your-railway-frontend-url>
   CORS_ORIGIN=<your-railway-frontend-url>
   ```

4. **Datenbank hinzufügen:**
   - Fügen Sie eine PostgreSQL-Datenbank zu Ihrem Railway-Projekt hinzu
   - Kopieren Sie die DATABASE_URL in Ihre Umgebungsvariablen

5. **Deployment:**
   - Railway erkennt automatisch die `railway.toml` Konfiguration
   - Das Deployment startet automatisch bei jedem Push zu main

### Manuelle Deployment-Befehle

```bash
# Build für Production
npm run build:all

# Datenbank-Migration
npm run db:migrate

# Server starten
npm start
```

## 📁 Projektstruktur

```
MayaLens/
├── api/                    # Backend-Code
│   ├── controllers/        # Route-Controller
│   ├── middleware/         # Express-Middleware
│   ├── routes/            # API-Routen
│   ├── utils/             # Hilfsfunktionen
│   └── server.ts          # Express-Server
├── src/                   # Frontend-Code
│   ├── components/        # React-Komponenten
│   ├── pages/            # Seiten-Komponenten
│   ├── hooks/            # Custom React Hooks
│   ├── utils/            # Hilfsfunktionen
│   └── main.tsx          # React-Einstiegspunkt
├── prisma/               # Datenbankschema
├── public/               # Statische Assets
├── uploads/              # Hochgeladene Dateien
├── .env.example          # Umgebungsvariablen-Template
├── railway.toml          # Railway-Konfiguration
├── Dockerfile            # Container-Konfiguration
└── package.json          # Projekt-Abhängigkeiten
```

## 🔧 Verfügbare Skripte

- `npm run dev` - Startet Frontend und Backend im Entwicklungsmodus
- `npm run build` - Erstellt Production-Build
- `npm run start` - Startet Production-Server
- `npm run lint` - Führt ESLint aus
- `npm run check` - TypeScript-Typprüfung
- `npm run db:push` - Pusht Datenbankschema
- `npm run db:migrate` - Führt Datenbankmigrationen aus

## 🌐 API-Endpunkte

### Authentifizierung
- `POST /api/auth/register` - Benutzerregistrierung
- `POST /api/auth/login` - Benutzeranmeldung
- `POST /api/auth/logout` - Benutzerabmeldung

### Bilder
- `GET /api/images` - Alle Bilder abrufen
- `POST /api/images/upload` - Bild hochladen
- `POST /api/images/generate` - AI-Bild generieren
- `DELETE /api/images/:id` - Bild löschen

### Benutzer
- `GET /api/users/profile` - Benutzerprofil abrufen
- `PUT /api/users/profile` - Benutzerprofil aktualisieren

## 🔒 Sicherheit

- JWT-basierte Authentifizierung
- CORS-Konfiguration
- Rate Limiting
- Datei-Upload-Validierung
- Umgebungsvariablen für sensible Daten

## 📝 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.

## 🤝 Beitragen

1. Fork das Repository
2. Erstellen Sie einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Committen Sie Ihre Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Pushen Sie zum Branch (`git push origin feature/AmazingFeature`)
5. Öffnen Sie eine Pull Request

## 📞 Support

Bei Fragen oder Problemen erstellen Sie bitte ein Issue im GitHub-Repository.