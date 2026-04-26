import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "YOUTUBE_API_KEY is not configured on the server." });
    }
    
    const channelId = "UC20ns0anAsbj_UFlhVnfu3A"; // 逆転ログ
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
}
