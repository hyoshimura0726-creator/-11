import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { db, handleFirestoreError } from '../firebase';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CheerMessage {
  id: string;
  userId: string;
  displayName: string;
  text: string;
  createdAt: number;
}

export function CheerBoard() {
  const { user } = useAuth();
  const isAdmin = user?.email === 'h.yoshimura0726@gmail.com';
  
  const [messages, setMessages] = useState<CheerMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fetchMessages = async () => {
    try {
      const q = query(
        collection(db, 'cheers'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toMillis() || Date.now()
      })) as CheerMessage[];
      setMessages(fetched);
    } catch (e) {
      console.error('Failed to fetch cheers:', e);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSend = async () => {
    if (!user || !newMessage.trim()) return;
    setIsSending(true);
    
    try {
      await addDoc(collection(db, 'cheers'), {
        userId: user.uid,
        displayName: user.displayName || '名無しさん',
        text: newMessage.trim(),
        createdAt: serverTimestamp()
      });
      setNewMessage('');
      await fetchMessages();
    } catch (error) {
      try {
        handleFirestoreError(error, 'create', '/cheers');
      } catch (e: any) {
        alert(e.message);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'cheers', id));
      await fetchMessages();
    } catch (error) {
      try {
        handleFirestoreError(error, 'delete', `/cheers/${id}`);
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  return (
    <div className="mt-16">
      <h2 className="text-neutral-500 font-mono text-sm mb-6 flex items-center gap-2">
        <MessageSquare size={16} /> 応援メッセージ (CHEERS)
      </h2>
      
      <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl flex flex-col h-96">
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 custom-scrollbar">
          <AnimatePresence>
            {messages.map(msg => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-neutral-950 border border-neutral-800/80 p-4 rounded-xl text-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-orange-500 font-bold text-xs">{msg.displayName}</div>
                  <div className="flex items-center gap-2">
                    <div className="text-neutral-600 text-[10px] font-mono">
                      {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    {isAdmin && (
                      <button onClick={() => handleDelete(msg.id)} className="text-neutral-600 hover:text-red-400">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-neutral-300 break-words whitespace-pre-wrap">{msg.text}</div>
              </motion.div>
            ))}
          </AnimatePresence>
          {messages.length === 0 && (
            <div className="text-center text-neutral-600 text-sm py-10 font-mono">
              まだメッセージはありません。一番乗りで応援しよう！
            </div>
          )}
        </div>

        {user ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="応援メッセージを入力..."
              maxLength={200}
              className="flex-1 bg-neutral-950 border border-neutral-800 text-neutral-200 px-4 py-3 rounded-xl focus:outline-none focus:border-orange-500/50"
            />
            <button
              onClick={handleSend}
              disabled={isSending || !newMessage.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-xl font-mono transition-colors disabled:opacity-50 disabled:hover:bg-orange-500 flex items-center justify-center"
            >
              <Send size={18} />
            </button>
          </div>
        ) : (
          <div className="text-center bg-neutral-950 border border-neutral-800 rounded-xl p-4">
            <p className="text-neutral-400 text-sm mb-2">メッセージを送信するにはログインしてください</p>
          </div>
        )}
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
}
