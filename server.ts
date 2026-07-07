import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory database for leaderboard
  interface LeaderboardEntry {
    id: string;
    name: string;
    score: number;
    timeMs: number;
    createdAt: number;
  }

  let leaderboard: LeaderboardEntry[] = [
    { id: "1", name: "CyberGamer_99", score: 500, timeMs: 42000, createdAt: Date.now() - 3600000 },
    { id: "2", name: "RootAccess", score: 400, timeMs: 48000, createdAt: Date.now() - 5400000 },
    { id: "3", name: "Defcon_Hero", score: 400, timeMs: 52000, createdAt: Date.now() - 7200000 },
    { id: "4", name: "NullPointer", score: 300, timeMs: 65000, createdAt: Date.now() - 10800000 },
    { id: "5", name: "PhishTerminator", score: 200, timeMs: 82000, createdAt: Date.now() - 14400000 }
  ];

  // API endpoints
  app.get("/api/leaderboard", (req, res) => {
    // Sort by score desc, then timeMs asc
    const sorted = [...leaderboard].sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.timeMs - b.timeMs;
    });
    res.json(sorted);
  });

  app.post("/api/leaderboard", (req, res) => {
    const { name, score, timeMs } = req.body;
    if (!name || typeof score !== "number" || typeof timeMs !== "number") {
      res.status(400).json({ error: "Invalid data fields" });
      return;
    }
    const newEntry: LeaderboardEntry = {
      id: Math.random().toString(36).substring(2, 9),
      name: name.substring(0, 20).trim(), // Truncate name
      score,
      timeMs,
      createdAt: Date.now()
    };
    leaderboard.push(newEntry);
    res.json({ success: true, entry: newEntry });
  });

  // Admin reset endpoint
  app.post("/api/leaderboard/reset", (req, res) => {
    leaderboard = [
      { id: "1", name: "CyberGamer_99", score: 500, timeMs: 42000, createdAt: Date.now() - 3600000 },
      { id: "2", name: "RootAccess", score: 400, timeMs: 48000, createdAt: Date.now() - 5400000 }
    ];
    res.json({ success: true });
  });

  // Serve static assets or development bundle
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
