const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors'); // Import CORS

const app = express();
const PORT = process.env.PORT || 3000;

// ENABLE CORS (Ito ang solusyon sa Failed to Fetch)
app.use(cors());

// Headers para hindi mahalata na bot tayo (Cloudflare bypass attempt)
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://hanime.tv/',
  'Origin': 'https://hanime.tv',
  'Connection': 'keep-alive'
};

app.get('/', (req, res) => {
  res.json({
    status: "Online",
    cors: "Enabled",
    message: "Pwede na mag-request galing sa localhost."
  });
});

/**
 * [GET] /api/home
 */
app.get('/api/home', async (req, res) => {
  try {
    console.log("Fetching Home Data...");
    const response = await axios.get('https://hanime.tv/api/v8/landing', {
      headers: HEADERS
    });
    
    const data = response.data;
    const sections = data.sections.map(section => ({
      title: section.title,
      videos: section.hentai_video_ids.map(id => {
        const video = data.hentai_videos.find(v => v.id === id);
        if (!video) return null;
        return {
          id: video.id,
          title: video.name,
          slug: video.slug,
          views: video.views,
          cover_url: video.cover_url,
          api_link: `${req.protocol}://${req.get('host')}/api/video/${video.slug}`
        };
      }).filter(Boolean)
    }));
    
    res.json({ success: true, sections });
    
  } catch (error) {
    console.error('Home Error:', error.message);
    // Ibalik ang error details para makita sa frontend kung bakit
    res.status(500).json({
      success: false,
      error: "Failed to fetch home data",
      details: error.message
    });
  }
});

/**
 * [GET] /api/video/:slug
 */
app.get('/api/video/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    console.log(`Fetching Video: ${slug}`);
    const targetUrl = `https://hanime.tv/videos/hentai/${slug}`;
    
    const { data: html } = await axios.get(targetUrl, { headers: HEADERS });
    
    const $ = cheerio.load(html);
    const pageTitle = $('title').text();
    
    // Regex para sa m3u8
    const m3u8Pattern = /"url":"(https:[^"]+?\.m3u8[^"]*?)"/g;
    
    const matches = [];
    let match;
    while ((match = m3u8Pattern.exec(html)) !== null) {
      const cleanUrl = match[1].replace(/\\u002F/g, "/");
      matches.push(cleanUrl);
    }
    
    const uniqueStreams = [...new Set(matches)];
    
    if (uniqueStreams.length === 0) {
      return res.status(404).json({ success: false, message: "No streams found (Premium or Changed Layout)" });
    }
    
    res.json({
      success: true,
      title: pageTitle,
      slug: slug,
      streams: uniqueStreams.map((url, index) => ({
        id: index + 1,
        url: url
      }))
    });
    
  } catch (error) {
    console.error('Video Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});