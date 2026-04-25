import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { db, handleFirestoreError } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Save, Settings } from 'lucide-react';

export function AdminPanel({ onUpdate }: { onUpdate: () => void }) {
  const { user } = useAuth();
  const isAdmin = user?.email === 'h.yoshimura0726@gmail.com';
  
  const [subs, setSubs] = useState('');
  const [views, setViews] = useState('');
  const [savings, setSavings] = useState('');
  
  const [videoId, setVideoId] = useState('');
  const [videoTitle, setVideoTitle] = useState('');

  const [isSavingStats, setIsSavingStats] = useState(false);
  const [isSavingVideo, setIsSavingVideo] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchData = async () => {
      const statsDoc = await getDoc(doc(db, 'settings', 'stats'));
      if (statsDoc.exists()) {
        const data = statsDoc.data();
        setSubs(String(data.subscribers));
        setViews(String(data.views));
        setSavings(String(data.savings));
      }
      
      const videoDoc = await getDoc(doc(db, 'settings', 'latest_video'));
      if (videoDoc.exists()) {
        const data = videoDoc.data();
        setVideoId(data.videoId);
        setVideoTitle(data.title);
      }
    };
    fetchData();
  }, [isAdmin]);

  if (!isAdmin) return null;

  const handleSaveStats = async () => {
    setIsSavingStats(true);
    try {
      await setDoc(doc(db, 'settings', 'stats'), {
        subscribers: Number(subs),
        views: Number(views),
        savings: Number(savings),
        updatedAt: serverTimestamp()
      });
      onUpdate();
    } catch (e) {
      handleFirestoreError(e, 'update', '/settings/stats');
    } finally {
      setIsSavingStats(false);
    }
  };

  const handleSaveVideo = async () => {
    setIsSavingVideo(true);
    try {
      await setDoc(doc(db, 'settings', 'latest_video'), {
        videoId,
        title: videoTitle,
        updatedAt: serverTimestamp()
      });
      onUpdate();
    } catch (e) {
      handleFirestoreError(e, 'update', '/settings/latest_video');
    } finally {
      setIsSavingVideo(false);
    }
  };

  return (
    <div className="mt-16 bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
      <h2 className="text-neutral-500 font-mono text-sm mb-6 flex items-center gap-2">
        <Settings size={16} /> 管理者設定 (ADMIN_CONTROLS)
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-neutral-400 text-xs font-mono mb-4 border-b border-neutral-800 pb-2">チャンネル統計</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-neutral-500 font-mono mb-1">登録者数</label>
              <input type="number" value={subs} onChange={e => setSubs(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-sm px-3 py-2 rounded-lg" />
            </div>
            <div>
              <label className="block text-[10px] text-neutral-500 font-mono mb-1">総再生数</label>
              <input type="number" value={views} onChange={e => setViews(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-sm px-3 py-2 rounded-lg" />
            </div>
            <div>
              <label className="block text-[10px] text-neutral-500 font-mono mb-1">貯金額 (円)</label>
              <input type="number" value={savings} onChange={e => setSavings(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-sm px-3 py-2 rounded-lg" />
            </div>
            <button onClick={handleSaveStats} disabled={isSavingStats} className="bg-neutral-800 text-neutral-300 hover:text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
              {isSavingStats ? '...' : <Save size={14} />} 統計を保存
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-neutral-400 text-xs font-mono mb-4 border-b border-neutral-800 pb-2">最新動画</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-neutral-500 font-mono mb-1">YouTube Video ID (ex: dQw4w9WgXcQ)</label>
              <input type="text" value={videoId} onChange={e => setVideoId(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-sm px-3 py-2 rounded-lg" />
            </div>
            <div>
              <label className="block text-[10px] text-neutral-500 font-mono mb-1">動画タイトル</label>
              <input type="text" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-sm px-3 py-2 rounded-lg" />
            </div>
            <button onClick={handleSaveVideo} disabled={isSavingVideo} className="bg-neutral-800 text-neutral-300 hover:text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
              {isSavingVideo ? '...' : <Save size={14} />} 動画情報を保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
