# LOG WISE - Workout Tracker: Devam Promptu

Bu promptu yeni bir Claude sohbetine yapıştırarak kaldığımız yerden devam edebilirsin.

---

## PROJE HAKKINDA

**LOG WISE** bir antrenman takip web uygulamasıdır. Netlify'da deploy edilmiş, tek HTML dosyasından oluşan bir React uygulaması.

- **Canlı URL**: https://incomparable-starburst-f7802c.netlify.app/
- **Teknoloji**: React 18 + Babel Standalone (tarayıcıda JSX derleme), Supabase (auth + veritabanı)
- **Ana dosya**: `index.html` (~694 satır, tüm CSS/JS/React inline)
- **Diğer dosyalar**: `supabase_setup.sql` (tablo şemaları), `netlify.toml` (deploy ayarları)

## TEKNİK MİMARİ

### Supabase
- **URL**: `https://czbxujioufhmvoajqwzp.supabase.co`
- **Tablolar**: `user_data` (JSONB blob, kullanıcı başına), `feedback` (ayrı satırlar)
- **RLS** (Row Level Security) aktif
- Auth: email/password

### Veri Yapısı
```json
{
  "exercises": [{"id":"...", "name":"...", "category":"Göğüs"}],
  "workouts": {"2026-03-26": [{"exerciseId":"...", "sets":[{"weight":50,"reps":10,"rir":"2"}]}]},
  "programs": {"id": {"name":"PPL", "days":{"0":["exId1"],"1":["exId2"],...}}},
  "activeProgram": "programId" | null,
  "durations": {"2026-03-26": [1800, 600]}  // timer kayıtları (saniye cinsinden dizi)
}
```

### Kayıt Stratejisi
- `save(newData)` → Giriş yapılmışsa Supabase'e upsert, misafirse localStorage'a yazar
- `localUpdate(newData)` → Sadece React state günceller (gün görünümünde CRUD işlemleri için)
- Gün görünümündeki değişiklikler (set ekle/sil, hareket ekle/sil) `localUpdate` kullanır
- Açık "Kaydet" butonuna basınca `save()` çağrılır

### Tema & Dil
- Dark/Light tema (CSS custom properties)
- TR/EN dil desteği (`TR` ve `EN` constant objeleri, ~70+ anahtar)
- `lang` state: "tr" veya "en", localStorage'da saklanır

### Timer
- `sessionStorage` ile persist (tab kapatınca sıfırlanır, app-switching'de kalır)
- Birden fazla kayıt/gün desteklenir (`durations` dizisi)
- Sidebar'da start/stop/reset/save butonları
- Gün görünümünde toplam + detaylar gösterilir

### Kategoriler ve Renkleri
```js
const CATS=["Göğüs","Sırt","Omuz","Biceps","Triceps","Bacak","Karın","Kardiyo","Diğer"];
const CC={"Göğüs":"blue","Sırt":"ngreen","Omuz":"orange","Biceps":"purple","Triceps":"pink","Bacak":"teal","Karın":"red","Kardiyo":"sky","Diğer":"green"};
```

### Misafir (Guest) Modu — EN SON EKLENEN
- Siteye giriş yapmadan kullanılabilir
- `Root` bileşeni her zaman `<App>` render eder (AuthScreen engellemez)
- `AuthScreen` modal overlay olarak açılır (kullanıcı isterse giriş/kayıt yapar)
- `isGuest = !user` — user null ise misafir
- Misafir verisi localStorage'da saklanır (`gym-log-v3` anahtarı)
- Ekranın altında sabit uyarı banner'ı: "Giriş yapmadan verileriniz sadece bu cihazda saklanır"
- Sidebar alt kısım: misafir ise "Giriş Yap/Kayıt Ol" butonu, giriş yapılmışsa profil + çıkış
- Feedback gönderme misafir modda engelli (toast uyarısı gösterir)

## MEVCUT DOSYA YAPISI (ÖNEMLİ SATIRLAR)

- **Satır 1-62**: HTML head, CSS (değişkenler, animasyonlar, dark/light tema)
- **Satır 66-82**: Supabase client, React hooks, sabitler (CATS, CC, RIRS), yardımcı fonksiyonlar, init()
- **Satır 83-84**: TR ve EN çeviri objeleri
- **Satır 86-124**: `AuthScreen` bileşeni (modal overlay, onClose prop'lu)
- **Satır 126-641**: `App` bileşeni (ana uygulama)
  - 126-127: Props (`user,setUser,lang,setLang,showAuth`), `isGuest=!user`
  - 155: Feedback yükleme (isGuest guard'lı)
  - 157-180: Timer state ve fonksiyonları
  - 182: `logout` (isGuest guard'lı)
  - 183: `saveFeedback` (isGuest guard'lı)
  - 189-202: Data loading (guest→localStorage, user→Supabase)
  - 204: `save()` (guest→localStorage, user→Supabase upsert)
  - 205: `localUpdate()` (sadece state)
  - 207-223: CRUD fonksiyonları (exercise, day, program)
  - 240: `Pill` bileşeni (renkli hareket etiketi)
  - 242-262: `MiniCal` bileşeni (sidebar mini takvim)
  - 264-275: SVG icon bileşenleri
  - 277-640: JSX return (header, sidebar, main content, modals)
  - 331-340: Sidebar alt kısım (guest/user koşullu)
  - 639: Guest uyarı banner'ı
- **Satır 643-664**: `S` style objesi
- **Satır 666-689**: `Root` bileşeni (showAuth state, her zaman App render, AuthScreen modal)
- **Satır 691**: ReactDOM.createRoot render
- **Satır 692-694**: Kapanış etiketleri

## GEÇMİŞTE YAPILAN DÜZELTMELER

1. **Dosya kesinti (2 kez)**: Root fonksiyonu ve kapanış etiketleri Edit işlemlerinde kesildi → beyaz ekran. Eksik satırlar eklenerek düzeltildi.
2. **Babel SyntaxError (satır 555)**: Dosya kesintisinden kaynaklı. Eksik JSX eklenerek düzeltildi.
3. **feedbackCat çeviri anahtarı eksik**: TR/EN'e eklendi.
4. **pri buton renk sorunu**: `color:"#fff"` → `color:"var(--accentT)"`
5. **savePg localStorage kullanıyordu**: `save(out)` ile değiştirildi.
6. **Form geçiş hatası**: `setErr("")` eklendi.
7. **Session persistence**: `onAuthStateChange` + `getSession()` fallback, `ready` flag ile race condition önlendi.

## ÖNEMLİ KURALLAR

1. **Değişiklikleri Chrome'da test etmeye çalışma** — Claude in Chrome eklentisi ile siteyi açıp kontrol etme.
2. **Tek dosya uygulaması** — Tüm CSS, JS, React tek `index.html` içinde.
3. **Babel standalone** — `<script type="text/babel">` kullanılıyor, build step yok.
4. **Edit dikkatli yapılmalı** — Dosya kesintisi beyaz ekrana sebep olur. Her edit sonrası dosyanın bütünlüğünü kontrol et.

## DEPLOY

Netlify'da otomatik deploy. `index.html` dosyasını güncelledikten sonra git push yeterli.
- `netlify.toml`: `publish = "."`, `/*` → `/index.html` redirect, güvenlik header'ları

---

**Bu promptu yeni sohbete yapıştırdıktan sonra, yapmak istediğin değişikliği veya eklemek istediğin özelliği yaz.**
