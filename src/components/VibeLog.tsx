import React, { useState, useEffect } from 'react';
import { Terminal, Save } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { db, handleFirestoreError } from '../firebase';
import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

export function VibeLog() {
  const [vibe, setVibe] = useState('今日も泥臭く積み上げる。');
  const [editedVibe, setEditedVibe] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  const isAdmin = user?.email === 'h.yoshimura0726@gmail.com';

  useEffect(() => {
    const fetchLatestVibe = async () => {
      try {
        const q = query(
          collection(db, 'vibes'),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const text = snapshot.docs[0].data().text;
          setVibe(text);
          setEditedVibe(text);
        }
      } catch (error) {
        console.error('Failed to fetch vibe:', error);
      }
    };
    
    fetchLatestVibe();
  }, [isAdmin]);

  const handleSave = async () => {
    if (!isAdmin || !editedVibe.trim()) return;
    
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'vibes'), {
        text: editedVibe,
        createdAt: serverTimestamp()
      });
      setVibe(editedVibe);
    } catch (error) {
      try {
        handleFirestoreError(error, 'create', `/vibes`);
      } catch (e: any) {
        alert(e.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-16">
      <h2 className="text-neutral-500 font-mono text-sm mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Terminal size={16} /> 現在のバイブス (VIBES_LOG)
        </div>
      </h2>
      
      {isAdmin ? (
        <div className="flex flex-col sm:flex-row gap-3 relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-orange-500 animate-pulse pointer-events-none" />
          <input
            type="text"
            value={editedVibe}
            onChange={(e) => setEditedVibe(e.target.value)}
            className="flex-1 bg-neutral-900/50 border border-neutral-800 text-orange-400 font-mono py-4 pl-10 pr-4 rounded-xl focus:outline-none focus:border-orange-500/50 focus:bg-neutral-900 transition-all placeholder:text-neutral-700"
            placeholder="今日の気分は？"
          />
          <button
            onClick={handleSave}
            disabled={isSaving || !editedVibe.trim()}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-4 rounded-xl font-mono transition-colors disabled:opacity-50 disabled:hover:bg-orange-500 flex items-center justify-center gap-2"
          >
            {isSaving ? <span className="animate-spin text-lg">...</span> : <Save size={18} />} SAVE
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <div className="w-full bg-neutral-900/30 border border-neutral-800/80 text-orange-400 font-mono py-4 pl-10 pr-4 rounded-xl">
            {vibe}
          </div>
        </div>
      )}
    </div>
  );
}
