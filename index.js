const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

// Browser Configuration
const launchBrowser = async () => {
  return await puppeteer.launch({
    headless: true, // Updated syntax (dati "new")
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

app.get('/', (req, res) => {
  res.json({ status: "Online", type: "Puppeteer (Browser)" });
});

app.get('/api/home', async (req, res) => {
  let browser;
  try {
    console.log('Scraping Home...');
    browser = await launchBrowser();
    const page = await browser.newPage();
    
    // 1. Gayahin ang User-Agent ng totoong tao
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
    
    // 2. Pumunta sa site at maghintay lumagpas sa Cloudflare
    await page.goto('https://hanime.tv/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // 3. Kunin ang NUXT data (Ito ang gold mine ng data)
    const data = await page.evaluate(() => {
      try { return window.__NUXT__.state.data.landing; } catch (e) { return null; }
    });
    
    if (!data) throw new Error("Blocked by Cloudflare or Layout Changed");
    
    const allVideos = data.hentai_videos;
    const sections = data.sections.map(section => ({
      title: section.title,
      videos: section.hentai_video_ids.map(id => {
        const v = Array.isArray(allVideos) ? allVideos.find(x => x.id === id) : allVideos[id];
        if (!v) return null;
        return {
          id: v.id,
          title: v.name,
          slug: v.slug,
          views: v.views,
          cover_url: v.cover_url,
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

app.get('/api/video/:slug', async (req, res) => {
  const { slug } = req.params;
  let browser;
  try {
    console.log(`Scraping Video: ${slug}`);
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
    
    // Navigate to video page
    await page.goto(`https://hanime.tv/videos/hentai/${slug}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Extract Video Data
    const videoState = await page.evaluate(() => {
      try { return window.__NUXT__.state.data.video; } catch (e) { return null; }
    });
    
    if (!videoState) return res.status(404).json({ success: false, message: "Video not found or Blocked" });
    
    const info = videoState.hentai_video;
    const manifest = videoState.videos_manifest ? videoState.videos_manifest.servers[0] : null;
    
    res.json({
      success: true,
      details: {
        title: info.name,
        tags: info.tags.map(t => t.text)
      },
      streams: manifest ? manifest.streams.map(s => ({
        resolution: s.height + 'p',
        url: s.url
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