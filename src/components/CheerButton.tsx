import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame } from 'lucide-react';
import { db, handleFirestoreError } from '../firebase';
import { doc, setDoc, serverTimestamp, increment } from 'firebase/firestore';

export function CheerButton({ count }: { count: number }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; x: number }[]>([]);

  const handleCheer = async () => {
    setIsAnimating(true);
    
    const newEmoji = { id: Date.now(), x: Math.random() * 40 - 20 };
    setFloatingEmojis(prev => [...prev, newEmoji]);
    
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
    }, 1000);

    setTimeout(() => setIsAnimating(false), 200);

    try {
      const docRef = doc(db, 'settings', 'global_cheers');
      await setDoc(docRef, {
        count: increment(1),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e as Error, 'update', '/settings/global_cheers');
    }
  };

  return (
    <div className="relative inline-flex mt-6 sm:mt-0 sm:ml-auto">
      <AnimatePresence>
        {floatingEmojis.map((emoji) => (
          <motion.div
            key={emoji.id}
            initial={{ opacity: 1, y: 0, x: emoji.x, scale: 0.5 }}
            animate={{ opacity: 0, y: -80, x: emoji.x + (Math.random() * 20 - 10), scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none z-50 text-2xl"
          >
            🔥
          </motion.div>
        ))}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleCheer}
        className={`relative overflow-hidden group flex items-center gap-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 hover:from-orange-500/20 hover:to-red-500/20 border border-orange-500/30 px-5 py-2.5 rounded-xl transition-all duration-300 backdrop-blur-sm ${isAnimating ? 'ring-2 ring-orange-500/50' : ''}`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <motion.div
          animate={isAnimating ? { scale: [1, 1.4, 1], rotate: [0, -15, 15, -15, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <Flame className="text-orange-400 group-hover:text-orange-300 transition-colors" size={20} />
        </motion.div>
        
        <div className="flex flex-col items-start leading-none gap-1">
          <span className="text-[10px] font-bold text-orange-200/60 uppercase tracking-widest">Cheer</span>
          <span className="text-sm font-mono font-black text-orange-400">{count.toLocaleString()}</span>
        </div>
      </motion.button>
    </div>
  );
}
