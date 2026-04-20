# Service Worker (sw.js) Versiyon Bump Kuralları

<!-- SON GÜNCELLEME: 2026-04-20 — DOC-1 -->

Bu belge, LogWise'ın `sw.js` Service Worker'ını ne zaman, nasıl ve neden güncelleyeceğini anlatır.

---

## Service Worker Ne Yapar?

- **Offline destek:** Kullanıcı internet olmadan siteye girebilir.
- **Cache-first static:** JS, CSS, resim, font cache'ten servis edilir (hızlı yükleme).
- **Network-first HTML:** `index.html` önce ağdan çekilir, başarısızsa cache'ten (güncel sürüm her zaman).
- **Network-first Supabase:** API çağrıları hep ağ; offline'da 503 döner.

---

## `CACHE_NAME` — Neden Bump Lazım?

`sw.js` dosyasında:

```js
const CACHE_NAME = 'logwise-v20';
```

Bu isim, tarayıcının cache storage'ındaki bir "klasör" gibidir. Değişmediğinde tarayıcı **eski cache'i kullanmaya devam eder** — yani eklediğin yeni `.js` dosyasını **almaz**.

Versiyon bump ettiğinde:
1. Tarayıcı eski cache'i (örn. `logwise-v19`) temizler.
2. Yeni `PRECACHE_URLS` listesini baştan çeker.
3. Kullanıcı bir sonraki ziyaretinde yeni dosyaları görür.

---

## Ne Zaman Bump YAPILIR?

**Bump ZORUNLU** (yeni statik URL ekleme/silme):
- `data/` altına yeni dosya eklendiğinde
- `lib/` altına yeni dosya eklendiğinde
- `components/` altına yeni dosya eklendiğinde
- `styles/` altına yeni dosya eklendiğinde
- Bu dizinlerden bir dosya **silindiğinde** (eski cache'te kaldığı için eski kullanıcılara 404 dönebilir)
- `sw.js` davranışı/fetch stratejisi değiştiğinde

**Bump GEREKMEZ** (sadece içerik değişti, URL aynı):
- Mevcut bir `data/*.js` dosyasının içeriği değişti (yeni preset ekleme, i18n düzenleme)
- Mevcut bir `lib/*.js` veya `components/*.js` dosyasının içeriği değişti
- `styles/base.css` içinde kurala ekleme/değiştirme
- `index.html`, `profile.html`, vb. sayfalar (network-first → her zaman taze)

**Özet kural:** Dosya **listesi** değişiyorsa → bump. Dosya **içeriği** değişiyorsa → cache-bust tarayıcı tarafından HTTP header ile zaten yapılıyor (Cloudflare Pages ETag ile yönetiyor), sw.js'nin bump'ına gerek yok.

---

## Bump Prosedürü

### Adım 1 — Versiyon Numarasını Arttır

Basit monotonik artış: `v19` → `v20` → `v21` ...

```js
const CACHE_NAME = 'logwise-v20';  // ← bu sayıyı +1 yap
```

Ondalık veya anlam ayrımı yok. Her bump +1.

### Adım 2 — `PRECACHE_URLS`'i Güncelle

Eklenen dosyayı listeye ekle (veya silinen dosyayı listeden çıkar):

```js
const PRECACHE_URLS = [
  '/',
  '/index.html',
  // ...
  '/lib/db.js',
  '/lib/YENI-DOSYA.js',      // ← EKLENEN
  // ...
];
```

Sıralama önemli değil ama **mantıksal gruplamaya** uy — `data/` dosyaları bir arada, `lib/` bir arada, `components/` bir arada.

### Adım 3 — Test

Lokal test için (tarayıcı DevTools):
1. Application → Service Workers → eski SW'yi Unregister
2. Application → Storage → Clear site data
3. Sayfayı yenile
4. Network tab'ında `logwise-v20` cache yazıyorsa başarılı

---

## Deploy Sonrası Kullanıcı Deneyimi

Cloudflare Pages deploy'dan sonra:
1. Mevcut kullanıcı siteyi açar
2. `sw.js` network-first stratejisiyle yeni sürümü çeker
3. Yeni sürümde `CACHE_NAME = 'logwise-v20'` gördüğünde
4. `install` event'inde yeni cache'i hazırlar
5. `activate` event'inde eski cache'leri siler (`CACHE_NAME !== 'logwise-v20'`)
6. `activate` içinde açık sekmelere `SW_UPDATED` mesajı postalar
7. Tarayıcı auto-reload yapar (`index.html` içindeki SW register logic'i)
8. Kullanıcı yeni sürümü görür

Bu 1-2 saniye içinde olur. Ama **sen bump'ı unutursan** kullanıcı cache'teki eski dosyaları kullanmaya devam eder ve değişikliklerini **görmez**.

---

## Yaygın Hata: "Sürüm Atladım, Kullanıcı Yine Eskisini Görüyor"

Semptomlar:
- Deploy yaptın
- Canlı URL'yi açtın, kendinde çalışıyor
- Arkadaşında veya başka cihazda eski site görünüyor

Sebep:
- `CACHE_NAME` bump unutulmuş
- `PRECACHE_URLS`'e yeni dosya eklenmemiş
- Yeni dosya var ama kullanıcının SW'si cache'teki eski sürümü servis ediyor

Çözüm:
- `sw.js`'yi güncelle (bump + yeni URL), commit+push, deploy
- Veya kullanıcıya tarayıcı DevTools → Clear site data önerebilirsin (ama ideal değil)

---

## sw.js Davranış Değişikliği Kontrolü

Eğer cache stratejisini değiştiriyorsan (örn. "Supabase'i de cache'le") çok dikkat et:
- Yeni davranış `install` ile mi geliyor, yoksa `activate` sonrası mı?
- Eski kullanıcıların SW'leri hâlâ eski stratejiyi çalıştırır, ta ki bump edilen yeni SW `activate` olana kadar
- Test: iki farklı browser profili kullan, birinde eski SW ile aç, diğerinde yeni ile

---

## Kontrol Listesi

- [ ] `CACHE_NAME` sayısal olarak +1 arttırıldı
- [ ] Eklenen/silinen dosyalar `PRECACHE_URLS` dizisinde güncel
- [ ] Virgül hatası yok (JS array)
- [ ] `node --check sw.js` ✅
- [ ] Deploy sonrası 2-3 cihazda açılma testi (mümkünse farklı browser)

---

## İlgili Dokümanlar

- [AGENTS.md](../AGENTS.md) §3.3 — PWA kuralı
- [docs/YENI-COMPONENT.md](YENI-COMPONENT.md) Adım 5 — bileşen ekleme sırasında sw.js
- [REFACTOR-GECMISI.md](../REFACTOR-GECMISI.md) — her büyük fazda `CACHE_NAME` bump'ın kayıtlı olduğu bölümler
