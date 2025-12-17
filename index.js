const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS so your PHP frontend can fetch data
app.use(cors());

// Browser Launcher Configuration
const launchBrowser = async () => {
  return await puppeteer.launch({
    headless: true,
    // Use the Chrome installed in the Docker container
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
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

// Root Route
app.get('/', (req, res) => {
  res.json({ status: "Online", message: "Hanime Scraper is Ready" });
});

// --- API: HOME PAGE ---
app.get('/api/home', async (req, res) => {
  let browser;
  try {
    console.log('Scraping Home Page...');
    browser = await launchBrowser();
    const page = await browser.newPage();
    
    // Mock a real user agent to bypass simple blocks
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Go to the website
    await page.goto('https://hanime.tv/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Extract the __NUXT__ data object from the page
    const data = await page.evaluate(() => {
      try {
        return window.__NUXT__.state.data.landing;
      } catch (e) {
        return null;
      }
    });
    
    if (!data) throw new Error("Cloudflare blocked access or site structure changed.");
    
    // Process the data
    const allVideos = data.hentai_videos;
    const sections = data.sections.map(section => ({
      title: section.title,
      videos: section.hentai_video_ids.map(id => {
        // Find video details
        const v = Array.isArray(allVideos) ? allVideos.find(x => x.id === id) : allVideos[id];
        if (!v) return null;
        return {
          id: v.id,
          title: v.name,
          slug: v.slug,
          views: v.views,
          cover_url: v.cover_url,
          // Link to our own API
          api_link: `${req.protocol}://${req.get('host')}/api/video/${v.slug}`
        };
      }).filter(Boolean)
    }));
    
    res.json({ success: true, sections });
    
  } catch (err) {
    console.error("Home Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

// --- API: VIDEO DETAILS & STREAM ---
app.get('/api/video/:slug', async (req, res) => {
  const { slug } = req.params;
  let browser;
  try {
    console.log(`Scraping Video: ${slug}`);
    browser = await launchBrowser();
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const targetUrl = `https://hanime.tv/videos/hentai/${slug}`;
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Extract Video Data from __NUXT__
    const videoState = await page.evaluate(() => {
      try {
        return window.__NUXT__.state.data.video;
      } catch (e) {
        return null;
      }
    });
    
    if (!videoState) {
      return res.status(404).json({ success: false, message: "Video not found (404) or Blocked." });
    }
    
    const info = videoState.hentai_video;
    const manifest = videoState.videos_manifest ? videoState.videos_manifest.servers[0] : null;
    
    res.json({
      success: true,
      details: {
        id: info.id,
        name: info.name,
        description: info.description,
        views: info.views,
        tags: info.tags ? info.tags.map(t => t.text) : []
      },
      streams: manifest ? manifest.streams.map(s => ({
        resolution: s.height + 'p',
        size_mb: s.filesize_mbs,
        url: s.url // This is the .m3u8 link
      })) : []
    });
    
  } catch (err) {
    console.error("Video Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});