const http = require("http");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "submissions.json");
const DATABASE_URL = process.env.DATABASE_URL || "";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".zip": "application/zip",
};

let storageMode = DATABASE_URL ? "postgres" : "json";
let storageMessage = DATABASE_URL
  ? "Trying PostgreSQL storage."
  : "Using local JSON storage.";
let dbPool = null;

const storageReady = initializeStorage();

const server = http.createServer(async (req, res) => {
  try {
    await storageReady;

    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/api/health") {
      return sendJson(res, 200, {
        status: "ok",
        storage: storageMode,
        detail: storageMessage,
      });
    }

    if (req.method === "GET" && url.pathname === "/api/submissions") {
      const submissions = await readSubmissions();
      return sendJson(res, 200, submissions);
    }

    if (req.method === "GET" && url.pathname === "/api/submissions.csv") {
      const submissions = await readSubmissions();
      const csv = toCsv(submissions);
      res.writeHead(200, {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="cybersafe-office-submissions.csv"',
      });
      res.end(csv);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/submissions") {
      const body = await readRequestBody(req);
      const payload = JSON.parse(body || "{}");
      const record = sanitizeSubmission(payload);

      await saveSubmission(record);
      return sendJson(res, 201, {
        ok: true,
        id: record.id,
        storage: storageMode,
      });
    }

    if (req.method === "GET") {
      return serveStatic(url.pathname, res);
    }

    sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    sendJson(res, 500, {
      error: "Server error",
      detail: error.message,
      storage: storageMode,
    });
  }
});

server.listen(PORT, () => {
  console.log(`CyberSafe Office server running at http://localhost:${PORT}`);
});

async function initializeStorage() {
  if (!DATABASE_URL) {
    ensureDataStore();
    return;
  }

  try {
    dbPool = new Pool({
      connectionString: DATABASE_URL,
      ssl: shouldUseSsl() ? { rejectUnauthorized: false } : undefined,
    });

    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        participant_name TEXT NOT NULL,
        score INTEGER NOT NULL,
        risk INTEGER NOT NULL,
        correct_count INTEGER NOT NULL,
        wrong_count INTEGER NOT NULL,
        retries INTEGER NOT NULL,
        total_tasks INTEGER NOT NULL,
        rating TEXT NOT NULL,
        started_at TIMESTAMPTZ NULL,
        finished_at TIMESTAMPTZ NOT NULL,
        duration_seconds INTEGER NOT NULL,
        task_results JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    storageMode = "postgres";
    storageMessage = "Using PostgreSQL storage for remote participant results.";
  } catch (error) {
    storageMode = "json-fallback";
    storageMessage = `Database connection failed, falling back to JSON storage: ${error.message}`;
    dbPool = null;
    ensureDataStore();
  }
}

function ensureDataStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]", "utf8");
  }
}

async function readSubmissions() {
  if (dbPool) {
    const result = await dbPool.query(`
      SELECT
        id,
        participant_name,
        score,
        risk,
        correct_count,
        wrong_count,
        retries,
        total_tasks,
        rating,
        started_at,
        finished_at,
        duration_seconds,
        task_results
      FROM submissions
      ORDER BY finished_at DESC, created_at DESC
    `);

    return result.rows.map(mapDatabaseRow);
  }

  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveSubmission(record) {
  if (dbPool) {
    await dbPool.query(
      `
        INSERT INTO submissions (
          id,
          participant_name,
          score,
          risk,
          correct_count,
          wrong_count,
          retries,
          total_tasks,
          rating,
          started_at,
          finished_at,
          duration_seconds,
          task_results
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10::timestamptz,
          $11::timestamptz,
          $12,
          $13::jsonb
        )
      `,
      [
        record.id,
        record.participantName,
        record.score,
        record.risk,
        record.correctCount,
        record.wrongCount,
        record.retries,
        record.totalTasks,
        record.rating,
        record.startedAt || null,
        record.finishedAt,
        record.durationSeconds,
        JSON.stringify(record.taskResults),
      ]
    );
    return;
  }

  const submissions = await readSubmissions();
  submissions.unshift(record);
  fs.writeFileSync(DATA_FILE, JSON.stringify(submissions, null, 2), "utf8");
}

function sanitizeSubmission(payload) {
  return {
    id: `SUB-${Date.now()}`,
    participantName: String(payload.participantName || "Participant").slice(0, 120),
    score: toNumber(payload.score),
    risk: toNumber(payload.risk),
    correctCount: toNumber(payload.correctCount),
    wrongCount: toNumber(payload.wrongCount),
    retries: toNumber(payload.retries),
    totalTasks: toNumber(payload.totalTasks),
    rating: String(payload.rating || ""),
    startedAt: normalizeIsoDate(payload.startedAt),
    finishedAt: normalizeIsoDate(payload.finishedAt) || new Date().toISOString(),
    durationSeconds: toNumber(payload.durationSeconds),
    taskResults: Array.isArray(payload.taskResults) ? payload.taskResults.map(sanitizeTaskResult) : [],
  };
}

function sanitizeTaskResult(task) {
  return {
    id: String(task?.id || ""),
    name: String(task?.name || "Task"),
    success: Boolean(task?.success),
    attempts: toNumber(task?.attempts || 1),
    retriesUsed: toNumber(task?.retriesUsed || 0),
  };
}

function mapDatabaseRow(row) {
  return {
    id: row.id,
    participantName: row.participant_name,
    score: row.score,
    risk: row.risk,
    correctCount: row.correct_count,
    wrongCount: row.wrong_count,
    retries: row.retries,
    totalTasks: row.total_tasks,
    rating: row.rating,
    startedAt: row.started_at ? new Date(row.started_at).toISOString() : "",
    finishedAt: row.finished_at ? new Date(row.finished_at).toISOString() : "",
    durationSeconds: row.duration_seconds,
    taskResults: Array.isArray(row.task_results) ? row.task_results : [],
  };
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function serveStatic(requestPath, res) {
  let safePath = requestPath === "/" ? "/index.html" : requestPath;

  if (safePath === "/participant") {
    safePath = "/participant-only.html";
  }

  if (safePath === "/supervisor") {
    safePath = "/index.html";
  }

  const resolved = path.normalize(path.join(ROOT, safePath));

  if (!resolved.startsWith(ROOT)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  if (!fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const ext = path.extname(resolved).toLowerCase();
  const mimeType = MIME_TYPES[ext] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": mimeType });
  fs.createReadStream(resolved).pipe(res);
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large"));
      }
    });

    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function toCsv(submissions) {
  const header = [
    "id",
    "participantName",
    "score",
    "risk",
    "correctCount",
    "wrongCount",
    "retries",
    "totalTasks",
    "rating",
    "startedAt",
    "finishedAt",
    "durationSeconds",
  ];

  const lines = [header.join(",")];

  submissions.forEach((item) => {
    const row = [
      item.id,
      item.participantName,
      item.score,
      item.risk,
      item.correctCount,
      item.wrongCount,
      item.retries,
      item.totalTasks,
      item.rating,
      item.startedAt,
      item.finishedAt,
      item.durationSeconds,
    ].map(csvEscape);

    lines.push(row.join(","));
  });

  return lines.join("\n");
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeIsoDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function shouldUseSsl() {
  return ["true", "1", "require"].includes(String(process.env.DATABASE_SSL || process.env.PGSSLMODE || "").toLowerCase());
}
