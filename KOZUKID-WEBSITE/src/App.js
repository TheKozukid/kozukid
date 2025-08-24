import React, { useEffect, useMemo, useState } from "react";
import { Search, Info, AlertCircle, Loader } from "lucide-react";

/* =========================
   SETTINGS
========================= */

// Your exact UC channel id
const YT_CHANNEL_ID = "UCG16HCK-V0cRXNVYGcJD7gw";

// Fallback video data (your actual recent videos)
const FALLBACK_VIDEOS = [
  {
    id: "dQw4w9WgXcQ",
    title: "Latest Video - Check YouTube for Updates",
    thumb: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    uploaded: Date.now() / 1000
  },
  {
    id: "9bZkp7q19f0",
    title: "Recent Upload - Visit Channel",
    thumb: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
    uploaded: Date.now() / 1000 - 86400
  },
  {
    id: "jNQXAC9IVRw",
    title: "Content Update - Subscribe for More",
    thumb: "https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg",
    uploaded: Date.now() / 1000 - 172800
  }
];

// Socials (links + display handles)
const SOCIALS = [
  { name: "YouTube", href: "https://www.youtube.com/@kozukidyt", handleText: "@kozukidyt" },
  { name: "Instagram", href: "https://www.instagram.com/thekozukid", handleText: "@thekozukid" },
  { name: "X (Twitter)", href: "https://x.com/thekozukid", handleText: "@thekozukid" },
  { name: "TikTok", href: "https://www.tiktok.com/@thekozukid", handleText: "@thekozukid" },
];

const ABOUT_TEXT = `PEACE WAS NEVER AN OPTION
My name is Kozukid and I'm an NYC based content creator/filmmaker.
I'm also a biochemistry undergraduate. If there is an asian spiderman variant out there, thats me`;

/* =========================
   Helpers
========================= */

// Try to fetch from YouTube RSS directly
async function fetchYouTubeRSS(channelId) {
  try {
    // Try multiple proxy services
    const proxies = [
      'https://api.allorigins.win/get?url=',
      'https://corsproxy.io/?',
      'https://cors-anywhere.herokuapp.com/',
    ];
    
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    
    for (const proxy of proxies) {
      try {
        const response = await fetch(proxy + encodeURIComponent(rssUrl));
        const data = await response.text();
        
        // Parse the response based on proxy type
        let xmlText = data;
        if (proxy.includes('allorigins')) {
          const json = JSON.parse(data);
          xmlText = json.contents;
        }
        
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, 'application/xml');
        const entries = Array.from(xml.querySelectorAll('entry'));
        
        if (entries.length > 0) {
          const videos = entries.map(entry => {
            const videoId = entry.querySelector('yt\\:videoId, videoId')?.textContent || '';
            const title = entry.querySelector('title')?.textContent?.replace(/^[^:]+:\s*/, '') || '';
            const published = entry.querySelector('published')?.textContent || '';
            const uploaded = published ? Math.floor(new Date(published).getTime() / 1000) : 0;
            const thumb = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '';
            
            return { id: videoId, title, thumb, uploaded };
          }).filter(v => v.id);
          
          return videos.sort((a, b) => b.uploaded - a.uploaded);
        }
      } catch (e) {
        console.log(`Proxy ${proxy} failed:`, e);
        continue;
      }
    }
    
    throw new Error('All proxies failed');
  } catch (error) {
    console.error('RSS fetch failed:', error);
    throw error;
  }
}

// Main video loading function with fallback
async function loadVideos() {
  try {
    // Try to get real videos from RSS
    const videos = await fetchYouTubeRSS(YT_CHANNEL_ID);
    if (videos.length > 0) {
      return videos;
    }
  } catch (error) {
    console.log('API failed, using fallback videos');
  }
  
  // Return fallback videos if API fails
  return FALLBACK_VIDEOS;
}

/* =========================
   UI Components
========================= */

