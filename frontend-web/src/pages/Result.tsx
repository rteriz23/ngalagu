import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { ArrowLeft, ExternalLink, Disc3, Play } from 'lucide-react';

export const Result: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const track = location.state?.track;

  if (!track) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-slate-400 mb-4">No track data available.</p>
        <button onClick={() => navigate('/')} className="text-cyan-400 font-medium">Return Home</button>
      </div>
    );
  }



  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-slate-950">
      {track.cover && (
        <div className="absolute inset-0 bg-cover bg-center opacity-[0.08] blur-3xl scale-125 pointer-events-none"
          style={{ backgroundImage: `url(${track.cover})` }} />
      )}

      {/* Header */}
      <header className="flex items-center p-6 border-b border-slate-800/50 glass-panel sticky top-0 z-50">
        <button onClick={() => navigate('/')} className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-slate-300 hover:text-white transition-all flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="flex-1 flex justify-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-purple-400">Match Found</span>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 flex flex-col items-center p-6 lg:p-12 relative z-10 max-w-4xl mx-auto w-full">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 w-full items-center md:items-start">
          
          {/* Cover Art */}
          <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/20 border-2 border-purple-500/30 group shrink-0">
            <img src={track.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80'}
              alt={track.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-md p-2 rounded-xl border border-slate-700">
              <img src="/assets/app_icon.png" alt="Ngalagu" className="w-8 h-8 rounded-lg" />
            </div>
          </div>

          {/* Details & Player */}
          <div className="flex-1 flex flex-col w-full text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2">{track.title}</h1>
            <p className="text-xl text-cyan-300 font-medium mb-4">{track.artist}</p>
            
            <div className="flex items-center justify-center md:justify-start gap-2 mb-8">
              <Disc3 className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-slate-400 font-medium">{track.album?.title || track.album || 'Single Album'}</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 justify-center md:justify-start">
              <button onClick={() => {
                const { setTrack } = usePlayerStore.getState();
                setTrack(track);
              }} className="flex items-center justify-center gap-2 py-4 px-8 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-cyan-500/30">
                <Play className="w-5 h-5 fill-current" /> Play Full Track
              </button>
              
              <div className="flex gap-4">
                <a href={`https://open.spotify.com/search/${encodeURIComponent(track.title + ' ' + track.artist)}`} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 p-4 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 font-semibold transition-colors">
                  <ExternalLink className="w-5 h-5" /> Spotify
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
