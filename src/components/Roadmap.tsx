import React, { useState, useEffect } from 'react';
import { Flag, Trophy, Target, Sparkles, AlertCircle, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { db, handleFirestoreError } from '../firebase';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

interface Milestone {
  id: string;
  date: string;
  title: string;
  description: string;
  status: 'upcoming' | 'current' | 'completed';
  order: number;
}

export function Roadmap() {
  const { user } = useAuth();
  const isAdmin = user?.email === 'h.yoshimura0726@gmail.com';
  
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // States for new/editing milestone
  const [editDate, setEditDate] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState<'upcoming' | 'current' | 'completed'>('upcoming');
  const [editOrder, setEditOrder] = useState('0');

  const fetchMilestones = async () => {
    try {
      const q = query(collection(db, 'roadmap_milestones'), orderBy('date', 'asc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Milestone[];
      setMilestones(data);
    } catch (e) {
      console.error('Failed to fetch milestones:', e);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, []);

  const handleAdd = async () => {
    if (!isAdmin) return;
    try {
      await addDoc(collection(db, 'roadmap_milestones'), {
        date: editDate || 'YYYY.MM',
        title: editTitle || '新しい目標',
        description: editDesc || '',
        status: editStatus,
        order: Number(editOrder),
        updatedAt: serverTimestamp()
      });
      resetEditState();
      await fetchMilestones();
    } catch (error) {
      handleFirestoreError(error, 'create', '/roadmap_milestones');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'roadmap_milestones', id), {
        date: editDate,
        title: editTitle,
        description: editDesc,
        status: editStatus,
        order: Number(editOrder),
        updatedAt: serverTimestamp()
      });
      resetEditState();
      await fetchMilestones();
    } catch (error) {
      handleFirestoreError(error, 'update', `/roadmap_milestones/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'roadmap_milestones', id));
      setDeleteConfirmId(null);
      await fetchMilestones();
    } catch (error) {
      handleFirestoreError(error, 'delete', `/roadmap_milestones/${id}`);
    }
  };

  const resetEditState = () => {
    setIsEditing(null);
    setEditDate('');
    setEditTitle('');
    setEditDesc('');
    setEditStatus('upcoming');
    setEditOrder('');
  };

  const startEdit = (m: Milestone) => {
    setIsEditing(m.id);
    setEditDate(m.date);
    setEditTitle(m.title);
    setEditDesc(m.description);
    setEditStatus(m.status);
    setEditOrder(String(m.order));
  };
  
  const startAdd = () => {
    setIsEditing('new');
    setEditDate('');
    setEditTitle('');
    setEditDesc('');
    setEditStatus('upcoming');
    setEditOrder(String(milestones.length * 10));
  };

  const getIcon = (status: string) => {
    switch (status) {
      case 'completed': return <AlertCircle size={18} />;
      case 'current': return <Flag size={18} />;
      default: return <Target size={18} />;
    }
  };

  return (
    <div className="mt-16">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-neutral-500 font-mono text-sm flex items-center gap-2">
          <Target size={16} /> 逆転ロードマップ (ROADMAP)
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
      
      <div className="relative border-l-2 border-neutral-800 ml-4 pl-8 py-4 space-y-12">
        {isEditing === 'new' && (
          <div className="relative bg-neutral-900/80 border border-orange-500/50 p-6 rounded-2xl">
              <div className="space-y-4">
                <input type="text" value={editDate} onChange={e => setEditDate(e.target.value)} placeholder="YYYY.MM" className="w-full bg-neutral-950 border border-neutral-800 text-white text-sm px-3 py-2 rounded-lg" />
                <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="タイトル" className="w-full bg-neutral-950 border border-neutral-800 text-white font-bold text-lg px-3 py-2 rounded-lg" />
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="説明" className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-sm px-3 py-2 rounded-lg h-24" />
                <div className="flex gap-4">
                  <select value={editStatus} onChange={e => setEditStatus(e.target.value as any)} className="bg-neutral-950 border border-neutral-800 text-neutral-300 text-sm px-3 py-2 rounded-lg">
                    <option value="upcoming">Upcoming</option>
                    <option value="current">Current</option>
                    <option value="completed">Completed</option>
                  </select>
                  <input type="number" value={editOrder} onChange={e => setEditOrder(e.target.value)} placeholder="並び順 (0, 10, 20...)" className="w-24 bg-neutral-950 border border-neutral-800 text-neutral-300 text-sm px-3 py-2 rounded-lg" />
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

        {milestones.map((item) => (
          <div key={item.id} className="relative group">
            {/* Timeline Dot */}
            <div className={`absolute -left-[41px] flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#050505] transition-colors
              ${item.status === 'completed' ? 'bg-orange-500 text-black' : 
                item.status === 'current' ? 'bg-orange-500/20 text-orange-400 border-orange-500' : 
                'bg-neutral-900 text-neutral-500 group-hover:text-orange-400'}`}
            >
              {getIcon(item.status)}
            </div>
            
            {/* Content */}
            <div className={`bg-neutral-900/40 border border-neutral-800/60 p-6 rounded-2xl transition-all duration-300
              ${item.status === 'current' ? 'border-orange-500/30 shadow-[0_0_20px_rgba(234,88,12,0.1)]' : 'hover:border-neutral-700'}`}>
              
              {isEditing === item.id ? (
                <div className="space-y-4">
                  <input type="text" value={editDate} onChange={e => setEditDate(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 text-white text-sm px-3 py-2 rounded-lg" />
                  <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 text-white font-bold text-lg px-3 py-2 rounded-lg" />
                  <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-sm px-3 py-2 rounded-lg h-24" />
                  <div className="flex gap-4">
                    <select value={editStatus} onChange={e => setEditStatus(e.target.value as any)} className="bg-neutral-950 border border-neutral-800 text-neutral-300 text-sm px-3 py-2 rounded-lg">
                      <option value="upcoming">Upcoming</option>
                      <option value="current">Current</option>
                      <option value="completed">Completed</option>
                    </select>
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <span className={`font-mono font-bold text-sm px-3 py-1 rounded-full w-max
                        ${item.status === 'current' ? 'bg-orange-500/20 text-orange-400' : 'bg-neutral-800 text-neutral-400'}
                      `}>
                        {item.date}
                      </span>
                      <h3 className={`text-lg font-bold ${item.status === 'completed' ? 'text-neutral-400 line-through decoration-neutral-600' : 'text-white'}`}>
                        {item.title}
                      </h3>
                    </div>
                    {isAdmin && (
                      <div className={`flex gap-2 transition-opacity ${deleteConfirmId === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
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
                  <p className="text-neutral-400 leading-relaxed text-sm whitespace-pre-wrap">
                    {item.description}
                  </p>
                </>
              )}
            </div>
          </div>
        ))}
        {milestones.length === 0 && !isEditing && (
          <div className="text-neutral-500 text-sm font-mono mt-8">
            ロードマップがまだ登録されていません。
          </div>
        )}
      </div>
    </div>
  );
}
