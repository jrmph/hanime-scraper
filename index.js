const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- BROWSER LAUNCHER (OPTIMIZED FOR RENDER) ---
const launchBrowser = async () => {
    return await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // Critical for Docker memory
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--single-process'
        ]
    });
};

// =======================================================
//  FRONTEND: PROFESSIONAL UI "JHAMES MARTIN EDITION"
// =======================================================
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StreamHub - Ultimate Scraper</title>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #7C3AED; /* Violet */
            --accent: #2DD4BF; /* Teal */
            --bg: #09090b;
            --surface: #18181b;
            --surface-hover: #27272a;
            --text: #ffffff;
            --text-muted: #a1a1aa;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; outline: none; }

        body {
            font-family: 'Space Grotesk', sans-serif;
            background-color: var(--bg);
            color: var(--text);
            overflow-x: hidden;
            min-height: 100vh;
        }

        /* --- Header --- */
        header {
            position: fixed; top: 0; width: 100%; z-index: 50;
            background: rgba(9, 9, 11, 0.8);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(255,255,255,0.1);
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo { font-size: 1.5rem; font-weight: 700; letter-spacing: -1px; display: flex; align-items: center; gap: 8px; }
        .logo i { color: var(--primary); }
        .logo span { color: var(--text); }
        .logo .pro-badge { background: var(--primary); color: white; font-size: 0.6rem; padding: 2px 6px; border-radius: 4px; margin-left: 8px; text-transform: uppercase; }

        /* --- Sidebar & Layout --- */
        .wrapper { display: flex; padding-top: 80px; min-height: 100vh; }
        
        .sidebar {
            width: 260px;
            padding: 20px;
            position: fixed;
            height: 100vh;
            border-right: 1px solid rgba(255,255,255,0.05);
            display: none; /* Hidden on mobile by default */
        }
        
        @media(min-width: 1024px) { .sidebar { display: block; } .main-content { margin-left: 260px; } }

        .main-content {
            flex: 1;
            padding: 20px;
            width: 100%;
        }

        .nav-category { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; margin-top: 20px; }
        .nav-item {
            display: flex; align-items: center; gap: 10px;
            padding: 12px 15px;
            border-radius: 8px;
            color: var(--text-muted);
            text-decoration: none;
            transition: 0.2s;
            cursor: pointer;
            margin-bottom: 5px;
        }
        .nav-item:hover, .nav-item.active { background: var(--surface-hover); color: white; }
        .nav-item i { font-size: 1.2rem; }

        /* --- Grid --- */
        .content-header { margin-bottom: 2rem; }
        .content-header h1 { font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; }
        .content-header p { color: var(--text-muted); }

        .video-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 20px;
        }

        .card {
            background: var(--surface);
            border-radius: 12px;
            overflow: hidden;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            position: relative;
            border: 1px solid rgba(255,255,255,0.05);
        }

        .card:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,0.5); border-color: var(--primary); }

        .card-poster { width: 100%; aspect-ratio: 16/9; object-fit: cover; background: #222; }
        
        .card-body { padding: 15px; }
        .card-title { font-weight: 600; font-size: 0.95rem; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .card-meta { font-size: 0.8rem; color: var(--text-muted); display: flex; justify-content: space-between; }

        /* --- Loader --- */
        .loader-container {
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            height: 50vh; text-align: center;
        }
        .spinner {
            width: 40px; height: 40px; border: 4px solid var(--surface-hover);
            border-top: 4px solid var(--primary); border-radius: 50%;
            animation: spin 1s linear infinite; margin-bottom: 20px;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        /* --- Player Modal --- */
        .modal {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.95); z-index: 100;
            display: none; align-items: center; justify-content: center;
            opacity: 0; transition: opacity 0.3s;
        }
        .modal.open { display: flex; opacity: 1; }
        .modal-content { width: 90%; max-width: 1100px; background: var(--bg); border-radius: 16px; overflow: hidden; border: 1px solid #333; }
        .player-wrapper { position: relative; width: 100%; background: #000; }
        video { width: 100%; display: block; max-height: 80vh; }
        .modal-header { padding: 20px; display: flex; justify-content: space-between; background: var(--surface); }
        .close-btn { background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; }
        
        .tag-pill { background: #333; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 5px; }
        
        /* Mobile Nav Toggle */
        .menu-btn { display: block; font-size: 1.5rem; cursor: pointer; color: white; margin-right: 15px; }
        @media(min-width: 1024px) { .menu-btn { display: none; } }
    </style>
</head>
<body>

    <header>
        <div style="display: flex; align-items: center;">
            <i class="ph ph-list menu-btn" onclick="document.querySelector('.sidebar').style.display = 'block'"></i>
            <div class="logo">
                <i class="ph ph-play-circle"></i>
                StreamHub <span class="pro-badge">PRO</span>
            </div>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">
            Jhames Martin Build v3.0
        </div>
    </header>

    <div class="wrapper">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="nav-category">Sources</div>
            <div class="nav-item active" onclick="loadSource('hanime')">
                <i class="ph ph-fire"></i> Hanime.tv
            </div>
            <div class="nav-item" onclick="alert('Coming Soon! Server resources limited.')">
                <i class="ph ph-film-strip"></i> AnimePahe
            </div>
            <div class="nav-item" onclick="alert('Coming Soon!')">
                <i class="ph ph-ghost"></i> HStream
            </div>
            
            <div class="nav-category">Library</div>
            <div class="nav-item"><i class="ph ph-heart"></i> Favorites</div>
            <div class="nav-item"><i class="ph ph-clock"></i> History</div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <div class="content-header">
                <h1>Trending Now</h1>
                <p>Latest uploads scraped fresh from Hanime.tv</p>
            </div>

            <div id="app-container">
                <!-- Loader -->
                <div class="loader-container">
                    <div class="spinner"></div>
                    <h3>Connecting to Docker Server...</h3>
                    <p style="color: #666; font-size: 0.9rem;">Please wait 30-60s for Puppeteer to boot up.</p>
                </div>
            </div>
        </main>
    </div>

    <!-- Video Modal -->
    <div id="video-modal" class="modal">
        <div class="modal-content">
            <div class="player-wrapper">
                <video id="main-player" controls playsinline></video>
            </div>
            <div class="modal-header">
                <div>
                    <h3 id="modal-title">Loading Title...</h3>
                    <div id="modal-tags" style="margin-top: 5px;"></div>
                </div>
                <button class="close-btn" onclick="closeModal()"><i class="ph ph-x"></i></button>
            </div>
        </div>
    </div>

    <script>
        const API_BASE = window.location.origin;

        // Init
        document.addEventListener('DOMContentLoaded', () => {
            loadSource('hanime');
        });

        async function loadSource(source) {
            const container = document.getElementById('app-container');
            
            // Fetch Hanime
            if(source === 'hanime') {
                try {
                    const res = await fetch(\`\${API_BASE}/api/hanime/home\`);
                    const data = await res.json();
                    
                    if(data.success) {
                        renderGrid(data.sections);
                    } else {
                        container.innerHTML = \`<div style="text-align:center; padding: 50px; color: red;">Error: \${data.error}</div>\`;
                    }
                } catch (e) {
                    container.innerHTML = \`<div style="text-align:center; padding: 50px;">
                        <h3>Request Timed Out</h3>
                        <p>The Render Free Tier server is taking too long to boot Chrome.</p>
                        <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 10px; cursor:pointer;">Try Again</button>
                    </div>\`;
                }
            }
        }

        function renderGrid(sections) {
            const container = document.getElementById('app-container');
            container.innerHTML = ''; // Clear loader

            sections.forEach(section => {
                if(section.videos.length === 0) return;

                const sectionTitle = document.createElement('h2');
                sectionTitle.style.marginBottom = '15px';
                sectionTitle.style.marginTop = '30px';
                sectionTitle.style.fontSize = '1.2rem';
                sectionTitle.innerHTML = \`<i class="ph ph-caret-right"></i> \${section.title}\`;
                
                const grid = document.createElement('div');
                grid.className = 'video-grid';
                
                section.videos.forEach(vid => {
                    const card = document.createElement('div');
                    card.className = 'card';
                    card.onclick = () => playVideo(vid.slug);
                    card.innerHTML = \`
                        <img src="\${vid.cover_url}" class="card-poster" loading="lazy">
                        <div class="card-body">
                            <div class="card-title">\${vid.title}</div>
                            <div class="card-meta">
                                <span>\${formatViews(vid.views)} views</span>
                                <span style="color: var(--primary);">HD</span>
                            </div>
                        </div>
                    \`;
                    grid.appendChild(card);
                });

                container.appendChild(sectionTitle);
                container.appendChild(grid);
            });
        }

        function formatViews(num) {
            return new Intl.NumberFormat('en-US', { notation: "compact" }).format(num);
        }

        // --- Player Logic ---
        let hls = null;

        async function playVideo(slug) {
            const modal = document.getElementById('video-modal');
            const video = document.getElementById('main-player');
            const titleEl = document.getElementById('modal-title');
            
            modal.classList.add('open');
            titleEl.innerText = "Fetching Stream Link...";
            
            try {
                const res = await fetch(\`\${API_BASE}/api/hanime/video/\${slug}\`);
                const data = await res.json();

                if(data.success && data.streams.length > 0) {
                    titleEl.innerText = data.details.title;
                    const streamUrl = data.streams[0].url;

                    if (Hls.isSupported()) {
                        if(hls) hls.destroy();
                        hls = new Hls();
                        hls.loadSource(streamUrl);
                        hls.attachMedia(video);
                        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
                    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                        video.src = streamUrl;
                        video.play();
                    }
                } else {
                    titleEl.innerText = "Error: Stream Not Found";
                }
            } catch (e) {
                titleEl.innerText = "Server Error";
            }
        }

        function closeModal() {
            const modal = document.getElementById('video-modal');
            const video = document.getElementById('main-player');
            modal.classList.remove('open');
            video.pause();
            if(hls) hls.destroy();
        }
    </script>
</body>
</html>
    `);
});

// =======================================================
//  BACKEND: PUPPETEER SCRAPER LOGIC
// =======================================================

app.get('/api/hanime/home', async (req, res) => {
    let browser;
    try {
        console.log("Launching Browser for Home...");
        browser = await launchBrowser();
        const page = await browser.newPage();
        // Set User Agent to bypass Cloudflare
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Go to Hanime
        await page.goto('https://hanime.tv/', { waitUntil: 'domcontentloaded', timeout: 90000 });

        // Extract Data
        const data = await page.evaluate(() => {
            try { return window.__NUXT__.state.data.landing; } catch (e) { return null; }
        });

        if (!data) throw new Error("Failed to get NUXT data");

        // Format Data
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
                    cover_url: v.cover_url
                };
            }).filter(Boolean)
        }));

        res.json({ success: true, sections });

    } catch (e) {
        console.error("Home Error:", e.message);
        res.status(500).json({ success: false, error: e.message });
    } finally {
        if (browser) await browser.close();
    }
});

app.get('/api/hanime/video/:slug', async (req, res) => {
    const { slug } = req.params;
    let browser;
    try {
        console.log(`Getting Video: ${slug}`);
        browser = await launchBrowser();
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await page.goto(`https://hanime.tv/videos/hentai/${slug}`, { waitUntil: 'domcontentloaded', timeout: 90000 });

        const videoData = await page.evaluate(() => {
            try { return window.__NUXT__.state.data.video; } catch (e) { return null; }
        });

        if (!videoData) throw new Error("Video data not found");

        const manifest = videoData.videos_manifest ? videoData.videos_manifest.servers[0] : null;
        
        res.json({
            success: true,
            details: { title: videoData.hentai_video.name },
            streams: manifest ? manifest.streams.map(s => ({ url: s.url, res: s.height })) : []
        });

    } catch (e) {
        console.error("Video Error:", e.message);
        res.status(500).json({ success: false, error: e.message });
    } finally {
        if (browser) await browser.close();
    }
});

app.listen(PORT, () => {
    console.log(`Jhames Martin Scraper running on port ${PORT}`);
});