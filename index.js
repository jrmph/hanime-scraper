const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

// Standard headers to look like a real browser (To bypass basic Cloudflare checks)
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Referer': 'https://hanime.tv/',
  'Origin': 'https://hanime.tv'
};

app.get('/', (req, res) => {
  res.json({
    status: "Active",
    mode: "Lightweight (No Puppeteer)",
    endpoints: {
      home: "/api/home",
      video: "/api/video/:slug"
    }
  });
});

/**
 * [GET] /api/home
 * Uses Hanime's internal API directly. No HTML scraping needed.
 */
app.get('/api/home', async (req, res) => {
  try {
    // Direct call to the API endpoint Hanime uses for its homepage
    const response = await axios.get('https://hanime.tv/api/v8/landing', {
      headers: HEADERS
    });
    
    const data = response.data;
    
    // Process sections
    const sections = data.sections.map(section => ({
      title: section.title,
      videos: section.hentai_video_ids.map(id => {
        // The API returns a lookup object 'hentai_videos' 
        // We need to find the matching ID in that array or object
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
    console.error('Home API Error:', error.message);
    res.status(500).json({ success: false, error: "Failed to fetch home data. Cloudflare might be blocking requests." });
  }
});

/**
 * [GET] /api/video/:slug
 * Scrapes HTML text to find the m3u8 link using Regex.
 */
app.get('/api/video/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const targetUrl = `https://hanime.tv/videos/hentai/${slug}`;
    
    // 1. Fetch the raw HTML
    const { data: html } = await axios.get(targetUrl, { headers: HEADERS });
    
    // 2. Load into Cheerio (optional, mainly to check title)
    const $ = cheerio.load(html);
    const pageTitle = $('title').text();
    
    // 3. THE MAGIC: Regex search for the m3u8 link in the raw HTML script
    // Nuxt stores data in window.__NUXT__. We look for the streams URL pattern.
    // Pattern matches: "url":"https://... .m3u8..."
    const m3u8Pattern = /"url":"(https:[^"]+?\.m3u8[^"]*?)"/g;
    
    const matches = [];
    let match;
    while ((match = m3u8Pattern.exec(html)) !== null) {
      // Unescape unicode slashes if present (e.g. \/)
      const cleanUrl = match[1].replace(/\\u002F/g, "/");
      matches.push(cleanUrl);
    }
    
    // Remove duplicates and filter
    const uniqueStreams = [...new Set(matches)];
    
    if (uniqueStreams.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No streams found. The video might be premium-only or the layout changed."
      });
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
    console.error('Video Scrape Error:', error.message);
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }
    res.status(500).json({ success: false, error: "Server error or Cloudflare blocked the request." });
  }
});

app.listen(PORT, () => {
  console.log(`Lightweight Server running on port ${PORT}`);
});