# Yeni Learn Yazisi Ekleme

Learn, build-step'siz statik HTML olarak calisir: yazilar Markdown kaynagindan
(`blog-content/`) bir Node script'iyle (`scripts/build-blog.js`) uretilir.
Uretilen EN `learn/*.html` ve TR `ogren/*.html` dosyalari commit'lenir.
Cloudflare Pages bunlari clean URL olarak sunar (`learn/slug.html` -> `/learn/slug`,
`ogren/slug.html` -> `/ogren/slug`). Ekstra config gerekmez.

## Iki Dilli Yazi Kurali

Her Learn konusu iki ayri Markdown dosyasiyla yayinlanir:

- bir `lang: en` varyanti
- bir `lang: tr` varyanti
- ikisinde de ayni `translationKey`

`translationKey`, ayni yazinin Ingilizce ve Turkce varyantlarini eslestirir.
Script eksik varyanti hata sayar; tek basina TR veya EN yazi birakilmaz.

## Adimlar

1. Ayni konu icin iki dosya olustur:

   ```markdown
   ---
   title: Post Title
   slug: post-title
   date: 2026-06-15
   lang: en
   translationKey: post-topic-key
   description: SEO meta aciklamasi ve kart metni (ideal <160 karakter).
   tags: training, tracking
   featured: false
   ---

   Markdown body...
   ```

   ```markdown
   ---
   title: Yazi Basligi
   slug: yazi-basligi
   date: 2026-06-15
   lang: tr
   translationKey: post-topic-key
   description: SEO meta aciklamasi ve kart metni (ideal <160 karakter).
   tags: antrenman, takip
   featured: false
   ---

   Markdown govde...
   ```

   Kurallar:
   - `slug`: yalnizca kucuk harf, rakam, tire; tum Learn icinde benzersiz.
   - `lang`: yalnizca `tr` veya `en`.
   - `translationKey`: kucuk harf, rakam, tire; ayni konunun TR+EN dosyalarinda birebir ayni.
   - `featured: true`: landing'deki Learn bolumunde konuya oncelik verir.
   - `date`: `YYYY-MM-DD`. Konu siralamasi en guncel varyant tarihine gore yapilir.

2. Script'i calistir:

   ```powershell
   node scripts/build-blog.js
   ```

   Script sunlari uretir/gunceller (hepsi commit'lenir):
   - `learn/<en-slug>.html` - EN yazi sayfasi (meta, OG, JSON-LD, hreflang dahil)
   - `ogren/<tr-slug>.html` - TR yazi sayfasi (meta, OG, JSON-LD, hreflang dahil)
   - `learn/index.html` - EN konu listesi
   - `ogren/index.html` - TR konu listesi
   - `learn/posts.json` - makine-okur manifest (`translationKey` + `alternates`)
   - `sitemap.xml` - tum yazilar ve hreflang alternate kayitlariyla yeniden uretilir
   - `index.html` / `tr.html` - `BLOG-CARDS:START/END` marker'lari arasina aktif dile uygun Learn kartlari enjekte edilir

3. Kontrol:
   - `/learn` EN konu listesini, `/ogren` TR konu listesini gostermeli.
   - Dil switch'i `/learn` <-> `/ogren` ve `/learn/<en-slug>` <-> `/ogren/<tr-slug>` arasinda URL degistirmeli.
   - Learn kartina tiklandiginda aktif dilin yazi URL'si acilmali.
   - Yazi sayfasindaki ust switch es yaziya gecmeli.
   - Sayfa kaynaginda `canonical`, `hreflang="en"`, `hreflang="tr"` ve `x-default` bulunmali.
   - Landing'deki Learn bolumunde EN landing EN varyantlari, TR landing TR varyantlari gostermeli.

## Yazi Silme / Guncelleme

- Silme: Ayni `translationKey`'e ait iki varyanti birlikte sil -> script'i calistir.
- Guncelleme: Ilgili `.md` dosyasini duzenle -> script'i calistir.
- `learn/*.html`, `ogren/*.html`, `learn/posts.json`, `sitemap.xml` ve landing marker blogu **elle duzenlenmez**.
- `learn/learn.css` elle yazilir (uretilmez) - Learn gorunumu buradan degisir.

## Notlar

- Bagimlilik: `scripts/vendor/marked.min.js` (vendored, npm install yok).
- Learn/Ogren HTML sayfalari `sw.js` PRECACHE'ine girebilir; `learn/learn.css` veya public URL yapisi degisirse `CACHE_NAME` bump kontrol edilir.
- Learn statik HTML'dir; React/JSX kullanilmaz (AGENTS.md 3.1 ile uyumlu).
