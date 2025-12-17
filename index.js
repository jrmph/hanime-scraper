const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- CONFIGURATION ---
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Referer': 'https://hanime.tv/',
    'Origin': 'https://hanime.tv'
};

// ==========================================
//  FRONTEND: PROFESSIONAL UI (Served via Root)
// ==========================================
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hanime API - Jhames Martin</title>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #FFD700;
            --primary-glow: rgba(255, 215, 0, 0.3);
            --bg: #0a0a0a;
            --surface: #161616;
            --text: #ffffff;
            --text-muted: #888888;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; outline: none; }
        
        body {
            font-family: 'Outfit', sans-serif;
            background-color: var(--bg);
            color: var(--text);
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
        }

        /* --- Animations --- */
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 var(--primary-glow); } 70% { box-shadow: 0 0 20px 10px rgba(0,0,0,0); } 100% { box-shadow: 0 0 0 0 rgba(0,0,0,0); } }

        /* --- Header --- */
        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 40px;
            background: rgba(10, 10, 10, 0.8);
            backdrop-filter: blur(10px);
            position: sticky;
            top: 0;
            z-index: 100;
            border-bottom: 1px solid #222;
        }

        .brand { font-size: 1.5rem; font-weight: 800; letter-spacing: -1px; }
        .brand span { color: var(--primary); }
        
        .status-badge {
            background: rgba(0, 255, 0, 0.1);
            color: #00ff88;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            border: 1px solid rgba(0, 255, 0, 0.2);
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .status-dot { width: 8px; height: 8px; background: #00ff88; border-radius: 50%; box-shadow: 0 0 10px #00ff88; }

        /* --- Hero --- */
        .hero {
            text-align: center;
            padding: 80px 20px;
            background: radial-gradient(circle at center, #1a1a1a 0%, var(--bg) 70%);
        }

        .hero h1 {
            font-size: 3.5rem;
            margin-bottom: 10px;
            background: linear-gradient(to right, #fff, #888);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: fadeIn 0.8s ease-out;
        }

        .hero p { color: var(--text-muted); font-size: 1.1rem; max-width: 600px; margin: 0 auto 30px; animation: fadeIn 1s ease-out; }

        .api-pill {
            display: inline-block;
            background: #222;
            padding: 10px 20px;
            border-radius: 8px;
            font-family: monospace;
            color: var(--primary);
            border: 1px solid #333;
            margin-bottom: 40px;
        }

        /* --- Content Grid --- */
        .container { max-width: 1400px; margin: 0 auto; padding: 0 20px 80px; }

        .section-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 25px;
            margin-top: 40px;
            font-size: 1.5rem;
            font-weight: 600;
            border-left: 4px solid var(--primary);
            padding-left: 15px;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 25px;
        }

        .card {
            background: var(--surface);
            border-radius: 12px;
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            border: 1px solid #222;
            cursor: pointer;
            position: relative;
        }

        .card:hover {
            transform: translateY(-8px);
            border-color: var(--primary);
            box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
        }

        .card-img-wrap {
            position: relative;
            width: 100%;
            aspect-ratio: 16/9;
            overflow: hidden;
        }

        .card-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s;
        }

        .card:hover .card-img { transform: scale(1.05); }

        .play-overlay {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s;
        }

        .card:hover .play-overlay { opacity: 1; }

        .play-icon {
            font-size: 3rem;
            color: var(--primary);
            filter: drop-shadow(0 0 10px rgba(0,0,0,0.5));
        }

        .card-info { padding: 15px; }
        
        .card-title {
            font-size: 0.95rem;
            font-weight: 600;
            margin-bottom: 8px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .card-meta {
            font-size: 0.8rem;
            color: var(--text-muted);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        /* --- Modal --- */
        #modal {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9);
            backdrop-filter: blur(5px);
            z-index: 1000;
            display: none;
            justify-content: center;
            align-items: center;
            opacity: 0;
            transition: opacity 0.3s;
        }

        #modal.active { display: flex; opacity: 1; }

        .modal-content {
            width: 90%; max-width: 1000px;
            background: #111;
            border-radius: 16px;
            border: 1px solid #333;
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0,0,0,0.8);
            position: relative;
        }

        .video-wrapper { position: relative; width: 100%; background: #000; }
        video { width: 100%; display: block; max-height: 80vh; }

        .modal-header {
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            background: #161616;
        }

        .close-btn {
            background: transparent;
            border: none;
            color: #fff;
            font-size: 1.5rem;
            cursor: pointer;
            transition: color 0.2s;
        }
        .close-btn:hover { color: var(--primary); }

        .modal-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
        .tag {
            background: #222; color: #ccc;
            padding: 4px 10px; border-radius: 4px;
            font-size: 0.75rem;
        }

        /* --- Footer --- */
        footer {
            text-align: center;
            padding: 40px;
            border-top: 1px solid #222;
            color: var(--text-muted);
            font-size: 0.9rem;
        }
        footer span { color: var(--primary); font-weight: 600; }

        /* Loader */
        .loader {
            display: flex; flex-direction: column; align-items: center; margin-top: 50px;
            color: var(--primary);
        }
    </style>
</head>
<body>

    <header>
        <div class="brand">Hanime<span>Scraper</span></div>
        <div class="status-badge"><div class="status-dot"></div> SYSTEM ONLINE</div>
    </header>

    <div class="hero">
        <h1>Advanced API Scraper</h1>
        <p>Professional high-performance scraper with lightweight architecture.</p>
        <div class="api-pill">GET /api/home</div>
    </div>

    <div class="container" id="app">
        <div class="loader" id="main-loader">
            <i class="ph ph-spinner-gap ph-spin" style="font-size: 3rem;"></i>
            <p style="margin-top: 15px; color: #666;">Fetching latest content...</p>
        </div>
    </div>

    <footer>
        Designed & Developed by <span>Jhames Martin</span>
    </footer>

    <!-- Video Modal -->
    <div id="modal">
        <div class="modal-content">
            <div class="video-wrapper">
                <video id="player" controls playsinline></video>
            </div>
            <div class="modal-header">
                <div style="flex: 1;">
                    <h2 id="modal-title" style="font-size: 1.2rem; margin-bottom: 5px;">Loading...</h2>
                    <div id="modal-tags" class="modal-tags"></div>
                </div>
                <button class="close-btn" onclick="closeModal()"><i class="ph ph-x"></i></button>
            </div>
        </div>
    </div>

    <script>
        const API_URL = window.location.origin;

        // Fetch Data on Load
        document.addEventListener('DOMContentLoaded', async () => {
            try {
                const res = await fetch(\`\${API_URL}/api/home\`);
                const data = await res.json();
                
                if(data.success) {
                    renderContent(data.sections);
                } else {
                    showError("API responded but returned no data.");
                }
            } catch (err) {
                showError("Failed to connect to API. " + err.message);
            }
        });

        function renderContent(sections) {
            const container = document.getElementById('app');
            const loader = document.getElementById('main-loader');
            loader.style.display = 'none';

            sections.forEach(section => {
                if(section.videos.length === 0) return;

                const sectionHTML = \`
                    <div class="section-header">
                        <i class="ph ph-trend-up"></i> \${section.title}
                    </div>
                    <div class="grid">
                        \${section.videos.map(v => createCard(v)).join('')}
                    </div>
                \`;
                container.innerHTML += sectionHTML;
            });
        }

        function createCard(video) {
            const views = new Intl.NumberFormat('en-US', { notation: "compact" }).format(video.views);
            return \`
                <div class="card" onclick="playVideo('\${video.slug}')">
                    <div class="card-img-wrap">
                        <img src="\${video.cover_url}" class="card-img" loading="lazy" alt="\${video.title}">
                        <div class="play-overlay"><i class="ph ph-play-circle play-icon"></i></div>
                    </div>
                    <div class="card-info">
                        <div class="card-title">\${video.title}</div>
                        <div class="card-meta">
                            <span><i class="ph ph-eye"></i> \${views}</span>
                            <span>HD</span>
                        </div>
                    </div>
                </div>
            \`;
        }

        function showError(msg) {
            document.getElementById('main-loader').innerHTML = \`<p style="color: red;">Error: \${msg}</p>\`;
        }

        // --- Video Logic ---
        let hlsInstance = null;

        async function playVideo(slug) {
            const modal = document.getElementById('modal');
            const video = document.getElementById('player');
            const titleEl = document.getElementById('modal-title');
            const tagsEl = document.getElementById('modal-tags');

            modal.classList.add('active');
            titleEl.innerText = "Fetching Stream...";
            tagsEl.innerHTML = '';
            
            try {
                const res = await fetch(\`\${API_URL}/api/video/\${slug}\`);
                const data = await res.json();

                if(data.success) {
                    titleEl.innerText = data.details.title || data.title;
                    
                    if(data.details.tags) {
                        tagsEl.innerHTML = data.details.tags.map(t => \`<span class="tag">\${t}</span>\`).join('');
                    }

                    const streamURL = data.streams[0].url;

                    if (Hls.isSupported()) {
                        if(hlsInstance) hlsInstance.destroy();
                        hlsInstance = new Hls();
                        hlsInstance.loadSource(streamURL);
                        hlsInstance.attachMedia(video);
                        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => video.play());
                    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                        video.src = streamURL;
                        video.play();
                    }
                } else {
                    titleEl.innerText = "Error: Stream not found (Premium/Blocked)";
                }
            } catch (err) {
                titleEl.innerText = "Error fetching video details";
            }
        }

        function closeModal() {
            const modal = document.getElementById('modal');
            const video = document.getElementById('player');
            modal.classList.remove('active');
            video.pause();
            video.src = "";
            if(hlsInstance) hlsInstance.destroy();
        }

        // Close on outside click
        document.getElementById('modal').addEventListener('click', (e) => {
            if(e.target.id === 'modal') closeModal();
        });
    </script>
</body>
</html>
    `);
});

// ==========================================
//  BACKEND: LIGHTWEIGHT API (Axios)
// ==========================================

// GET /api/home
app.get('/api/home', async (req, res) => {
    try {
        const response = await axios.get('https://hanime.tv/api/v8/landing', { headers: HEADERS });
        const data = response.data;

        const sections = data.sections.map(section => ({
            title: section.title,
            videos: section.hentai_video_ids.map(id => {
                const v = data.hentai_videos.find(val => val.id === id);
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
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to fetch home data." });
    }
});

// GET /api/video/:slug
app.get('/api/video/:slug', async (req, res) => {
    const { slug } = req.params;
    try {
        const pageUrl = `https://hanime.tv/videos/hentai/${slug}`;
        const { data: html } = await axios.get(pageUrl, { headers: HEADERS });

        // Method 1: Regex Scraping (Lightweight & Fast)
        const m3u8Pattern = /"url":"(https:[^"]+?\.m3u8[^"]*?)"/g;
        const matches = [];
        let match;
        while ((match = m3u8Pattern.exec(html)) !== null) {
            matches.push(match[1].replace(/\\u002F/g, "/"));
        }
        let streams = [...new Set(matches)];

        // Extract Metadata
        const $ = cheerio.load(html);
        const title = $('title').text().replace(' - hanime.tv', '');
        
        // Return Result
        if (streams.length > 0) {
            res.json({
                success: true,
                title: title,
                details: { title: title, tags: [] }, // Basic meta for now
                streams: streams.map(url => ({ url }))
            });
        } else {
            res.status(404).json({ success: false, message: "Stream not found (Cloudflare blocked or Premium)" });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});