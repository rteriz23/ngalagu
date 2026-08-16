import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore, type Track } from '../store/playerStore';
import { Search as SearchIcon, Play, Disc3, Mic2, LayoutGrid } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const GENRES = ['All', 'Pop', 'Acoustic', '80s', 'Rock', 'Jazz', 'Hip-Hop'];

export const Search: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { setTrack, addToQueue, currentTrack } = usePlayerStore();
  
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const genreParam = selectedGenre === 'All' ? '' : selectedGenre;
        const res = await axios.get(`${API_BASE}/search`, {
          params: { q: query, genre: genreParam },
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setResults(res.data.data);
        }
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [query, selectedGenre, token]);

  const handlePlay = (track: Track) => {
    setTrack(track);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden pb-24">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header / Nav (Simplified for Search) */}
      <header className="flex items-center justify-between p-6 border-b border-slate-800/50 glass-panel sticky top-0 z-40">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/app')}>
          <img src="/assets/brand_logo.png" alt="Ngalagu" className="h-8 opacity-80 hover:opacity-100 transition-opacity" />
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/app')} className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2">
            <Mic2 className="w-4 h-4" /> Radar
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 relative z-10 flex flex-col">
        {/* Search Input */}
        <div className="relative w-full max-w-2xl mb-8">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-4 bg-slate-900/80 border border-slate-700/80 rounded-2xl text-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-xl shadow-black/20"
            placeholder="Search for songs, artists, or albums..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Genre Filters */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedGenre === genre
                  ? 'bg-white text-black'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Results Grid */}
        <div>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-cyan-400" /> Results
          </h2>
          
          {loading ? (
            <div className="text-slate-500 text-center py-20">Searching...</div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((track) => (
                <div key={track.id} className="group relative glass-panel rounded-2xl p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                    <img src={track.cover} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button onClick={() => handlePlay(track)} className="p-2 bg-cyan-500 rounded-full text-white hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-base font-bold truncate ${currentTrack?.id === track.id ? 'text-cyan-400' : 'text-white'}`}>
                      {track.title}
                    </h4>
                    <p className="text-slate-400 text-sm truncate">{track.artist}</p>
                  </div>
                  <button onClick={() => addToQueue(track)} className="p-2 text-slate-500 hover:text-white" title="Add to queue">
                    +
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Disc3 className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-300">No tracks found</h3>
              <p className="text-slate-500">Try searching for something else or change the genre filter.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
