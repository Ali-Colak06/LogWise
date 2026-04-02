# GYM LOG — Proje Devir Özeti

## Proje Nedir?
Tek sayfalık (SPA) bir antrenman takip web uygulaması. Kullanıcı hareketlerini tanımlar, haftalık programlar oluşturur, takvim üzerinden günlere hareket ekler ve her set için ağırlık/tekrar/RIR kaydı tutar. Tüm veriler `localStorage`'da saklanır. Backend yoktur.

## Teknik Yapı
- **Tek HTML dosyası** (`index.html`) — React 18 + Babel (CDN'den yükleniyor), inline `<script type="text/babel">` bloğu içinde tüm uygulama kodu var.
- **Netlify deploy** için `netlify.toml` dosyası mevcut (SPA redirect, cache, güvenlik header'ları).
- Framework/build tool yok — dosyayı doğrudan tarayıcıda açabilir veya Netlify'a sürükle-bırak deploy edebilirsin.
- Font: Google Fonts'tan Roboto.
- localStorage key: `gym-log-v3` (data), `gym-log-theme` (tema).

## Tasarım
- **Google Calendar klonu** arayüz: üst bar (hamburger menü, logo, Bugün butonu, ileri/geri oklar, ay başlığı, görünüm seçici), sol sidebar (navigasyon, mini takvim, aktif program özeti), ana alan (takvim grid).
- **Gece/Gündüz modu** — CSS custom properties ile. Sağ üstte güneş/ay ikonu ile geçiş. Tema tercihi localStorage'da saklanır.
- **Kategori renkleri**: Göğüs=blue, Sırt=green, Omuz=orange, Kol=purple, Bacak=teal, Karın=red, Kardiyo=orange, Diğer=blue. Renkler hem takvim pill'lerinde hem hareket kartlarında sol border olarak kullanılıyor.
- Material Design ikonları (inline SVG), pill butonlar (border-radius: 20px), yuvarlak icon butonlar, hafif box-shadow'lar.

## Ana Özellikler

### 1. Takvim (Ay/Hafta görünümü)
- Aylık grid: 7 sütun, `gridAutoRows: 1fr` ile eşit yükseklikte hücreler. Bugün mavi daire. Hareketler renkli pill olarak gösteriliyor.
- Haftalık grid: 7 gün yan yana, her günün hareketleri detaylı (ağırlık×tekrar) gösteriliyor.
- Bir güne tıklanınca "Gün Görünümü"ne geçiyor.

### 2. Gün Görünümü
- O gün eklenen hareketler kart olarak listelenir. Her kartta:
  - Set tablosu: SET | KG | TEKRAR | RIR | Sil butonu
  - "+ Set Ekle" butonu
  - Geçmiş (📊) ve Kaldır (✕) butonları
- Sağ altta mavi FAB butonu ile hareket ekleme modal'ı açılır.
- Eğer aktif bir program varsa ve o günün programında başlanmamış hareketler varsa, üstte mavi kutuda "+" butonlarıyla listelenir. Tıklanınca o günün antrenmanına eklenir.

### 3. Hareketler
- Kategorilere ayrılmış hareket listesi. Her hareketin: adı, kategorisi, son max ağırlığı, toplam kayıt sayısı görünür.
- Yeni hareket eklerken kategori seçimi pill butonlarla yapılır.
- Geçmiş (📊) ve Sil butonları var.

### 4. Programlar (Haftalık)
- Her program haftanın 7 gününe ayrı ayrı hareket atanmasını sağlar.
- Program oluşturma/düzenleme modal'ında: gün sekmeleri (Pzt-Paz), her gün için hareket seçimi (checkbox listesi), üzerinde seçili hareket sayısı badge'i.
- Bir program "Aktif Et" ile aktifleştirilir. Aktif program takvimde otomatik olarak ilgili günlerde görünür.
- Aynı anda sadece bir program aktif olabilir.

### 5. Hareket Geçmişi Modal
- Herhangi bir hareketin 📊 butonuna basınca açılır (hem Hareketler sekmesinden hem Gün Görünümü'nden).
- Tüm kayıtlı günler ters kronolojik sırayla listelenir: tarih, max ağırlık, hacim, her setin detayı (ağırlık×tekrar + RIR).
- PR (personal record) sağ üstte gösterilir.

### 6. RIR (Reps in Reserve)
- Her set için dropdown: "—" (yok), "Failure" (0), "RIR 1", "RIR 2", "RIR 3", "RIR 4+".
- Geçmiş kayıtlarda RIR bilgisi parantez içinde gösterilir.

## Bilinen Teknik Detaylar ve Çözülmüş Sorunlar

### Stale Closure Sorunu (ÖNEMLİ)
React'te `useCallback` veya event handler'lar içinde state değerlerinin eski (stale) kalması sorunu yaşandı. Çözüm: Kritik state'ler için `useRef` kullanılıyor:
```
const dRef = useRef(data);       dRef.current = data;
const pnRef = useRef(pgName);    pnRef.current = pgName;
const pdRef = useRef(pgDays);    pdRef.current = pgDays;
const peRef = useRef(pgEditId);  peRef.current = pgEditId;
```
`savePg`, `togPgEx` ve diğer CRUD fonksiyonları bu ref'lerden okuyor. **Yeni state eklenirse ve bir callback içinde kullanılacaksa mutlaka ref pattern'i uygulanmalı.**

### Program Days Key Normalizasyonu
Program günleri objesinde key'ler string olmalı (`"0"`, `"1"`, ..., `"6"`). `savePg` fonksiyonunda `for(let i=0;i<7;i++){nd[String(i)]=[...]}` ile normalize ediliyor.

### localStorage
Tüm veri tek bir key'de (`gym-log-v3`) JSON olarak saklanıyor. Yapı:
```json
{
  "exercises": [{ "id": "timestamp", "name": "...", "category": "Göğüs" }],
  "workouts": {
    "2026-03-25": [
      { "exerciseId": "...", "sets": [{ "weight": 80, "reps": 8, "rir": "1" }] }
    ]
  },
  "programs": {
    "timestamp": {
      "name": "Push Pull Legs",
      "days": { "0": ["exId1","exId2"], "1": [], ... "6": [] }
    }
  },
  "activeProgram": "timestamp" | null
}
```

## Dosya Yapısı
```
site/
├── index.html      (41KB, tüm uygulama kodu)
└── netlify.toml    (SPA redirect + header config)
```

Netlify'a deploy etmek için bu iki dosyayı içeren klasörü Netlify dashboard'da "Deploy manually" ile yükle.

## Henüz Yapılmamış / Geliştirilebilecek Şeyler
- Veri export/import (JSON)
- Grafik/chart ile ilerleme takibi
- PWA desteği (offline çalışma, ana ekrana ekleme)
- Drag & drop ile set/hareket sıralama
- Antrenman süresi takibi (timer)
- Responsive iyileştirmeleri (mobilde sidebar otomatik kapanıyor ama detay geliştirilebilir)
