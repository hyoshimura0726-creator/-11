import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Dumbbell, Utensils, BookOpen, Flame, Heart, Briefcase, Plus, Trash2, Edit2, Check, X, Activity } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { db, handleFirestoreError } from '../firebase';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

interface LifeBalanceItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  order: number;
}

const iconMap: Record<string, React.ReactNode> = {
  'Dumbbell': <Dumbbell className="text-neutral-400" size={20} />,
  'Utensils': <Utensils className="text-neutral-400" size={20} />,
  'BookOpen': <BookOpen className="text-neutral-400" size={20} />,
  'Flame': <Flame className="text-neutral-400" size={20} />,
  'Heart': <Heart className="text-neutral-400" size={20} />,
  'Briefcase': <Briefcase className="text-neutral-400" size={20} />,
  'Activity': <Activity className="text-neutral-400" size={20} />
};

export function LifeBalance() {
  const { user } = useAuth();
  const isAdmin = user?.email === 'h.yoshimura0726@gmail.com';
  
  const [items, setItems] = useState<LifeBalanceItem[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [editIcon, setEditIcon] = useState('Dumbbell');
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editOrder, setEditOrder] = useState('0');

  const fetchItems = async () => {
    try {
      const q = query(collection(db, 'life_balances'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LifeBalanceItem[];
      setItems(data);
    } catch (e) {
      console.error('Failed to fetch life balances:', e);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAdd = async () => {
    if (!isAdmin) return;
    try {
      await addDoc(collection(db, 'life_balances'), {
        icon: editIcon || 'Dumbbell',
        title: editTitle || '新しい項目',
        description: editDesc || '',
        order: Number(editOrder),
        updatedAt: serverTimestamp()
      });
      resetEditState();
      await fetchItems();
    } catch (error) {
      handleFirestoreError(error, 'create', '/life_balances');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'life_balances', id), {
        icon: editIcon,
        title: editTitle,
        description: editDesc,
        order: Number(editOrder),
        updatedAt: serverTimestamp()
      });
      resetEditState();
      await fetchItems();
    } catch (error) {
      handleFirestoreError(error, 'update', `/life_balances/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'life_balances', id));
      setDeleteConfirmId(null);
      await fetchItems();
    } catch (error) {
      handleFirestoreError(error, 'delete', `/life_balances/${id}`);
    }
  };

  const resetEditState = () => {
    setIsEditing(null);
    setEditIcon('Dumbbell');
    setEditTitle('');
    setEditDesc('');
    setEditOrder('');
  };

  const startEdit = (a: LifeBalanceItem) => {
    setIsEditing(a.id);
    setEditIcon(a.icon);
    setEditTitle(a.title);
    setEditDesc(a.description);
    setEditOrder(String(a.order));
  };
  
  const startAdd = () => {
    setIsEditing('new');
    setEditIcon('Dumbbell');
    setEditTitle('');
    setEditDesc('');
    setEditOrder(String(items.length * 10));
  };

  // 編集フォームのアイコンセレクタ
  const renderIconSelector = () => (
    <div className="flex gap-2 flex-wrap mb-4">
      {Object.keys(iconMap).map(iconName => (
        <button
          key={iconName}
          onClick={() => setEditIcon(iconName)}
          className={`p-2 rounded-lg border flex items-center justify-center transition-colors ${editIcon === iconName ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-600'}`}
          type="button"
        >
          {iconMap[iconName]}
        </button>
      ))}
    </div>
  );

  return (
    <div className="mt-16">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-neutral-500 font-mono text-sm flex items-center gap-2">
          // ライフバランス
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

      {isEditing === 'new' && (
        <div className="relative bg-neutral-900/80 border border-orange-500/50 p-6 rounded-2xl mb-4">
          <div className="space-y-4">
            {renderIconSelector()}
            <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="タイトル" className="w-full bg-neutral-950 border border-neutral-800 text-white font-bold text-lg px-3 py-2 rounded-lg" />
            <input type="text" value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="説明文" className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-sm px-3 py-2 rounded-lg" />
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.id} className="relative group">
            {isEditing === item.id ? (
              <div className="bg-neutral-900/80 border border-orange-500/50 p-6 rounded-2xl h-full flex flex-col space-y-4">
                {renderIconSelector()}
                <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 text-white font-bold px-3 py-2 rounded-lg" />
                <input type="text" value={editDesc} onChange={e => setEditDesc(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-sm px-3 py-2 rounded-lg" />
                <div className="flex gap-4">
                  <input type="number" value={editOrder} onChange={e => setEditOrder(e.target.value)} placeholder="並び順" className="w-24 bg-neutral-950 border border-neutral-800 text-neutral-300 text-sm px-3 py-2 rounded-lg" />
                </div>
                <div className="flex gap-2 pt-2 mt-auto">
                  <button onClick={() => handleUpdate(item.id)} className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1">
                    <Check size={14} /> 保存
                  </button>
                  <button onClick={resetEditState} className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1">
                    <X size={14} /> キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <motion.div whileHover={{ y: -4 }} className="bg-neutral-900/30 border border-neutral-800/50 p-6 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-orange-500/30 hover:bg-neutral-900/50 transition-all h-full relative">
                
                {isAdmin && (
                  <div className={`absolute top-2 right-2 flex gap-2 transition-opacity ${deleteConfirmId === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {deleteConfirmId === item.id ? (
                      <div className="flex items-center gap-1 bg-red-500/10 px-1 py-1 rounded">
                        <span className="text-red-400 text-[10px] font-bold">削除?</span>
                        <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300"><Check size={12} /></button>
                        <button onClick={() => setDeleteConfirmId(null)} className="text-neutral-400 hover:text-white"><X size={12} /></button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => startEdit(item)} className="text-neutral-500 hover:text-white bg-neutral-900/50 p-1.5 rounded-md backdrop-blur-sm border border-neutral-800"><Edit2 size={12} /></button>
                        <button onClick={() => setDeleteConfirmId(item.id)} className="text-neutral-500 hover:text-red-400 bg-neutral-900/50 p-1.5 rounded-md backdrop-blur-sm border border-neutral-800"><Trash2 size={12} /></button>
                      </>
                    )}
                  </div>
                )}

                <div className="p-3 bg-neutral-950 rounded-full border border-neutral-800">
                  {iconMap[item.icon] || <Activity className="text-neutral-400" size={20} />}
                </div>
                <div className="text-center">
                  <div className="text-neutral-200 font-medium mb-1">{item.title}</div>
                  <div className="text-xs text-neutral-500">{item.description}</div>
                </div>
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
