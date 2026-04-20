# Yeni React Bileşeni Ekleme Reçetesi

<!-- SON GÜNCELLEME: 2026-04-20 — DOC-1 -->

Bu belge, LogWise'a yeni bir React bileşeni eklerken kullanılacak standart pattern'i açıklar. Pattern, Faz 2C (1-5) sırasında 5 bileşenin çıkarılmasıyla kristalize oldu.

---

## Ne Zaman Yeni Dosya Açarsın, Ne Zaman `index.html` İçinde Kalırsın?

**Yeni bileşen dosyası aç:**
- Bileşen 50+ satırsa
- Başka bir sayfadan da kullanılacaksa
- Bağımlılıkları net (props + birkaç runtime window.* referansı)
- Aşama 3 view extraction zamanında gelen bir bölüm

**`index.html`'de inline kal (App içinde):**
- 10-30 satırlık geçici/basit bir helper component
- Sadece App scope'undaki state'e bağımlı ve prop ile geçirmek maliyetli

Şüpheye düştüğünde: **yeni dosya aç**. Küçük adımla ayrıştırmak, sonra geri birleştirmekten kolaydır.

---

## Standart İskelet (Defensive IIFE Pattern)

Yeni bir bileşen için şablon:

```js
// LogWise — <ComponentName>
// <Kısa amaç açıklaması>
// Bağımlılıklar (runtime'da çözülür):
//   - React (CDN, global) — React.createElement, React.useState, ...
//   - window.LOGWISE_XYZ  — <ne için>
// Props: { prop1, prop2, ... }
// Kullanım: window.LOGWISE_COMPONENTS.<ComponentName>
(function () {
  // İsteğe bağlı: modül-level sabitler burada.

  function ComponentName({ prop1, prop2 }) {
    // Runtime bağımlılık çözümü — scope'un başında yap.
    const TR = window.LOGWISE_TR;
    const EN = window.LOGWISE_EN;
    const L = prop1?.lang === "tr" ? TR : EN;

    // Hook'lar
    const [state, setState] = React.useState(null);

    // Effect'ler (varsa)
    React.useEffect(() => {
      // ...
    }, []);

    // Render
    return React.createElement("div", {
      style: { /* ... */ }
    }, /* children */);
  }

  // Defensive init: namespace'i yoksa aç.
  window.LOGWISE_COMPONENTS = window.LOGWISE_COMPONENTS || {};
  window.LOGWISE_COMPONENTS.ComponentName = ComponentName;
})();
```

---

## Kurallar ve Gerekçeler

### 1. IIFE Wrapper (`(function () { ... })();`)
- Modül-düzeyi scope izolasyonu. Dosyanın içindeki `const`/`let` global kirlenme yaratmaz.
- Tüm bileşen dosyaları bu pattern'i kullanır (tutarlılık).

### 2. `React.createElement` / `React.useState` / `React.useEffect`
- Component içinde hook'ları `React.*` olarak çağır. (`index.html`'deki gibi `const { useState } = React;` destructure KULLANMA — bileşen dosyasının kendi scope'u var, React import'u yoktur.)
- Böylece script yükleme sırasından bağımsız, React hazırsa çalışır.

### 3. Runtime Bağımlılık Çözümü — Scope'un Başında
- `window.LOGWISE_TR`, `window.LOGWISE_DB`, vb. gibi bağımlılıkları **component fonksiyonunun en başında** veya **useEffect içinde** oku.
- IIFE'nin **dış** scope'unda (en üstte) okuma! Çünkü script yükleme sırası sırasında bu dosya yüklendiğinde bağımlılık dosyası henüz yüklenmemiş olabilir.

**Kötü:**
```js
(function () {
  const { sb } = window.LOGWISE_DB;   // ❌ HATA: db.js bu script'ten sonra yüklenirse crash
  function AuthScreen(...) { ... }
})();
```

**İyi:**
```js
(function () {
  function AuthScreen(...) {
    const { sb } = window.LOGWISE_DB;  // ✅ Render zamanında okunur; tüm script'ler yüklenmiş olur
    ...
  }
})();
```

### 4. Defensive Namespace Init
```js
window.LOGWISE_COMPONENTS = window.LOGWISE_COMPONENTS || {};
window.LOGWISE_COMPONENTS.ComponentName = ComponentName;
```
Bu iki satır her component dosyasının sonunda durur. Hangi component önce yüklenirse namespace'i açar; sonrakiler mevcut namespace'i bozmadan üstüne yazar.

