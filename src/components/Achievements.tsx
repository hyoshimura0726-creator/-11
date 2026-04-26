import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Trash2, Edit2, Check, X, Award } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { db, handleFirestoreError } from '../firebase';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

interface Achievement {
  id: string;
  date: string;
  title: string;
  description: string;
  order: number;
}

export function Achievements() {
  const { user } = useAuth();
  const isAdmin = user?.email === 'h.yoshimura0726@gmail.com';
  
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [editDate, setEditDate] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editOrder, setEditOrder] = useState('0');

  const fetchAchievements = async () => {
    try {
      const q = query(collection(db, 'achievements'), orderBy('date', 'asc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Achievement[];
      setAchievements(data);
    } catch (e) {
      console.error('Failed to fetch achievements:', e);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const handleAdd = async () => {
    if (!isAdmin) return;
    try {
      await addDoc(collection(db, 'achievements'), {
        date: editDate || 'YYYY.MM',
        title: editTitle || '新しい達成記録',
        description: editDesc || '',
        order: Number(editOrder),
        updatedAt: serverTimestamp()
      });
      resetEditState();
      await fetchAchievements();
    } catch (error) {
      handleFirestoreError(error, 'create', '/achievements');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'achievements', id), {
        date: editDate,
        title: editTitle,
        description: editDesc,
        order: Number(editOrder),
        updatedAt: serverTimestamp()
      });
      resetEditState();
      await fetchAchievements();
    } catch (error) {
      handleFirestoreError(error, 'update', `/achievements/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'achievements', id));
      setDeleteConfirmId(null);
      await fetchAchievements();
    } catch (error) {
      handleFirestoreError(error, 'delete', `/achievements/${id}`);
    }
  };

  const resetEditState = () => {
    setIsEditing(null);
    setEditDate('');
    setEditTitle('');
    setEditDesc('');
    setEditOrder('');
  };

  const startEdit = (a: Achievement) => {
    setIsEditing(a.id);
    setEditDate(a.date);
    setEditTitle(a.title);
    setEditDesc(a.description);
    setEditOrder(String(a.order));
  };
  
  const startAdd = () => {
    setIsEditing('new');
    setEditDate('');
    setEditTitle('');
    setEditDesc('');
    setEditOrder(String(achievements.length * 10));
  };

  if (!isAdmin && achievements.length === 0) return null;

  return (
    <div className="mt-16">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-neutral-500 font-mono text-sm flex items-center gap-2">
          <Trophy size={16} /> 達成記録 (ACHIEVEMENTS)
        </h2>
        {isAdmin && (
          <button 
            onClick={startAdd}
            className="text-orange-500 hover:text-orange-400 font-mono text-xs flex items-center gap-1"
          >
            <Plus size={14} /> 追加
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isEditing === 'new' && (
          <div className="relative bg-neutral-900/80 border border-orange-500/50 p-6 rounded-2xl md:col-span-2">
            <div className="space-y-4">
              <input type="text" value={editDate} onChange={e => setEditDate(e.target.value)} placeholder="YYYY.MM" className="w-full bg-neutral-950 border border-neutral-800 text-white text-sm px-3 py-2 rounded-lg" />
              <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="達成した内容" className="w-full bg-neutral-950 border border-neutral-800 text-white font-bold text-lg px-3 py-2 rounded-lg" />
              <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="詳細・想いなど" className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-sm px-3 py-2 rounded-lg h-24" />
              <div className="flex gap-4">
                <input type="number" value={editOrder} onChange={e => setEditOrder(e.target.value)} placeholder="並び順 (0, 10...)" className="w-24 bg-neutral-950 border border-neutral-800 text-neutral-300 text-sm px-3 py-2 rounded-lg" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleAdd} className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1">
                  <Check size={14} /> 保存
                </button>
                <button onClick={resetEditState} className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1">
                  <X size={14} /> キャンセル
                </button>
              </div>
            </div>
          </div>
        )}

        {achievements.map((item) => (
          <div key={item.id} className="relative group">
            <div className="bg-gradient-to-br from-neutral-900/40 to-neutral-950/80 border border-neutral-800/60 p-6 rounded-2xl transition-all duration-300 hover:border-orange-500/30 hover:shadow-[0_0_20px_rgba(234,88,12,0.05)] h-full flex flex-col">
              {isEditing === item.id ? (
                <div className="space-y-4 flex-1">
                  <input type="text" value={editDate} onChange={e => setEditDate(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 text-white text-sm px-3 py-2 rounded-lg" />
                  <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 text-white font-bold text-lg px-3 py-2 rounded-lg" />
                  <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-sm px-3 py-2 rounded-lg h-24" />
                  <div className="flex gap-4">
                    <input type="number" value={editOrder} onChange={e => setEditOrder(e.target.value)} placeholder="並び順" className="w-24 bg-neutral-950 border border-neutral-800 text-neutral-300 text-sm px-3 py-2 rounded-lg" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => handleUpdate(item.id)} className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1">
                      <Check size={14} /> 保存
                    </button>
                    <button onClick={resetEditState} className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1">
                      <X size={14} /> キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex flex-col gap-2">
                      <span className="font-mono font-bold text-xs px-2.5 py-1 rounded w-max bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center gap-1.5">
                        <Award size={12} /> {item.date}
                      </span>
                      <h3 className="text-xl font-bold text-white tracking-tight leading-snug">
                        {item.title}
                      </h3>
                    </div>
                    {isAdmin && (
                      <div className={`flex gap-2 transition-opacity whitespace-nowrap ${deleteConfirmId === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {deleteConfirmId === item.id ? (
                          <div className="flex items-center gap-2 bg-red-500/10 px-2 py-1 rounded">
                            <span className="text-red-400 text-xs font-bold">削除する？</span>
                            <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300"><Check size={14} /></button>
                            <button onClick={() => setDeleteConfirmId(null)} className="text-neutral-400 hover:text-white"><X size={14} /></button>
                          </div>
                        ) : (
                          <>
                            <button onClick={() => startEdit(item)} className="text-neutral-500 hover:text-white"><Edit2 size={14} /></button>
                            <button onClick={() => setDeleteConfirmId(item.id)} className="text-neutral-500 hover:text-red-400"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-neutral-400 leading-relaxed text-sm whitespace-pre-wrap mt-auto pt-2">
                      {item.description}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
