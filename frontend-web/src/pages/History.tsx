import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { ArrowLeft, Clock, Play } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const History: React.FC = () => {
  const navigate = useNavigate();
  const { setTrack, setQueue } = usePlayerStore();
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const authData = localStorage.getItem('auth-storage');
      let token = '';
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          token = parsed?.state?.token || '';
        } catch (err) {
          console.error(err);
        }
      }

      try {
        const res = await axios.get(`${API_BASE}/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setHistoryList(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch history', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handlePlayTrack = (track: any) => {
    // Map history track to player store format
    const playData = {
      id: track.track_id,
      title: track.title,
      artist: track.artist,
      cover: track.cover,
      preview_url: track.preview_url,
      youtube_id: track.youtube_id,
    };
    setTrack(playData);
    setQueue([playData]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 relative pb-28">
      {/* Background Glow */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-purple-900/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/app')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-300">
              Riwayat Mendengarkan
            </h1>
          </div>
        </div>

        {/* History List */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Memuat riwayat...</div>
        ) : historyList.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 border border-slate-900 rounded-2xl p-8">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-300">Belum ada riwayat</h3>
            <p className="text-sm text-slate-500 mt-1">Lagu yang Anda dengarkan akan muncul di sini.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {historyList.map((item) => (
              <div 
                key={item.id}
                onClick={() => handlePlayTrack(item)}
                className="flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 rounded-xl cursor-pointer group transition-all"
              >
                <div className="flex items-center gap-4">
                  <img src={item.cover} alt={item.title} className="w-12 h-12 rounded-lg object-cover" />
                  <div>
                    <h3 className="font-semibold text-sm text-white group-hover:text-purple-400 transition">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{item.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-slate-500 font-mono hidden sm:block">
                    {new Date(item.created_at).toLocaleDateString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <button className="p-2 rounded-full bg-purple-600/10 text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition">
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
