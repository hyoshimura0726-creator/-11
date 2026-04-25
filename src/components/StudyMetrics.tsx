import React, { useState, useEffect } from 'react';
import { BarChart2, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList, LineChart, Line } from 'recharts';
import { useAuth } from '../AuthContext';
import { db, handleFirestoreError } from '../firebase';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, Timestamp, where, doc, getDoc, setDoc } from 'firebase/firestore';

export function StudyMetrics() {
  const { user } = useAuth();
  const isAdmin = user?.email === 'h.yoshimura0726@gmail.com';

  const [logs, setLogs] = useState<{ date: string; hours: number }[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newHours, setNewHours] = useState('1');
  const [newDate, setNewDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  
  const [targetHours, setTargetHours] = useState(50);
  const [newTargetHours, setNewTargetHours] = useState('50');
  const [isUpdatingTarget, setIsUpdatingTarget] = useState(false);
  const [updateFeedback, setUpdateFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchLogs = async () => {
    try {
      // Get past 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const minDate = `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(thirtyDaysAgo.getDate()).padStart(2, '0')}`;

      const q = query(
        collection(db, 'study_logs'),
        where('date', '>=', minDate),
        orderBy('date', 'asc') // This is OK since date is lexical YYYY-MM-DD
      );
      
      const [snapshot, targetDoc] = await Promise.all([
        getDocs(q),
        getDoc(doc(db, 'settings', 'target'))
      ]);
      
      if (targetDoc.exists()) {
        const val = targetDoc.data().weeklyTargetHours;
        setTargetHours(val);
        setNewTargetHours(String(val));
      }

      const fetched = snapshot.docs.map(doc => ({
        date: doc.data().date as string,
        hours: doc.data().hours as number
      }));
      setLogs(fetched);
    } catch (error) {
      console.error('Failed to fetch study logs:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleUpdateTarget = async () => {
    if (!isAdmin) return;
    const hours = parseFloat(newTargetHours);
    if (isNaN(hours) || hours < 1) {
      setUpdateFeedback({ message: '有効な時間を入力', type: 'error' });
      return;
    }

    setIsUpdatingTarget(true);
    setUpdateFeedback(null);
    try {
      await setDoc(doc(db, 'settings', 'target'), {
        weeklyTargetHours: hours,
        updatedAt: serverTimestamp()
      });
      setTargetHours(hours);
      setUpdateFeedback({ message: '更新しました', type: 'success' });
      setTimeout(() => setUpdateFeedback(null), 3000);
    } catch (error) {
      console.error('Failed to update target:', error);
      setUpdateFeedback({ message: '更新に失敗', type: 'error' });
    } finally {
      setIsUpdatingTarget(false);
    }
  };

  const handleAddLog = async () => {
    if (!isAdmin) return;
    const hours = parseFloat(newHours);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      alert('有効な時間を入力してください (0 - 24)');
      return;
    }
    
    setIsAdding(true);
    try {
      await addDoc(collection(db, 'study_logs'), {
        hours: hours,
        date: newDate,
        createdAt: serverTimestamp()
      });
      setNewHours('1');
      await fetchLogs();
    } catch (error) {
      try {
        handleFirestoreError(error, 'create', `/study_logs`);
      } catch (e: any) {
        alert(e.message);
      }
    } finally {
      setIsAdding(false);
    }
  };

  // Process data for charts
  const getChartData = () => {
    const monthlyMap = new Map<string, number>();
    
    // Initialize 30 days
    const monthlyDataArr = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const fullDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const displayDate = `${d.getMonth() + 1}/${d.getDate()}`;
      monthlyMap.set(fullDate, 0);
      return { fullDate, date: displayDate, hours: 0 };
    });

    // Populate with actual logs
    logs.forEach(log => {
      if (monthlyMap.has(log.date)) {
        monthlyMap.set(log.date, monthlyMap.get(log.date)! + log.hours);
      }
    });

    const monthlyData = monthlyDataArr.map(item => ({
      ...item,
      hours: Math.round(monthlyMap.get(item.fullDate)! * 10) / 10
    }));

    // Calculate this week's hours (last 7 days including today)
    const thisWeekHours = monthlyData.slice(-7).reduce((acc, curr) => acc + curr.hours, 0);

    const weeklyData = [
      { name: '現在 (Current)', hours: thisWeekHours },
      { name: '目標 (Target)', hours: targetHours },
    ];
    
    const totalMonthlyHours = monthlyData.reduce((acc, curr) => acc + curr.hours, 0);
    const achievementRate = Math.round((thisWeekHours / targetHours) * 100) || 0;

    return { monthlyData, weeklyData, totalMonthlyHours, achievementRate };
  };

  const { monthlyData, weeklyData, totalMonthlyHours, achievementRate } = getChartData();

  return (
    <div className="mt-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
        <h2 className="text-neutral-500 font-mono text-sm flex items-center gap-2">
          <BarChart2 size={16} /> 学習進捗 (STUDY_METRICS)
        </h2>
        
        <div className="flex gap-6">
          <div className="text-right">
            <div className="text-[10px] text-neutral-500 font-mono mb-1">今週の達成率</div>
            <div className="text-2xl font-bold text-orange-500 font-mono">{achievementRate}%</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-neutral-500 font-mono mb-1">過去30日の合計</div>
            <div className="text-2xl font-bold text-white font-mono">{Math.round(totalMonthlyHours)}h</div>
          </div>
        </div>
      </div>
      
      {/* Admin Controls */}
      {isAdmin && (
        <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl mb-6 flex flex-col md:flex-row gap-6">
          {/* Logger Form */}
          <div className="flex flex-wrap gap-4 items-end border-r border-neutral-800 pr-6">
            <div>
              <label className="block text-[10px] text-neutral-500 font-mono mb-1">日付</label>
              <input 
                type="date" 
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-orange-500/50"
              />
            </div>
            <div>
              <label className="block text-[10px] text-neutral-500 font-mono mb-1">時間 (hr)</label>
              <input 
                type="number" 
                step="0.5"
                min="0.5"
                max="24"
                value={newHours}
                onChange={(e) => setNewHours(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-sm px-3 py-2 rounded-lg w-20 focus:outline-none focus:border-orange-500/50"
              />
            </div>
            <button 
              onClick={handleAddLog}
              disabled={isAdding}
              className="bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/30 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isAdding ? <><span className="animate-spin text-sm">...</span> 追加中</> : <><Plus size={16} /> 記録する</>}
            </button>
          </div>

          {/* Target Update Form */}
          <div className="flex flex-col gap-2 flex-1 pt-1 md:pt-0">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] text-neutral-500 font-mono">週間ターゲット設定 (hr)</label>
              {updateFeedback && (
                <span className={`text-[10px] font-mono ${updateFeedback.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                  {updateFeedback.message}
                </span>
              )}
            </div>
            <div className="flex items-stretch justify-between bg-neutral-950 border border-neutral-800 rounded-xl p-1.5">
              <div className="flex-1 text-center py-2 text-neutral-400 font-mono text-sm border-r border-neutral-800/50 flex flex-col justify-center">
                <span className="text-[9px] text-neutral-600 mb-1">現在</span>
                <span className="text-xl font-bold">{targetHours}</span>
              </div>
              
              <div className="px-3 flex items-center shrink-0">
                <button 
                  onClick={handleUpdateTarget}
                  disabled={isUpdatingTarget}
                  className="bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1 group shadow-sm border border-neutral-700/50"
                  title="更新"
                >
                  {isUpdatingTarget ? <span className="animate-spin inline-block">...</span> : <>更新 <span className="text-orange-500 group-hover:text-orange-400 text-sm leading-none ml-1">→</span></>}
                </button>
              </div>
              
              <div className="flex-1 text-center py-2 relative flex flex-col justify-center">
                <span className="text-[9px] text-neutral-600 mb-1">新しい目標</span>
                <input 
                  type="number" 
                  step="1"
                  min="1"
                  value={newTargetHours}
                  onChange={(e) => setNewTargetHours(e.target.value)}
                  className="w-full bg-transparent text-neutral-200 text-xl font-bold text-center focus:outline-none font-mono py-0 m-0 leading-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Bar Chart */}
        <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl h-72 lg:col-span-1 flex flex-col">
          <h3 className="text-neutral-400 text-xs font-mono mb-4">週間ターゲット (過去7日)</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={weeklyData} margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="orangeGoldHorizontal" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ea580c" stopOpacity={1} />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                <XAxis type="number" stroke="#737373" tick={{ fill: '#737373', fontSize: 12 }} tickLine={false} axisLine={false} domain={[0, 60]} />
                <YAxis dataKey="name" type="category" stroke="#737373" tick={{ fill: '#737373', fontSize: 12 }} tickLine={false} axisLine={false} width={110} />
                <Tooltip 
                  cursor={{ fill: '#262626', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fbbf24' }}
                  formatter={(value: number) => [`${value} hrs`, '学習時間']}
                />
                <Bar dataKey="hours" radius={[0, 4, 4, 0]} barSize={24}>
                  <Cell fill="url(#orangeGoldHorizontal)" />
                  <Cell fill="#3f3f46" />
                  <LabelList dataKey="hours" position="right" fill="#a3a3a3" fontSize={12} formatter={(val: number) => `${val}h`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 30 Days Line Chart */}
        <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl h-72 lg:col-span-2 flex flex-col">
          <h3 className="text-neutral-400 text-xs font-mono mb-4">過去30日間の推移 (時間/日)</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="date" stroke="#737373" tick={{ fill: '#737373', fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={20} />
                <YAxis stroke="#737373" tick={{ fill: '#737373', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#ea580c' }}
                  labelStyle={{ color: '#a3a3a3', marginBottom: '4px' }}
                  formatter={(value: number) => [`${value} 時間`, '実績']}
                />
                <Line type="monotone" dataKey="hours" stroke="#ea580c" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: '#ea580c', stroke: '#171717', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
