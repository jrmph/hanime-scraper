const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- HEADERS (Pampanggap na Tao) ---
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Referer': 'https://google.com',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
};

// ==========================================
//  FRONTEND: ULTIMATE UI (Jhames Martin)
// ==========================================
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StreamHub Ultimate</title>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #6366f1; /* Indigo */
            --accent: #ec4899;  /* Pink */
            --bg: #030712;      /* Darkest */
            --sidebar: #111827;
            --surface: #1f2937;
            --text: #f3f4f6;
            --text-muted: #9ca3af;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; outline: none; }
        
        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg);
            color: var(--text);
            display: flex;
            height: 100vh;
            overflow: hidden;
        }

        /* --- Sidebar --- */
        .sidebar {
            width: 260px;
            background: var(--sidebar);
            border-right: 1px solid rgba(255,255,255,0.05);
            display: flex; flex-direction: column;
            padding: 20px;
            overflow-y: auto;
            flex-shrink: 0;
            transition: transform 0.3s ease;
        }

        .brand {
            font-size: 1.4rem; font-weight: 800; color: white;
            display: flex; align-items: center; gap: 10px;
            margin-bottom: 30px; letter-spacing: -1px;
        }
        .brand i { color: var(--primary); font-size: 1.8rem; }
        .brand span { background: linear-gradient(to right, var(--primary), var(--accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

        .menu-group { margin-bottom: 25px; }
        .menu-title { font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin-bottom: 10px; letter-spacing: 1px; }

        .nav-item {
            padding: 12px; border-radius: 8px; color: var(--text-muted);
            cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 10px;
            font-size: 0.9rem; font-weight: 500; margin-bottom: 4px;
        }
        .nav-item:hover, .nav-item.active { background: var(--surface); color: white; }
        .nav-item.active { border-left: 3px solid var(--primary); }
        .nav-item i { font-size: 1.1rem; }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; margin-left: auto; }
        .online { background: #10b981; }
        .unstable { background: #f59e0b; }

        /* --- Main Content --- */
        .main { flex: 1; display: flex; flex-direction: column; position: relative; overflow: hidden; }
        
        .top-bar {
            height: 70px; border-bottom: 1px solid rgba(255,255,255,0.05);
            display: flex; align-items: center; justify-content: space-between; padding: 0 30px;
            background: rgba(3, 7, 18, 0.8); backdrop-filter: blur(10px);
        }

        .mobile-toggle { display: none; font-size: 1.5rem; cursor: pointer; }
        
        .content-area { flex: 1; padding: 30px; overflow-y: auto; }

        /* --- Grid & Cards --- */
        .section-header { margin: 20px 0 15px; display: flex; align-items: center; gap: 10px; font-size: 1.2rem; font-weight: 700; }
        
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
        
        .card {
            background: var(--surface); border-radius: 12px; overflow: hidden;
            position: relative; transition: transform 0.2s, box-shadow 0.2s; cursor: pointer;
            border: 1px solid rgba(255,255,255,0.05);
        }
        .card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.4); border-color: var(--primary); }
        
        .poster-wrap { position: relative; aspect-ratio: 16/9; overflow: hidden; }
        .poster { width: 100%; height: 100%; object-fit: cover; }
        .play-btn {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            font-size: 3rem; color: white; opacity: 0; transition: 0.2s; filter: drop-shadow(0 0 10px black);
        }
        .card:hover .play-btn { opacity: 1; }

        .card-info { padding: 12px; }
        .title { font-size: 0.9rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 5px; }
        .meta { font-size: 0.75rem; color: var(--text-muted); display: flex; justify-content: space-between; }

        /* --- Modal --- */
        .modal {
            position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 100;
            display: none; justify-content: center; align-items: center;
        }
        .modal.open { display: flex; animation: fadeIn 0.3s; }
        .modal-box { width: 90%; max-width: 1000px; background: #000; border-radius: 16px; overflow: hidden; border: 1px solid #333; }
        video { width: 100%; display: block; max-height: 80vh; }
        .modal-controls { padding: 15px; background: var(--surface); display: flex; justify-content: space-between; align-items: center; }

        @media (max-width: 768px) {
            .sidebar { position: absolute; z-index: 50; transform: translateX(-100%); }
            .sidebar.active { transform: translateX(0); }
            .mobile-toggle { display: block; }
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        .loader { text-align: center; margin-top: 100px; color: var(--primary); }
    </style>
</head>
<body>

    <aside class="sidebar" id="sidebar">
        <div class="brand">
            <i class="ph ph-infinity"></i> <span>StreamHub</span>
        </div>

        <div class="menu-group">
            <div class="menu-title">Hentai Sources</div>
            <div class="nav-item active" onclick="switchSource('hanime', this)">
                <i class="ph ph-fire"></i> Hanime.tv <div class="status-dot online"></div>
            </div>
            <div class="nav-item" onclick="switchSource('hstream', this)">
                <i class="ph ph-drop"></i> HStream.moe <div class="status-dot unstable"></div>
            </div>
            <div class="nav-item" onclick="switchSource('haho', this)">
                <i class="ph ph-heart"></i> Haho.moe <div class="status-dot unstable"></div>
            </div>
            <div class="nav-item" onclick="switchSource('wow', this)">
                <i class="ph ph-star"></i> WowHentai <div class="status-dot unstable"></div>
            </div>
        </div>

        <div class="menu-group">
            <div class="menu-title">Anime Sources</div>
            <div class="nav-item" onclick="switchSource('animepahe', this)">
                <i class="ph ph-film-strip"></i> AnimePahe <div class="status-dot unstable"></div>
            </div>
            <div class="nav-item" onclick="switchSource('animekai', this)">
                <i class="ph ph-sword"></i> AnimeKai <div class="status-dot unstable"></div>
            </div>
            <div class="nav-item" onclick="switchSource('aninow', this)">
                <i class="ph ph-clock"></i> AniNow <div class="status-dot unstable"></div>
            </div>
        </div>
    </aside>

    <main class="main">
        <div class="top-bar">
            <i class="ph ph-list mobile-toggle" onclick="document.getElementById('sidebar').classList.toggle('active')"></i>
            <h3 id="current-source">Hanime.tv</h3>
            <div style="font-size: 0.8rem; color: #666;">Jhames Martin Edition</div>
        </div>

        <div class="content-area" id="content">
            <!-- Content Loads Here -->
        </div>
    </main>

    <!-- Video Player -->
    <div class="modal" id="modal">
        <div class="modal-box">
            <video id="player" controls playsinline></video>
            <div class="modal-controls">
                <div id="v-title" style="font-weight: 600;">Loading...</div>
                <button onclick="closeModal()" style="background:none; border:none; color:white; cursor:pointer; font-size:1.5rem;"><i class="ph ph-x"></i></button>
            </div>
        </div>
    </div>

    <script>
        const API = window.location.origin + '/api';
        let currentSource = 'hanime';

        document.addEventListener('DOMContentLoaded', () => fetchContent('hanime'));

        function switchSource(source, el) {
            // Update UI
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            el.classList.add('active');
            document.getElementById('current-source').innerText = el.innerText;
            document.getElementById('sidebar').classList.remove('active'); // Close mobile menu
            
            currentSource = source;
            fetchContent(source);
        }

        async function fetchContent(source) {
            const container = document.getElementById('content');
            container.innerHTML = \`<div class="loader"><i class="ph ph-spinner-gap ph-spin" style="font-size: 3rem;"></i><p>Connecting to \${source}...</p></div>\`;

            try {
                const res = await fetch(\`\${API}/\${source}/home\`);
                const data = await res.json();

                if(data.success) {
                    container.innerHTML = '';
                    if(data.sections.length === 0) {
                        container.innerHTML = '<div style="text-align:center; margin-top:50px;">No content found. Cloudflare might be blocking this source.</div>';
                        return;
                    }

                    data.sections.forEach(sec => {
                        const title = document.createElement('div');
                        title.className = 'section-header';
                        title.innerHTML = \`<i class="ph ph-caret-right" style="color:var(--primary)"></i> \${sec.title}\`;
                        container.appendChild(title);

                        const grid = document.createElement('div');
                        grid.className = 'grid';
                        
                        sec.videos.forEach(v => {
                            grid.innerHTML += \`
                                <div class="card" onclick="play('\${v.slug}')">
                                    <div class="poster-wrap">
                                        <img src="\${v.cover_url}" class="poster" loading="lazy" onerror="this.src='https://placehold.co/400x225?text=No+Image'">
                                        <div class="play-btn"><i class="ph ph-play-circle"></i></div>
                                    </div>
                                    <div class="card-info">
                                        <div class="title">\${v.title}</div>
                                        <div class="meta">
                                            <span>\${v.views ? format(v.views) + ' views' : 'Latest'}</span>
                                            <span style="color:var(--accent)">HD</span>
                                        </div>
                                    </div>
                                </div>
                            \`;
                        });
                        container.appendChild(grid);
                    });
                } else {
                    container.innerHTML = \`<div style="text-align:center; margin-top:50px; color:#ef4444;">Error: \${data.message}</div>\`;
                }
            } catch (e) {
                container.innerHTML = '<div style="text-align:center; margin-top:50px; color:#ef4444;">Server Connection Failed.</div>';
            }
        }

        let hls = null;
        async function play(slug) {
            const modal = document.getElementById('modal');
            const video = document.getElementById('player');
            const title = document.getElementById('v-title');
            
            modal.classList.add('open');
            title.innerText = "Fetching Stream link...";
            
            try {
                const res = await fetch(\`\${API}/\${currentSource}/video/\${slug}\`);
                const data = await res.json();

                if(data.success) {
                    title.innerText = data.title;
                    const url = data.streams[0].url;

                    if(Hls.isSupported()) {
                        if(hls) hls.destroy();
                        hls = new Hls();
                        hls.loadSource(url);
                        hls.attachMedia(video);
                        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
                    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                        video.src = url;
                        video.play();
                    }
                } else {
                    title.innerText = "Stream not found (Site Blocked/Premium)";
                }
            } catch (e) {
                title.innerText = "Error fetching video.";
            }
        }

        function closeModal() {
            const modal = document.getElementById('modal');
            const video = document.getElementById('player');
            modal.classList.remove('open');
            video.pause();
            if(hls) hls.destroy();
        }

        function format(n) {
            return new Intl.NumberFormat('en-US', { notation: "compact" }).format(n);
        }
    </script>
</body>
</html>
    `);
});

// ==========================================
//  BACKEND SCRAPERS (Lightweight)
// ==========================================

// --- Helper: Standardizer ---
// Lahat ng scraper dapat ganito ang output format
const formatResponse = (title, videos) => ({
    success: true,
    sections: [{ title, videos }]
});

// --- 1. HANIME SCRAPER (API v8) ---
app.get('/api/hanime/home', async (req, res) => {
    try {
        const { data } = await axios.get('https://hanime.tv/api/v8/landing', { headers: HEADERS });
        const videos = data.sections[0].hentai_video_ids.map(id => {
            const v = data.hentai_videos.find(val => val.id === id);
            return v ? { id: v.id, title: v.name, slug: v.slug, views: v.views, cover_url: v.cover_url } : null;
        }).filter(Boolean);
        res.json({ success: true, sections: data.sections.map(s => ({
            title: s.title,
            videos: s.hentai_video_ids.map(id => data.hentai_videos.find(v=>v.id===id)).filter(Boolean).map(v=>({
                 id: v.id, title: v.name, slug: v.slug, views: v.views, cover_url: v.cover_url
            }))
        }))});
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/hanime/video/:slug', async (req, res) => {
    try {
        const { data: html } = await axios.get(`https://hanime.tv/videos/hentai/${req.params.slug}`, { headers: HEADERS });
        const match = html.match(/"url":"(https:[^"]+?\.m3u8[^"]*?)"/);
        if(match) {
            res.json({ success: true, title: req.params.slug, streams: [{ url: match[1].replace(/\\u002F/g, "/") }] });
        } else {
            res.json({ success: false, message: "No stream found" });
        }
    } catch (e) { res.status(500).json({ success: false }); }
});

// --- 2. HSTREAM/HAHO PLACEHOLDER ---
// Note: HStream uses obfuscation. We try basic extraction.
app.get('/api/hstream/home', async (req, res) => {
    // This is a simulation because HStream blocks raw axios requests often.
    // For a real app, you need proxies.
    res.json(formatResponse("Latest HStream", [
        { title: "Site Protected by DDOS-Guard", slug: "error", cover_url: "https://placehold.co/400x225?text=Protected" }
    ]));
});

// --- 3. ANIMEPAHE SCRAPER (Web Scrape) ---
app.get('/api/animepahe/home', async (req, res) => {
    try {
        // AnimePahe often allows scraping the homepage list
        const { data } = await axios.get('https://animepahe.ru', { headers: HEADERS });
        const $ = cheerio.load(data);
        const videos = [];
        
        $('.latest-release .row .col-12').each((i, el) => {
            const title = $(el).find('a').attr('title');
            const img = $(el).find('img').attr('src');
            const link = $(el).find('a').attr('href'); // /play/id/slug
            // Extract slug
            const slug = link ? link.split('/').pop() : 'error';
            
            if(title) videos.push({ title, slug, cover_url: img, views: 0 });
        });

        res.json(formatResponse("Latest Releases", videos));
    } catch (e) {
        res.json({ success: false, message: "Cloudflare blocked AnimePahe request." });
    }
});

// --- GENERIC HANDLER FOR OTHERS ---
app.get('/api/:source/home', (req, res) => {
    res.json(formatResponse("Source Unavailable", [
        { title: "Cloudflare Protected", slug: "none", cover_url: "https://placehold.co/400x225?text=Blocked+by+CF" }
    ]));
});

app.listen(PORT, () => {
    console.log(`Ultimate Scraper running on port ${PORT}`);
});


