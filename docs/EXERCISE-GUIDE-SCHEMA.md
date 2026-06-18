# Exercise Guide Ortak Veri ve Medya Sözleşmesi

<!-- SON GÜNCELLEME: 2026-06-18 — JSON kanonik kaynak ve R2 medya sözleşmesi. -->

Bu belge, statik Library sayfaları ile React Native / Expo istemcisinin paylaşacağı exercise-guide verisinin sözleşmesidir. Mobil kod bu repoda değiştirilmez; iki platform aynı `data/ex-guides.json` dosyasını kaynak kabul eder.

## Kaynaklar ve Üretilen Dosya

- `data/ex-guides.json`: Tek kanonik ve platform-nötr kaynak. Elle düzenlenen dosya budur.
- `data/ex-guides.js`: Web için üretilen `window.LOGWISE_EX_GUIDES` wrapper'ı. Elle düzenlenmez.
- `docs/ex-guides.schema.json`: Makine-okunur JSON Schema.
- `scripts/build-ex-guides.js`: Preset slug, readiness, URL ve i18n doğrulaması yapar; wrapper üretir.

`data/ex-preview.js` ve `data/ex-images.js` migration boyunca fallback olarak kalır. Yeni medya yalnız `mediaReady: true` olduğunda legacy görsellerin önüne geçer.

## Readiness Kuralları

- `previewReady`: `summary` ve en az bir `tips` girdisi mobil/web preview için hazırdır.
- `mediaReady`: En az versiyonlu `demoMp4` ve `poster` R2 üzerinde hazırdır.
- `publish`: JSON tabanlı tam web guide sayfası yayına hazırdır.
- `publish: true`, hem `previewReady: true` hem `mediaReady: true` gerektirir.
- `publish: true`, ayrıca form adımları, hatalar, progression, muscle map ve `web` alanlarını gerektirir.
- Mobilde “Tam rehbere git” bağlantısı yalnız `publish: true` olduğunda gösterilmelidir.

Mevcut Bench Press, Squat ve Deadlift sayfaları medya hazır olana kadar legacy generator ile yayında kalır. JSON cutover bu üç hareket için içerik, medya ve generator değişikliği birlikte hazır olduğunda atomik yapılır.

## Dil ve İçerik

Yerelleştirilmiş her değer iki elemanlı `[TR, EN]` dizisidir. Otomatik karakter kesme yapılmaz; `summary` uygulama preview'ı için özel ve kısa yazılır. Liste maddeleri önem sırasına konur.

Slug ve hareket adı kaynağı `data/presets-exercises.js` dosyasıdır. Guide anahtarları yeni isim üretmez ve mevcut slug'ları değiştirmez.

## URL Sözleşmesi

Web guide URL'si:

```text
https://logwise.fit/library/exercises/{slug}
```

Medya base URL'si:

```text
https://media.logwise.fit/exercises/{slug}/
```

Tüm medya URL'leri mutlak HTTPS olmalıdır. Dosyalar cache üzerinde güncellenmez; yeni sürüm yeni isim alır:

```text
demo-v1.mp4
demo-v1.webm
poster-v1.webp
muscles-v1.webp
```

## MP4 Encode Standardı

- Konteyner: MP4
- Codec: H.264 / AVC
- Profil: Main, Level 3.1
- Pixel format: `yuv420p`
- Hedef: yaklaşık 720p, 30 FPS, 1–2 Mbps
- Süre: 4–6 saniye, 1–2 kontrollü tekrar
- Progressive playback: `-movflags +faststart`
- Ses kanalı yok: `-an`
- HLS yok; kısa klipler progressive MP4 ve byte-range ile servis edilir.
- WebM opsiyoneldir ve yalnız web optimizasyonu içindir.

Örnek başlangıç komutu:

```bash
ffmpeg -i input.mov -vf "scale=-2:720,fps=30" -c:v libx264 -profile:v main -level 3.1 -pix_fmt yuv420p -b:v 1600k -maxrate 2000k -bufsize 4000k -movflags +faststart -an demo-v1.mp4
```

Kaynak dikeyse veya 720 pikselden küçükse ölçek ayarı kaynak bazında yapılmalıdır; görüntü esnetilmez ve gereksiz upscale uygulanmaz.

## R2 HTTP Gereksinimleri

- `.mp4`: `Content-Type: video/mp4`
- `.webm`: `Content-Type: video/webm`
- `.webp`: `Content-Type: image/webp`
- Byte-range isteği `206 Partial Content` döndürmelidir.
- Versiyonlu dosyalar uzun süreli `Cache-Control: public, max-age=31536000, immutable` ile sunulmalıdır.
- CORS, `https://logwise.fit` kaynaklı web isteklerine izin vermelidir.
- `r2.dev` production URL olarak kullanılmaz; `media.logwise.fit` custom domain kullanılır.
- Remote medya dosyaları service worker precache listesine eklenmez.

## Yayına Alma Kontrolü

1. JSON doğrulamasını çalıştır: `node scripts/build-ex-guides.js --check`.
2. Wrapper üret: `node scripts/build-ex-guides.js`.
3. Yerel MP4 dosyasını `ffprobe` ile codec, pixel format, ses kanalı ve ölçüler açısından kontrol et.
4. R2 URL'sinde Content-Type, cache header ve range isteğini kontrol et.
5. `mediaReady` değerini ancak dosyalar gerçekten erişilebildiğinde `true` yap.
6. `publish` değerini ancak tam web içeriği ve muscle map hazır olduğunda `true` yap.
7. `node scripts/build-blog.js` ile statik çıktıları yeniden üret.
