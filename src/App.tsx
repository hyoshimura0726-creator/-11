import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView, animate, AnimatePresence } from 'motion/react';
import { Terminal, Youtube, Play, Wallet, Dumbbell, Utensils, BookOpen, Flame, Clock, CheckCircle2, BarChart2, Plus, Minus, Share2, Twitter, Facebook, Copy, Check, X, RefreshCw, LogIn, LogOut } from 'lucide-react';
import { VibeLog } from './components/VibeLog';
import { StudyMetrics } from './components/StudyMetrics';
import { AdminPanel } from './components/AdminPanel';
import { CheerBoard } from './components/CheerBoard';
import { Roadmap } from './components/Roadmap';
import { useAuth } from './AuthContext';
import { db } from './firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

function CountUp({ end, duration = 2, suffix = '', prefix = '' }: { end: number, duration?: number, suffix?: string, prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const prevEnd = useRef(0);

  useEffect(() => {
    if (isInView) {
      const controls = animate(prevEnd.current, end, {
        duration,
        ease: "easeOut",
        onUpdate: (value) => {
          setCount(Math.floor(value));
        },
        onComplete: () => {
          prevEnd.current = end;
        }
      });
      return () => controls.stop();
    }
  }, [isInView, end, duration]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

function Countdown({ targetDate, title }: { targetDate: string, title: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;

      if (distance < 0) {
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="bg-neutral-900/80 border border-neutral-800 p-6 rounded-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <h3 className="text-neutral-400 text-sm font-mono mb-4 flex items-center gap-2">
        <Flame size={16} className="text-orange-500" />
        {title}
      </h3>
      <div className="flex gap-2 md:gap-4 text-orange-500 font-mono text-2xl md:text-4xl">
        <div className="flex flex-col items-center w-16 md:w-20"><span className="font-bold">{timeLeft.days}</span><span className="text-[10px] md:text-xs text-neutral-500 mt-1">日</span></div>
        <span className="text-neutral-700 font-light">:</span>
        <div className="flex flex-col items-center w-12 md:w-16"><span className="font-bold">{timeLeft.hours.toString().padStart(2, '0')}</span><span className="text-[10px] md:text-xs text-neutral-500 mt-1">時間</span></div>
        <span className="text-neutral-700 font-light">:</span>
        <div className="flex flex-col items-center w-12 md:w-16"><span className="font-bold">{timeLeft.minutes.toString().padStart(2, '0')}</span><span className="text-[10px] md:text-xs text-neutral-500 mt-1">分</span></div>
        <span className="text-neutral-700 font-light">:</span>
        <div className="flex flex-col items-center w-12 md:w-16"><span className="font-bold">{timeLeft.seconds.toString().padStart(2, '0')}</span><span className="text-[10px] md:text-xs text-neutral-500 mt-1">秒</span></div>
      </div>
    </div>
  );
}


function Life() {
  return (
    <div className="mt-16">
      <h2 className="text-neutral-500 font-mono text-sm mb-6 flex items-center gap-2">
        // ライフバランス
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div whileHover={{ y: -4 }} className="bg-neutral-900/30 border border-neutral-800/50 p-6 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-orange-500/30 hover:bg-neutral-900/50 transition-all">
          <div className="p-3 bg-neutral-950 rounded-full border border-neutral-800">
            <Dumbbell className="text-neutral-400" size={20} />
          </div>
          <div className="text-center">
            <div className="text-neutral-200 font-medium mb-1">筋トレ</div>
            <div className="text-xs text-neutral-500">身体は最大の資本。</div>
          </div>
        </motion.div>
        <motion.div whileHover={{ y: -4 }} className="bg-neutral-900/30 border border-neutral-800/50 p-6 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-orange-500/30 hover:bg-neutral-900/50 transition-all">
          <div className="p-3 bg-neutral-950 rounded-full border border-neutral-800">
            <Utensils className="text-neutral-400" size={20} />
          </div>
          <div className="text-center">
            <div className="text-neutral-200 font-medium mb-1">料理</div>
            <div className="text-xs text-neutral-500">身体を作る、心を整える。</div>
          </div>
        </motion.div>
        <motion.div whileHover={{ y: -4 }} className="bg-neutral-900/30 border border-neutral-800/50 p-6 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-orange-500/30 hover:bg-neutral-900/50 transition-all">
          <div className="p-3 bg-neutral-950 rounded-full border border-neutral-800">
            <BookOpen className="text-neutral-400" size={20} />
          </div>
          <div className="text-center">
            <div className="text-neutral-200 font-medium mb-1">読書</div>
            <div className="text-xs text-neutral-500">先人の知恵をインストール。</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


function LatestVideo({ videoId, title }: { videoId?: string; title?: string }) {
  const [video, setVideo] = useState<{ id: string; title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // If props are provided via Firestore, use them; otherwise fetch from RSS
    if (videoId && title) {
      setVideo({ id: videoId, title });
      setLoading(false);
      return;
    }

    const fetchVideo = async () => {
      try {
        const channelId = 'UC20ns0anAsbj_UFlhVnfu3A';
        const rssUrl = encodeURIComponent(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`);
        const data = await res.json();
        
        if (data.items && data.items.length > 0) {
          const latest = data.items[0];
          const fetchedVideoId = latest.link.split('v=')[1];
          setVideo({ id: fetchedVideoId, title: latest.title });
        }
      } catch (error) {
        console.error('動画の取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId, title]);

  const videoUrl = video ? `https://youtu.be/${video.id}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(videoUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-16 relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-neutral-500 font-mono text-sm flex items-center gap-2">
          <Youtube size={16} /> 最新の記録 (LATEST_VLOG)
        </h2>
        {video && (
          <button 
            onClick={() => setIsShareOpen(true)}
            className="flex items-center gap-2 text-neutral-400 hover:text-orange-400 text-xs font-mono transition-colors bg-neutral-900/50 px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-orange-500/50"
          >
            <Share2 size={14} /> SHARE
          </button>
        )}
      </div>
      
      <div className="bg-neutral-900/50 border border-neutral-800 p-4 md:p-6 rounded-2xl relative">
        {loading ? (
          <div className="aspect-video bg-neutral-900/50 animate-pulse rounded-xl flex items-center justify-center border border-neutral-800">
            <span className="text-neutral-600 font-mono text-sm">LOADING_VIDEO...</span>
          </div>
        ) : video ? (
          <div className="aspect-video rounded-xl overflow-hidden border border-neutral-800 shadow-lg shadow-black/50">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${video.id}`}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        ) : (
          <div className="aspect-video bg-neutral-900/50 rounded-xl flex items-center justify-center border border-neutral-800">
            <span className="text-neutral-600 font-mono text-sm">VIDEO_NOT_FOUND</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isShareOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShareOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10, x: "-50%", translateY: "-50%" }}
              animate={{ opacity: 1, scale: 1, y: 0, x: "-50%", translateY: "-50%" }}
              exit={{ opacity: 0, scale: 0.95, y: 10, x: "-50%", translateY: "-50%" }}
              className="fixed left-1/2 top-1/2 z-50 w-[90%] max-w-sm bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Share2 size={16} className="text-neutral-400" /> 動画をシェア
                </h3>
                <button onClick={() => setIsShareOpen(false)} className="text-neutral-500 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
              
              <div className="flex justify-center gap-4 mb-6">
                <a 
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent(video?.title || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20 p-4 rounded-xl transition-colors flex-1 flex flex-col justify-center items-center gap-2"
                >
                  <Twitter size={24} />
                  <span className="text-xs font-medium">X (Twitter)</span>
                </a>
                <a 
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#4267B2]/10 text-[#4267B2] hover:bg-[#4267B2]/20 p-4 rounded-xl transition-colors flex-1 flex flex-col justify-center items-center gap-2"
                >
                  <Facebook size={24} />
                  <span className="text-xs font-medium">Facebook</span>
                </a>
              </div>

              <div className="bg-neutral-950 p-2 rounded-xl flex items-center gap-2 border border-neutral-800">
                <input 
                  type="text" 
                  readOnly 
                  value={videoUrl} 
                  className="bg-transparent text-neutral-400 text-sm flex-1 outline-none px-2 font-mono truncate"
                />
                <button 
                  onClick={handleCopy}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white p-2 rounded-lg transition-colors flex items-center gap-2 flex-shrink-0"
                >
                  {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const { user, login, logout } = useAuth();
  const [subs, setSubs] = useState(0);
  const [views, setViews] = useState(0);
  const [savings, setSavings] = useState(45200);
  
  const [videoId, setVideoId] = useState('');
  const [videoTitle, setVideoTitle] = useState('');

  useEffect(() => {
    // Firestore real-time auto-update
    const unsubscribeStats = onSnapshot(doc(db, 'settings', 'stats'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.subscribers !== undefined) setSubs(data.subscribers);
        if (data.views !== undefined) setViews(data.views);
        if (data.savings !== undefined) setSavings(data.savings);
      }
    });

    const unsubscribeVideo = onSnapshot(doc(db, 'settings', 'latest_video'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.videoId) setVideoId(data.videoId);
        if (data.title) setVideoTitle(data.title);
      }
    });

    return () => {
      unsubscribeStats();
      unsubscribeVideo();
    };
  }, []);


  return (
    <div className="min-h-screen bg-[#050505] text-neutral-200 selection:bg-orange-500/30 selection:text-orange-200 pb-20">
      {/* Background grid for tech feel */}
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      
      {/* Auth Header */}
      <div className="fixed top-0 right-0 p-6 z-50">
        {user ? (
          <button onClick={logout} className="flex items-center gap-2 text-xs font-mono text-neutral-500 hover:text-orange-400 transition-colors bg-neutral-900/50 px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-orange-500/50">
            <LogOut size={14} /> LOGOUT
          </button>
        ) : (
          <button onClick={login} className="flex items-center gap-2 text-xs font-mono text-orange-400 hover:text-orange-300 transition-colors bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/30 hover:border-orange-500/50">
            <LogIn size={14} /> LOGIN
          </button>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-20 md:pt-32 relative z-10">
        <motion.header 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-block border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-mono px-3 py-1 rounded-full mb-6">
            プロジェクト：逆転ログ
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-tight font-display">
            32歳中卒フリーター、<br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
              人生どん底からの挑戦。
            </span>
          </h1>
          <p className="text-neutral-400 text-lg md:text-xl max-w-2xl leading-relaxed">
            失った時間は戻らない。だからこそ、今からすべてを覆す。
            泥臭く、テクノロジーを武器に、逆転の軌跡をここに刻む。
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-6 items-start sm:items-center border-t border-neutral-800/50 pt-8 max-w-2xl">
            <div className="flex-1 w-full">
              <div className="flex justify-between text-xs font-mono text-neutral-400 mb-2">
                <span className="flex items-center gap-1.5"><Clock size={14} /> 今週の学習時間</span>
                <span className="text-orange-400">42.5 / 50 hrs</span>
              </div>
              <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "85%" }}
                  transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
                  className="h-full bg-orange-500 rounded-full"
                />
              </div>
            </div>
          </div>
        </motion.header>

        <VibeLog />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16"
        >
          <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl group flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-neutral-400">
                <Youtube size={18} />
                <span className="text-sm font-mono">チャンネル登録者数</span>
              </div>
            </div>
            <div className="text-3xl font-bold font-mono text-white mt-auto">
              <CountUp end={subs} />
            </div>
          </div>
          
          <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl group flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-neutral-400">
                <Play size={18} />
                <span className="text-sm font-mono">総再生回数</span>
              </div>
            </div>
            <div className="text-3xl font-bold font-mono text-white mt-auto">
              <CountUp end={views} suffix="+" />
            </div>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-neutral-400">
                <Wallet size={18} />
                <span className="text-sm font-mono">貯金残高</span>
              </div>
            </div>
            <div className="text-3xl font-bold font-mono text-white">
              <CountUp end={savings} prefix="¥" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          <StudyMetrics />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
        >
          {videoId ? <LatestVideo videoId={videoId} title={videoTitle} /> : <div />}
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        >
          <CheerBoard />
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, delay: 0.45, ease: "easeOut" }}
        >
          <Roadmap />
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
        >
          <AdminPanel onUpdate={() => {}} />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="mt-16"
        >
          <h2 className="text-neutral-500 font-mono text-sm mb-6 flex items-center gap-2">
            // 逆転へのカウントダウン
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Countdown targetDate="2026-06-14T09:00:00" title="簿記1級 試験日 (2026.06)" />
            <Countdown targetDate="2026-08-04T09:00:00" title="税理士試験 (2026.08)" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
        >
          <Life />
        </motion.div>
        
        <footer className="mt-24 pt-8 border-t border-neutral-900 text-center text-neutral-600 font-mono text-xs">
          © {new Date().getFullYear()} 逆転ログ. 言い訳無用。
        </footer>
      </div>
    </div>
  );
}
