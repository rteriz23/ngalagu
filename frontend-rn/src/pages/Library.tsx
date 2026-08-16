import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { useAuthStore } from '../store/authStore';
import { UploadModal } from '../components/UploadModal';
import { ArrowLeft, Music, Heart, Disc, UploadCloud, Play } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const Library: React.FC = () => {
  const navigate = useNavigate();
  const { setTrack, setQueue } = usePlayerStore();
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'tracks' | 'albums' | 'uploads'>('tracks');
  
  const [likedTracks, setLikedTracks] = useState<any[]>([]);
  const [likedAlbums, setLikedAlbums] = useState<any[]>([]);
  const [myUploads, setMyUploads] = useState<any[]>([]);
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLibraryData = async () => {
    setIsLoading(true);
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const [tracksRes, albumsRes, uploadsRes] = await Promise.all([
        axios.get(`${API_BASE}/tracks/liked`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/albums/liked`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/my-tracks`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (tracksRes.data.success) setLikedTracks(tracksRes.data.data);
      if (albumsRes.data.success) setLikedAlbums(albumsRes.data.data);
      if (uploadsRes.data.success) setMyUploads(uploadsRes.data.data);
    } catch (err) {
      console.error('Failed to fetch library', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraryData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handlePlayTrack = (track: any) => {
    // Map to player store format
    const playData = {
      id: track.track_id || track.id,
      title: track.title,
      artist: track.artist,
      cover: track.cover,
      preview_url: track.preview_url,
      youtube_id: track.youtube_id,
      audio_url: track.audio_url // user uploaded track
    };
    setTrack(playData);
    setQueue([playData]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 relative pb-28">
      {/* Background Glow */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-cyan-900/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/app')}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-300">
              Koleksiku
            </h1>
          </div>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            Unggah Lagu
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-900 pb-px mb-6">
          <button
            onClick={() => setActiveTab('tracks')}
            className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'tracks' 
                ? 'border-purple-500 text-purple-400 font-bold' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Lagu Disukai
          </button>
          <button
            onClick={() => setActiveTab('albums')}
            className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'albums' 
                ? 'border-purple-500 text-purple-400 font-bold' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Album Disukai
          </button>
          <button
            onClick={() => setActiveTab('uploads')}
            className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'uploads' 
                ? 'border-purple-500 text-purple-400 font-bold' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Unggahanku
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Memuat koleksi...</div>
        ) : (
          <div>
            {/* 1. LIKED TRACKS TAB */}
            {activeTab === 'tracks' && (
              likedTracks.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/30 border border-slate-900 rounded-2xl p-8">
                  <Heart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-slate-300">Belum ada lagu disukai</h3>
                  <p className="text-sm text-slate-500 mt-1">Ketuk ikon hati pada lagu untuk menyimpannya.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {likedTracks.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => handlePlayTrack(item)}
                      className="flex items-center justify-between p-4 bg-slate-900/40 hover:bg-slate-900 border border-slate-900/80 hover:border-slate-800 rounded-xl cursor-pointer group transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <img src={item.cover} alt={item.title} className="w-12 h-12 rounded-lg object-cover" />
                        <div>
                          <h3 className="font-semibold text-sm text-white group-hover:text-purple-400 transition">{item.title}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">{item.artist}</p>
                        </div>
                      </div>
                      <button className="p-2 rounded-full bg-purple-600/10 text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition">
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* 2. LIKED ALBUMS TAB */}
            {activeTab === 'albums' && (
              likedAlbums.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/30 border border-slate-900 rounded-2xl p-8">
                  <Disc className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-slate-300">Belum ada album disukai</h3>
                  <p className="text-sm text-slate-500 mt-1">Simpan album favorit Anda di sini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {likedAlbums.map((album) => (
                    <div 
                      key={album.id}
                      className="bg-slate-900/40 border border-slate-900 hover:border-slate-800 p-4 rounded-xl hover:bg-slate-900 transition duration-200 cursor-pointer group"
                    >
                      <img src={album.cover} alt={album.title} className="aspect-square w-full rounded-lg object-cover mb-3" />
                      <h3 className="font-bold text-sm text-white truncate">{album.title}</h3>
                      <p className="text-xs text-slate-400 truncate mt-1">{album.artist}</p>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* 3. MY UPLOADS TAB */}
            {activeTab === 'uploads' && (
              myUploads.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/30 border border-slate-900 rounded-2xl p-8">
                  <Music className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-slate-300">Belum mengunggah lagu</h3>
                  <p className="text-sm text-slate-500 mt-1">Unggah file musik MP3 milik Anda sendiri.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {myUploads.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => handlePlayTrack(item)}
                      className="flex items-center justify-between p-4 bg-slate-900/40 hover:bg-slate-900 border border-slate-900/80 hover:border-slate-800 rounded-xl cursor-pointer group transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <img src={item.cover} alt={item.title} className="w-12 h-12 rounded-lg object-cover" />
                        <div>
                          <h3 className="font-semibold text-sm text-white group-hover:text-purple-400 transition">{item.title}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">{item.artist}</p>
                        </div>
                      </div>
                      <button className="p-2 rounded-full bg-purple-600/10 text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition">
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </div>

      <UploadModal 
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={fetchLibraryData}
      />
    </div>
  );
};
