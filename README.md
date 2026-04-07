# CyberSafe Office

CyberSafe Office is a beginner-friendly workplace cybersecurity game for office workers and other non-technical participants.

It includes:

- a participant game
- a supervisor dashboard
- score and activity tracking
- a downloadable certificate
- local and remote data collection support

## Main Files

- `index.html`
  Supervisor dashboard

- `participant-only.html`
  Participant game page

- `participant-play.html`
  Redirect launcher for participant play

- `supervisor-dashboard.html`
  Redirect launcher for the dashboard

- `styles.css`
  Visual design, layout, and animation

- `script.js`
  Game logic, tasks, explanations, sound, result saving, and certificate generation

- `server.js`
  Backend server for local or remote data collection

- `render.yaml`
  Render deployment blueprint with a web service and Postgres database

## How To Run Locally

### Beginner method

1. Open the `cybersafe-office` folder.
2. Double-click `start-local-server.bat`.
3. Keep that window open.
4. Open `http://localhost:3000/participant` for the participant game.
5. Open `http://localhost:3000/` for the supervisor dashboard.

### Manual method

1. Open a terminal in the `cybersafe-office` folder.
2. Run:

```powershell
node server.js
```

3. Open these links in your browser:

- Participant game: [http://localhost:3000/participant](http://localhost:3000/participant)
- Supervisor dashboard: [http://localhost:3000/](http://localhost:3000/)

## Storage Modes

The project now supports two storage modes:

### Local mode

If no `DATABASE_URL` is set, the server stores results in:

- `data/submissions.json`

This is good for:

- coursework demos
- classroom sessions
- local supervision

### Remote mode

If `DATABASE_URL` is set, the server automatically uses PostgreSQL.

This is better for:

- remote participants
- public sharing
- longer studies
- safer result persistence online

## How To Share With Remote Participants

The easiest beginner-friendly option is Render.

### What the links will be

After deployment:

- participant link: `https://your-app.onrender.com/participant`
- supervisor link: `https://your-app.onrender.com/`

### Deployment steps

1. Put this project in a GitHub repository.
2. Sign in to Render.
3. Choose `New` then `Blueprint`.
4. Connect your GitHub repo.
5. Render will detect `render.yaml`.
6. Create the blueprint.
7. Wait for the web service and database to finish deploying.
8. Open your public Render URL.

The project is already prepared so Render can:

- create the Node web service
- create a free Postgres database
- pass the database connection string to the app through `DATABASE_URL`

## What The Supervisor Dashboard Shows

The dashboard is designed for supervision and review.

It shows:

- participant name
- score
- correct answers
- wrong answers
- retries
- time taken
- risk level
- rating
- start and finish time
- task-by-task attempt summary

## How The Game Flow Works

1. The participant enters their name.
2. The participant completes the cybersecurity tasks.
3. After each task, the game explains the correct answer.
4. At the end, the score is saved to the backend.
5. The participant can download a certificate.
6. The supervisor can review the result on the dashboard.

## The Tasks Included

1. Phishing
2. Password Strength
3. Device Security
4. IDS Detection
5. IPS Prevention
6. Fail2Ban
7. USB Safety
8. MFA Push Fatigue
9. Safe Wi-Fi And VPN
10. Screen Lock
11. Data Classification
12. Safe Website Check
13. Backup Builder
14. Incident Response Order

## How To Zip For Submission

### Easiest method

1. Double-click `create-submission-zip.bat`
2. Submit `cybersafe-office-submission.zip`

The zip helper now skips `node_modules`, so the submission file stays cleaner and smaller.

## Project Submission Contents

Include these files for submission:

- `index.html`
- `participant-only.html`
- `participant-play.html`
- `supervisor-dashboard.html`
- `styles.css`
- `script.js`
- `server.js`
- `package.json`
- `package-lock.json`
- `render.yaml`
- `README.md`
- `data/submissions.json`

## Helpful Notes

- The supervisor dashboard is the main entry page.
- The participant game is the participant-only page.
- Remote result storage works when `DATABASE_URL` is available.
- If database connection fails, the server falls back to local JSON storage so the app can still run for testing.

## Official Render Docs

- [Render docs](https://render.com/docs)
- [Render Blueprint YAML reference](https://render.com/docs/blueprint-spec)
- [Render free instances](https://render.com/docs/free)
- [Render Postgres](https://render.com/docs/postgresql)
