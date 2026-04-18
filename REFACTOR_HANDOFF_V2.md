# LogWise Refactor — Handoff (Aşama 2)

Bu dosyayı yeni Claude Code sohbetinin ilk mesajına şöyle ekle:

> "LogWise klasöründeki `REFACTOR_HANDOFF_V2.md` dosyasını oku ve talimatlarını uygula."

---

## Proje Bağlamı

- **Proje:** LogWise — logwise.fit (antrenman takip PWA'sı)
- **Stack:** React 18 (klasik `React.createElement()`, JSX YOK, Babel YOK, build step YOK) + Supabase + Cloudflare Pages/R2
- **Hosting:** Cloudflare Pages, push → otomatik deploy
- **Dosya yapısı:** `index.html` + `profile.html` + `data/` (9 dosya) + `lib/` (3 dosya) + `sw.js` + `CLAUDE-CODE-REHBER.md`

## Ali'nin Çalışma Tercihleri

- **Dil:** Türkçe konuş
- **Adım adım:** Her adım sonrası Ali'den onay al, kendi kendine ileri geçme
- **Commit'leri Ali yapıyor** — sen komutu hazırla, MINGW64'te çalıştırmayı ona bırak
- **Her adım sonrası CLAUDE-CODE-REHBER.md'ye yeni bölüm ekle** (şu an Bölüm 33'te)
- **`window.LOGWISE_*` global pattern** — klasik `<script src>` tag'leri. ES module kullanma.
- **Her adımda 3 doğrulama:** `node --check` + runtime test (`global.window = {}`) + bracket balance (awk)
- **Service Worker:** Her taşımada `CACHE_NAME` bump (`logwise-v12` → `v13`...) ve PRECACHE_URLS güncelle
- **SW cache gotcha:** E-2'de bug çıktı — yeni sohbette de çıkarsa Ali'ye "DevTools → Application → Service Workers → Unregister + Clear site data + hard refresh" talimatını hatırlat

## Aşama 1 — TAMAMLANDI ✅

| Adım | İçerik | Yeni dosya(lar) |
|---|---|---|
| A | TR/EN çeviriler | `data/i18n-tr.js`, `data/i18n-en.js`, `data/i18n-tr-profile.js`, `data/i18n-en-profile.js` |
| B | Rozet tanım ve yardımcıları | `data/badges.js`, `lib/badge-logic.js` (getBadgeName, getBadgeCatLabel) |
| C | Hazır hareketler | `data/presets-exercises.js`, `data/ex-descriptions.js`, `data/ex-preview.js` |
| D | Hazır programlar | `data/presets-programs.js` (4 program: PPL, Upper/Lower, Full Body, Bro Split) |
| E-1 | Hesaplama ve tarih yardımcıları | `lib/calc.js` (11 fonksiyon: fmt, pD, gdow, eDays, calc1RM, calcBrzycki, calcStreak, calcWeekFreq, calcMonthFreq, getAllPRs, calcCompliance) |
| E-2 | Rozet mantık fonksiyonları | `lib/badge-logic.js` genişletildi (+ calcBadgeStats, checkBadges, getNextBadge) |
| F | Veri şeması | `lib/data-schema.js` (init, migrateData) |

**Sonuç:** index.html 11,161 → 9,674 satır (-1,487, %13.3). profile.html 3,833 → 3,490 satır. 11 yeni dosya, 11 `window.LOGWISE_*` namespace.

Detaylı dokümantasyon CLAUDE-CODE-REHBER.md Bölüm 28-33 arasında.

## Aşama 2 — YAPILACAK

Aşağıdaki fazları **sırayla** uygula, her fazın sonunda Ali'den onay al.

### Faz 2A — Profile/UI utilities ayrıştırması (düşük risk, küçük getiri)

**Hedef:** `lib/profile-utils.js` oluştur, `window.LOGWISE_PROFILE_UTILS` namespace.

