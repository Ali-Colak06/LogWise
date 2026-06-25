# Sonraki seansa devir notu

> Bu dosya geçicidir — sonraki AI seansını başlatırken kullanıcı bu metni prompt olarak yapıştırır.
> Seans başladıktan sonra silinebilir veya `next-session-prompt.md` olarak tutulabilir.

---

## Sonraki seansa açılış prompt'u (kopyala-yapıştır)

```
Merhaba. LogWise mobil uygulamasını geliştirme sürecini önceki bir
seansta devam ettirdik. Şu noktada bıraktık:

Önce şu dosyaları sırayla oku — bağlam bunlarda:
1. AGENTS.md (proje sözleşmesi, SON GÜNCELLEME 2026-05-20)
2. docs/mobile-design-system/03-mvp-decisions.md (mobil kararların tek
   kaynağı, rev 11)
3. docs/mobile-design-system/04-user-journeys.md (5 kullanıcı yolculuğu)
4. docs/mobile-design-system/05-screen-specs.md (implementation-ready
   ekran spec'leri, rev 1 — A1-A5 + B1 yazılı)

Şu ana kadar tamamlanan adımlar:
- Proje analizi (web app, schema, prototipler)
- MVP karar kaydı (03)
- MVP screen listesi
- 5 kullanıcı yolculuğunun tam haritası (04)
- Grup A (UX/şema açık soruları) → kapatıldı
- Grup B (5 görsel detay sorusu) → kapatıldı (rev 11)
- Grup C (stack ve mimari) → kapatıldı (rev 9)
- Grup D (operasyonel) → kapatıldı (rev 10)
- Ekran spec dosyası 05 oluşturuldu, A1-A5 + B1 yazıldı:
  - A1 Launch (Splash)
  - A2 Welcome
  - A3 Login
  - A4 Register
  - A5 Forgot Password
  - B1 Calendar (Month/Week)
  Her ekran 9 standart bölümle: Niyet, Layout sketch, Component
  breakdown, State varyantları, Props (TS interface), Interaction
  notes, Edge cases, Prototip referansı, Açık sorular.

Açık olan tek karar grubu: Grup E (MVP sonrası — web senkron
seçeneği). Şimdi karar gerekmez.

Tam olarak burada kaldık:
Sıradaki adım, kullanıcı yolculuğu sırasında devam ederek diğer
ekranların spec'ini yazmak:
- C1 Day Detail (empty)
- C2 Day Detail (filled)
- C3 Day Detail (program day)
- C4 Add Exercise modal
- D1 Library — Exercises tab
- D2 Library — Programs tab
- E1 More panel
- F1 Dashboard placeholder
- F2 Social placeholder

Yapacakların:
1. Bağlam dosyalarını oku.
2. 05-screen-specs.md'nin sonundaki "Sıradaki seansta" bölümünü
   gör — ordan devam et.
3. İlk olarak C1-C4 (Day Detail + Add Exercise) blokuna ne kadar
   ilerleyeceğimizi sor (AskUserQuestion ile). Önerilen kapsam:
   tek seansta C1-C4 (4 ekran, hepsi birbiriyle yakın ilişkili).
4. Day-prototype klasörünü (day-prototype/index.html, styles.css,
   script.js) ve workout-prototype klasörünü (Add Exercise modal
   inspiration) referans al.
5. Her ekran için aynı 9 bölümlük şablonu kullan (A1-A5+B1 ile
   birebir tutarlı).
6. Yeni karar gerektiren noktaları "Açık sorular" altına yaz, ama
   kararı hemen alma — kullanıcıya seans sonunda topluca sor.
7. 05-screen-specs.md'yi güncelle (rev 2), AGENTS.md'nin SON
   GÜNCELLEME satırını yenile.
8. B1 spec'inde 6 açık soru var; eğer C1-C4 yazarken cevaplaması
   gereken noktalar çıkarsa, onları da topluca sor.

Hatırlatma: 03-mvp-decisions.md mobil kararların tek kaynağı.
Yeni bir karar verildiğinde önce o dosyayı güncelle.
```

