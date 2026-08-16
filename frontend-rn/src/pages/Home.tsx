import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Mic, History, LogOut, Disc3 } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const Home: React.FC = () => {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMicClick = async () => {
    if (isRecording) {
      setIsRecording(false);
      setIsAnalyzing(false);
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.addEventListener("dataavailable", event => {
        audioChunks.push(event.data);
      });

      mediaRecorder.addEventListener("stop", async () => {
        setIsRecording(false);
        setIsAnalyzing(true);
        
        const audioBlob = new Blob(audioChunks);
        
        // Convert Blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64AudioMessage = reader.result;
          
          try {
            const res = await axios.post(
              `${API_BASE}/recognize`,
              { audio_data: base64AudioMessage },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (res.data.success) {
              navigate('/result', { state: { track: res.data.data } });
            } else {
              alert(res.data.message);
            }
          } catch (err: any) {
            console.error(err);
            alert(`Gagal menghubungi server: ${err.message || 'Unknown Error'}. Pastikan server backend PHP (localhost:8000) sedang berjalan!`);
          } finally {
            setIsAnalyzing(false);
            // Stop all tracks to release mic
            stream.getTracks().forEach(track => track.stop());
          }
        };
      });

      // Start recording and stop after 5 seconds
      mediaRecorder.start();
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 5000);

    } catch (err) {
      console.error("Microphone access denied or error:", err);
      alert("Harap berikan izin akses mikrofon untuk mendeteksi lagu.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-slate-800/50 glass-panel sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <img src="/assets/brand_logo.png" alt="Ngalagu" className="h-10 drop-shadow-lg shadow-purple-500/20" />
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-sm text-slate-400">
            Welcome, <span className="text-slate-200 font-medium">{user?.name}</span>
          </div>
          <button onClick={() => navigate('/search')} className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-all flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <span className="text-sm font-medium hidden sm:block">Search</span>
          </button>
          <button onClick={() => navigate('/library')} className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-all flex items-center gap-2">
            <Disc3 className="w-4 h-4 animate-spin-slow" />
            <span className="text-sm font-medium hidden sm:block">Koleksi</span>
          </button>
          <button onClick={() => navigate('/history')} className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-all flex items-center gap-2">
            <History className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:block">History</span>
          </button>
          <button onClick={handleLogout} className="p-2.5 rounded-xl bg-slate-900/50 border border-red-500/30 text-slate-300 hover:text-red-400 hover:bg-red-950/30 transition-all flex items-center gap-2">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="text-center max-w-lg mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-100 tracking-tight mb-4">
            Lagu Apa Ini?
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            {isRecording ? 'Mendengarkan sampel audio di sekitarmu...' 
              : isAnalyzing ? 'Mencocokkan pola suara...' 
              : 'Tekan tombol mikrofon untuk mulai mendeteksi musik yang sedang diputar.'}
          </p>
        </div>

        {/* Mic Button */}
        <div className="relative flex justify-center items-center h-64 w-full">
          {/* Ripple effects when active */}
          {(isRecording || isAnalyzing) && (
            <>
              <div className="absolute w-40 h-40 bg-purple-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
              <div className="absolute w-56 h-56 bg-cyan-500/10 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
            </>
          )}

          <button
            onClick={handleMicClick}
            disabled={isRecording || isAnalyzing}
            className={`
              relative z-10 w-32 h-32 rounded-full flex items-center justify-center
              shadow-[0_0_40px_rgba(139,92,246,0.3)] transition-all duration-300
              ${isRecording || isAnalyzing 
                ? 'bg-gradient-to-tr from-pink-600 to-purple-600 scale-110 pulse-glow' 
                : 'bg-gradient-to-tr from-purple-600 to-cyan-500 hover:scale-105 active:scale-95'
              }
            `}
          >
            {isAnalyzing ? (
              <Disc3 className="w-12 h-12 text-white animate-spin" />
            ) : (
              <Mic className={`w-12 h-12 text-white ${isRecording ? 'animate-pulse' : ''}`} />
            )}
          </button>
        </div>
      </main>
    </div>
  );
};