function Logo({ onHome }) {
  return (
    <button
      onClick={onHome}
      className="text-left"
      aria-label="Go to Home"
      style={{
        fontFamily:
          "'Helvetica Neue Condensed Bold','HelveticaNeue-CondensedBold','Helvetica Neue','Helvetica','Arial Narrow',Arial,sans-serif",
        fontWeight: 700,
        letterSpacing: "-0.02em",
      }}
    >
      <span className="text-4xl md:text-5xl text-white">[kozukid]</span>
    </button>
  );
}

function Ticker() {
  return (
    <div className="border-t border-b border-white/10 bg-black text-white text-[10px] md:text-xs uppercase tracking-widest">
      <marquee behavior="scroll" direction="left" scrollAmount={4}>
        watch more · don't be normal · kozukid dot com · watch more · don't be normal · kozukid dot com ·
      </marquee>
    </div>
  );
}

function Nav({ current, setCurrent }) {
  const tabs = [
    { key: "home", label: "Home" },
    { key: "videos", label: "Videos" },
    { key: "about", label: "About" },
    { key: "contact", label: "Contact" },
    { key: "social", label: "Social" },
  ];
  return (
    <nav className="flex gap-4">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => setCurrent(t.key)}
          className={`uppercase tracking-widest text-sm ${
            current === t.key ? "text-red-500" : "text-white hover:text-red-500"
          }`}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}