**Taşınacak fonksiyonlar (index.html'de şu an inline, ~satır 448 civarı):**
- `catLabel(cat, lang)` — kategori etiketi
- `normalizeUsername(v)`, `isValidUsername(v)`
- `defaultDisplayName(user)`, `defaultAvatar(user)`
- `buildProfileRow(user, existing, overrides)`

**İlk iş:** profile.html'de duplike var mı kontrol et, varsa temizle (bonus duplikasyon temizliği).

**Beklenen getiri:** ~30-40 satır.

### Faz 2B — CSS ayrıştırma (orta risk, iyi getiri)

**Hedef:** `index.html` içindeki `<style>` bloğunu `styles/main.css`'e taşı.

**Dikkat:**
- Cloudflare `_headers` dosyasında CSS için doğru MIME type verilmeli (`Content-Type: text/css`)
- `sw.js` PRECACHE_URLS'e `styles/main.css` eklensin
- CSS değişkenleri (`:root { --bg: ... }`), `@media` query'leri, pseudo-class'ler (`::before`) aynen korunmalı
- profile.html ve share.html da aynı CSS'i kullanıyorsa paylaşım stratejisi düşün (aynı `<link>` tag veya ayrı dosyalar?)

**Beklenen getiri:** index.html 500-1000 satır daha küçülebilir.

### Faz 2C — React bileşenleri ayrıştırma (yüksek risk, yüksek getiri)

**Ali'ye iki seçenek sun:**

**C1 — İzole bileşenleri tek tek çıkar:**
- `components/brand-mark.js` → BrandMark
- `components/error-boundary.js` → ErrorBoundary
- `components/dash-chart.js` → DashChart (Chart.js canvas yönetimi)

Her biri `window.LOGWISE_COMPONENTS = { BrandMark, ErrorBoundary, DashChart }` altında.

**C2 — Feature bazlı dosyalar:**
- `features/workout.js`, `features/dashboard.js`, `features/badges.js`, `features/programs.js`

**Dikkat:**
- React hooks (`useState`, `useEffect`) inline scope'ta kalır, bileşenler ayrı dosyada tanımlanır
- Closure'la erişilen state/callback'ler → props'a çevrilmeli
- Bileşen tanımı sırası önemli: parent → child yükleme

### Faz 2D — Supabase ve veri katmanı izolasyonu (orta-yüksek risk)

**Hedef:** `lib/db.js` → `window.LOGWISE_DB`

```js
window.LOGWISE_DB = {
  loadUserData(userId),
  saveUserData(userId, data),
  loadProfile(userId),
  saveProfile(userId, row),
  listFollowers(userId),
  // vb.
};
```

**Dikkat:**
- Supabase client instance'ı tek noktada (muhtemelen `lib/db.js` içinde create)
- Auth listener (`supabase.auth.onAuthStateChange`) bozulmadan taşınmalı
- Realtime subscription varsa (follower updates vs.) `lib/db.js`'ye alınır veya `features/` bileşeninde kalır
- `try/catch` ve error handling pattern'leri korunmalı

## Her Faz İçin Standart Adım Listesi

1. **Keşif:** İlgili fonksiyon/blokların `grep -n` ile tam konumunu çıkar
2. **Plan + onay:** Ali'ye ne yapacağını anlat, tercih (ör: tek dosya vs. birden çok) sunarsa onay al
3. **Yeni dosya oluştur:** `lib/` veya `components/` altında, `window.LOGWISE_*` namespace
4. **Eski blokları sil, redirection satırı koy:** Büyük bloklar için `Edit` yerine Python regex kullan
5. **Script tag ekle** (HTML <head>, doğru yükleme sırasıyla)
6. **Doğrulama:** `node --check` + runtime test + bracket balance
7. **SW bump:** `sw.js` CACHE_NAME + PRECACHE_URLS
8. **CLAUDE-CODE-REHBER.md'ye yeni bölüm ekle** (Bölüm 34'ten başlayacak)
9. **Ali için test checklist + git commit komutu hazırla**
10. **Commit'ten sonra onay bekle**, bir sonraki adıma geç

## Yolda Gelebilecek Tuzaklar

- **Python ile büyük blok değiştirme:** `import re; re.compile(r'const X = .*?\n};\nconst NEXT', re.DOTALL)` pattern'i işe yarıyor
- **profile.html duplikasyon:** Her faz öncesi `grep -n "fonksiyonAdı" profile.html` ile duplikasyon kontrol et
- **SW cache:** CACHE bump yeterli olmayabilir, Ali'ye Unregister + Clear site data talimatı ver
- **React component bağımlılıkları:** Script yükleme sırası hayati — parent bileşen child'dan önce yüklenemez, child parent props'a erişir ama tanım sırası tersine

## Kritik Dosyalar

- `CLAUDE-CODE-REHBER.md` — okunmalı (Bölüm 1-7 yapı/mimari, Bölüm 28-33 refactor geçmişi)
- `index.html` — ana uygulama
- `profile.html` — profil sayfası
- `sw.js` — service worker (şu an `logwise-v12`)
- `lib/calc.js`, `lib/badge-logic.js`, `lib/data-schema.js` — örnek kalıp olarak referans al

## Önemli Not

Ali bu dosyayı yeni sohbete attığında **önce CLAUDE-CODE-REHBER.md'yi oku** (özellikle Bölüm 2, 7, 28-33). O dosya projenin gerçek mimari dokümanıdır. Bu handoff sadece özet.

Başlarken Ali'ye şunu sor: **"Hangi fazdan başlayalım — 2A mı, yoksa atlayıp 2B/2C/2D'ye gitmek istiyor musun?"**
