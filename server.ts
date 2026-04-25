import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import "dotenv/config";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes FIRST
  app.get("/api/youtube-stats", async (req, res) => {
    try {
      const apiKey = process.env.YOUTUBE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "YOUTUBE_API_KEY is not configured on the server." });
      }
      
      const channelId = "UC20ns0anAsbj_UFlhVnfu3A";
      const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        console.error("YouTube API Error:", data);
        return res.status(500).json({ error: data?.error?.message || "YouTube API error" });
      }
      
      if (data.items && data.items.length > 0) {
        const stats = data.items[0].statistics;
        res.json({
          subscriberCount: parseInt(stats.subscriberCount, 10),
          viewCount: parseInt(stats.viewCount, 10)
        });
      } else {
        res.status(404).json({ error: "Channel not found" });
      }
    } catch (error) {
      console.error("Error fetching YouTube stats:", error);
      res.status(500).json({ error: "Failed to fetch YouTube stats" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();