# R2 Exercise Media Kurulum Rehberi

<!-- SON GÜNCELLEME: 2026-06-18 — Ayrı exercise-media bucket ve doğrulama akışı. -->

Bu rehber, exercise guide video/poster/muscle-map varlıklarının Cloudflare R2 üzerinde yayınlanmasını anlatır. Kullanıcı avatarları ve workout fotoğrafları için kullanılan `logwise-images` bucket'ı bu iş için kullanılmaz. Exercise medyası immutable, public ve ayrı yaşam döngüsüne sahip olduğu için `logwise-exercise-media` bucket'ında tutulur.

## Sabitler

```text
Bucket: logwise-exercise-media
Custom domain: media.logwise.fit
Object prefix: exercises/{slug}/
Public base URL: https://media.logwise.fit/exercises/{slug}/
```

## 1. Cloudflare Oturumu ve Bucket

Wrangler oturumu kullanıcı tarafından açılır:

```powershell
wrangler login
wrangler whoami
```

Bucket oluşturulur:

```powershell
wrangler r2 bucket create logwise-exercise-media --location weur
```

Bucket zaten varsa create komutu tekrar çalıştırılmaz; `wrangler r2 bucket list` ile kontrol edilir.

## 2. CORS

Repo kökündeki `r2-exercise-media-cors.json` uygulanır:

```powershell
wrangler r2 bucket cors set logwise-exercise-media --file r2-exercise-media-cors.json --force
wrangler r2 bucket cors list logwise-exercise-media
```

CORS yalnız `https://logwise.fit` kaynaklı `GET`/`HEAD` erişimini ve `Range` header'ını kapsar. Yerel browser geliştirmesi gerektiğinde localhost origin'i geçici olarak dosyaya eklenir; production commit'inde bırakılmaz.

## 3. Custom Domain

Cloudflare Dashboard içinde:

1. R2 → `logwise-exercise-media` → Settings açılır.
2. Public Development URL (`r2.dev`) production için etkinleştirilmez.
3. Custom Domains → Connect Domain seçilir.
4. `media.logwise.fit` bağlanır.
5. DNS ve sertifika durumu Active olana kadar beklenir.

Custom domain bağlandıktan sonra `https://media.logwise.fit/exercises/...` URL'leri kullanılmalıdır. JSON içinde `r2.dev`, `workers.dev` veya provider-specific geçici URL tutulmaz.

## 4. Cache

Cloudflare Cache Rule:

```text
Hostname equals media.logwise.fit
AND URI Path starts with /exercises/
```

Dosyalar versioned olduğu için cache eligibility etkinleştirilir ve origin `Cache-Control` header'ı korunur. Aynı object key üzerine yeni medya yazılmaz; `demo-v1.mp4` yerine yeni sürüm `demo-v2.mp4` olarak yüklenir.

Upload sırasında kullanılacak cache değeri:

```text
public, max-age=31536000, immutable
```

## 5. Bench Press Pilot Upload

Önce yerel MP4 doğrulanır:

```powershell
node scripts/validate-exercise-media.js --local .\media\bench-press\demo-v1.mp4
```

Dosyalar doğru MIME ve cache metadata ile yüklenir:

```powershell
wrangler r2 object put logwise-exercise-media/exercises/bench-press/demo-v1.mp4 --file .\media\bench-press\demo-v1.mp4 --ct video/mp4 --cc "public, max-age=31536000, immutable" --remote --force
wrangler r2 object put logwise-exercise-media/exercises/bench-press/demo-v1.webm --file .\media\bench-press\demo-v1.webm --ct video/webm --cc "public, max-age=31536000, immutable" --remote --force
wrangler r2 object put logwise-exercise-media/exercises/bench-press/poster-v1.webp --file .\media\bench-press\poster-v1.webp --ct image/webp --cc "public, max-age=31536000, immutable" --remote --force
wrangler r2 object put logwise-exercise-media/exercises/bench-press/muscles-v1.webp --file .\media\bench-press\muscles-v1.webp --ct image/webp --cc "public, max-age=31536000, immutable" --remote --force
```

Local `media/` çalışma dosyaları repoya eklenmez. Yalnız final public URL'ler `data/ex-guides.json` içine yazılır.

## 6. JSON ve Uzak Doğrulama

Yüklenen URL'ler `data/ex-guides.json` içindeki ilgili `media` alanına yazılır. Önce `mediaReady` false kalır.

```powershell
node scripts/build-ex-guides.js --check
node scripts/validate-exercise-media.js --remote bench-press
```

Uzak doğrulama şunları zorlar:

- HTTP `200` HEAD yanıtı
- Doğru `Content-Type`
- `public, max-age=31536000, immutable`
- `https://logwise.fit` CORS izni
- MP4 range isteğinde `206 Partial Content`
- Geçerli `Content-Range`

Doğrulama geçtikten sonra `mediaReady: true` yapılır ve guide JSON yeniden doğrulanır. `publish: true` ancak tam form/mistake/progression/web içeriği ve muscle map de hazır olduğunda etkinleştirilir.

## 7. Encode Referansı

```powershell
ffmpeg -i input.mov -vf "scale=-2:720,fps=30" -c:v libx264 -profile:v main -level 3.1 -pix_fmt yuv420p -b:v 1600k -maxrate 2000k -bufsize 4000k -movflags +faststart -an demo-v1.mp4
```

`ffmpeg` ve `ffprobe` PATH üzerinde bulunmalıdır. Kaynak 720p'den küçükse upscale yapılmaz; dikey kaynaklarda oran korunur.

## Hareket görsellerini GitHub raw'dan R2'ye taşıma (Faz 5 / D6)

`data/ex-images.js` içindeki free-exercise-db görselleri `raw.githubusercontent.com` üzerinden geliyor. Taşımak için:

```text
node scripts/mirror-ex-images.js download ..\logwise-media-staging
# klasördeki upload.ps1 (Windows) veya upload.sh ile wrangler r2 object put
node scripts/mirror-ex-images.js rewrite --dry-run
node scripts/mirror-ex-images.js rewrite
```

Anahtarlar `exercises/{slug}/still-{n}-v1.jpg`. `rewrite` yalnız tüm kareleri `https://media.logwise.fit/...` adresinde HEAD ile doğrulanan hareketleri değiştirir; sonra `sw.js` `CACHE_NAME` artırılır. Görsellerin lisansını yüklemeden önce kaynak depoda kontrol et.