---

## Bu seansta neler oldu (özet)

### Karar kaydı güncellemeleri
- **rev 10** — Grup D (operasyonel) kapatıldı: Sentry crash only, TypeScript+Jest unit, otomatik icon/splash, Library/Kütüphane sekme adı, snake_case AsyncStorage key.
- **rev 11** — Grup B (görsel detay) kapatıldı: preset preview always expanded, sıfırdan program direkt Edit, migration full-screen sade spinner, web welcome merkez dialog, toggle default işaretli.

### Yeni dosya
- `05-screen-specs.md` (rev 1, ~37KB) — A1-A5 auth + B1 Calendar için implementation-ready spec.

### Güncellenen dosyalar
- `AGENTS.md` — SON GÜNCELLEME 2026-05-20; §2 seans öncesi checklist'e 3. dosya (05-screen-specs) eklendi; §2 reçete tablosuna ekran spec satırı; §4 dosya yapısı haritası genişletildi.
- `03-mvp-decisions.md` — rev 9 → rev 11; §3.1 (Library sekme adı), §3.8 (preset preview), §3.9 (snake_case format), §3.9.1 (loading state UI), §3.10 (welcome modal stili + toggle default), §8.4.1 (yeni "sıfırdan program" akışı), §9 (Grup B+D kapatıldı), §10 (Operasyonel kararlar — yeni bölüm), değişiklik kaydı güncel.

### Açık sorular — sonraki seans için biriktirilenler
- **A1 splash:** Tagline gösterilsin mi? Version label nerede? (önerim: ikisi de yok / Settings'te)
- **A2 welcome:** Misafir confirm dialog gerekli mi? "Bilgi" linki olsun mu? (önerim: ikisi de yok)
- **A3 login:** "Remember me" gerekli mi? Web kullanıcısı modalı A3'te mi B1'de mi açılsın? (önerim: hayır / B1'de)
- **A4 register:** Migration RPC transaction atomic mi? Display name zorunlu mu? Şifre min length? (önerim: RPC ile atomic / zorunlu min 2 / min 8)
- **A5 forgot:** "Maile geç" butonu MVP'de mi? Resend countdown süresi? (önerim: var / 60sn)
- **B1 calendar:** Hint card sildikten sonra geri gelir mi? Avatar tap → bottom sheet mi route mu? WebWelcomeModal hardware back davranışı? Today pill her zaman görünür mü? Month'ta swipe ile ay değiştirme MVP'de mi? Week feed initial render hafta sayısı? (önerimler spec'te)

**Toplam: ~17 açık soru.** Bunları sonraki seans başında veya C1-C4 yazıldıktan sonra topluca AskUserQuestion ile sun.

### Git durumu
- Bu seansta dokunulan dosyalar:
  - `AGENTS.md` (M — modified)
  - `docs/mobile-design-system/03-mvp-decisions.md` (?? — untracked)
  - `docs/mobile-design-system/04-user-journeys.md` (?? — untracked, bu seansta dokunulmadı)
  - `docs/mobile-design-system/05-screen-specs.md` (?? — untracked, bu seansta yazıldı)
- Repo'da bu seansla ilgisi olmayan çok sayıda başka değişiklik de var. Commit kararı kullanıcıya bırakıldı.

### Tutarlılık doğrulaması
- AGENTS.md ve 03-mvp-decisions.md tarih + rev senkron.
- 04-user-journeys.md rev 7 ve 2026-05-19; bu seansta dokunulmadı, akışlar değişmedi → güncel.
- 05-screen-specs.md'deki tüm component referansları 02-mobile-design-system-proposal.md ile uyumlu (AppButton, AppInput, AppScreen, BottomTabBar, CalendarDay vs.).
- 05'teki tüm karar referansları (§3.5, §3.8, §3.10, §10.5 gibi) gerçekten 03'te o noktalarda mevcut.
