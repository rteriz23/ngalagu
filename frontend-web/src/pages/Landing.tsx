import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Mic2, Music2, Sparkles, ChevronRight, ShieldCheck, Zap, Headphones } from 'lucide-react';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/app');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 overflow-x-hidden font-sans selection:bg-purple-500/30">
      
      {/* Background Animated Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/15 rounded-full blur-[150px] rotate-animation" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/15 rounded-full blur-[150px] rotate-animation" style={{ animationDirection: 'reverse' }} />
      </div>

      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'glass-panel border-b border-slate-800/80 py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/assets/brand_logo.png" alt="Ngalagu" className="h-16 md:h-20 object-cover scale-150 origin-left mix-blend-screen drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]" />
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <button onClick={() => navigate('/app')} className="px-6 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-sm font-semibold transition-colors border border-slate-700 shadow-lg shadow-black/50">
                Go to App
              </button>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white hidden sm:block transition-colors">Log in</Link>
                <button onClick={() => navigate('/register')} className="px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-sm font-bold shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:scale-105 active:scale-95 transition-all">
                  Sign Up Free
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Left Text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm font-semibold mb-6 animate-pulse">
              <Sparkles className="w-4 h-4" />
              <span>Memperkenalkan Ngalagu 3.0</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
              Temukan & Dengarkan <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
                Musik Sekitarmu
              </span>
            </h1>
            <p className="text-lg lg:text-xl text-slate-400 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Pendeteksi lagu super cepat yang digabungkan dengan platform streaming musik tak terbatas. Langsung temukan lagunya, nyanyikan liriknya, dan putar musiknya sampai habis secara gratis.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button onClick={handleGetStarted} className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white font-bold text-lg shadow-[0_0_40px_rgba(139,92,246,0.4)] hover:shadow-[0_0_60px_rgba(139,92,246,0.6)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
                Mulai Gunakan Ngalagu <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Right Visualizer 3D */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
            <div className="relative w-full aspect-square flex items-center justify-center">
              {/* Outer rings */}
              <div className="absolute inset-0 rounded-full border border-purple-500/20 animate-[spin_10s_linear_infinite]" />
              <div className="absolute inset-8 rounded-full border border-cyan-500/30 animate-[spin_15s_linear_infinite_reverse]" />
              <div className="absolute inset-16 rounded-full border border-pink-500/20 animate-[spin_8s_linear_infinite]" />
              
              {/* Center Floating 3D Microphone */}
              <div className="absolute z-10 w-80 h-80 animate-[bounce_5s_ease-in-out_infinite] drop-shadow-[0_0_50px_rgba(139,92,246,0.6)]">
                <img src="/assets/3d_microphone_neon.png" alt="3D Microphone" className="w-full h-full object-contain filter drop-shadow-2xl mix-blend-screen" />
              </div>

              {/* Floating App Icon */}
              <div className="absolute top-10 right-10 w-24 h-24 rounded-3xl overflow-hidden shadow-2xl animate-[bounce_6s_ease-in-out_infinite_0.5s] border border-slate-700/50">
                <img src="/assets/app_icon.png" alt="App Preview" className="w-full h-full object-cover mix-blend-screen scale-110" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Kelebihan & Fitur Section */}
      <section className="relative z-10 py-24 bg-slate-900/50 border-y border-slate-800/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Fitur Tanpa Tanding</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">Ngalagu dirancang bukan sekadar untuk menebak lagu, melainkan menyajikan pengalaman mendengarkan musik seutuhnya di ujung jari Anda.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
            <div className="order-2 md:order-1 relative">
              <div className="absolute inset-0 bg-cyan-500/20 blur-[100px] rounded-full" />
              <img src="/assets/3d_headphones_glass.png" alt="3D Headphones" className="relative z-10 w-full max-w-md mx-auto animate-[bounce_7s_ease-in-out_infinite] drop-shadow-[0_0_30px_rgba(6,182,212,0.4)] mix-blend-screen" />
            </div>
            <div className="order-1 md:order-2">
              <h3 className="text-3xl font-bold mb-4 text-white flex items-center gap-3">
                <Headphones className="text-cyan-400 w-8 h-8" /> Spotify-Clone Player
              </h3>
              <p className="text-slate-400 text-lg leading-relaxed mb-6">
                Lupakan preview lagu 30 detik. Ngalagu dilengkapi dengan <strong>Native Global Player</strong> tak terlihat di latar belakang yang memungkinkan Anda mendengarkan lagu secara penuh (Full Track) secara terus menerus, gratis tanpa batas.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-300"><Zap className="text-pink-500 w-5 h-5" /> Dukungan sinkronisasi lirik Real-Time</li>
                <li className="flex items-center gap-3 text-slate-300"><Zap className="text-pink-500 w-5 h-5" /> Katalog musik tak terbatas (Terintegrasi Spotify & YouTube)</li>
                <li className="flex items-center gap-3 text-slate-300"><Zap className="text-pink-500 w-5 h-5" /> Auto-cast ke Bluetooth/Headphone Anda</li>
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-4 text-white flex items-center gap-3">
                <Mic2 className="text-purple-400 w-8 h-8" /> Continuous Radar
              </h3>
              <p className="text-slate-400 text-lg leading-relaxed mb-6">
                Tidak perlu memencet tombol berkali-kali. Nyalakan <strong>Radar Mode</strong> dan biarkan aplikasi kami mendengarkan latar belakang. Begitu pola lagu ditemukan, Ngalagu akan langsung memasukkannya ke daftar putar Anda dalam hitungan detik.
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/20 blur-[100px] rounded-full" />
              {/* Radar visualization using CSS */}
              <div className="relative w-80 h-80 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-purple-500/30 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-8 rounded-full border border-purple-500/40 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                <div className="absolute inset-16 rounded-full border border-purple-500/50 animate-ping" style={{ animationDuration: '2s', animationDelay: '1s' }} />
                <div className="z-10 w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,1)]">
                  <Music2 className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Keamanan & Kepercayaan Section */}
      <section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="glass-panel rounded-[3rem] p-12 lg:p-20 relative overflow-hidden">
            {/* Background glow for the card */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px]" />

            <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold mb-6">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Keamanan Privasi Maksimal</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">Privasi Anda Adalah Prioritas Utama Kami</h2>
                <p className="text-slate-300 text-lg leading-relaxed mb-6">
                  Ngalagu dirancang dengan protokol keamanan tingkat tinggi. Rekaman suara Anda <strong>tidak pernah</strong> disimpan di server kami. Audio hanya dikonversi sementara menjadi sidik jari digital <i>(acoustic fingerprint)</i> yang tidak bisa dikembalikan menjadi suara asli.
                </p>
                <p className="text-slate-300 text-lg leading-relaxed">
                  Selain itu, seluruh riwayat pencarian lagu Anda terenkripsi dengan aman di akun pribadi Anda. Kami memastikan pengalaman musikal Anda sepenuhnya bersifat pribadi.
                </p>
              </div>
              <div className="relative flex justify-center">
                <img src="/assets/3d_security_shield.png" alt="3D Security Shield" className="w-full max-w-sm animate-[bounce_6s_ease-in-out_infinite] drop-shadow-[0_0_40px_rgba(16,185,129,0.3)] mix-blend-screen" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Footer */}
      <section className="relative z-10 py-32 text-center px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-purple-950/20 pointer-events-none" />
        <h2 className="text-4xl md:text-6xl font-extrabold mb-8">Siap Mengubah Cara Anda <br className="hidden md:block"/> Mendengarkan Musik?</h2>
        <button onClick={handleGetStarted} className="px-12 py-5 rounded-full bg-white text-black font-extrabold text-xl hover:scale-105 active:scale-95 transition-transform shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:shadow-[0_0_70px_rgba(255,255,255,0.5)]">
          Coba Ngalagu Gratis
        </button>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-slate-800/80 text-center bg-[#010409]">
        <img src="/assets/brand_logo.png" alt="Ngalagu" className="h-8 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all mx-auto mb-4 mix-blend-screen" />
        <p className="text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} Ngalagu Music Platform. Hak Cipta Dilindungi Undang-Undang.
        </p>
      </footer>
    </div>
  );
};
