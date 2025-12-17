const express = require('express');
const puppeteer = require('puppeteer');

const app = express();

// Render uses a dynamic port variable. Default to 3000 if local.
const PORT = process.env.PORT || 3000;

// Function to launch browser with settings optimized for Docker/Render
const launchBrowser = async () => {
  return await puppeteer.launch({
    headless: "new",
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--single-process'
    ]
  });
};

// Health Check Route (Para malaman ni Render na buhay ang app)
app.get('/', (req, res) => {
  res.json({
    status: "Online",
    message: "API is running",
    usage: {
      home: "/api/home",
      video: "/api/video/:slug (example: /api/video/shachiku-cinderella-1)"
    }
  });
});

/**
 * [GET] /api/home
 * Scrapes the landing page sections (Trending, New Releases, etc.)
 */
app.get('/api/home', async (req, res) => {
  let browser;
  try {
    console.log('Scraping Home Page...');
    browser = await launchBrowser();
    const page = await browser.newPage();
    
    // Mock a real user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navigate
    await page.goto('https://hanime.tv/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Extract Nuxt Data
    const data = await page.evaluate(() => {
      try {
        return window.__NUXT__.state.data.landing;
      } catch (e) {
        return null;
      }
    });
    
    if (!data) {
      throw new Error("Failed to extract data. Cloudflare might be blocking or structure changed.");
    }
    
    // Process Data
    const allVideos = data.hentai_videos; // Look up table for videos
    const sections = data.sections.map(section => ({
      title: section.title,
      videos: section.hentai_video_ids.map(id => {
        // Find video object in the array/object
        const v = Array.isArray(allVideos) ? allVideos.find(x => x.id === id) : allVideos[id];
        if (!v) return null;
        return {
          id: v.id,
          title: v.name,
          slug: v.slug,
          views: v.views,
          cover: v.cover_url,
          api_link: `${req.protocol}://${req.get('host')}/api/video/${v.slug}`
        };
      }).filter(Boolean)
    }));
    
    res.json({ success: true, sections });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

/**
 * [GET] /api/video/:slug
 * Scrapes a specific video page for description, tags, and VIDEO STREAMS (m3u8)
 */
app.get('/api/video/:slug', async (req, res) => {
  const { slug } = req.params;
  let browser;
  try {
    console.log(`Scraping Video: ${slug}`);
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const url = `https://hanime.tv/videos/hentai/${slug}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    const videoState = await page.evaluate(() => {
      try {
        return window.__NUXT__.state.data.video;
      } catch (e) {
        return null;
      }
    });
    
    if (!videoState || !videoState.hentai_video) {
      return res.status(404).json({ success: false, message: "Video not found or IP blocked." });
    }
    
    const info = videoState.hentai_video;
    const manifest = videoState.videos_manifest ? videoState.videos_manifest.servers[0] : null;
    
    res.json({
      success: true,
      details: {
        id: info.id,
        name: info.name,
        description: info.description,
        tags: info.tags.map(t => t.text),
        brand: info.brand,
        release_date: info.released_at,
        views: info.views
      },
      streams: manifest ? manifest.streams.map(s => ({
        resolution: s.height + 'p',
        size_mb: s.filesize_mbs,
        url: s.url // This is the m3u8 link
      })) : []
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});