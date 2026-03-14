# Panduan Desain UI (Masiang v2.0)

Dokumen ini merangkum *design language* dan aturan estetika yang dipakai untuk menghasilkan UI yang "bersih, rapi, dan elegan" (sebagaimana diimplementasikan pada halaman **Booking Jadwal**).

Pendekatan utama yang digunakan adalah perpaduan **Clean Modernism** dengan sedikit nuansa **Editorial/Refined**, guna menghindari kesan *template-y* atau UI generik.

---

## 1. Warna (Color Palette)
Alih-alih menggunakan hitam pekat (`#000`) murni dan abu-abu standar, UI ini menggunakan spektrum warna *Navy* / *Slate* (kebiruan gelap). Hal ini memberikan nuansa profesional, kredibel, namun tetap "hangat".

### **Warna Utama & Teks**
- **Dark Navy (Primary Text & Strong Borders):** `#121d35` - Digunakan untuk *Heading*, dan aksen paling gelap.
- **Deep Slate (Secondary Text / Subheadings):** `#25365f`, `#273a63`, `#2d3e67` - Digunakan untuk teks judul kartu atau label tebal.
- **Muted Blue-Grey (Body Text / Medium):** `#313f61`, `#4f5b77`, `#4a5f8e` - Digunakan untuk paragraf ringan atau deskripsi.
- **Light Slate (Soft Text / Icon Colors):** `#6d7998` - Digunakan untuk teks *footnote*, *placeholder*, atau ikon kecil.

### **Aksen (Status & Pembeda)**
Aksen digunakan secara sangat efisien dan "kalem", dihindari warna neon yang mencolok mata:
- **Blue (Melayani / Default):** `#4f8fdb`
- **Gold / Amber (Adaptif / Dalam Proses):** `#d4a95c` / `#ad7a2c` / Latar: `#fff2de`
- **Cyan & Emerald (Disetujui / Pelaksanaan):** `#3f95a5` / `#2d7480` / Latar: `#d8eef0`
- **Soft Muted Grey/Blue (Draft):** `#496b9f` / Latar: `#dce7fb`

### **Background (Surface & Layering)**
Daripada putih solid bertumpuk murni yang bisa membosankan, gunakan kombinasi off-white dan *soft gradient*:
- **Base Background:** Putih murni atau `#ffffff` untuk area prioritas tinggi (seperti tabel aktif).
- **Secondary Background (Surface):** `#f9f8fc`, `#f4f1f7`, `#f3f2f8` - Menciptakan kedalaman (depth) yang elegan untuk *container* tanpa butuh banyak *shadow*.

---

## 2. Tipografi (Typography)
Tipografi memegang peranan sangat kuat dalam memberikan identitas *premium* pada desain ini.

1. **Heading (Judul Utama):** 
   - Menggunakan `var(--font-fraunces)` yang memberikan profil elegan bak editorial majalah.
   - Skala besar dan ketat: `text-[clamp(28px,3vw,42px)]` dengan *line-height* ketat (`leading-[1.2]`) dan `font-medium`.
2. **Body & Interface Text:** 
   - Gunakan font Sans-Serif sistem (Inter/Geist). 
   - Perhatikan hirarki *weight*-nya: `font-medium` untuk teks penting, dan `font-bold` dikombinasi dengan `uppercase tracking-wide` untuk label/status (contoh: teks status "DISETUJUI").
   - Ukuran body ideal antara `text-[13px]` hingga `text-[15px]`. Teks deskriptif dibuat nyaman dengan `leading-[1.6]`.

---

## 3. Komposisi dan Spasi (Layout & Spacing)
Prinsip "Negative Space" sangat ditekankan di sini. Biarkan elemen bernapas.
- Selalu gunakan padding yang cukup ekstra pada kartu interior (`p-5` atau `p-6`). 
- Gap antar bagian harus terlihat jelas (`gap-4`, `gap-5` pada *grid* atau *flex flex-col*).
- Hindari memenuhi layar tanpa batas di desktop. Gunakan *max-width* sebagai penahan fokus, misalnya `max-w-[1280px]` untuk *container* utama.

---

## 4. Tampilan Interaktif & Kartu (Cards & Surfaces)
Untuk menghilangkan kesan "AI Slop" (bayangan ultra besar keunguan, border melengkung ekstrim padahal tidak sesuai konteks), gunakan pakem di bawah ini:

1. **Border Halus:** Elemen dikurung dengan garis luar lembut (contoh: `border border-[#e1dce8]`) alih-alih mengandalkan *shadow* raksasa.
2. **Shadow Halus:** Gunakan `shadow-sm` secara tipis hanya sebagai aksen pendukung *border*.
3. **Rounded Corners yang Terkendali:** Radius dijaga di ukuran moderat seperti `rounded-xl` (untuk kontainer utama), `rounded-lg` untuk tombol/kartu dalam, dan `rounded-md` untuk elemen kecil.
4. **Hover States yang Mulus:**
   - Kartu (*article / cards*): Gunakan `transition-all duration-300 hover:shadow-md hover:border-[#cfd5e6] hover:-translate-y-0.5`. Sedikit mengangkat, tanpa merusak komposisi.
   - Tombol: Berikan perbedaan warna latar tipis (contoh: dari `bg-[#f3f2f8]` ke `hover:bg-[#e4e9f2]`) sehingga terasa taktil/responsif saat didekati *mouse*.

---

## 5. UI Elements Khusus (Panel & Kalender)
- **Kalender Grid:**
  Beri *border* hanya pada batas transisi komponen dalam (`border-b`, `border-r`), agar tidak dobel pinggiran. Beda hari ini atau bulan yang aktif tidak ditandai warna blok masif, melainkan kontras pada warna *font* harinya (teks tebal `#34466f` vs pucat `#a3adc2`).

- **Pop-over / Sidebar Detail Dinamis (`<aside>`):**
  Untuk layar besar, panel muncul meluncur anggun dan tertahan mutlak (`absolute z-30`) atau *sticky* di samping. Manfaatkan state CSS ringkas:
  `transition-all duration-300 ease-out` digabungkan perubahan dimensi/kecerahan (`translate-y-0 scale-100 opacity-100` ke `translate-y-2 scale-[0.98] opacity-0`).

---

**Ringkasan:** Kunci dari visual kali ini adalah keseimbangan—warna "redup" berkelas *navy/slate*, margin lega, tepian bergaris batas yang jelas, tipografi dengan kepribadian yang tanggulan, serta interaksi mikro yang halus untuk *user feedback*.