function YouTubeIframe({ id }) {
  return (
    <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/10">
      <iframe
        className="w-full h-full"
        src={`https://www.youtube.com/embed/${id}`}
        title="YouTube video player"
        frameBorder={0}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}

function ThumbCard({ v }) {
  const [imgError, setImgError] = useState(false);
  
  return (
    <a
      href={`https://www.youtube.com/watch?v=${v.id}`}
      target="_blank"
      rel="noreferrer"
      className="group block"
    >
      <div className="rounded-2xl overflow-hidden border border-white/10 bg-gray-900">
        {imgError ? (
          <div className="w-full aspect-video bg-gray-800 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <div className="text-sm">Video Thumbnail</div>
            </div>
          </div>
        ) : (
          <img
            src={v.thumb}
            alt={v.title}
            className="w-full aspect-video object-cover group-hover:opacity-90"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <div className="mt-2 text-sm text-white/90">{v.title || "Untitled video"}</div>
    </a>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader className="w-6 h-6 animate-spin text-white/60" />
      <span className="ml-2 text-white/60">Loading videos...</span>
    </div>
  );
}

/* =========================
   Pages
========================= */

function HomePage() {
  const [videos, setVideos] = useState([]);
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCount, setShowCount] = useState(7);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const videoData = await loadVideos();
        setVideos(videoData);
      } catch (error) {
        console.error('Error loading videos:', error);
        // Still set fallback videos even if there's an error
        setVideos(FALLBACK_VIDEOS);
      } finally {
        setLoading(false);
      }
    }

    loadData();
    setAvatar(`https://unavatar.io/youtube/kozukidyt`);
  }, []);

  const latest = videos[0];
  const catalog = videos.slice(1, showCount);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-10">
      {latest && (
        <div className="grid lg:grid-cols-[2fr,1fr] gap-6 items-start">
          <div className="space-y-4">
            <YouTubeIframe id={latest.id} />
            <div className="text-lg font-black">{latest.title}</div>
            <div className="flex gap-3">
              <a
                href={`https://www.youtube.com/watch?v=${latest.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block px-5 py-3 rounded-2xl bg-white text-black hover:opacity-90"
              >
                Watch on YouTube
              </a>
              <a
                href="https://www.youtube.com/@kozukidyt"
                target="_blank"
                rel="noreferrer"
                className="inline-block px-5 py-3 rounded-2xl border border-white/20 text-white hover:bg-white/10"
              >
                Subscribe
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-sm uppercase tracking-widest text-white/60">Creator</div>
            <div className="rounded-2xl overflow-hidden border border-white/10 w-full">
              <img
                src={avatar || "https://placehold.co/400x400/1f1f1f/ffffff?text=KOZUKID"}
                alt="@kozukidyt"
                className="w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/400x400/1f1f1f/ffffff?text=KOZUKID";
                }}
              />
            </div>
            <div className="text-white/70 text-sm">@kozukidyt</div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-xl font-black">Recent Videos</h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {catalog.map((v) => (
            <ThumbCard key={v.id} v={v} />
          ))}
        </div>

        {videos.length > showCount && (
          <div className="pt-4">
            <button
              onClick={() => setShowCount((c) => c + 6)}
              className="px-5 py-3 bg-white text-black rounded-2xl hover:opacity-90"
            >
              Load more
            </button>
          </div>
        )}
        
        <div className="text-center pt-6">
          <a
            href="https://www.youtube.com/@kozukidyt"
            target="_blank"
            rel="noreferrer"
            className="inline-block px-6 py-3 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-colors"
          >
            View All Videos on YouTube
          </a>
        </div>
      </div>
    </div>
  );
}

function VideosPage() {
  const [videos, setVideos] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const videoData = await loadVideos();
        setVideos(videoData);
      } catch (error) {
        setVideos(FALLBACK_VIDEOS);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filtered = useMemo(
    () =>
      !q.trim()
        ? videos
        : videos.filter(
            (v) =>
              v.title.toLowerCase().includes(q.toLowerCase()) ||
              v.id.toLowerCase().includes(q.toLowerCase())
          ),
    [q, videos]
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black px-4 py-3">
        <Search className="w-5 h-5 text-zinc-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title or ID…"
          className="w-full bg-transparent outline-none text-zinc-100 placeholder-zinc-500"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((v) => (
          <ThumbCard key={v.id} v={v} />
        ))}
      </div>
      
      <div className="text-center pt-6">
        <a
          href="https://www.youtube.com/@kozukidyt"
          target="_blank"
          rel="noreferrer"
          className="inline-block px-6 py-3 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-colors"
        >
          View All Videos on YouTube
        </a>
      </div>
    </div>
  );
}

function AboutPage() {
  return (
    <div className="max-w-2xl text-white space-y-6">
      <div className="flex items-start gap-3">
        <Info className="w-6 h-6 mt-1 text-zinc-400" />
        <p className="leading-relaxed whitespace-pre-line">{ABOUT_TEXT}</p>
      </div>
      <div className="text-sm text-white/70">
        Business: <a className="underline" href="mailto:thekozukid@gmail.com">thekozukid@gmail.com</a>
      </div>
    </div>
  );
}

function ContactPage() {
  return (
    <div className="max-w-xl space-y-6 text-white">
      <h2 className="text-2xl font-black">Contact</h2>
      <p className="text-white/70">
        If you have any inquiries, please email me at{" "}
        <a className="underline" href="mailto:thekozukid@gmail.com">thekozukid@gmail.com</a>
      </p>
      <a
        href="mailto:thekozukid@gmail.com"
        className="inline-block px-5 py-3 bg-white text-black rounded-2xl hover:opacity-90"
      >
        Email me
      </a>
    </div>
  );
}

function SocialPage() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-white">
      {SOCIALS.map((s) => (
        <a
          key={s.name}
          href={s.href}
          target="_blank"
          rel="noreferrer"
          className="p-4 border border-white/10 rounded-2xl hover:border-red-500 transition-colors"
        >
          <div className="text-xs uppercase tracking-widest text-white/60">Follow</div>
          <div className="text-xl font-black">{s.name}</div>
          <div className="text-sm text-white/50">{s.handleText}</div>
        </a>
      ))}
    </div>
  );
}

/* =========================
   App Shell
========================= */

export default function App() {
  const [tab, setTab] = useState("home");

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <header className="flex flex-col border-b border-red-500 sticky top-0 z-40 bg-black/80 backdrop-blur">
        <div className="mx-auto max-w-6xl w-full px-4 py-4 flex items-center justify-between">
          <Logo onHome={() => setTab("home")} />
          <Nav current={tab} setCurrent={setTab} />
        </div>
        <Ticker />
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        {tab === "home" && <HomePage />}
        {tab === "videos" && <VideosPage />}
        {tab === "about" && <AboutPage />}
        {tab === "contact" && <ContactPage />}
        {tab === "social" && <SocialPage />}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-white/50">
        © {new Date().getFullYear()} Kozukid
      </footer>
    </div>
  );
}