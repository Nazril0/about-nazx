# Nazx — Personal Space

Website statis biasa (HTML + CSS + JS). Tanpa Vercel, tanpa build, tanpa npm.
Upload seluruh folder ke hosting statis mana saja (GitHub Pages, Netlify, hosting biasa, dll).
Buka lewat server, bukan klik dua kali file `index.html`, karena daftar isi dibaca lewat `fetch`.
Tes lokal: `python3 -m http.server` lalu buka http://localhost:8000

## Menambah foto ke Gallery
1. Taruh foto di folder `gallery/`.
2. Tambah satu baris di `gallery/gallery.js`:
   `"fotoku.jpg",` atau `{ file: "fotoku.jpg", caption: "Judul", desc: "Deskripsi" },`
Ukuran foto bebas, tata letaknya menyesuaikan sendiri.
Tahan lama sebuah foto untuk melihat pratinjau + deskripsi (`desc`) ala iOS; ketuk biasa untuk memperbesar.

## Menambah Game / Tools
1. Taruh file `.html` di `games/` atau `tools/`.
2. Tambah satu baris di `list.json` folder itu:
   `{ "file": "nama.html", "title": "Judul", "emoji": "🧮", "color": "blue" }`
   Warna (khusus ikon): blue, green, orange, red, pink, purple, indigo, teal, yellow, dark. Kosong = dipilih otomatis.
   `title` boleh dikosongkan, nanti diambil dari nama file.
- Tool bertema iOS bisa memakai `tools/ios.css` dan `tools/ios.js` (lihat `tool1.html` dst). Tool bebas (seperti `live-photo.html`) juga boleh.

## Menambah kategori baru
Tambah satu baris di `collections.json`, buat foldernya beserta `list.json`:
`{ "id": "musik", "title": "Musik", "emoji": "🎵", "type": "collection", "dir": "musik" }`

## Lainnya
- Foto profil/OG: `images/` | Lagu: `audio/background.mp3` | Font: `fonts/`
- Teks dan link profil: `index.html` | Fakta acak: array `facts` di `script.js`

## Menutup Game / Tools
Tombol Selesai, ketuk area kosong di atas, tarik header ke bawah, tombol Kembali di HP/browser, atau Esc.
