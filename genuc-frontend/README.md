# GENUC Frontend

SPA React 19 pour la Plateforme Nationale de Gestion Universitaire.

## Prérequis

- Node.js 20+
- npm 9+

## Installation

```bash
npm install
cp .env.example .env
```

## Développement

```bash
npm start
# http://localhost:3000
```

## Build

```bash
npm run build
```

## Tests

```bash
npm test -- --watchAll=false
```

## Structure

```
src/
├── api/              # Axios instances and endpoints config
├── components/       # Shared UI components
├── context/          # Auth, Theme, i18n contexts
├── hooks/            # Custom React hooks
├── layouts/          # Role-specific layouts
├── pages/            # Role-based pages organized by domain
├── services/         # API service modules
├── styles/           # CSS themes, variables, utilities
└── utils/            # Validators, formatters, interceptors
```