### 5. Props vs Runtime Namespace
- Sık değişen state/callback → **prop** olarak geç (`lang`, `onClose`, `onLogin`).
- Sabit / genel yardımcı → **runtime `window.LOGWISE_*`'ten oku** (`TR`, `EN`, `sb`, `profileRoute`).
- "Bridge prop" pattern'i (geçici): henüz namespace'te olmayan bir bağımlılık için geçici prop. Genelde bir sonraki refactor fazında temizlenir.

---

## Ekleme Adımları

### Adım 1 — Dosya Oluştur

`components/<kebab-case-name>.js` yolunda standart iskeletle yeni dosya.

İsimlendirme:
- Dosya: `kebab-case.js` (örn. `dash-chart.js`, `ex-preview-modal.js`)
- Component: `PascalCase` (örn. `DashChart`, `ExPreviewModal`)

### Adım 2 — `index.html`'de Script Tag Ekle

Doğru sırada — bağımlılıklarından **sonra**, kendisini kullanan bileşenlerden **önce**:

```html
<!-- Mevcut bileşenler -->
<script src="components/error-boundary.js"></script>
<script src="components/brand-mark.js"></script>
<script src="components/dash-chart.js"></script>
<script src="components/ex-preview-modal.js"></script>
<script src="components/auth-screen.js"></script>
<script src="components/YENI-BILESENIN.js"></script>   <!-- YENİ -->
```

### Adım 3 — `index.html` Destructure'a Ekle

Ana `<script>` bloğunun başında (satır ~96 civarı):

```js
const { ErrorBoundary, BrandMark, DashChart, ExPreviewModal, AuthScreen, YeniBilesen } = window.LOGWISE_COMPONENTS;
```

### Adım 4 — Kullan

Artık App/Root içinde:

```js
React.createElement(YeniBilesen, { prop1: ..., prop2: ... })
```

### Adım 5 — `sw.js` Güncellemesi (ZORUNLU)

Bkz. [`SW-VERSION-BUMP.md`](SW-VERSION-BUMP.md). İki değişiklik:

1. `CACHE_NAME` bir sonraki versiyona bump (örn. `v20` → `v21`).
2. `PRECACHE_URLS` dizisine yeni dosya:
   ```js
   '/components/yeni-bilesenin.js',
   ```

### Adım 6 — `AGENTS.md` Dosya Haritası

§4 dosya ağacı diyagramında `components/` bloğuna yeni satır ekle + `SON GÜNCELLEME` tarihini yenile.

### Adım 7 — `REFACTOR-GECMISI.md`

Büyük bir refactor değil tek bir bileşen eklemek de olsa, eğer pattern/mimari kaydına değer bir iş ise Bölüm ekle. Küçük UI bileşeni ise REFACTOR-GECMISI'ne yazmayabilirsin.

---

## Doğrulama (Seans Sonu)

- [ ] `node --check components/<yeni>.js` ✅
- [ ] Bracket balance: `(` `{` `[` hepsi 0 ✅
- [ ] `node --check` index.html inline JS (script etiketini söküp geçici dosya yaparak) ✅
- [ ] `sw.js` `CACHE_NAME` bump edildi ✅
- [ ] `sw.js` `PRECACHE_URLS`'e eklendi ✅
- [ ] `AGENTS.md` dosya haritası güncellendi ✅
- [ ] Tarayıcıda yeni bileşen render oluyor ✅
- [ ] Console'da hata yok ✅

---

## Sık Yapılan Hatalar

- **IIFE dış scope'ta runtime bağımlılık okumak** — script sırası kırıldığında `undefined.destructure` patlar.
- **Destructure'a eklemeyi unutmak** — `index.html`'de `const { YeniBilesen } = window.LOGWISE_COMPONENTS` yoksa `YeniBilesen is not defined` hatası.
- **Script tag'ı eklememek** — bileşen dosyası var ama yüklenmiyor, namespace'e girmiyor.
- **Script tag sırası yanlış** — bir bileşen IIFE dış scope'unda başka bir bileşeni okuyorsa (önerilmez), sıra kritik olur.
- **sw.js bump atlamak** — yeni kullanıcılar dosyayı alır, eski kullanıcılar almaz; hash mismatch veya 404.
- **Component fonksiyonu içinde `useState` (destructured)** — bileşen dosyasında `React.useState` olmalı; `useState` tek başına tanımsızdır.

---

## İlgili Dokümanlar

- [AGENTS.md](../AGENTS.md) §3.1 — component pattern kuralı
- [docs/SW-VERSION-BUMP.md](SW-VERSION-BUMP.md) — versiyon bump
- [REFACTOR-GECMISI.md](../REFACTOR-GECMISI.md) Bölüm 36-40 — 5 bileşenin çıkarılma hikâyesi (referans örnekler)
