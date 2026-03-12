# Symbolly CRM

CRM complet de gestion des leads — Next.js 14 App Router, shadcn/ui, Tailwind CSS, stockage JSON local.

## Démarrage rapide

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

## Accès

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Landing page leads |
| http://localhost:3000/login | Connexion CRM |
| http://localhost:3000/crm | Dashboard |
| http://localhost:3000/crm/leads | Liste des leads |
| http://localhost:3000/crm/agenda | Planning journalier |
| http://localhost:3000/crm/parametres | Paramètres |

**Compte par défaut :**
- Email : `admin@symbolly.fr`
- Mot de passe : `admin123`

## Données locales

Stockées dans `/data/` (créé automatiquement) :
- `leads.json` — Tous les leads
- `users.json` — Comptes utilisateurs
- `settings.json` — Configuration (Telegram, agenda)

## Configuration Telegram

1. Créez un bot via [@BotFather](https://t.me/BotFather)
2. Récupérez le **Bot Token**
3. Ajoutez le bot à votre groupe et récupérez le **Chat ID**
4. `/crm/parametres` → Section Telegram → saisir token + chat ID → "Tester"

**Notifications automatiques :**
- 1h avant chaque RDV : alerte individuelle
- La veille à 20h : récapitulatif des RDV du lendemain

## Stack

- Next.js 14 App Router + TypeScript
- shadcn/ui + Tailwind CSS v4
- Recharts (graphiques dashboard)
- date-fns (dates)
- Stockage JSON local (pas de base de données externe)

## Uploads

Les pièces jointes sont stockées dans `/public/uploads/[lead_id]/`.
