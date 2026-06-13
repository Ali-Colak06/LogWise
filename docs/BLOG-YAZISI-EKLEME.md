# Yeni Blog Yazısı Ekleme

Blog, build-step'siz statik HTML olarak çalışır: yazılar Markdown kaynağından
(`blog-content/`) bir Node script'iyle (`scripts/build-blog.js`) üretilir.
Üretilen `blog/*.html` dosyaları commit'lenir; Cloudflare Pages bunları clean
URL olarak sunar (`blog/slug.html` → `/blog/slug`). Ekstra config gerekmez.

## İki Dilli Yazı Kuralı

Her blog konusu iki ayrı Markdown dosyasıyla yayınlanır:

- bir `lang: en` varyantı
- bir `lang: tr` varyantı
- ikisinde de aynı `translationKey`

`translationKey`, aynı yazının İngilizce ve Türkçe varyantlarını eşleştirir.
Script eksik varyantı hata sayar; tek başına TR veya EN yazı bırakılmaz.

## Adımlar

1. Aynı konu için iki dosya oluştur:

   ```markdown
   ---
   title: Post Title
   slug: post-title
   date: 2026-06-15
   lang: en
   translationKey: post-topic-key
   description: SEO meta açıklaması ve kart metni (ideal <160 karakter).
   tags: training, tracking
   featured: false
   ---

   Markdown body...
   ```

   ```markdown
   ---
   title: Yazı Başlığı
   slug: yazi-basligi
   date: 2026-06-15
   lang: tr
   translationKey: post-topic-key
   description: SEO meta açıklaması ve kart metni (ideal <160 karakter).
   tags: antrenman, takip
   featured: false
   ---

   Markdown gövde...
   ```

   Kurallar:
   - `slug`: yalnızca küçük harf, rakam, tire; tüm blog içinde benzersiz.
   - `lang`: yalnızca `tr` veya `en`.
   - `translationKey`: küçük harf, rakam, tire; aynı konunun TR+EN dosyalarında birebir aynı.
   - `featured: true`: landing'deki "Blog" bölümünde konuya öncelik verir.
   - `date`: `YYYY-MM-DD`. Konu sıralaması en güncel varyant tarihine göre yapılır.

2. Script'i çalıştır:

   ```powershell
   node scripts/build-blog.js
   ```

   Script şunları üretir/günceller (hepsi commit'lenir):
   - `blog/<slug>.html` — yazı sayfası (meta, OG, JSON-LD, hreflang dahil)
   - `blog/index.html` — konu listesi; her kartta EN/TR okuma seçenekleri vardır
   - `blog/posts.json` — makine-okur manifest (`translationKey` + `alternates`)
   - `sitemap.xml` — tüm yazılar ve hreflang alternate kayıtlarıyla yeniden üretilir
   - `index.html` / `tr.html` — `BLOG-CARDS:START/END` marker'ları arasına aktif dile uygun blog kartları enjekte edilir

3. Kontrol:
   - `/blog` aynı konuyu iki kez listelememeli.
   - Her yazı sayfasında English/Türkçe geçişi görünmeli.
   - Sayfa kaynağında `canonical`, `hreflang="en"`, `hreflang="tr"` ve `x-default` bulunmalı.
   - Landing'deki Blog bölümünde EN landing EN varyantları, TR landing TR varyantları göstermeli.

## Yazı Silme / Güncelleme

- Silme: Aynı `translationKey`'e ait iki varyantı birlikte sil → script'i çalıştır.
- Güncelleme: İlgili `.md` dosyasını düzenle → script'i çalıştır.
- `blog/*.html`, `blog/posts.json`, `sitemap.xml` ve landing marker bloğu **elle düzenlenmez**.
- `blog/blog.css` elle yazılır (üretilmez) — blog görünümü buradan değişir.

## Notlar

- Bağımlılık: `scripts/vendor/marked.min.js` (vendored, npm install yok).
- Blog HTML sayfaları `sw.js` PRECACHE'ine girmez; navigation network-first olduğu için yalnızca yeni post eklemek için `CACHE_NAME` bump gerekmez.
- `blog/blog.css` değişirse service worker runtime cache sebebiyle `CACHE_NAME` bump değerlendirilmeli.
- Blog statik HTML'dir; React/JSX kullanılmaz (AGENTS.md §3.1 ile uyumlu).
