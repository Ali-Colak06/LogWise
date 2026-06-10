# Yeni Blog Yazısı Ekleme

Blog, build-step'siz statik HTML olarak çalışır: yazılar Markdown kaynağından
(`blog-content/`) bir Node script'iyle (`scripts/build-blog.js`) üretilir.
Üretilen `blog/*.html` dosyaları commit'lenir; Netlify/CF Pages bunları
clean URL olarak sunar (`blog/slug.html` → `/blog/slug`). Ekstra config gerekmez.

## Adımlar

1. `blog-content/<slug>.md` oluştur. Şablon:

   ```markdown
   ---
   title: Yazı Başlığı
   slug: yazi-basligi
   date: 2026-06-15
   lang: tr
   description: SEO meta açıklaması ve kart metni (ideal <160 karakter).
   tags: antrenman, takip
   featured: false
   ---

   Markdown gövde...
   ```

   Kurallar:
   - `slug`: yalnızca küçük harf, rakam, tire; dosya genelinde benzersiz.
   - `lang`: `tr` veya `en` (yazı bazında dil — karışık blog).
   - `featured: true` → landing'deki "Blog" bölümünde öncelik alır.
   - `date`: `YYYY-MM-DD`. Sıralama bu alana göre (yeni → eski).

2. Script'i çalıştır:

   ```
   node scripts/build-blog.js
   ```

   Script şunları üretir/günceller (hepsi commit'lenir):
   - `blog/<slug>.html` — yazı sayfası (meta + OG + JSON-LD dahil)
   - `blog/index.html` — yazı listesi (dil filtresiyle)
   - `blog/posts.json` — makine-okur manifest
   - `sitemap.xml` — tüm yazılarla yeniden üretilir
   - `index.html` (landing) — `BLOG-POSTS:START/END` marker'ları arasına
     öne çıkan yazı verisi enjekte edilir (landing "Blog" bölümü buradan beslenir)

3. Kontrol: yazı sayfasını tarayıcıda aç, landing'deki Blog bölümünde kartın
   göründüğünü doğrula (landing kartları: önce `featured`, sonra tarih; aktif
   dile uyan yazılar öne alınır, ilk 3 gösterilir).

## Yazı silme / güncelleme

- Silme: `blog-content/<slug>.md` dosyasını sil → script'i çalıştır
  (script `blog/` içindeki eski HTML'leri temizleyip yeniden üretir).
- Güncelleme: `.md`'yi düzenle → script'i çalıştır.
- `blog/*.html`, `blog/posts.json` ve landing marker bloğu **elle düzenlenmez**.
- `blog/blog.css` elle yazılır (üretilmez) — blog görünümü buradan değişir.

## Notlar

- Bağımlılık: `scripts/vendor/marked.min.js` (vendored, npm install yok).
- Blog sayfaları `sw.js` PRECACHE'ine **girmez**; navigation network-first
  olduğu için CACHE_NAME bump gerekmez.
- Blog statik HTML'dir; React/JSX kullanılmaz (AGENTS.md §3.1 ile uyumlu).
