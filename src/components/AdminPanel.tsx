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

  const [recVideoId, setRecVideoId] = useState('');
  const [recVideoTitle, setRecVideoTitle] = useState('');

  const [profileText1, setProfileText1] = useState('');
  const [profileText2, setProfileText2] = useState('');
  const [profileText3, setProfileText3] = useState('');

  const [isSavingStats, setIsSavingStats] = useState(false);
  const [isSavingVideo, setIsSavingVideo] = useState(false);
  const [isSavingRecVideo, setIsSavingRecVideo] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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

      const recVideoDoc = await getDoc(doc(db, 'settings', 'recommended_video'));
      if (recVideoDoc.exists()) {
        const data = recVideoDoc.data();
        setRecVideoId(data.videoId || '');
        setRecVideoTitle(data.title || '');
      }

      const profileDoc = await getDoc(doc(db, 'settings', 'profile'));
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        setProfileText1(data.text1 || '');
        setProfileText2(data.text2 || '');
        setProfileText3(data.text3 || '');
      }
    };
    fetchData();
  }, [isAdmin]);

  if (!isAdmin) return null;

  const handleSaveStats = async () => {
    setIsSavingStats(true);
    try {
      // ユーザーの意図通り、空の入力項目を無視してマージ保存する
      const updateData: any = { updatedAt: serverTimestamp() };
      if (subs !== '') updateData.subscribers = Number(subs);
      if (views !== '') updateData.views = Number(views);
      if (savings !== '') updateData.savings = Number(savings);

      await setDoc(doc(db, 'settings', 'stats'), updateData, { merge: true });
      onUpdate();
    } catch (e) {
      handleFirestoreError(e, 'update', '/settings/stats');
    } finally {
      setIsSavingStats(false);
    }
  };

  const extractYoutubeId = (input: string) => {
    if (!input) return "";
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = input.match(regExp);
    return (match && match[2].length === 11) ? match[2] : input;
  };

  const handleSaveVideo = async () => {
    setIsSavingVideo(true);
    try {
      const extractedId = extractYoutubeId(videoId);
      setVideoId(extractedId);

      const updateData: any = { 
        updatedAt: serverTimestamp(),
        videoId: extractedId,
        title: videoTitle
      };

      await setDoc(doc(db, 'settings', 'latest_video'), updateData, { merge: true });
      onUpdate();
    } catch (e) {
      handleFirestoreError(e, 'update', '/settings/latest_video');
    } finally {
      setIsSavingVideo(false);
    }
  };

  const handleSaveRecVideo = async () => {
    setIsSavingRecVideo(true);
    try {
      const extractedId = extractYoutubeId(recVideoId);
      setRecVideoId(extractedId);

      const updateData: any = { 
        updatedAt: serverTimestamp(),
        videoId: extractedId,
        title: recVideoTitle
      };

      await setDoc(doc(db, 'settings', 'recommended_video'), updateData, { merge: true });
      onUpdate();
    } catch (e) {
      handleFirestoreError(e, 'update', '/settings/recommended_video');
    } finally {
      setIsSavingRecVideo(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const updateData: any = { 
        updatedAt: serverTimestamp(),
        text1: profileText1,
        text2: profileText2,
        text3: profileText3
      };

      await setDoc(doc(db, 'settings', 'profile'), updateData, { merge: true });
      onUpdate();
    } catch (e) {
      handleFirestoreError(e, 'update', '/settings/profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="mt-16 bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
      <h2 className="text-neutral-500 font-mono text-sm mb-6 flex items-center gap-2">
        <Settings size={16} /> 管理者設定 (ADMIN_CONTROLS)
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
              {isSavingVideo ? '...' : <Save size={14} />} 情報を保存
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-neutral-400 text-xs font-mono mb-4 border-b border-neutral-800 pb-2">おすすめ動画</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-neutral-500 font-mono mb-1">YouTube Video ID (ex: dQw4w9WgXcQ)</label>
              <input type="text" value={recVideoId} onChange={e => setRecVideoId(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-sm px-3 py-2 rounded-lg" />
            </div>
            <div>
              <label className="block text-[10px] text-neutral-500 font-mono mb-1">動画タイトル</label>
              <input type="text" value={recVideoTitle} onChange={e => setRecVideoTitle(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-sm px-3 py-2 rounded-lg" />
            </div>
            <button onClick={handleSaveRecVideo} disabled={isSavingRecVideo} className="bg-neutral-800 text-neutral-300 hover:text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
              {isSavingRecVideo ? '...' : <Save size={14} />} 情報を保存
            </button>
          </div>
        </div>

        <div>
           <h3 className="text-neutral-400 text-xs font-mono mb-4 border-b border-neutral-800 pb-2">自己紹介テキスト</h3>
           <div className="space-y-3">
             <div>
               <label className="block text-[10px] text-neutral-500 font-mono mb-1">テキスト 1行目</label>
               <input type="text" value={profileText1} onChange={e => setProfileText1(e.target.value)} placeholder="32歳中卒フリーター、" className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-sm px-3 py-2 rounded-lg" />
             </div>
             <div>
               <label className="block text-[10px] text-neutral-500 font-mono mb-1">テキスト 2行目 (ハイライト)</label>
               <input type="text" value={profileText2} onChange={e => setProfileText2(e.target.value)} placeholder="人生どん底からの挑戦。" className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-sm px-3 py-2 rounded-lg" />
             </div>
             <div>
               <label className="block text-[10px] text-neutral-500 font-mono mb-1">詳細テキスト</label>
               <textarea value={profileText3} onChange={e => setProfileText3(e.target.value)} rows={3} placeholder="失った時間は戻らない。だからこそ、今からすべてを覆す。泥臭く、テクノロジーを武器に、逆転の軌跡をここに刻む。" className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-sm px-3 py-2 rounded-lg resize-none" />
             </div>
             <button onClick={handleSaveProfile} disabled={isSavingProfile} className="bg-neutral-800 text-neutral-300 hover:text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
               {isSavingProfile ? '...' : <Save size={14} />} テキストを保存
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
