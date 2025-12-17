const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. ENABLE CORS (Para gumana sa frontend/localhost mo)
app.use(cors());

// 2. HEADERS (Para magmukhang tao/browser ang request natin)
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Referer': 'https://hanime.tv/',
  'Origin': 'https://hanime.tv',
  'X-Requested-With': 'XMLHttpRequest'
};

app.get('/', (req, res) => {
  res.json({ status: "Online", message: "Hanime API with CORS & Video Streams enabled." });
});

/**
 * [GET] /api/home
 * Kukuha ng Trending at New Releases
 */
app.get('/api/home', async (req, res) => {
  try {
    const response = await axios.get('https://hanime.tv/api/v8/landing', { headers: HEADERS });
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
    res.status(500).json({ success: false, error: "Failed to fetch home data." });
  }
});

/**
 * [GET] /api/video/:slug
 * Kukuha ng Video Stream (.m3u8)
 */
app.get('/api/video/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    console.log(`Finding stream for: ${slug}`);
    
    // --- STEP 1: Subukan kunin ang HTML Page ---
    // Madalas nandito na yung link sa loob ng source code
    const pageUrl = `https://hanime.tv/videos/hentai/${slug}`;
    const { data: html } = await axios.get(pageUrl, { headers: HEADERS });
    
    // Extract Title (Simple text search)
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(' - hanime.tv', '') : slug;
    
    // --- STEP 2: Hanapin ang .m3u8 gamit ang Regex ---
    // Ang format sa Hanime ay: "url":"https://... .m3u8 ..."
    const m3u8Pattern = /"url":"(https:[^"]+?\.m3u8[^"]*?)"/g;
    const matches = [];
    let match;
    
    while ((match = m3u8Pattern.exec(html)) !== null) {
      // Linisin ang URL (tanggalin ang unicode slash \u002F)
      const cleanUrl = match[1].replace(/\\u002F/g, "/");
      matches.push(cleanUrl);
    }
    
    // Tanggalin ang duplicates
    let streams = [...new Set(matches)];
    
    // --- STEP 3: BACKUP PLAN (Kung walang nahanap sa HTML) ---
    // Kung walang nakuha, susubukan natin tawagin ang internal API nila gamit ang Video ID.
    if (streams.length === 0) {
      console.log("Regex failed, trying internal API lookup...");
      
      // Hanapin ang Video ID sa HTML (kung meron man)
      // Pattern: "id":12345
      const idMatch = html.match(/"id":(\d+),"slug":"${slug}"/);
      
      if (idMatch && idMatch[1]) {
        const videoId = idMatch[1];
        try {
          const apiRes = await axios.get(`https://hanime.tv/api/v8/video?id=${videoId}`, { headers: HEADERS });
          const manifest = apiRes.data.videos_manifest;
          if (manifest && manifest.servers && manifest.servers[0]) {
            manifest.servers[0].streams.forEach(s => {
              if (s.url) streams.push(s.url);
            });
          }
        } catch (apiErr) {
          console.error("Backup API failed:", apiErr.message);
        }
      }
    }
    
    // --- STEP 4: Return Result ---
    if (streams.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Stream not found. Cloudflare might be blocking requests or video is Premium."
      });
    }
    
    res.json({
      success: true,
      title: title,
      slug: slug,
      // Format streams for frontend
      streams: streams.map((url, index) => ({
        id: index + 1,
        quality: "Auto/1080p", // Hanime usually provides one master playlist
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