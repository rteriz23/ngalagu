# 🎵 Ngalagu — DJ Mixer, Strobe Visualizer & Music Radar

Aplikasi pemutar musik premium, deteksi musik (radar), dan DJ Remix Mixer interaktif dengan visualisasi beat lampu disko (Jedag-Jedug). Dibuat dan dikembangkan oleh **rteriz23 (Ruly Rizki Perdana)**.

---

## 🌟 Fitur Utama

### 1. **Music Radar (Pengenal Musik)**
- Deteksi lagu yang sedang diputar di sekitar Anda secara real-time menggunakan mikrofon perangkat.
- Terintegrasi dengan **ACRCloud API** untuk mencocokkan sidik jari suara (audio fingerprint) secara akurat.

### 2. **DJ Mixer & Equalizer**
- Kontrol penuh 3-band Equalizer: **Bass (Low)**, **Vocal (Mid)**, dan **Treble (High)**.
- **Efek DJ Profesional**: Atur tempo kecepatan lagu (Pitch speed tune), efek echo/delay (dengan kontrol feedback & mix volume), dan efek distorsi.

### 3. **Mode Jedag-Jedug (Strobe Visualizer)**
- Sinkronisasi visual lampu disko/strobe yang berkedip mengikuti intensitas frekuensi bass rendah secara real-time.
- Animasi getar (vibrate) dan zoom pada album cover yang menyatu secara ritmis dengan ketukan musik.

### 4. **Smart Audio Engine & Player**
- **CORS Bypassed**: Memutar lagu langsung dari CDN eksternal (Deezer, Spotify, SoundHelix) tanpa hambatan pemblokiran CORS browser.
- **Virtual Playback Loop**: Memutar preview musik 30 detik secara terus-menerus (looping otomatis di latar belakang) hingga mencapai durasi asli lagu, sehingga Anda dapat mendengarkan lagu secara penuh.
- **Milikku (Unggah Lagu)**: Unggah file audio MP3 milik Anda sendiri lengkap dengan sampul album dan lirik kustom.
- **Koleksi & Riwayat**: Simpan lagu disukai, album favorit, dan pantau lagu-lagu yang pernah diputar sebelumnya.

---

## 🛠️ Arsitektur & Teknologi

### **Frontend**
- **Framework**: React 19 (TypeScript)
- **Build Tool**: Vite & TailwindCSS v3
- **State Management**: Zustand v5
- **Icons**: Lucide React
- **Platform**: Web (`frontend-web`) & React Native / Vite multi-platform (`frontend-rn`)

### **Backend**
- **Bahasa**: PHP
- **Framework Core**: Laravel 11 (digunakan dalam mode PHP Native Lightweight Server)
- **Database**: Flat-file JSON Database (`database.json`) untuk performa tinggi tanpa dependensi eksternal.
- **Keamanan**: WAF (Web Application Firewall) & OWASP Middleware untuk memblokir payload berbahaya (XSS/SQLi) dan manajemen pemblokiran IP Rule otomatis.

---

## 🚀 Petunjuk Penggunaan & Cara Menjalankan

### **Prasyarat**
Pastikan perangkat Anda sudah terinstal:
- [Node.js](https://nodejs.org/) (versi 18+)
- [PHP](https://www.php.net/) (versi 8.2+)

---

### **1. Menjalankan Backend Server**

1. Masuk ke direktori `backend-laravel`:
   ```bash
   cd backend-laravel
   ```
2. Jalankan server lokal PHP di port 8000:
   ```bash
   php -S localhost:8000 -t public
   ```
   *Server backend sekarang berjalan di `http://localhost:8000`.*

---

### **2. Menjalankan Frontend App (Web & Mobile View)**

Aplikasi ini menyediakan dua varian frontend. Anda dapat menjalankan salah satu atau keduanya:

#### **A. Menjalankan Aplikasi Web (`frontend-web`)**
1. Buka terminal baru dan masuk ke direktori `frontend-web`:
   ```bash
   cd frontend-web
   ```
2. Instal dependensi node (jika belum):
   ```bash
   npm install
   ```
3. Jalankan server development Vite:
   ```bash
   npm run dev
   ```
   *Aplikasi web dapat diakses melalui browser di `http://localhost:5173`.*

#### **B. Menjalankan Aplikasi Multi-Platform (`frontend-rn`)**
1. Buka terminal baru dan masuk ke direktori `frontend-rn`:
   ```bash
   cd frontend-rn
   ```
2. Instal dependensi node (jika belum):
   ```bash
   npm install
   ```
3. Jalankan server development:
   ```bash
   npm run dev
   ```
   *Aplikasi dev-view berjalan di port `http://localhost:5176`.*

---

## 🔒 Manajemen Admin & Keamanan (WAF)
Aplikasi ini dilengkapi dengan firewall internal (`waf.php`) yang memantau akses mencurigakan secara otomatis:
- Jika IP Anda terblokir atau Anda ingin mengelola aturan IP, masuk dengan akun Admin:
  - **Email**: `admin@ngalagu.com`
  - **Password**: `admin123` (atau sesuai konfigurasi awal di `database.json`)
- Buka menu **IP Management** di `/admin` untuk menambahkan IP whitelist atau mencabut pemblokiran IP manual.

---

## 🧑‍💻 Hak Cipta & Pengembang

Aplikasi ini dibuat dan dikelola sepenuhnya oleh:
- **Nama**: Ruly Rizki Perdana (rteriz23)
- **GitHub**: [github.com/rteriz23](https://github.com/rteriz23)
- **Proyek**: [ngalagu](https://github.com/rteriz23/ngalagu.git)

*Dibuat untuk memberikan pengalaman DJ Mixer dan Visualisasi Jedag-Jedug yang luar biasa!* 🎧⚡
