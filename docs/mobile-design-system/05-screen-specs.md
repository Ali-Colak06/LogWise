# LogWise Mobile MVP — Ekran Spec'leri

> Bu dosya MVP'deki her ekranın implementation-ready spec'idir.
> Her ekran için: layout sketch + component breakdown + state varyantları + props (TS interface) + interaction notes + edge cases + prototip referansı + açık sorular.
> Tasarım kararlarının kaynağı: `03-mvp-decisions.md`. Akış kaynağı: `04-user-journeys.md`. Token/component referansı: `02-mobile-design-system-proposal.md`.

Son güncelleme: 2026-05-25 (rev 6 — E1 More panel + F1 Dashboard placeholder + F2 Social placeholder eklendi; MVP screen listesi tamamlandı — 15 ekran; E1 disabled-placeholder satır kararı, F1+F2 PlaceholderScreen ortak component kararı yazıldı)

---

## İçindekiler

- **Auth grubu**
  - [A1 Launch (Splash)](#a1-launch-splash)
  - [A2 Welcome](#a2-welcome)
  - [A3 Login](#a3-login)
  - [A4 Register](#a4-register)
  - [A5 Forgot Password](#a5-forgot-password)
- **Calendar grubu**
  - [B1 Calendar (Month/Week)](#b1-calendar-monthweek)
- **Day Detail grubu**
  - [C1 Day Detail (empty)](#c1-day-detail-empty)
  - [C2 Day Detail (filled)](#c2-day-detail-filled)
  - [C3 Day Detail (program day)](#c3-day-detail-program-day)
  - [C4 Add Exercise modal](#c4-add-exercise-modal)
- **Library grubu**
  - [D1 Library — Exercises tab](#d1-library--exercises-tab)
  - [D2 Library — Programs tab](#d2-library--programs-tab)
  - [D3 Program Edit](#d3-program-edit)
- **More grubu**
  - [E1 More panel](#e1-more-panel)
- **Placeholder grubu**
  - [F1 Dashboard placeholder](#f1-dashboard-placeholder)
  - [F2 Social placeholder](#f2-social-placeholder)

---

## Şablon konvansiyonları

Her ekran spec'i şu yapıda:

1. **Niyet & yolculuk konteksti** — Bu ekran hangi yolculukta nerede? Kullanıcının niyeti ne?
2. **Layout sketch** — ASCII / markdown ile sayfanın iskeleti. Üstten alta blok blok.
3. **Component breakdown** — Bu ekranı oluşturan tüm reusable + screen-specific component'ler. Hangi klasörde (`components/ui/`, `components/calendar/` vs.) yaşadığı belirtilir.
4. **State varyantları** — Bu ekran hangi state'lere girer (loading, empty, error, filled, disabled vb.) ve her birinde ne değişir.
5. **Props / TypeScript interface** — Ekran ana component'inin ve önemli alt component'lerin TS imzaları.
6. **Interaction notes** — Etkileşim detayları: focus akışı, klavye davranışı, dismiss, animasyon, haptic.
7. **Edge cases** — Beklenmedik durumlar (network, çok uzun string, RTL, accessibility, vs.).
8. **Prototip referansı** — Hangi prototipten ne kadar bire bir alındı, neresi farklı.
9. **Açık sorular** — Hala karar gerekli noktalar.

**Yol notları (path, file naming):**
- Route dosyaları: `app/(auth)/welcome.tsx`, `app/(app)/calendar/index.tsx` gibi (Expo Router).
- Screen-level component'i route dosyasının kendisi `export default` ile verir. Reusable parçalar `components/` altına çıkar.
- TS interface'leri ya component dosyasında, ya `types/domain.ts`'te (paylaşılan domain tipi ise).

---

## A1 Launch (Splash)

### Niyet & yolculuk konteksti
App icon'a basıldığı an ile authenticated route'a (Calendar) ya da auth route'a (Welcome) yönlendirme arasındaki **geçiş ekranı**. Asıl iş bekleme: Supabase session kontrolü + font yükleme + AsyncStorage'dan tercih okuma. Tüm yolculukların **giriş noktası** (Yeni, Tekrar açan, Program takipli, Misafir, Web'den gelen).

### Layout sketch

```
┌─────────────────────────────┐
│                             │
│                             │
│                             │
│           [logo]            │  ← BrandMark, 96×96, gold accent
│                             │
│         LOG WISE            │  ← wordmark, Space Grotesk 24, letter-spacing 0.18em
│                             │
│                             │
│        ▁▁▁▁▁▁▁▁▁▁           │  ← ince loading bar (gold), 120pt genişlik, infinite shimmer
│                             │
└─────────────────────────────┘
   bg: #0a0a0a (--bg-app)
```

- Status bar transparan, light content (dark splash).
- Logo + wordmark dikey ortalanmış, ekranın yaklaşık %45 yüksekliğinde.
- Loading bar logodan ~80pt aşağıda, ince (3pt), animated shimmer.

### Component breakdown

| Component | Konum | Görevi |
|---|---|---|
| `app/_layout.tsx` | Expo Router root | Splash mantığı burada: `expo-splash-screen` keep, font load, session check, sonra `SplashScreen.hideAsync()`. |
| `BrandMark` | `components/shared/BrandMark.tsx` | Logo SVG render. Web'deki `components/brand-mark.js` portu. |
| `LoadingBar` | `components/ui/LoadingBar.tsx` | Indeterminate shimmer animasyonu. `react-native-reanimated` shared value ile. |
| (native splash) | `app.json` → splash | `expo-splash-screen` plugin'i — siyah bg + ortalanmış logo. **JS yüklenene kadar bu görünür.** Sonra `_layout.tsx`'in render ettiği aynı tasarım devralır — hiç flash olmaz. |

### State varyantları

| State | Tetik | Görünüm |
|---|---|---|
| `initializing` (default) | App açıldı, fontlar yükleniyor | Logo + wordmark + loading bar shimmer |
| `session-check` | Fontlar yüklendi, AsyncStorage + Supabase session check | Aynı görünüm, sadece içeride iş |
| `navigating-auth` | Session yok → A2 Welcome'a redirect | Fade out (200ms) sonra navigate |
| `navigating-app` | Session var → B1 Calendar'a redirect | Aynı fade out |
| `error` (rare) | Init sırasında catch'lemeyen exception | Logo görünür kalır, alt metin: "Bir şeyler ters gitti. Yeniden dene." + retry button. Sentry'ye event gönderilir. |

### Props / TS interface

`A1 Launch`'un kendi route component'i **yok** — `app/_layout.tsx` içinde mantık. Yine de yardımcı tipler:

```ts
// app/_layout.tsx (excerpt)
type SessionResolution =
  | { status: 'authenticated'; userId: string }
  | { status: 'guest'; hasGuestData: boolean }
  | { status: 'anonymous' };  // hiç login olmamış, guest mode da seçmemiş

interface BootstrapResult {
  fontsLoaded: boolean;
  session: SessionResolution;
  locale: 'tr' | 'en';
  theme: 'dark' | 'light';
  durationMs: number;  // sentry breadcrumb için
}
```

```ts
// components/ui/LoadingBar.tsx
interface LoadingBarProps {
  width?: number;         // default 120
  color?: string;         // default token --accent
  durationMs?: number;    // shimmer cycle, default 1400
}
```

### Interaction notes

- **Animasyon:** Loading bar shimmer = soldan sağa kayan gold highlight, infinite. `react-native-reanimated` `withRepeat(withTiming(...))`.
- **Min süre:** En az **600ms** splash göster — fontlar 100ms'de yüklenirse bile. Daha kısa flash kötü hisseder. Eğer init >2sn sürerse splash uzar; kullanıcı bekler.
- **Native splash devri:** `expo-splash-screen` plugin native splash'i tutar, JS bundle yüklendikten ve fontlar hazır olduktan sonra `SplashScreen.hideAsync()` ile bırakır. JS-side splash component'i aynı görseli render eder → kullanıcı geçişi fark etmez.
- **Haptic:** Yok.
- **Back button (Android):** Yok (splash'tan back = app çıkış, default Android davranışı).

### Edge cases

- **Çok yavaş cihaz:** Init 5sn+ sürerse splash'ta görünür değişiklik olmaz. Sentry breadcrumb: `bootstrap.duration_ms` log'la, p95 izle.
- **Font yükleme hatası:** Fallback olarak system font kullan; warn breadcrumb. Asla blocking error gösterme — kullanıcı erişebilsin.
- **Supabase network down:** 3sn timeout → `anonymous` state gibi davran (A2 Welcome'a yönlendir). Login denediğinde gerçek hatayı orada görür.
- **Migration in progress (gelecek):** AsyncStorage schema migration gerekirse splash uzar — şimdi MVP'de yok.
- **Dark mode disable (user pref light):** Splash hala siyah bg + gold logo (marka kimliği). Tema toggle uygulamayı sonra etkiler.

### Prototip referansı

- **Doğrudan prototip yok.** `auth-prototype/index.html`'in başında brand mark + wordmark var ama splash ayrı bir ekran değil.
- Görsel kaynak: web'deki `components/brand-mark.js` + `Site_Logo180.svg`. Logo siyah arka planda gold accent → splash için aynen.
- §3.6 (auto-login aktif) ve §10.3 (splash siyah bg + ortalanmış logo) doğrultusunda.

### Açık sorular

- **Tagline splash'ta gösterilsin mi?** "Train smart. Log smarter." gibi bir alt metin marka tonu güçlendirir, ama splash sade olmalı. **Önerim: yok**, sade brand mark + wordmark. (Karar gerekli.)
- **Brand version pin:** Splash'ın altına version label (`v0.1.0`) konacak mı, yoksa Settings'e mi? **Önerim: Settings → About'ta**, splash tamamen marka.

---

## A2 Welcome

### Niyet & yolculuk konteksti
Anonim kullanıcının ilk gerçek temas noktası. Üç yola ayrılır:
- **Yeni kullanıcı** → "Hesap Oluştur" → A4 Register
- **Tekrar açan kullanıcı (logout sonrası)** → "Giriş Yap" → A3 Login
- **Misafir** → "Misafir Olarak Devam Et" → B1 Calendar (guest mode)

§3.6 + §3.9 kararları doğrultusunda. Splash'tan session yoksa buraya gelir.

### Layout sketch

```
┌─────────────────────────────┐
│  [status bar]               │
│                       EN TR │  ← üst sağ, lang pill (segmented)
│                             │
│                             │
│           [logo]            │  ← BrandMark 80×80
│         LOG WISE            │  ← wordmark
│  Train smart. Log smarter.  │  ← tagline, t-secondary
│                             │
│                             │
│  ┌─────────────────────┐    │
│  │  Hesap Oluştur      │    │  ← primary CTA (gold), tam genişlik
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │  Giriş Yap          │    │  ← secondary (ghost border), tam genişlik
│  └─────────────────────┘    │
│                             │
│   Misafir Olarak Devam Et   │  ← tertiary text-only link
│                             │
│  Misafir verisi yalnızca    │  ← küçük not, t-tertiary
│  bu cihazda saklanır.       │
│                             │
└─────────────────────────────┘
```

### Component breakdown

| Component | Konum | Görevi |
|---|---|---|
| `app/(auth)/welcome.tsx` | route | Ekran component'i |
| `AppScreen` | `components/ui/AppScreen.tsx` | SafeAreaView + bg + scroll wrapper |
| `BrandMark` | `components/shared/BrandMark.tsx` | Logo |
| `Wordmark` | `components/shared/Wordmark.tsx` | "LOG WISE" Space Grotesk text. Splash + Welcome + Auth ekranlarında ortak. |
| `LangPill` | `components/ui/LangPill.tsx` | EN/TR segmented toggle. `usePreferencesStore` ile bağlı. |
| `AppButton` | `components/ui/AppButton.tsx` | 3 variant: `primary` (gold), `secondary` (ghost), `tertiary` (text-only) |

### State varyantları

| State | Tetik | Görünüm |
|---|---|---|
| `default` | İlk render | Yukarıdaki layout |
| `language-switching` | Lang pill tap | Anında re-render (i18n key resolve değişir). Hafif fade transition opsiyonel. |
| `guest-confirming` | "Misafir Devam Et" tap | Confirm dialog (Native Alert) "Hesap açmadan başla? İstediğin zaman hesap açıp verini taşıyabilirsin." [İptal] [Devam Et]. **Bu opsiyonel**, MVP'de skipped olabilir → direkt B1'e. (Bkz. açık sorular.) |

### Props / TS interface

```ts
// app/(auth)/welcome.tsx
export default function WelcomeScreen() {
  // no props — route component
}

// components/ui/LangPill.tsx
interface LangPillProps {
  value: 'tr' | 'en';
  onChange: (lang: 'tr' | 'en') => void;
  variant?: 'compact' | 'standard';  // welcome'da standard, auth header'da compact
}

// components/ui/AppButton.tsx (çok yerde kullanılacak — burada tam interface)
interface AppButtonProps {
  variant: 'primary' | 'secondary' | 'tertiary' | 'danger';
  size?: 'sm' | 'md' | 'lg';  // default 'md'
  fullWidth?: boolean;          // welcome'da true
  loading?: boolean;            // spinner içeride
  disabled?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  onPress: () => void;
  children: React.ReactNode;    // label
  testID?: string;
}
```

### Interaction notes

- **Lang pill:** Tap = anında dil değişir, AsyncStorage'a yazar (`@logwise/guest/profile` veya `preferences-store`). Visual feedback: pressed seg gold fill.
- **CTA tap haptic:** Primary butona basınca `Haptics.impactAsync(ImpactFeedbackStyle.Light)`.
- **Buton spacing:** Primary ve secondary arasında 12pt, tertiary üstünde 20pt.
- **Loading state:** "Hesap Oluştur"a basınca navigation neredeyse anında — loading state yok.

### Edge cases

- **Önceki seansta misafir veri var (logout sonrası):** Welcome'a düştüğünde AsyncStorage'da guest data hala olabilir. "Misafir Devam Et" → mevcut guest verisi kalır (silinmez). Bu kasıtlı — kullanıcı misafir olarak devam edebilir.
- **Cihaz dili Türkçe değil:** Default EN, ama lang pill ile değiştirilebilir.
- **Çok küçük ekran (iPhone SE 1):** Tagline tek satıra sığmazsa wrap. Buton stack'i scroll'a izin verir.
- **Voiceover/TalkBack:** Her CTA'nın `accessibilityLabel`'i var, mantıklı tab order: Lang → CTA'lar yukarıdan aşağı.

### Prototip referansı

- **Doğrudan prototip yok** — auth-prototype 4 ekran içeriyor (Login, Register, Forgot, Verify) ama Welcome yok.
- Görsel kaynak: `auth-prototype/styles.css`'deki brand block (logo + wordmark + subhead) + `homepage-prototype-v2`'nin marka dili (siyah arka plan + gold logo + minimalist hierarchy).
- Buton stili `auth-prototype`'taki `.cta` ve `.swap-row` link kombinasyonundan türetilir.

### Açık sorular

- **Tagline final metni:** "Train smart. Log smarter." önerisi — onay/değişiklik?
- **Misafir confirm dialog gerekli mi?** §3.9'da yok, ama veri kaybı endişesi için bir uyarı katmanı eklenebilir. **Önerim: yok**, küçük not metni yeterli.
- **Welcome'da "Bilgi" linki olsun mu?** ("LogWise nedir?" gibi onboarding'e açılan bir tertiary link.) **Önerim: yok**, MVP sade kalsın.

---

## A3 Login

### Niyet & yolculuk konteksti
Mevcut hesabı olan kullanıcı (web'den gelen veya logout sonrası). Email + şifre ile giriş yapar. Başarı → B1 Calendar. Web kullanıcısı ise § 3.10 Hoş geldin modal'ı görür.

### Layout sketch

```
┌─────────────────────────────┐
│  [status bar]               │
│  ✕                    EN TR │  ← back/close + lang pill
│                             │
│         [logo 64×64]        │
│         LOG WISE            │
│       Sign in to continue   │  ← subhead, t-secondary
│                             │
│  ┌─────────────────────┐    │
│  │ 📧  alex@logwise.fit│    │  ← AppInput, email tip
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ 🔒  ••••••••••   👁 │    │  ← AppInput, password + reveal
│  └─────────────────────┘    │
│                             │
│              Forgot password?│  ← link, sağa hizalı
│                             │
│  ┌─────────────────────┐    │
│  │     Sign in         │    │  ← primary CTA gold
│  └─────────────────────┘    │
│                             │
│  Don't have an account? Sign up│  ← swap row, link
│                             │
│  By continuing you agree to ...│  ← legal, t-tertiary, küçük
│                             │
└─────────────────────────────┘
```

> **Google login butonu MVP'de YOK** — auth-prototype'ta var ama §5'te "Google OAuth MVP dışı". Spec'te ve UI'da gösterilmez.

### Component breakdown

| Component | Konum | Görevi |
|---|---|---|
| `app/(auth)/login.tsx` | route | Ekran component'i |
| `AppScreen` | `components/ui/AppScreen.tsx` | |
| `AuthHeader` | `components/shared/AuthHeader.tsx` | Close/back + lang pill — A3/A4/A5'te ortak |
| `AuthBrand` | `components/shared/AuthBrand.tsx` | Logo + wordmark + subhead — A3/A4/A5'te ortak |
| `AppInput` | `components/ui/AppInput.tsx` | Icon prefix + input + optional suffix action (reveal) |
| `AppButton` | `components/ui/AppButton.tsx` | Primary CTA |
| `Link` | `components/ui/Link.tsx` | Inline text link (gold), tap target uygun |

### State varyantları

| State | Tetik | Görünüm |
|---|---|---|
| `idle` | İlk render | Form boş veya autofill |
| `validating` | Submit basıldı, client-side validation | CTA disable, spinner |
| `submitting` | Validation geçti, Supabase'e gidiyor | CTA spinner + label "Giriş yapılıyor..." |
| `error-invalid-credentials` | Supabase 401 | Form altında error banner: "Email veya şifre yanlış." Email/password field'lar resetlemez. CTA aktif. |
| `error-network` | Network fail | Banner: "Bağlantı sorunu. Tekrar dene." |
| `error-rate-limit` | Çok fazla deneme | Banner: "Çok fazla deneme. Birkaç dakika bekle." |
| `success` | Supabase ok → 200ms transition → navigate | CTA spinner + ✓ → fade |

### Props / TS interface

```ts
// app/(auth)/login.tsx
export default function LoginScreen() {
  // no props
}

// components/ui/AppInput.tsx
interface AppInputProps {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  iconLeft?: React.ReactNode;
  actionRight?: React.ReactNode;  // örn reveal button
  error?: string;                  // error message render edilir
  autoComplete?: string;           // RN textContentType
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
  returnKeyType?: 'next' | 'done' | 'go';
  testID?: string;
}

// components/shared/AuthHeader.tsx
interface AuthHeaderProps {
  onBack?: () => void;            // null ise close icon
  showLangPill?: boolean;         // default true
}

// components/shared/AuthBrand.tsx
interface AuthBrandProps {
  subhead?: string;               // "Sign in to continue", "Create your account" vs.
  logoSize?: number;              // default 64
}
```

### Interaction notes

- **Klavye:** Email field autoFocus = false (kullanıcıya zaman ver), `keyboardType="email-address"`, `returnKeyType="next"` → tap = password'a geç. Password `returnKeyType="go"` → submit.
- **Reveal toggle:** Göz icon tap = `secureTextEntry` flip. Visual: göz açık/kapalı icon.
- **Submit:** Form `onSubmit` veya CTA tap. CTA disable during submit.
- **Forgot password link:** Tap → A5 Forgot.
- **Sign up link (swap row):** Tap → A4 Register.
- **Haptic:** Submit success'te `Haptics.notificationAsync(NotificationFeedbackType.Success)`.
- **KeyboardAvoidingView:** iOS'ta `behavior="padding"`, Android'de default işler.

### Edge cases

- **Email autocapitalize off:** `autoCapitalize="none"`.
- **Email autocorrect off:** `autoCorrect={false}`.
- **Şifre paste:** İzinli (password manager'lar için kritik).
- **Web kullanıcısı login:** Login success'ten sonra `user_data` check (§3.10) → Welcome modal aç. Modal ilk render'da Calendar üzerinde dialog olarak görünür.
- **Token refresh fail (sonra session expire):** Login sayfasına otomatik geri at, banner: "Oturumun süresi doldu, tekrar gir."
- **Misafir veri varken login:** Login eden kullanıcının kendi `app_*` verisi yüklenir; AsyncStorage guest data **silinmez** ama dokunulmaz (logout sonrası "Misafir Devam Et" → veriye tekrar erişir). *(Bu davranış 04-user-journeys 4. yolculukla tutarlı — guest mode'a ayrı bir adımla "logout sonra misafir" durumu söz konusu olmaz; bu MVP edge case sayılabilir, dokümante edilebilir.)*

### Prototip referansı

- **auth-prototype/index.html → Section 1 (Login)**: doğrudan referans. Yapı bire bir.
- **Farklar (MVP):**
  - Google butonu yok (silinir).
  - "or" divider yok (Google olmadığı için).
  - Geri kalan layout (logo, subhead, email, password, forgot link, CTA, swap row, legal) aynen alınır.
- Token'lar: `--bg-app`, `--bg-elevated`, `--brd-subtle`, `--accent`, `--t-primary`, `--t-secondary` direkt eşleşir.

### Açık sorular

- **"Remember me" toggle olsun mu?** Supabase auto-refresh zaten aktif. Toggle yok. (Karar netleştirme — büyük olasılıkla **yok**, mevcut karar yeterli.)
- **Web kullanıcısı modal'ı login akışında mı yoksa Calendar yüklendikten sonra mı açılsın?** §3.10'da "ilk mobil login'inde" diyor — Calendar yüklendikten sonra (B1 mount sonrası) check yapılır, modal sonradan açılır. Bu seansta detayı B1 spec'inde yazıyorum.

---

## A4 Register

### Niyet & yolculuk konteksti
Yeni kullanıcı veya misafir kullanıcının hesap açtığı ekran. Email + şifre + display name. §3.3 (username yok), §3.6 (email confirmation kapalı), §3.9.1 (misafir → hesap migration modal akışı) kararları doğrultusunda. Başarı → B1 Calendar; misafir veri varsa → migration loading modal → B1.

### Layout sketch

```
┌─────────────────────────────┐
│  [status bar]               │
│  ←                    EN TR │  ← back + lang pill
│                             │
│         [logo 64×64]        │
│         LOG WISE            │
│       Create your account   │
│                             │
│  ┌─────────────────────┐    │
│  │ 👤  Adın             │    │  ← display name
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ 📧  Email            │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ 🔒  Şifre        👁  │    │
│  └─────────────────────┘    │
│                             │
│  Strength: ▓▓▓░ Güçlü       │  ← password strength meter
│                             │
│  ┌─────────────────────┐    │
│  │   Hesap Oluştur     │    │  ← primary CTA
│  └─────────────────────┘    │
│                             │
│  Zaten hesabın var mı? Giriş│  ← swap row
│                             │
│  By creating an account ... │
│                             │
└─────────────────────────────┘
```

> **MVP'de YOK:** Google OAuth butonu, "or" divider, username field (§3.3).

### Component breakdown

| Component | Konum | Görevi |
|---|---|---|
| `app/(auth)/register.tsx` | route | Ekran component'i + migration trigger |
| `AppScreen`, `AuthHeader`, `AuthBrand`, `AppInput`, `AppButton`, `Link` | (Login ile ortak) | |
| `PasswordStrengthMeter` | `components/ui/PasswordStrengthMeter.tsx` | 4 segment bar + label (Zayıf/Orta/Güçlü/Çok güçlü) |
| `MigrationModal` | `components/auth/MigrationModal.tsx` | Confirm modal — "Misafir verilerin hesabına aktarılacak. Devam?" (§3.9.1 adım 3) |
| `MigrationLoadingOverlay` | `components/auth/MigrationLoadingOverlay.tsx` | Full-screen overlay + spinner + tek satır metin (§3.9.1, B3 kararı) |

### State varyantları

| State | Tetik | Görünüm |
|---|---|---|
| `idle` | İlk render | Boş form |
| `validating` | Submit | Client-side: email format, şifre min 8 char, name min 2 char. Field-level error'lar `AppInput.error`'da. |
| `migration-confirm` | Submit + guest data var | `MigrationModal` açılır: "X egzersiz, Y antrenman bulundu. Hesabına aktaralım mı?" [İptal] [Devam Et] |
| `submitting` | Supabase signUp call | CTA spinner, form lock |
| `migrating` | signUp success + guest var → migration başlar | `MigrationLoadingOverlay`: tam ekran modal, spinner + "Verileriniz aktarılıyor..." |
| `success` | signUp + (varsa) migration ok | Toast: "Hoş geldin!" (+ migration başarılıysa "X egzersiz, Y antrenman aktarıldı") → navigate B1 |
| `error-email-taken` | Supabase 422 | Banner üst kısımda: "Bu email zaten kullanımda. Giriş yap." + giriş linki |
| `error-weak-password` | Supabase validation | Password field error |
| `error-network` | Network fail | Banner |
| `migration-failed` | signUp ok, migration error | Overlay'de error state + [Tekrar Dene] + [Atla, Hesap Aç]. Atlarsa hesap açılır ama guest data silinmez (manual export için kalır). §3.9.1 rollback. |

### Props / TS interface

```ts
// app/(auth)/register.tsx
export default function RegisterScreen() {}

// components/ui/PasswordStrengthMeter.tsx
type PasswordStrength = 'empty' | 'weak' | 'fair' | 'strong' | 'very-strong';

interface PasswordStrengthMeterProps {
  password: string;             // hesaplama internal — zxcvbn light port
  showLabel?: boolean;          // default true
}

// components/auth/MigrationModal.tsx
interface MigrationModalProps {
  visible: boolean;
  exerciseCount: number;
  workoutCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

// components/auth/MigrationLoadingOverlay.tsx
interface MigrationLoadingOverlayProps {
  visible: boolean;
  status: 'in-progress' | 'taking-long' | 'success' | 'error';
  errorMessage?: string;
  onRetry?: () => void;
  onSkip?: () => void;          // sadece error state'te
}
```

### Interaction notes

- **Klavye akışı:** Name → email → password (returnKeyType chain). Password'da "Done" → submit.
- **Password strength:** Live hesaplama (300ms debounce). zxcvbn-ts veya light heuristic.
- **Confirm dialog dismiss:** Modal backdrop tap = İptal. Hardware back = İptal.
- **Migration overlay dismiss:** Loading state'te **dismiss edilemez**. Hata state'te [Atla] basınca dismiss. Success'te 1sn göster → otomatik dismiss + toast.
- **Haptic:** Success → notification haptic.
- **AsyncStorage temizlik:** Migration başarılıysa `GUEST_KEYS.*` keys delete (§10.5). Başarısızsa dokunulmaz.

### Edge cases

- **Display name yerel karakterler (ÇÖŞŞĞÜ):** Encoding sorunsuz — UTF-8.
- **Email leading/trailing whitespace:** Trim before submit.
- **Şifre çok uzun (>72 char):** Supabase bcrypt limit 72. Form 72'de truncate **etme** — uyarı ver: "Şifre çok uzun (max 72)."
- **Password manager autofill:** İzinli (`autoComplete="new-password"`).
- **Migration kısmen başardı (yarısı yazıldı, network kesildi):** Şu an MVP'de transaction yok — rollback yok. **Bu açık bir risk**: bkz. açık sorular.
- **Email confirmation kapalı ama Supabase project setting yanlışsa:** Supabase'den `email_confirmed_at = null` user dönerse manual handle: "Email doğrulaması bekleniyor" banner + resend. **MVP'de bu durumun olmaması bekleniyor** (admin setting net).
- **Guest verisi varken farklı bir hesap email girilirse:** Migration yine yapılır — guest data **şu anki kullanıcıya** taşınır (hangi hesap olduğu fark etmez, "device-local data" konsepti). Bu kullanıcı bilinci — modal'da net olmalı.

### Prototip referansı

- **auth-prototype/index.html → Section 2 (Register)**: temel referans.
- **Farklar:**
  - Google butonu yok.
  - Username field yok.
  - Password strength meter prototipte var, korunuyor.
  - Geri kalan layout (logo, subhead, name, email, password+reveal, strength, CTA, swap row, legal) bire bir.

### Açık sorular

- **Migration transaction:** Şu an §3.9.1 "hata → rollback" diyor ama detay yok. Migration atomik mi (tek SQL transaction) yoksa best-effort (yarı yazılırsa kabullen) mi? **Önerim: Supabase RPC fonksiyonu içinde transaction — tüm tablo insert'leri tek RPC, fail = rollback otomatik.** (Karar gerekli; B grup spec'lerine girer.)
- **"Adın" zorunlu mu opsiyonel mi?** §3.3 username yok diyor, display name'den bahsetmiyor. **Önerim: zorunlu, min 2 char** — profil avatar'da initial olarak kullanılacak ("AC" gibi calendar-prototype'ta görünüyor).
- **Şifre min length politikası:** 8 mi 10 mu? Supabase default 6. **Önerim: min 8, max 72**.

---

## A5 Forgot Password

### Niyet & yolculuk konteksti
Şifresini unutmuş kullanıcı email girer, Supabase reset link gönderir. Mail içindeki link → deep link (later) veya web tarafında reset → kullanıcı app'e dönüp Login'le devam.

### Layout sketch

```
┌─────────────────────────────┐
│  [status bar]               │
│  ←                    EN TR │
│                             │
│         [logo 64×64]        │
│         LOG WISE            │
│                             │
│         [lock icon]         │  ← büyük gold lock icon
│                             │
│     Şifreni sıfırla         │  ← section-title (Space Grotesk 20)
│                             │
│ Hesabındaki email'i gir,    │  ← section-sub, t-secondary, center
│ sana sıfırlama linki        │
│ göndereceğiz.               │
│                             │
│  ┌─────────────────────┐    │
│  │ 📧  Email            │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │  Sıfırlama linki gönder →│    │  ← primary CTA + arrow icon
│  └─────────────────────┘    │
│                             │
│  ⓘ İpucu: Birkaç dakika     │  ← info block
│  içinde gelmezse spam       │
│  klasörünü kontrol et.      │
│                             │
│       ←  Girişe dön         │  ← back-link
│                             │
└─────────────────────────────┘
```

### Component breakdown

| Component | Konum | Görevi |
|---|---|---|
| `app/(auth)/forgot-password.tsx` | route | Ekran component'i |
| `AppScreen`, `AuthHeader`, `AuthBrand`, `AppInput`, `AppButton` | (ortak) | |
| `SectionHeader` | `components/ui/SectionHeader.tsx` | `<h2>` + `<p>` subtitle compound (Forgot + Verify ekranlarında ortak desen) |
| `LockIcon` | inline SVG | Büyük decorative icon, gold |
| `InfoBlock` | `components/ui/InfoBlock.tsx` | ⓘ icon + text — tip/note rendering |
| `BackLink` | `components/ui/BackLink.tsx` | Alt taraftaki "← Girişe dön" |

### State varyantları

| State | Tetik | Görünüm |
|---|---|---|
| `idle` | İlk render | Boş email field |
| `validating` | Submit | Email format check |
| `submitting` | Supabase resetPasswordForEmail çağrısı | CTA spinner |
| `success` | Mail gönderildi | Form alanı **kalkar**, yerine success state: ✓ icon + "Email yolladık. <kullanici@email.com>'a bak." + [Maile geç] (mail uygulamasını aç) + countdown "60sn sonra yeniden gönder" |
| `error-no-account` | Supabase mail gönderme — ama burada Supabase **email yok diye 404 dönmez**, security için her zaman 200 döner. Bu yüzden bu state UI'da gösterilmez. |
| `error-network` | Network fail | Banner |
| `error-rate-limit` | Çok fazla deneme | Banner: "Çok fazla istek. Birkaç dakika bekle." |
| `resend-pending` | Success state'te countdown | "Yeniden gönder (0:42)" — disabled |
| `resend-ready` | Countdown 0 | "Yeniden gönder" — aktif |

### Props / TS interface

```ts
// app/(auth)/forgot-password.tsx
export default function ForgotPasswordScreen() {}

// components/ui/SectionHeader.tsx
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';  // default center on auth
  icon?: React.ReactNode;     // büyük decorative icon (forgot lock, verify mail)
}

// components/ui/InfoBlock.tsx
interface InfoBlockProps {
  icon?: 'info' | 'warning' | 'tip';  // default 'info'
  children: React.ReactNode;
  variant?: 'subtle' | 'accent';      // default 'subtle'
}

// components/ui/BackLink.tsx
interface BackLinkProps {
  label: string;
  onPress: () => void;
}
```

### Interaction notes

- **Klavye:** Email field autoFocus = true (tek field, hızlı). `returnKeyType="go"` → submit.
- **Maile geç butonu:** `Linking.openURL('mailto:')` ile native mail uygulamasını aç. iOS'ta Mail, Android'de varsayılan client.
- **Countdown:** 60sn'lik timer. Visible counter, format `0:MM`. Bitince "Yeniden gönder" aktif olur.
- **Yeniden gönder:** Aynı submit akışı, countdown 60'a reset.
- **Back link:** Navigate back to A3 Login (veya router back).
- **Haptic:** Success → notification haptic.

### Edge cases

- **Aynı email'i tekrar tekrar dene:** Supabase rate limit (3 attempt/hour gibi). Backend dönüşüne göre UI'da rate-limit banner.
- **Reset link clicking on phone (deep link MVP'de yok):** Mail'deki link tarayıcıda Supabase reset page'i açar (web tarafı). Kullanıcı orada şifreyi değiştirir, sonra app'e döner ve A3 Login'le yeni şifresiyle girer. Deep link entegrasyonu MVP sonrası.
- **Email field paste:** İzinli.
- **iCloud Hide My Email kullanıyor:** Sorun yok — alias da bir email, Supabase ona gönderir.

### Prototip referansı

- **auth-prototype/index.html → Section 3 (Forgot)**: bire bir referans.
- Tek fark: success state prototipte yok (statik mockup) — implementation'da eklenmeli.
- Lock icon, section header, info block, back link patterni doğrudan port.

### Açık sorular

- **Success state'te "Maile geç" butonu MVP'de var mı?** Nice-to-have ama implementation kolay (`Linking.openURL`). **Önerim: var.**
- **Resend countdown süresi:** 60sn mi 120sn mi? Supabase default ne? **Önerim: 60sn**, daha uzunsa kullanıcı sıkılır.
- **Reset link deep link (MVP sonrası):** Şimdi web fallback yeterli. Karar zaten MVP sonrası, ama §3.10 web yönlendirme patterniyle örtüşür.

---

## B1 Calendar (Month/Week)

### Niyet & yolculuk konteksti
Auth'lu veya misafir tüm yolculukların ana ekranı. Bottom nav'in birinci sekmesi. **Default:** Month view + bugünün ayı. Yeni kullanıcı için hint kartı görünür; mevcut kullanıcı için dolu takvim. §3.5 + §3.5.1 + §3.5.2 + §3.8 kararları doğrultusunda.

### Layout sketch

**Month view (default):**

```
┌─────────────────────────────┐
│  [status bar]               │
│  [AC]   September      [≡][⊙ Today]│  ← app bar: avatar + ay/yıl + view switch + today pill
│         2026                │
│                             │
│  Sun Mon Tue Wed Thu Fri Sat│  ← weekday header (mini)
│  ───────────────────────    │
│  ┌───┬───┬───┬───┬───┬───┬───┐
│  │30 │31 │ 1 │ 2 │ 3 │ 4 │ 5 │
│  │   │ ●●│   │ ●│   │   │   │  ← chip indicator (max 2)
│  ├───┼───┼───┼───┼───┼───┼───┤
│  │ 6 │ 7 │ 8 │ 9 │10 │11 │12 │
│  │ ●●│   │   │ ●●│   │   │   │
│  ├───┼───┼───┼───┼───┼───┼───┤
│  │13 │14 │[15]│16│17│18│19 │  ← bugün gold border
│  │   │ ●●│   │   │   │   │   │
│  ├───┼───┼───┼───┼───┼───┼───┤
│  │ ...                     │
│  └─────────────────────────┘
│                             │
│ ┌─ (yeni kullanıcı ise) ──┐│
│ │ • İlk antrenmanını ekle  ││  ← hint kartı (sadece empty + new user)
│ │   [Bugünü Aç] [Program]  ││
│ └──────────────────────────┘│
│                             │
│ [Cal] [Lib] [Dash][Soc][More]│  ← bottom nav (5 öğe, Calendar aktif)
└─────────────────────────────┘
```

**Week view (alternatif):**

```
┌─────────────────────────────┐
│  [AC]  Sep 13 — Sep 19 [▦][⊙]│  ← app bar: avatar + hafta aralığı + view switch + today
│         Week 38 · 2026      │
│                             │
│  ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔     │  ← scroll feed başlar
│  Pzt 14 Eyl  • Push day      │  ← gün satırı, sol gün+tarih, sağ program kategori
│  ─ Bench Press · 4×8         │
│  ─ Incline DB · 3×10         │  ← egzersiz mini liste
│  ─ Cable Fly · 3×12          │
│                             │
│  Sal 15 Eyl  • (boş)         │
│                             │
│  Çrş 16 Eyl  • Pull day      │
│  ─ Lat Pulldown · 4×10       │
│  ...                        │
│                             │
│  [feed devamı + sonsuz scroll]
│                             │
│ [Cal] [Lib] [Dash][Soc][More]│
└─────────────────────────────┘
```

### Component breakdown

| Component | Konum | Görevi |
|---|---|---|
| `app/(app)/calendar/index.tsx` | route | Ekran component'i (Month + Week toggle state burada) |
| `AppScreen` | `components/ui/AppScreen.tsx` | |
| `CalendarAppBar` | `components/calendar/CalendarAppBar.tsx` | Avatar + title (ay/yıl veya hafta aralığı) + view switch icon + Today pill |
| `AvatarButton` | `components/ui/AvatarButton.tsx` | Display name initials (örn "AC") veya misafir "M" badge. Tap → E1 More'a açar (alt sheet). |
| `MonthGrid` | `components/calendar/MonthGrid.tsx` | 6 satır × 7 sütun grid. Render: `DayCell[]` |
| `DayCell` | `components/calendar/DayCell.tsx` | Tek hücre: gün rakamı + chip indicator(lar) + today border + muted/normal state |
| `CategoryChip` | `components/calendar/CategoryChip.tsx` | Mini dot/rect, kategori rengiyle (§3.5 max 2 per cell). Renkler `--cat-*` tokens. |
| `WeekFeed` | `components/calendar/WeekFeed.tsx` | Sonsuz scroll vertical feed, week-by-week. IntersectionObserver yerine RN'de `onViewableItemsChanged` ile app bar title sync. |
| `WeekDayRow` | `components/calendar/WeekDayRow.tsx` | Tek gün satırı (Pzt 14 Eyl + program day adı + egzersiz mini liste) |
| `HintCard` | `components/calendar/HintCard.tsx` | Yeni kullanıcı empty hint (§3.5: gold dot + başlık + 1 satır + 2 buton) |
| `PresetProgramModal` | `components/calendar/PresetProgramModal.tsx` | "Hazır Program Seç" modal (§3.8). HintCard'daki [Program] butonundan açılır. |
| `WebWelcomeModal` | `components/calendar/WebWelcomeModal.tsx` | Web kullanıcısı için tek seferlik dialog (§3.10 + B4 kararı: merkez dialog) |
| `BottomTabBar` | `components/ui/BottomTabBar.tsx` | 5 sekme. Expo Router `<Tabs>` ile sarılır; bu component özelleştirilmiş tab bar render'ı. |
| `TodayPill` | `components/calendar/TodayPill.tsx` | "Today" pill — current ay/hafta zaten görünmüyorsa öne çıkar, görünüyorsa subtle |

### State varyantları

| State | Tetik | Görünüm |
|---|---|---|
| `loading` | İlk mount, query running | Skeleton: grid hücreleri shimmer, app bar skeleton |
| `empty-new-user` | `app_workouts` count = 0 + ilk açılış | Grid boş hücrelerle render + HintCard altta görünür |
| `empty-no-active-program` | Workout var ama aktif program yok | Grid dolu, hint kartı yok |
| `populated` | Workout var (aktif program var/yok) | Tam render: chip'ler, today border, vs. |
| `loading-month` | Ay değişti, yeni ayın workout query'si fetching | Sadece chip'ler skeleton, yapı sabit |
| `error` | Query fail | Banner üstte: "Yükleme sorunu. [Tekrar dene]" |
| `web-welcome-pending` | Web kullanıcısı + `seen_web_welcome != true` | Calendar mount → query başarılı → modal açılır (overlay) |
| `view-month` / `view-week` | View switch toggle | İçerik component'i değişir, app bar title formatı değişir |
| `week-feed-scrolling` | Week view'da scroll | App bar title visible week'e göre sync olur (debounced) |

### Props / TS interface

```ts
// app/(app)/calendar/index.tsx
export default function CalendarScreen() {}

// components/calendar/CalendarAppBar.tsx
interface CalendarAppBarProps {
  viewMode: 'month' | 'week';
  currentLabel: string;        // "September" veya "Sep 13 — Sep 19"
  subLabel?: string;           // "2026" veya "Week 38 · 2026"
  onAvatarPress: () => void;
  onViewSwitchPress: () => void;
  onTodayPress: () => void;
  todayPillVariant: 'subtle' | 'prominent';  // bugün görünüyor mu?
}

// components/calendar/MonthGrid.tsx
interface MonthGridProps {
  monthDate: Date;             // ayın herhangi bir günü
  workoutsByDate: Map<string, DayWorkoutSummary>;  // key: 'YYYY-MM-DD'
  activeProgram?: ProgramSummary;
  onDayPress: (date: Date) => void;
  todayISO: string;            // 'YYYY-MM-DD' bugün
  locale: 'tr' | 'en';
}

interface DayWorkoutSummary {
  categories: CategoryKey[];   // ['chest','triceps'] — max 2 chip
  hasMore: boolean;            // 3+ kategori varsa overflow indicator
  workoutCount: number;
}

// components/calendar/DayCell.tsx
interface DayCellProps {
  date: Date;
  isCurrentMonth: boolean;     // false ise muted (önceki/sonraki ay)
  isToday: boolean;            // gold border
  summary?: DayWorkoutSummary; // undefined = boş gün
  onPress: () => void;
}

// components/calendar/CategoryChip.tsx
interface CategoryChipProps {
  category: CategoryKey;
  size?: 'mini' | 'normal';    // mini = grid chip, normal = legend
}

type CategoryKey = 'chest'|'back'|'shoulder'|'biceps'|'triceps'|'leg'|'core'|'cardio'|'other';

// components/calendar/WeekFeed.tsx
interface WeekFeedProps {
  initialWeekStart: Date;
  onVisibleWeekChange: (weekStart: Date) => void;
  workoutsByDate: Map<string, DayWorkoutSummary>;
  exercisesByDate?: Map<string, WeekDayExercise[]>;  // detay göstermek için
  activeProgram?: ProgramSummary;
  onDayPress: (date: Date) => void;
}

interface WeekDayExercise {
  exerciseRef: string;   // slug VEYA UUID (§4.3 polymorphic)
  displayName: string;
  setSummary?: string;   // "4×8" veya null
}

// components/calendar/HintCard.tsx
interface HintCardProps {
  onOpenToday: () => void;
  onChoosePreset: () => void;
}

// components/calendar/PresetProgramModal.tsx
interface PresetProgramModalProps {
  visible: boolean;
  presets: PresetProgramSummary[];   // 4 hazır program
  onSelectPreset: (presetSlug: string) => void;   // → kopyala + aktif et + dismiss
  onDismiss: () => void;
}

interface PresetProgramSummary {
  slug: string;
  name: string;
  description: string;
  daysExpanded: Array<{ dayLabel: string; exercises: string[] }>;  // B1 kararı: always expanded
}

// components/calendar/WebWelcomeModal.tsx
interface WebWelcomeModalProps {
  visible: boolean;
  onContinueMobile: () => void;     // bayrak set + dismiss
  onOpenWeb: () => void;            // Linking.openURL + bayrak set + dismiss
  dontShowAgainDefault: true;       // B5 kararı: işaretli
  onDontShowAgainChange: (v: boolean) => void;
}
```

### Interaction notes

- **Month view tap → Day Detail:** Bir hücreye tap → `router.push('/calendar/day/' + dateISO)`. C1-C4 ekranlarına geçer.
- **Avatar tap → More:** Bottom tab bar'daki More'a değil, doğrudan More panelini bottom sheet olarak aç (§3.1: floating panel). Hızlı erişim alt sağ üst kombosu.
- **View switch:** Tap → state flip, app bar title ve içerik blok değişir. Animasyon: cross-fade 200ms. AsyncStorage'a son view kaydedilmez — her açılışta Month default (§3.5).
- **Today pill:** Tap → Month'ta bugünün ayına scroll/snap; Week'te bugünün haftasına. App bar title güncellenir.
- **Long-press tarihi (Month):** MVP'de yok. (Workout şablonu kopyalama gibi feature sonra.)
- **Week feed scroll:** `FlatList` veya `FlashList` — initial 6 hafta render (-3 .. +2), kullanıcı scroll'larken bidirectional load.
- **App bar title sync (Week):** `onViewableItemsChanged` throttled 200ms — en üstteki tam görünür week başlangıcı title'a yazılır.
- **HintCard dismiss:** Manuel X yok (§3.5). İlk workout eklenince otomatik kaybolur — `workoutCount > 0` check.
- **PresetProgramModal açılışı:** HintCard "Program" butonu → modal aç. Modal içinde preset listesi (always expanded, B1 kararı). Tap preset → preview → [Bu Programı Başlat] → backend'e kopyala + activate → modal kapanır + invalidate query → grid yeniden render (artık aktif program kategori chip'leri görünür).
- **WebWelcomeModal açılışı:** Calendar mount + ilk başarılı `app_profiles` fetch + `seen_web_welcome !== true` + `user_data` count > 0 → modal aç. Dismiss = bayrak set (`app_profiles.preferences.seen_web_welcome = true`) — bir daha açılmaz.
- **Haptic:** Today pill tap → light impact. Day tap → selection haptic.

### Edge cases

- **Locale = TR ama AyAdı uzun (örn "Ağustos"):** App bar title clip etmez, font auto-resize değil — uzun ay isimleri sığar.
- **Hafta başlangıcı:** Web TR'de Pazartesi, EN'de Pazar. Mobile aynı kural (locale-dependent).
- **DST geçişi:** Workout date `YYYY-MM-DD` (string), timezone yok. Cihaz timezone değişse bile data sapmaz.
- **Çok yoğun gün (5+ kategori):** Max 2 chip + `hasMore` indicator (küçük + işareti veya 3. chip yerine "⋯"). Detay Day Detail'de.
- **Çok eski tarih (5+ yıl önce):** Month view date pickers veya jump — MVP'de yok, sadece swipe/scroll ile.
- **Offline:** TanStack Query cache'inden render, stale indicator opsiyonel. Yeni data fetch fail → silently fail, cache devam eder.
- **Active program değişti (background sync):** TanStack Query invalidate → grid yeniden render, yeni chip'ler görünür.
- **Misafir kullanıcı:** Avatar "M" (Misafir) badge gösterir. Diğer her şey aynı, sadece veri AsyncStorage'dan okunur (Supabase query yerine local read).
- **Cihaz date değişti (kullanıcı manuel ileri/geri aldı):** `todayISO` her render yenilenir, gold border doğru hücreye gider. Workout date'leri etkilemez.
- **WebWelcomeModal: kullanıcı modal açıkken back basarsa:** Hardware back = İptal sayılır (dismiss + bayrak set EDİLMEZ). Sadece [Mobil'e Başla] veya [Web'e Git] basınca bayrak yazılır. (Bu kararı netleştirmek lazım — bkz. açık sorular.)

### Prototip referansı

- **calendar-prototype-v2/index.html → Section 1 (Month)**: bire bir referans. App bar, weekday row, month grid, chip stili, bottom nav.
- **calendar-prototype-v2/index.html → Section 2 (Week default)**: Week view feed yapısı.
- **Section 3 (Week with expanded day):** **MVP'de bu davranış yok** — Day Detail ayrı sayfa (C1-C4). Prototipte tek ekranda accordion açılması inspiration; mobil MVP'de Day Detail ayrı route.
- Bottom nav prototipte "Workout" yazıyor → MVP'de **"Library / Kütüphane"** (D4 kararı). Diğer 4 sekme isim aynı.
- TodayPill stili `auth-prototype`'tan değil, doğrudan calendar-prototype-v2'den (gold filled circle + label).

### Karara bağlandı (rev 3)

- **Hint kartı kapanış (sticky dismiss):** Kart bir kez kapandıysa **bir daha gösterilmez** — kullanıcı tüm workout'ları silse bile geri gelmez. Flag: `@logwise/seen_hint_card` (guest) veya `app_profiles.preferences.seen_hint_card = true` (auth). §8.8 (rev 12).
- **Month swipe:** **Var.** `react-native-pager-view` horizontal pager — sol/sağ swipe = önceki/sonraki ay. Today pill her zaman kalır, hızlı dönüş için. §8.8 (rev 12).
- **WebWelcomeModal hardware back:** Default davranış olarak back = İptal (flag set ETMEZ). Kullanıcı bilinçli [Mobil'e Başla] / [Web'e Git] basana kadar modal sonraki Calendar mount'ta tekrar açılır. Resmi onay sonraki seansta — 03 §9 Grup E altında not edildi.

### Açık sorular (kalan)

- **Avatar tap davranışı:** Bottom sheet More mu, yoksa direkt /more route'a navigate mi? §3.1 floating panel diyor → bottom sheet daha tutarlı. **Önerim: bottom sheet.**
- **Today pill her zaman görünür mü, yoksa sadece bugün görünmüyorsa mı?** Prototipte hep görünüyor. **Önerim: hep görünür**, subtle/prominent variant bugün uzaktaysa belirginleşir.
- **Week feed kaç hafta ileriye render?** Default 6 hafta (–3 to +2), scroll'da bidirectional load. Sayı netleşmeli. **Önerim: ilk render 8 hafta (–4 to +3), windowSize 4.**

---

## C1 Day Detail (empty)

### Niyet & yolculuk konteksti
Kullanıcı Calendar'dan bir güne (genellikle bugüne) tap'ledi, o gün için henüz hiç workout kaydı yok ve **aktif bir program da yok** (aktif program varyantı C3'te). Bu, **Yeni kullanıcı yolculuğunun (1. yolculuk) 6. adımı** ve **Tekrar açan kullanıcı yolculuğunun (2. yolculuk) 3a sapması**. §3.2 kararı doğrultusunda "Start workout" yok; ekran açılır açılmaz set girişine hazır — ama henüz egzersiz yok, kullanıcının ilk aksiyonu egzersiz eklemek.

Boş state'in iki CTA'sı (§3.8 ile uyumlu): [+ Egzersiz Ekle] (primary → C4 modal) ve [Hazır Program Seç] (secondary → PresetProgramModal, B1'deki aynı component reuse). FAB her durumda sağ altta hazır.

### Layout sketch

```
┌─────────────────────────────┐
│  [status bar]               │
│  ←   Sal 15 Eyl       ←  →  │  ← app bar: back + tarih + prev/next day
│      Bugün                  │     (gün adı subtitle; program context yok §3.5.2/§3.2)
│                             │
│  ┌─────┬─────┬─────────┐    │
│  │ Egz │ Set │ Hacim   │    │  ← day summary stat şeridi
│  │  0  │  0  │   —     │    │     (idle state — tüm "0" / "—")
│  └─────┴─────┴─────────┘    │
│                             │
│                             │
│                             │
│         [icon-empty]        │  ← merkez ortalanmış empty state
│                             │
│   Bu gün için henüz         │  ← başlık, t-primary
│   egzersiz yok              │
│                             │
│   Bir hareket ekle veya     │  ← açıklama 1 satır, t-secondary
│   hazır programdan başla.   │
│                             │
│  ┌─────────────┐ ┌─────────┐│
│  │+ Egzersiz   │ │ Hazır   ││  ← yan yana iki CTA
│  │  Ekle       │ │ Program ││     (primary gold + secondary ghost)
│  └─────────────┘ └─────────┘│
│                             │
│                             │
│                       ┌───┐ │
│                       │ + │ │  ← FAB sağ altta (her durumda)
│                       └───┘ │
│ [Cal][Lib][Dash][Soc][More] │  ← bottom nav (gizli değil; Calendar aktif kalır)
└─────────────────────────────┘
```

> **Not — Rest day banner:** Aktif program **yok** durumunda rest day kavramı tetiklenmez. Off-day banner sadece "aktif program var + bugün program off-day" durumunda (C3 varyantı) çıkar.

### Component breakdown

| Component | Konum | Görevi |
|---|---|---|
| `app/(app)/calendar/day/[date].tsx` | route | Day Detail ana ekran; URL param `date` (YYYY-MM-DD); state varyantını (empty / filled / program) içerideki query sonucuna göre seçer |
| `AppScreen` | `components/ui/AppScreen.tsx` | SafeAreaView + bg |
| `DayAppBar` | `components/day/DayAppBar.tsx` | Back + tarih başlığı (gün adı subtitle, locale-aware) + prev/next day okları |
| `DaySummaryStrip` | `components/day/DaySummaryStrip.tsx` | 3 stat: Egzersiz / Set / Hacim. Idle state'te "0 / 0 / —" |
| `DayEmptyState` | `components/day/DayEmptyState.tsx` | Merkez icon + başlık + 1 satır açıklama + 2 yan yana CTA |
| `AppButton` | `components/ui/AppButton.tsx` | Primary / secondary variant; empty state CTA'larında size `md`, fullWidth=false (yan yana) |
| `PresetProgramModal` | `components/calendar/PresetProgramModal.tsx` | **B1 ile ortak**; "Hazır Program Seç" → preset modal, seçim sonrası aktif et + invalidate query; modal kapanır, ekran C3 varyantına geçer |
| `FAB` | `components/ui/FAB.tsx` | Sağ alt floating + butonu; her zaman görünür; tap → C4 modal aç |
| `BottomTabBar` | `components/ui/BottomTabBar.tsx` | B1 ile aynı; Day Detail tek bir route altında Calendar tab'ı aktif gösterir |

### State varyantları

| State | Tetik | Görünüm |
|---|---|---|
| `loading` | İlk mount, `app_workouts` + `app_day_meta` + active program query çalışıyor | Stat strip skeleton, body skeleton (basit pulse) |
| `empty-no-program` (default) | Query ok + workout count = 0 + active_program_id = null | Yukarıdaki layout |
| `empty-program-off-day` | Active program var ama bugün off_day (örn. Pazar PPL off) | **Body değişir**: DayEmptyState yerine `RestDayBanner` (C3'te detay). Empty buton seti yine var (manuel egzersiz eklemek için). Bu state C3'te tam yazılı. |
| `presetModal-open` | "Hazır Program Seç" tap | PresetProgramModal sheet açılır (B1 component) |
| `addExModal-open` | "+ Egzersiz Ekle" veya FAB tap | C4 Add Exercise modal açılır |
| `error-load` | Network/query fail | Stat strip "—", body içinde inline error: "Yükleme sorunu. [Tekrar dene]" |
| `guest-mode` | Auth yok, guest mode aktif | Tüm görünüm aynı; sadece veri kaynağı AsyncStorage. Görsel ayrım yok (avatar M badge B1'de) |

### Props / TS interface

```ts
// app/(app)/calendar/day/[date].tsx
export default function DayDetailScreen() {
  // route param: { date: 'YYYY-MM-DD' }
  // içeride useLocalSearchParams ile alır
}

// components/day/DayAppBar.tsx
interface DayAppBarProps {
  dateISO: string;              // 'YYYY-MM-DD'
  locale: 'tr' | 'en';
  programContext?: {            // C3'te dolu; C1'de undefined
    programName: string;        // "PPL"
    dayLabel: string;           // "Push Day"
    weekNumber?: number;        // 2 (varsa)
  };
  isToday: boolean;             // "Bugün" tag'i için
  onBack: () => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  canGoNext: boolean;           // gelecek > 1 yıl gibi limit varsa false
}

// components/day/DaySummaryStrip.tsx
interface DaySummaryStripProps {
  exerciseCount: number;
  setCount: number;
  totalSetsTarget?: number;     // program varsa "0 / 20" şeklinde; yoksa sadece "0"
  totalVolumeKg?: number;       // undefined → "—" render
  isActive?: boolean;           // sadece görsel highlight (prototip ile uyum) — MVP'de always false (active workout konsepti yok §3.2)
}

// components/day/DayEmptyState.tsx
interface DayEmptyStateProps {
  variant: 'no-program' | 'program-off-day';   // off-day C3'te
  onAddExercise: () => void;
  onChoosePreset: () => void;                  // sadece 'no-program' variant'ta görünür
}

// components/ui/FAB.tsx
interface FABProps {
  onPress: () => void;
  icon?: React.ReactNode;       // default + icon
  accessibilityLabel: string;
  bottomInset?: number;         // bottom nav yüksekliği + 16pt
  testID?: string;
}
```

### Interaction notes

- **App bar prev/next day:** Tap → `router.replace('/calendar/day/' + nextDateISO)` (push değil — back stack şişmesin). Klavye açıkken disabled (focus kayboluş hatası önlenir).
- **App bar back:** `router.back()` (Calendar'a döner; tarih state'i Calendar'da korunur).
- **"+ Egzersiz Ekle" tap:** `addExModal-open` state → C4 modal slide-up.
- **"Hazır Program Seç" tap:** `presetModal-open` → PresetProgramModal (B1 component reuse). Preset seçildi + aktif edildi → query invalidation → C1 state'i **C3'e geçer** (artık active program var, body otomatik kartlanır).
- **FAB tap:** "+ Egzersiz Ekle" ile aynı aksiyon (entry duplication kasıtlı — tek elle erişim).
- **Stat strip stiline dair karar:** Prototipte "is-active" highlight var ama §3.2 "active workout konsepti yok" → MVP'de `isActive` her zaman false. Görsel olarak stat'lar her zaman aynı renkte (t-secondary key + t-primary value).
- **Empty state animasyonu:** Mount'ta hafif fade-in (200ms). Yeniden mount'ta tekrar yok (sadece ilk açılışta).
- **Klavye:** Bu state'te input yok; klavye açılmaz.
- **Haptic:** CTA tap'lerde light impact.

### Edge cases

- **Geçmiş bir günün boş state'i:** Tamamen geçerli — kullanıcı 2 ay önceye gidip "o gün de egzersiz ekleyeyim" diyebilir. App bar tarih + gün adı; "Bugün" tag'i görünmez; aksi tüm akış aynı. (§3.2 geçmiş read-write her zaman.)
- **Çok uzun ay/gün adı (TR "Ağustos Pazartesi"):** App bar title clip etmez; uzun ay isimleri sığar. Gerekirse alt satıra wrap (subtitle).
- **Empty state CTA basıldıktan sonra geri dönüş:** Add Exercise modal cancel → C1 state aynen kalır (state değişmez, render aynı). Preset modal cancel → aynı şekilde.
- **Cihazda klavye yapısı dar:** CTA'lar yan yana sığmazsa stack'e düş (responsive — `flexWrap` veya minWidth check). 320pt genişlikte (iPhone SE 1) stack mode tercih.
- **Locale değişti (TR → EN runtime):** App bar tarih formatı re-render; query değişmez.
- **Network down + cache yok:** `error-load` state. Skeleton 3 saniye sonra error'a düşer.
- **Date URL param invalid (örn. /day/abc):** `+not-found.tsx`'e yönlen (Expo Router default) veya inline error.
- **Guest user için future date:** İzinli (guest da gelecek günü açıp egzersiz planlayabilir). Workout date string olarak yazılır.
- **Future date çok ileri (örn. 2030):** Engelleme yok ama `canGoNext` limit'i Calendar'la tutarlı (örn. +5 yıl).
- **Accessibility:** Empty state'te VoiceOver/TalkBack focus order: başlık → açıklama → primary CTA → secondary CTA → FAB.

### Prototip referansı

- **day-prototype/index.html → Phone 1 (idle)** üst kısmı (status bar + app bar + day-summary) doğrudan referans.
- **Farklar (MVP):**
  - Prototipte day-summary'de "0 / 20" (planned target) görünüyor — bu **aktif program varsa** mantıklı. C1 (no-program) varyantında "0" yeterli; "/ 20" ek bilgisi C3'te belirir.
  - Prototipte `cta-start` "Start workout" butonu var (footer'da) → **MVP'de YOK** (§3.2). Footer kaldırılır; yerine boş state body + FAB.
  - Prototipte body egzersizlerle dolu (idle = "planlı program günü") → C1'de body **boş** (egzersiz yok).
  - Prototipte FAB sadece active state'te görünür → MVP'de **her zaman görünür** (§3.2'deki "FAB her durumda hazır" kararıyla uyumlu).
- Renk/font/spacing token'ları prototipten doğrudan: `--bg-app`, `--bg-elevated`, `--brd-subtle`, `--accent`, kategori `--cat-*`.

### Karara bağlandı (rev 3)

- **Empty state icon:** `lucide-react-native` → **Dumbbell** outline, 48pt, `t-tertiary` renk. Day Detail / Library / Add Exercise empty hepsinde tutarlı. §8.8 (rev 12).
- **CTA layout:** Responsive — **≥360pt yan yana**, **<360pt stack** (`flexWrap`). iPhone SE 1 darlığında otomatik dikey yığın. §8.8 (rev 12).

### Açık sorular (kalan)

- **Stat strip "Hacim" placeholder:** `—` mi `0 kg` mı? Web tarafıyla tutarlılık? **Önerim:** `—` (boş veri için tipografi tercihi).
- **FAB ile "+ Egzersiz Ekle" entry duplication:** İkisi de aynı modal'ı açıyor. Empty state'te FAB **disable** edilsin mi (görsel duplication önlensin) yoksa hep aktif mi? **Önerim:** hep aktif; tutarlılık daha önemli.
- **Day summary "0 set" gösterimi locale:** TR'de "0 set" mi "Set: 0" mı? §3'te i18n key tanımı yok. **Önerim:** TR "Set 0", EN "0 sets" — tipografi tercihi.

---

## C2 Day Detail (filled)

### Niyet & yolculuk konteksti
Kullanıcı bir veya daha fazla egzersiz ekledi (manuel veya programdan); en az bir egzersiz kartı render ediliyor. Her kartta set'ler boş veya dolu olabilir. Bu, **1. yolculuğun 9-13. adımları** ve **2. yolculuğun 3c sapması**. §3.2 + §3.7 davranış kararları doğrultusunda: direkt set girişi (Start yok), focus-dışı/Done'da auto-save, undo toast, long-press drag sadece kart başlığında, set tipleri **working / warmup / drop** (superset MVP'den çıktı, rev 12), RIR chip group (`- / F / 1 / 2 / 3 / 4+`).

C2, "aktif program YOK ama egzersiz kartı VAR" varyantını **ve** "aktif program VAR + kullanıcı ekstra egzersiz ekledi" varyantını kapsar — fark sadece C3'teki program context subtitle ve lazy/sanal yazma davranışı. C2'nin ana yapısı her iki durumda da aynı.

### Layout sketch

```
┌─────────────────────────────┐
│  [status bar]               │
│  ←   Sal 15 Eyl       ←  →  │  ← app bar: aynı C1
│      Bugün                  │
│                             │
│  ┌─────┬─────┬─────────┐    │
│  │ Egz │ Set │ Hacim   │    │  ← day summary güncel:
│  │  2  │  7  │ 2,340 kg│    │     Egz: kart sayısı, Set: tüm set'ler, Hacim: kg×rep toplamı
│  └─────┴─────┴─────────┘    │
│                             │
│ ┌─ Bench Press ──────⋮ 👁 ─┐ │  ← ex-card: başlık + cat chip + last + ⋯ + 👁 preview
│ │ • Göğüs                  │ │
│ │ Last: 75 kg × 8          │ │
│ │ ┌─────────────────────┐  │ │
│ │ │ # Type  KG Reps RIR ×│ │ │  ← set-grid head (mini, t-tertiary)
│ │ │ 1 Work  75  10  2  ×│ │ │  ← set-row, type-working (gold accent num)
│ │ │ 2 Work  77   8  1  ×│ │ │
│ │ │ 3 Work  77   7  0  ×│ │ │
│ │ │ 4 Drop  55  12  F  ×│ │ │  ← type-drop (mor accent)
│ │ └─────────────────────┘  │ │
│ │ [ + Set Ekle ]    [📝]   │ │  ← add-set + note btn (icon)
│ └──────────────────────────┘ │
│                             │
│ ┌─ Cable Row ────────⋮ 👁 ─┐ │
│ │ • Sırt                   │ │
│ │ Last: 64 kg × 10         │ │
│ │ ┌────────────────────┐   │ │
│ │ │ 1 Work  __  __  -  ×│  │ │  ← boş set: placeholder '64' / '10' grey
│ │ │ 2 Work  __  __  -  ×│  │ │
│ │ │ 3 Work  __  __  -  ×│  │ │
│ │ └────────────────────┘   │ │
│ │ [ + Set Ekle ]    [📝]   │ │
│ └──────────────────────────┘ │
│                             │
│         (scroll devam)      │
│                             │
│  ┌─ rest timer (sticky) ──┐ │  ← KULLANICI manuel açtıysa sticky bottom
│  │ ⏱ Dinlenme · 01:12     │ │     görünür; default kapalı (§3.2 manuel)
│  │ +30s  Skip  ⏸ Pause    │ │
│  └────────────────────────┘ │
│                             │
│  ⏱ Dinlenme                 │  ← rest timer kapalıyken: sade entry chip
│                             │     (global trigger, set ile bağı yok)
│                                ┌───┐
│                                │ + │ ← FAB
│ [Cal][Lib][Dash][Soc][More]    └───┘
└─────────────────────────────┘
```

> **Active workout clock YOK:** day-prototype'ın "active" varyantında app bar'da `00:24:18` elapsed clock var. §3.2 "active workout konsepti yok" → MVP'de bu clock **gösterilmez**. App bar her zaman C1 ile aynı (sadece tarih + nav okları).

> **Footer Pause / Finish butonları YOK:** Prototipteki sticky bottom Pause + Finish kontrolleri MVP dışı. MVP'de footer **sadece rest timer** (kullanıcı açtıysa) + **rest timer entry chip** (kapalıysa).

### Component breakdown

| Component | Konum | Görevi |
|---|---|---|
| `app/(app)/calendar/day/[date].tsx` | route | C1 ile aynı route; state `filled` ise body değişir |
| `DayAppBar` | `components/day/DayAppBar.tsx` | C1 ile aynı |
| `DaySummaryStrip` | `components/day/DaySummaryStrip.tsx` | Şimdi gerçek sayılar; `totalVolumeKg` hesaplı |
| `ExerciseCardList` | `components/day/ExerciseCardList.tsx` | Sıralı kart listesi; long-press drag handling (`react-native-draggable-flatlist` veya `Reanimated + GestureHandler`) |
| `ExerciseCard` | `components/day/ExerciseCard.tsx` | Tek egzersiz kartı: head (başlık + cat chip + last + ⋯ + 👁) + set grid + footer (add-set + note btn) |
| `ExerciseCardHeader` | `components/day/ExerciseCardHeader.tsx` | **Drag handle scope buraya:** long-press = card-reorder; set satırlarına bulaşmaz (§3.2) |
| `SetGrid` | `components/day/SetGrid.tsx` | Head row + set rows; 6 sütun (# / Type / KG / Reps / RIR / ×) |
| `SetRow` | `components/day/SetRow.tsx` | Tek set; type-class ile renk vurgusu; otomatik save handling |
| `SetTypeSelect` | `components/day/SetTypeSelect.tsx` | **working / warmup / drop** chip select (compact). `superset` MVP'den çıktı (rev 12 — §8.8). Tap → bottom sheet picker |
| `NumericInput` | `components/ui/NumericInput.tsx` | KG (decimal) ve Reps (integer) için; iOS `keyboardType="decimal-pad"`/`numeric`, Android `inputMode` |
| `RirSelect` | `components/day/RirSelect.tsx` | RIR chip group: `-` / `F` / `1` / `2` / `3` / `4+` (rev 12). Tap → quick picker (inline horizontal chips) |
| `AddSetButton` | `components/day/AddSetButton.tsx` | "+ Set Ekle" buton + (yanında) note icon-btn |
| `ExerciseMenu` | `components/day/ExerciseMenu.tsx` | ⋯ menüsü: Note, Preview, Delete, (program varsa) Reorder içinde program-day silme alt-modal'ı (§3.2). Bottom sheet veya popover. |
| `ExPreviewModal` | `components/ui/ExPreviewModal.tsx` | Web'deki `components/ex-preview-modal.js` portu — 👁 tap → gif + uzun açıklama + tips |
| `RestTimerBar` | `components/day/RestTimerBar.tsx` | Sticky bottom; aktif state + entry chip. iki state: `idle` (entry chip) / `running` (full bar) |
| `RestTimerSheet` | `components/day/RestTimerSheet.tsx` | Timer ayarları sheet (preset chips 30/60/90/120/180/300, +30s/-30s, Skip, Settings → default kaydet) |
| `UndoToast` | `components/ui/UndoToast.tsx` | Set kayıt hatası veya delete sonrası "Geri al" toast (3sn) |
| `FAB` | `components/ui/FAB.tsx` | C1 ile aynı; tap → C4 Add Exercise modal |

### State varyantları

| State | Tetik | Görünüm |
|---|---|---|
| `loading` | İlk mount + query | Skeleton kart(lar) |
| `filled-no-program` | Query ok + kart sayısı ≥ 1 + active_program_id = null | Yukarıdaki layout |
| `filled-with-program-extra` | Aktif program + program günündeki kartlara ek olarak FAB ile eklenmiş kart(lar) var | Yukarıdaki layout + DayAppBar.programContext subtitle dolu (C3 davranışı); program kartı ile ekstra kart **görsel ayrımsız** (§3.2) |
| `set-empty-with-placeholder` | Yeni eklenen set; önceki kayıt var | KG/Reps input placeholder `60` / `10` (grey), `RirSelect` "-" |
| `set-empty-no-placeholder` | Yeni eklenen set; önceki kayıt yok (ilk antrenman, hiç tarihçe yok) | Placeholder hint metni `kg` / `reps` (§3.2 kararı). RirSelect "-" |
| `set-filled` | Kullanıcı KG + Reps yazdı, focus dışı | Input rengi gold (is-filled class). RIR seçilmişse chip highlight. Save debounced (300ms) → DB |
| `set-saving` | Auto-save sırasında | Subtle row indicator: sol kenarında 2pt gold pulse (1sn). Engelleyici değil |
| `set-save-error` | Network/insert fail | UndoToast: "Kaydedilemedi. [Geri al]" 3sn |
| `card-reordering` | Long-press header → drag aktif | Kart elevation artar (shadow), scale 1.02, diğer kartlar yer açar |
| `program-exercise-delete-confirm` | ⋯ → Sil + bu kart program'a aitse | Modal: "Sadece bugün için mi, tüm programdan mı?" [Sadece bugün] [Programdan] [İptal] (§3.2) |
| `custom-exercise-delete-confirm` | ⋯ → Sil + program dışı kart | Native Alert: "Bu egzersizi silmek istediğine emin misin?" [İptal] [Sil] |
| `rest-timer-idle` | Default | Footer alt: "⏱ Dinlenme" entry chip (sade, küçük) |
| `rest-timer-running` | Kullanıcı timer açtı | Sticky bottom full bar: süre + +30s/Skip/Pause |
| `rest-timer-warning` | Son 10sn | Bar `is-warning`: değer rengi danger |
| `rest-timer-done` | 00:00 | Visual flash + haptic notification; bar `idle`'a döner. (Default: ses **yok**, MVP'de push notif yok §8.3) |
| `network-offline` | Connection drop | Üst banner: "Çevrimdışı — değişiklikler senkronize edilemiyor". Set girişine **izinli** ama save kuyrukta; bağlantı geri gelince retry. *(Şu an MVP'de offline-first değil §4.2; bu davranış basit "fail + retry" şeklinde kalır.)* |

### Props / TS interface

```ts
// components/day/ExerciseCard.tsx
interface ExerciseCardProps {
  workout: WorkoutWithSets;       // joined: app_workouts + app_sets
  exerciseRef: string;            // slug VEYA UUID (§4.3 polymorphic)
  resolvedExercise: ResolvedExercise;  // bundle preset veya app_exercises
  lastSession?: PreviousSession;  // önceki en son antrenmanın setleri (§3.2)
  isProgramExercise: boolean;     // C3'te true; silme modal seçeneklerini etkiler
  isDraggable: boolean;           // default true
  onAddSet: () => void;
  onEditSet: (setIndex: number, patch: SetPatch) => void;
  onDeleteSet: (setIndex: number) => void;
  onOpenPreview: () => void;
  onOpenNote: () => void;
  onDeleteCard: () => void;
  onLongPressHeader?: () => void; // drag başlat
}

interface ResolvedExercise {
  ref: string;                    // slug veya UUID
  name: string;
  categories: CategoryKey[];
  notes?: string;
  isPreset: boolean;
}

interface PreviousSession {
  workoutDate: string;            // 'YYYY-MM-DD'
  sets: Array<{
    setType: SetType;
    weight: number;
    reps: number;
    rir: RirValue;
  }>;
}

type SetType = 'working' | 'warmup' | 'drop';   // rev 12: superset MVP'den çıktı (şema field'ı kalır, MVP sonrası geri gelir)
type RirValue = '-' | 'F' | '1' | '2' | '3' | '4+';   // rev 12: "F" = Failure (web "0" yerine; DB ve UI tek dil)

// components/day/SetRow.tsx
interface SetRowProps {
  setIndex: number;               // 0-based; UI'da +1
  set: SetEntity;                 // app_sets row
  previousSet?: PreviousSession['sets'][number];   // placeholder source
  onChange: (patch: SetPatch) => void;             // debounced save trigger
  onDelete: () => void;
  isSaving?: boolean;
}

interface SetEntity {
  id: string;
  workoutId: string;
  setIndex: number;
  setType: SetType;
  weight: number | null;          // null = boş (placeholder göster)
  reps: number | null;
  rir: RirValue;
  createdAt: string;
}

interface SetPatch {
  setType?: SetType;
  weight?: number | null;
  reps?: number | null;
  rir?: RirValue;
}

// components/day/RestTimerBar.tsx
interface RestTimerBarProps {
  state: 'idle' | 'running' | 'warning' | 'done';
  remainingSec: number;
  defaultDurationSec: number;     // user preference; default 90
  onStart: (durationSec: number) => void;
  onAdd30: () => void;
  onSkip: () => void;
  onPause: () => void;
  onOpenSheet: () => void;        // RestTimerSheet
}

// components/day/RirSelect.tsx
interface RirSelectProps {
  value: RirValue;
  onChange: (v: RirValue) => void;
  variant?: 'inline' | 'sheet';   // inline = horizontal chips, sheet = bottom sheet picker
}

// components/day/ExerciseMenu.tsx
interface ExerciseMenuProps {
  visible: boolean;
  isProgramExercise: boolean;     // delete UI'yi değiştirir
  hasNote: boolean;
  onClose: () => void;
  onAddNote: () => void;
  onOpenPreview: () => void;
  onDelete: () => void;
}
```

### Interaction notes

- **Set girişi (en yoğun akış):**
  1. "+ Set Ekle" tap → yeni satır ekle (DB'ye placeholder insert: setType=working, weight=null, reps=null, rir='-'). Optimistic.
  2. KG input autoFocus → `keyboardType="decimal-pad"` (iOS) / `inputMode="decimal"` (Android).
  3. Klavye Done veya focus dışı (Reps input'a tap dahil) → debounced 300ms save (patch `weight`).
  4. Reps input → aynı.
  5. RIR chip tap → anında save (debounce yok, single tap).
  6. Set type chip tap → bottom sheet açılır → seçim → save + sheet kapanır.
  7. Save failure → UndoToast (3sn) + row error state (kırmızı kenar 1sn).
- **Önceki set prefill logic (§3.2 rev 12 — web'den ayrıldı):**
  - Egzersiz kartı render edilirken: `lastSession` query → "bu `exercise_ref` için bugünden önceki en son `workout_date`'in setleri" (program bağı yok — programdan veya manuel olsun, sadece en son tarih).
  - **Input value'lar gerçek değerlerle dolar** (hayalet placeholder değil): Set 1 KG input = "75", Reps input = "10" (örn). Kullanıcı aynı ağırlığı tekrar girecekse hiçbir şey yapmaz; sadece farklıysa düzenler.
  - **Lazy DB yazma:** Prefill edilen değer DB'ye **anında yazılmaz**. Kullanıcı input'a dokunduğunda veya focus-blur olduğunda save tetiklenir. Kart açılıp dokunulmadan geçilirse DB'ye satır yazılmaz.
  - Hiç önceki kayıt yoksa: input boş + hint metni `kg` / `reps` (§3.2 ilk set placeholder kararı). Placeholder rengi `t-tertiary`.
  - Set'lerin **type ve RIR'i de** prefill edilir: önceki "warmup" set "warmup" gelir, RIR önceki değerle dolar. Tutarlılık prensibi.
  - **Visual ayırt etme:** Prefill edilen input ile kullanıcının yazdığı input görsel olarak ayrılır — prefill `t-secondary` renkli ve italik (`is-prefilled` class), kullanıcı dokunup save tetiklediğinde rengi `t-primary` + `is-filled` class'a geçer ("gerçekten kaydedildi" sinyali).
- **Long-press drag (§3.2):**
  - Trigger: kart **header'ında** 400ms hold. Set grid veya footer'da hold = no-op.
  - `react-native-draggable-flatlist` ile; activeOffset gesture-handler.
  - Drop: yeni position → `app_workouts.position` update (joker bir transaction veya optimistic local + background sync).
  - Haptic: long-press başlangıcında `selection`, drop'ta `light impact`.
  - Drag affordance: kart header sağ kenarında küçük drag-handle icon (üst üste 6 nokta — visual hint).
- **Kart sil:**
  - Program egzersizi (`isProgramExercise=true`) → 3-seçenekli modal:
    - "Sadece bugün için mi" → `app_day_meta.skipped_exercise_ids` push (slug veya UUID).
    - "Tüm programdan mı" → `app_program_days` satırı sil (yarın da gelmez).
    - "İptal" → kapat.
  - Custom egzersiz → 2-seçenekli native Alert.
  - Delete sonrası UndoToast: "Egzersiz silindi. [Geri al]" (5sn, daha uzun süre — kart silmesi delete-set'ten daha kritik).
- **Rest timer trigger:**
  - Default state: footer'da sade "⏱ Dinlenme" entry chip (8pt height, t-secondary).
  - Tap → RestTimerSheet açılır: preset chips (30/60/90/120/180/300) + custom input.
  - Süre seç → sheet kapan + RestTimerBar `running` state'e geç (sticky bottom).
  - Bar üstünde aksiyon: `+30s`, `Skip`, `⏸ Pause`. Tap → `running` ↔ `paused` toggle.
  - Set ile bağı yok (§3.2): kullanıcı istediği zaman istediği süreyle açar.
  - Done → haptic notification + bar `idle`'a 1sn fade.
- **App bar prev/next + kayıt persistance:** Kullanıcı set yazıyorken (focus aktif) prev/next basarsa: 1) klavye blur → save trigger (last patch); 2) save tamamlanınca navigate. Saving sırasında prev/next disabled.
- **Pull-to-refresh:** Üstten swipe → `app_workouts` + `app_sets` invalidate (TanStack Query). Stale data sync için.
- **Haptic özet:**
  - Set type chip seçim → selection
  - RIR chip → selection
  - "+ Set Ekle" → light impact
  - Set delete → medium impact + UndoToast
  - Card delete confirm → medium impact
  - Long-press drag start → selection
  - Drag drop → light impact
  - Rest timer done → notification

### Edge cases

- **Çok hızlı tap "+ Set Ekle" (debounce):** İki set ardarda eklenirse her ikisi de yazılır; setIndex sıralı (auto-increment). UI race condition yok — optimistic update sıralı kuyruğa eklenir.
- **Aynı egzersizden 2 kart (superset gibi):** Şema `UNIQUE(user_id, workout_date, exercise_ref)` kuralı bunu **engeller**. Superset için `app_workouts.superset_group` alanı şemada var (rev 11) ama MVP'de **kullanılmaz** (rev 12 — superset MVP'den çıktı). Aynı egzersizi tekrar eklemek yerine kullanıcı set'leri tek kartta birleştirir.
- **Aynı egzersize farklı set tipleriyle 8+ set:** Limit yok. Scroll devam eder. Performans için `FlashList` virtualization önerilir (kart başına 4-6 set tipik; 20+ set rare).
- **Klavye açıkken sticky rest timer bar:** Klavye yukarı iter → bar gizlenir veya klavye üstünde kalır. **Önerim:** klavye open ise bar gizli; klavye close ise yine görünür.
- **Set type select bottom sheet açıkken klavye:** Sheet açılırken klavye blur (input save trigger). Sheet kapanınca focus restore EDİLMEZ (kullanıcı eylemi tamamlandı).
- **Note butonuna tap:** Egzersiz başına 1 note (`app_workouts.notes`). Bottom sheet ile text area + Save. Boş note silinir.
- **Çok uzun egzersiz adı:** Card header 2 satıra wrap; cat chip alt satıra düşer.
- **Custom egzersiz silindi ama set'leri var:** Cascade — `app_workouts` silmesi `app_sets`'i FK cascade ile siler. Soft-delete yok (MVP).
- **Network drop mid-save:** Optimistic UI çoktan render edilmiş; save retry (TanStack Query mutation retry). Başarısızsa UndoToast + lokal state rollback.
- **Date prev/next ile gün geçişi (klavye odaklıyken):** Yukarıda yazdı; blur + save → navigate.
- **Last session'ın setleri 8 ama bugün kullanıcı sadece 4 set ekledi:** 4 satır görünür, 5-8'in placeholder'ı görünmez. Kullanıcı yeni satır eklerse 5. set placeholder = previousSet[4].
- **RIR enum (rev 12'de standardize edildi):** UI + DB her ikisi de `-` / `F` / `1` / `2` / `3` / `4+`. Karara bağlandı altında.
- **Accessibility:** Set row VoiceOver okuma: "Set 1, working, 75 kilo, 10 tekrar, RIR 2, sil butonu". Cat chip "Göğüs kategorisi". Add set "Set ekle butonu".

### Prototip referansı

- **day-prototype/index.html → Phone 1 (idle)**: ex-card yapısı + day-summary stat şeridi + add-set + note btn doğrudan referans.
- **day-prototype/index.html → Phone 2 (active)** kart yapısı: set-row 6 sütun grid (`# Type KG Reps RIR ×`) + filled state gold highlight + set type accent renkleri (working gold / warmup orange / drop purple). **Doğrudan referans** (superset indigo prototipte var ama MVP'den çıktı — rev 12).
- **Farklar (MVP):**
  - **App bar workout-clock YOK:** Sağ üstte elapsed time `00:24:18` gösterilmez (active workout konsepti yok §3.2).
  - **Footer Pause/Finish YOK:** Sticky bottom Pause + Finish ✓ butonları kaldırılır.
  - **Rest timer entry farklı:** Prototipte rest timer hep sticky bottom full bar; MVP'de **idle state'te entry chip + running state'te full bar** iki davranış.
  - **FAB her zaman görünür:** Prototipte sadece active'de; MVP'de her zaman.
  - **`is-active` kart highlight:** Prototipte "şu an çalışılan egzersiz" altın kenar var. MVP'de **bu state yok** — tüm kartlar eşit.
- Token'lar: `--set-working`, `--set-warmup`, `--set-drop` ve `--cat-*` doğrudan eşleşir. (`--set-superset` token tasarım sisteminde tanımlı ama MVP'de kullanılmaz — rev 12.)

### Karara bağlandı (rev 3)

- **Superset MVP'den çıktı:** Set type chip enum sadece `working / warmup / drop`. Şema `app_workouts.superset_group` alanı kalır (MVP sonrası kullanılır). 03 §8.8 (rev 12).
- **RIR enum "F" standardı:** UI ve DB her ikisi de `-` / `F` / `1` / `2` / `3` / `4+`. Web "0" → mobil "F" (mobil ayrı veri katmanı, web etkilenmez). 03 §4.3 + §8.8 (rev 12).
- **Placeholder kaynağı + davranışı:** Same `exercise_ref`'in en son `workout_date`'i (program bağı yok). **Gerçek değer prefill** edilir, hayalet placeholder değil — kullanıcı aynı ağırlığı tekrar yazmak zorunda değil. Lazy DB yazma korunur (input'a dokunulmadan satır yazılmaz). 03 §3.2 (rev 12) + C2 interaction notes.
- **Drag handle:** Visible 6-dot icon, kart header sağ kenarında (⋯ menünün solunda). 03 §8.8 (rev 12).

### Açık sorular (kalan)

- **Set delete UndoToast süresi:** 3sn mi 5sn mi? Web'de undo yok (direkt sil). **Önerim:** 5sn (kullanıcı yanlışlıkla siler).
- **Rest timer default süresi:** Tüm kullanıcılar için 90sn mi yoksa user preference'tan mı okunur? §8.3 manuel başlatma diyor ama default değeri belirtmiyor. **Önerim:** 90sn default; user preference olarak `app_profiles.preferences.rest_default_sec`.
- **Auto-save debounce süresi:** 300ms önerildi. Test cihazında çok agresif olabilir. **Açık** — implementation'da ayarlanır.
- **Note buton ⋯ menüsünde değil add-set yanında — kasıtlı mı?** Prototipte add-set yanında. MVP'de ⋯ menüsüne de eklensin mi (alternative entry)? **Önerim:** sadece footer'da kalsın (tek entry, daha az gürültü).
- **Prefill edilen değerin görsel ayırımı tam ne olsun?** `is-prefilled` → t-secondary + italic önerildi; `is-filled` (kullanıcı save'ledi) → t-primary + bold. Detaylar implementation aşamasında token ile finalize edilir.

---

## C3 Day Detail (program day)

### Niyet & yolculuk konteksti
Kullanıcı aktif bir programa sahip ve açtığı gün bir program günü (off-day veya egzersiz günü). Bu, **3. yolculuğun 6-11. adımları** ve **2. yolculuğun 3b sapması**. §3.2 (program egzersizleri otomatik kartlanmış + lazy/sanal yazma) + §3.5.2 (geçmiş günde program context yok) + 3. yolculuğun rest day banner kararı doğrultusunda.

C3, C1 ve C2'nin **üzerine eklenir**: app bar subtitle'a program context (bugün/gelecek için), boş günde program egzersizlerinin otomatik kartlanması, lazy/sanal yazma, off-day rest banner. C2'nin tüm set giriş davranışları C3 içinde de geçerli — fark sadece kart kaynağı (programdan vs manuel) ve subtitle.

### Layout sketch

**C3a — Egzersiz günü, boş (programdan otomatik kartlandı):**
```
┌─────────────────────────────┐
│  ←   Sal 15 Eyl       ←  →  │
│      Bugün                   │
│      PPL · Push Day · Hf 2   │  ← subtitle: program context (§3.2)
│                             │
│  ┌─────┬─────┬─────────┐    │
│  │ Egz │ Set │ Hacim   │    │
│  │  5  │0/20 │   —     │    │  ← "0/20" = planned target (program varsa)
│  └─────┴─────┴─────────┘    │
│                             │
│ ┌─ Bench Press ──────⋮ 👁 ─┐ │  ← otomatik render; DB'de henüz yok (lazy)
│ │ • Göğüs                  │ │
│ │ Last: 75 kg × 8          │ │
│ │ [+ Set Ekle]    [📝]     │ │  ← henüz set yok
│ └──────────────────────────┘ │
│ ┌─ OHP ──────────────⋮ 👁 ─┐ │
│ │ • Omuz                   │ │
│ │ Last: 50 kg × 8          │ │
│ │ [+ Set Ekle]    [📝]     │ │
│ └──────────────────────────┘ │
│ ┌─ Lateral Raise ──── ... ─┐ │
│ │ ...                       │ │
│ └──────────────────────────┘ │
│         (5 kart, scroll)     │
│                       ┌───┐ │
│                       │ + │ │  ← FAB: program-dışı extra ekleme
│                       └───┘ │
│ [Cal][Lib][Dash][Soc][More] │
└─────────────────────────────┘
```

**C3b — Off-day (rest day banner):**
```
┌─────────────────────────────┐
│  ←   Paz 20 Eyl       ←  →  │
│      Bugün                   │
│      PPL · Rest Day · Hf 2   │  ← subtitle: rest day belirgin
│                             │
│  ┌─────┬─────┬─────────┐    │
│  │ Egz │ Set │ Hacim   │    │
│  │  0  │  0  │   —     │    │
│  └─────┴─────┴─────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │  💤  Dinlenme Günü   │    │  ← rest day banner (info teal/cyan)
│  │                      │    │
│  │  Bugün programında   │    │  ← 1-2 satır açıklama
│  │  dinlenme günü.      │    │
│  │                      │    │
│  │  Yine de egzersiz    │    │  ← küçük tertiary link
│  │  eklemek istersen ↓  │    │
│  └─────────────────────┘    │
│                             │
│  (boş alan)                 │
│                             │
│                       ┌───┐ │
│                       │ + │ │  ← FAB: manuel egzersiz ekleme
│                       └───┘ │
│ [Cal][Lib][Dash][Soc][More] │
└─────────────────────────────┘
```

**C3c — Geçmiş program günü (bugünden önce):**
- §3.5.2 kuralı: subtitle'da **program context YOK** — sadece tarih + gün adı (C1/C2 ile aynı app bar). Geçmişin "o zaman hangi program aktifti" sorusu öncelik değil.

### Component breakdown

| Component | Konum | Görevi |
|---|---|---|
| (C1/C2 ile aynı route ve ana component'ler) | | |
| `DayAppBar` | `components/day/DayAppBar.tsx` | `programContext` prop doluysa subtitle render: "PPL · Push Day · Hf 2" (veya rest day) |
| `RestDayBanner` | `components/day/RestDayBanner.tsx` | Off-day banner: 💤 icon + başlık + 1 satır + opsiyonel "Yine de ekle" link |
| `ExerciseCardList` | (C2 ile aynı) | Programdan otomatik render — lazy entries |
| `ExerciseCard` | (C2 ile aynı) | `isProgramExercise=true` flag; lazy yazma davranışı içeride |
| `LazyWorkoutMutation` | `lib/calc.ts` veya `queries/workouts.ts` | İlk set girişinde `app_workouts` row insert (background mutation); kart sadece görsel state'tir, set girilmeden DB'ye yazılmaz (§3.2) |
| `ProgramContextResolver` | `lib/program.ts` | Bugünün dayIndex'inden program günü adını çözer; cycle (weekly/deload) + off_days mantığı |

### State varyantları

| State | Tetik | Görünüm |
|---|---|---|
| `loading-with-program` | Active program query + day's program-day query | Skeleton, subtitle "program yükleniyor" değil — direkt subtitle skeleton |
| `program-day-empty` | Bugün program günü, henüz set yok | Programdaki egzersizler **otomatik kartlandı** (lazy); set girişi bekliyor |
| `program-day-partial` | Bazı setler girildi | C2 ile aynı; subtitle program context |
| `program-day-with-skipped` | Bazı egzersiz "sadece bugün skip" | Skip edilen egzersiz **görünmez** (`app_day_meta.skipped_exercise_ids`'de) |
| `off-day` | Bugün program off_day (örn. PPL'de Pazar) | `RestDayBanner` body'de; FAB ile manuel ekleme yine açık |
| `past-program-day` | `workout_date < today` ve o günde program çalışılmış olabilirdi | **Subtitle program context YOK** (§3.5.2); davranış C1/C2 ile aynı. Set girilmemişse **lazy kartlar render edilmez** (rev 12) — boş state (C1 empty) görünür |
| `future-program-day` | `workout_date > today` ve aktif program varsa | Subtitle program context **VAR** (planlama görünümü); lazy kartlar render |
| `program-deactivated-after-render` | Kullanıcı başka program aktif etti / bu programı pasifleştirdi | Query invalidate → C3 → C1/C2'ye transition (kartlar persist eden setler kalır, lazy kartlar kaybolur) |
| `cycle-deload-week` | Active program'da `cycle_type = 'deload'` ve bu hafta deload | Subtitle: "PPL · Deload · Hf 4". Egzersizler aynı set sayısıyla görünür ama önceki kayıt placeholder'ı deload weight (last/2 gibi) önermez — sadece "Last:" referansı görünür. *(MVP'de deload-aware placeholder mantığı yok; sadece subtitle.)* |

### Props / TS interface

```ts
// components/day/DayAppBar.tsx (C1'de tanımlandı, C3'te kullanılır)
// programContext zaten optional — C3'te doludur:
interface ProgramContext {
  programName: string;            // "PPL"
  dayLabel: string;               // "Push Day" / "Rest Day" / "Deload"
  weekNumber?: number;            // 2
  isRestDay: boolean;             // RestDayBanner trigger
  cycleStateLabel?: string;       // "Deload" gibi cycle-aware label
}

// components/day/RestDayBanner.tsx
interface RestDayBannerProps {
  programName: string;            // "PPL"
  dayLabel: string;               // "Pazar"
  onAddExerciseAnyway: () => void;  // "Yine de ekle" → C4 modal
}

// queries/workouts.ts
// Lazy/sanal yazma için query hook:
interface UseProgramDayWorkoutsResult {
  ephemeralCards: ExerciseRef[];      // programdan gelen, henüz DB'de olmayan kartlar
  persistedWorkouts: WorkoutWithSets[];  // DB'de gerçek satırlar
  skippedRefs: string[];               // app_day_meta.skipped_exercise_ids
}

interface ExerciseRef {
  ref: string;                    // slug VEYA UUID
  position: number;               // program_day'deki sıra
  resolved: ResolvedExercise;
}

// lib/program.ts
interface ResolveProgramDayInput {
  date: string;                   // 'YYYY-MM-DD'
  activeProgram: ProgramWithDays;
  todayISO: string;               // bugün
}

interface ResolveProgramDayResult {
  dayIndex: number;               // 0-6 (Pzt-Paz)
  dayLabel: string;               // i18n key resolved
  isOffDay: boolean;
  isDeloadWeek: boolean;
  weekNumber: number;             // activated_at'tan bugüne kaç hafta
  exercises: ExerciseRef[];       // off-day ise []
}
```

### Interaction notes

- **Lazy/sanal yazma akışı (kritik):**
  1. Day Detail mount + bugün program günü → `ResolveProgramDayResult.exercises` → kartlar render (her biri `isProgramExercise=true`).
  2. Bu kartlar henüz `app_workouts` tablosunda **yok**. UI sadece görsel.
  3. Kullanıcı "Bench Press" kartında "+ Set Ekle" basar → **mutation chain**:
     - `app_workouts` insert (user_id, workout_date, exercise_ref=slug, position).
     - Sonra `app_sets` insert (set 1, placeholder values).
  4. UI: önce set row görünür (optimistic), sonra arka planda iki insert tamamlanır. Hata → ikisi de rollback + UndoToast.
  5. Diğer programa ait kartlara dokunulmadıysa (kullanıcı set girmemişse) DB'ye yazılmaz. Bu, "kullanıcı 5 egzersizli push day'i açtı ama sadece 2 tanesini yaptı" durumunda DB'de sadece 2 satır olmasını sağlar.
- **Program egzersizi silme (§3.2 modal):**
  - Lazy kart silinirse (henüz DB'de yok): "Sadece bugün" → `app_day_meta.skipped_exercise_ids` push (`app_day_meta` upsert). UI'dan kayboldu. "Programdan" → `app_program_days` satırı sil + yine kart kaybolur (gelecek günlerde de gelmez). Modal **lazy** kart için bile aynı seçenekleri sunar.
  - Persisted kart (set girilmiş): aynı modal; "Sadece bugün" + `app_workouts` row'u kalır (set'ler kalır, sadece o gün için skip flag); "Programdan" + `app_workouts` kalır (bugünkü set'ler korunur, ama gelecek günlerde gelmez). **Tutarlılık önemli**: silme aksiyonu DB row'u silmiyor, sadece program ilişkisini kesiyor.
- **FAB tap (program günü):** Program-dışı ekstra egzersiz ekleme. Eklendiği zaman görsel ayrım yok (§3.2 + 3. yolculuk). DB'de `app_workouts.exercise_ref` insert; program_day ile ilişki yok.
- **Rest day banner "Yine de ekle":** FAB ile aynı işlev — C4 Add Exercise modal aç.
- **Subtitle güncelleme (cycle değişimi runtime):** Kullanıcı aktif programı değiştirirse query invalidate → subtitle anında güncellenir.
- **Geçmiş program günü:** Subtitle göstermeme kararı app bar component içinde `programContext`'i `undefined` veya `null` geçirme ile sağlanır (`workout_date < today` check route component'inde).
- **Skipped exercise display:** Kart hiç görünmez. Gizli kalmaz (silindi gibi) — kullanıcı modal'dan "Sadece bugün skip" demişti. Bir uyarı banner: "**1 egzersiz bugün için atlandı**" subtle metin (üst banner veya stat strip altında küçük satır)? **Açık soru.**
- **Haptic:** Lazy kart'a ilk set ekleme = light impact (yeni workout DB'ye yazılıyor sinyali).

### Edge cases

- **Aktif program değişti (kullanıcı bugünün ortasında PPL'den UL'a geçti):** Bugünkü `app_workouts` satırları olduğu gibi kalır (silinmez); subtitle yeni programın o günkü label'ına döner; lazy kartlar yeni program'a göre yeniden hesaplanır. Karışık görünüm olabilir — uyarı banner: "Aktif program değişti." Karar gerekli (bkz. açık sorular).
- **Active program activated_at = bugünden sonra:** Program ileride başlıyorsa bugün etkilemiyor — subtitle yok, lazy kart yok. Program activated_at = bugün ise hemen etkili.
- **Off_days değişti (kullanıcı Pazar'ı off'dan kaldırdı):** Bugün Pazar ise off-day banner kaybolur, lazy kartlar render olur (eğer Pazar için program_day var ise).
- **Cycle deload mantığı:** `activated_at`'tan bugüne hesaplanan hafta. `deload_every=4` ise hafta 4 = deload. Aşırı uzun süredir aktif programlar (örn. 30 hafta) doğru hafta numarası gösterir; deload de doğru çıkar.
- **Programda 0 egzersiz olan gün:** `app_program_days`'te o day_index için satır yok → off-day muamelesi (off_days array'inde değil ama egzersiz de yok). UI: rest day banner mı, empty state mı? **Önerim:** rest day banner (off_days'te değil ama egzersiz yoksa "açık ama planlanmamış gün" — bunu off-day gibi göster). Karar gerekli.
- **`app_day_meta.skipped_exercise_ids` array çok büyük (10+ skip):** Performance sorun değil; basit `text[]` query.
- **Program günü egzersizi DB'ye yazıldı ama sonra `app_program_days`'ten silindi (kullanıcı "programdan sil" dedi):** `app_workouts` satır kalır (set'leriyle); gelecek günlerde aynı program günü açılırsa o egzersiz **render edilmez**. Geçmiş kayıt korunur — bu doğru davranış.
- **Hafta numarası 0 veya negatif (activated_at gelecekte):** Edge — subtitle "Hafta 1" göster (en az 1). veya tamamen gizle. **Önerim:** activated_at > today ise subtitle program context yok (program henüz başlamamış).
- **i18n (rev 12'de karara bağlandı):** Program günü subtitle = `ProgramAdı · HaftanınGünü · Hf N` (örn "PPL · Pazartesi · Hf 2"). "Push Day" / "Pull Day" gibi kullanıcı-tanımlı label'lar MVP'de **yok**; MVP sonrası `app_program_days.label` field'ı eklenir. 03 §8.8.

### Prototip referansı

- **day-prototype/index.html → Phone 1 (idle)**: Tüm ex-card'ların boş şekilde render edilmesi (= lazy kartlar render). Doğrudan referans.
- **Farklar (MVP):**
  - Prototipte app bar subtitle "Pull day · Today" — MVP'de "PPL · Push Day · Hf 2" gibi 3 katmanlı (program adı + gün label + hafta). Daha uzun olabilir; clip etmeyecek şekilde wrap.
  - Prototipte rest day görüntülenmemiş — MVP için yeni component (`RestDayBanner`). Marka rengi info-teal (`--info` veya `--cat-leg`'den türeme) ile çelişmesin.
  - "0 / 20" planned target prototipteki gibi day-summary'de görünür (C1'de "/ 20" gizliydi, C3'te belirir).
- Token'lar: subtitle için `--t-secondary`; rest banner için `--info-bg` ve `--info-fg` (yeni token gerekebilir).

### Karara bağlandı (rev 3)

- **Program günü label MVP'de yok:** Subtitle = `ProgramAdı · HaftanınGünü · Hf N` (örn "PPL · Pazartesi · Hf 2"). "Push Day" gibi custom label'lar MVP sonrası; `app_program_days.label` field MVP'de eklenmez. 03 §8.8 (rev 12).
- **Geçmiş program günü lazy render YOK:** `workout_date < today` ve o güne set girilmemişse → C1 empty state gösterilir. Lazy kartlar render edilmez (kullanıcı şaşkınlığını önler). 03 §8.8 (rev 12).

### Açık sorular (kalan)

- **Subtitle hafta numarası gösterimi (TR "Hf 2" vs "Hafta 2"):** Subtitle uzun — kısaltma mı tam mı? **Önerim:** "Hf 2" (kompakt). Karar gerekli.
- **Aktif program runtime değişiminde uyarı:** Bugünün ortasında kullanıcı aktif programı değiştirirse subtitle ve kartlar değişir. Uyarı banner gerekli mi? **Önerim:** sessiz değişim + invalidate; banner gereksiz friction.
- **Skipped exercise banner:** "1 egzersiz atlandı" subtle metni var mı yok mu? **Önerim:** yok (sessiz skip; kullanıcı bilinçli karar verdi).
- **Programda 0 egzersizli açık gün (off_days'te değil):** Rest day mı, empty state mı? **Önerim:** rest day görüntüsü (programatik off-day).
- **Cycle "deload week" placeholder weight hesabı:** Last weight × 0.7 gibi otomatik öneri MVP'de var mı? **Önerim:** yok (sadece "Last:" referansı, kullanıcı manuel ayarlar).

---

## C4 Add Exercise modal

### Niyet & yolculuk konteksti
Kullanıcı bir günde egzersiz eklemek istiyor. C1 "+ Egzersiz Ekle" CTA'sından veya C2/C3 FAB'ından açılır. Hibrit multi-select (§3.7): tek tap = anında ekle + modal kapan; long-press = multi-select mode. Üç sekme: **Kütüphanem** (custom + kullanılmış preset'ler), **Hazır Hareketler** (54 preset), **Yeni Özel**. Kategori chips ile filtreleme.

**1. yolculuğun 7-8. adımları**, **2. yolculuğun ekstra egzersiz ekleme** akışı, **3. yolculuğun programa olmayan ekstra egzersiz** akışı bu modal'da birleşir.

### Layout sketch

**Default state (single tap mode):**
```
┌─────────────────────────────┐
│  ════                       │  ← bottom sheet drag handle
│                             │
│ 🔍 Hareket ara              ✕│  ← search input + close
│                             │
│ [Kütüphanem][Hazır][+ Özel] │  ← segmented tab (3)
│                             │
│ ▓All ░Göğüs ░Sırt ░Omuz ░...│  ← category chip strip (horizontal scroll)
│                             │
│ ▔ A ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔  │  ← alfabetik section header
│ ┌─────────────────────────┐ │
│ │ 🟢 Arnold Press         │ │  ← row: kategori dot + ad + (PR/last hint)
│ │    Omuz · 22 kg PR      │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 🔵 Bench Press          │ │
│ │    Göğüs · Last 3g önce │ │
│ └─────────────────────────┘ │
│ ▔ C ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔  │
│ ┌─────────────────────────┐ │
│ │ 🟢 Cable Row            │ │
│ │    Sırt                 │ │
│ └─────────────────────────┘ │
│  ...                        │
│                             │
└─────────────────────────────┘
```

**Multi-select state (long-press sonrası):**
```
┌─────────────────────────────┐
│  ════                       │
│                             │
│  ← Seçim Modu          [İptal]│  ← header değişir: count + cancel
│  3 hareket seçildi          │
│                             │
│ ▓All ░Göğüs ░Sırt ░Omuz ░...│
│                             │
│ ┌─────────────────────────┐ │
│ │ ☑ 🔵 Bench Press        │ │  ← seçili: checkbox + light gold bg
│ │    Göğüs                 │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ ☐ 🔵 Incline Press      │ │  ← seçilmemiş: empty checkbox
│ │    Göğüs                 │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ ☑ 🟢 Cable Row          │ │
│ │    Sırt                 │ │
│ └─────────────────────────┘ │
│  ...                        │
│                             │
│  ┌──────────────────────┐   │
│  │ 3 hareket · Ekle  →  │   │  ← sticky alt bar: count + Ekle
│  └──────────────────────┘   │
└─────────────────────────────┘
```

**"Yeni Özel" tab:**
```
┌─────────────────────────────┐
│  ════                       │
│                             │
│  ←  Yeni Özel Hareket   ✕   │
│                             │
│  ┌─────────────────────┐    │
│  │  Egzersiz adı *      │    │
│  └─────────────────────┘    │
│                             │
│  Kategori (opsiyonel)        │
│  [Göğüs][Sırt][Omuz][...]   │  ← chip select (multi)
│                             │
│  ┌─────────────────────┐    │
│  │  Not (opsiyonel)     │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │  Oluştur & Ekle      │    │
│  └─────────────────────┘    │
│                             │
│  Sadece kütüphaneme ekle    │  ← secondary text link
│                             │
└─────────────────────────────┘
```

### Component breakdown

| Component | Konum | Görevi |
|---|---|---|
| `AddExerciseSheet` | `components/workout/AddExerciseSheet.tsx` | Bottom sheet wrapper (`@gorhom/bottom-sheet` veya `react-native-bottom-sheet`); modal entry component |
| `SearchInput` | `components/ui/SearchInput.tsx` | Magnifier icon + input + clear button. Debounced 200ms |
| `SegmentedTabs` | `components/ui/SegmentedTabs.tsx` | 3 tab: Kütüphanem / Hazır / Yeni Özel. Active state altın |
| `CategoryChipStrip` | `components/workout/CategoryChipStrip.tsx` | Horizontal scrollable chips: All + 8 kategori. Multi-select VEYA single-select (radio); MVP'de **single** |
| `ExerciseList` | `components/workout/ExerciseList.tsx` | Alfabetik gruplanmış liste; FlashList (virtualized) |
| `ExerciseListSection` | `components/workout/ExerciseListSection.tsx` | Letter header + rows |
| `ExerciseListRow` | `components/workout/ExerciseListRow.tsx` | Tek satır: kategori dot + ad + (alt satırda kategori + stat hint) + selection state |
| `MultiSelectBar` | `components/workout/MultiSelectBar.tsx` | Sticky alt bar: "N hareket · Ekle" buton |
| `NewCustomExerciseForm` | `components/workout/NewCustomExerciseForm.tsx` | "Yeni Özel" tab form: name + categories chip select + note + 2 buton |
| `EmptyTabState` | `components/workout/EmptyTabState.tsx` | "Kütüphanem boş" / "Aramada sonuç yok" — boş state mesajı |

### State varyantları

| State | Tetik | Görünüm |
|---|---|---|
| `tab-library-empty` | Kütüphanem sekmesi + custom + kullanılmış preset = 0 | EmptyTabState: "Henüz kütüphanende hareket yok. Hazır sekmesinden ekle veya yeni özel oluştur." + 2 link |
| `tab-library-populated` | Kullanıcının custom + **tüm tarihçede kullandığı** preset'ler (rev 12) | Alfabetik liste — her zaman kullanılmış preset slug'lar (distinct from `app_workouts.exercise_ref`), tarih filtresi yok |
| `tab-presets` | "Hazır" sekmesi | 54 preset alfabetik liste |
| `tab-new-custom` | "Yeni Özel" sekmesi | NewCustomExerciseForm |
| `search-active` | Search input dolu | Liste filtrelenir (her sekmede); aramada eşleşme yoksa "Aramada sonuç yok" |
| `category-filter-active` | Category chip seçildi (All değil) | Liste o kategoriye göre filtrelenir; chip altın highlight |
| `single-tap-mode` (default) | Selection state boş | Row tap → anında ekle + sheet kapan + parent C1/C2/C3'te ex-card render |
| `long-press-mode` | Row long-press → multi-select aç | Header değişir: "Seçim Modu / X hareket / İptal"; tüm row'lar checkbox göster; sticky alt bar |
| `multi-select-with-items` | Multi-mode + ≥1 seçim | "3 hareket · Ekle" CTA aktif |
| `multi-select-empty` | Multi-mode aktif ama 0 seçim | CTA disabled "0 hareket" veya İptal'le çık |
| `adding` | "Ekle" basıldı, mutation pending | CTA spinner + lock |
| `adding-error` | Insert fail | UndoToast veya inline banner |
| `success` | Insert ok | Sheet kapan + parent ekrana toast: "1 hareket eklendi" / "3 hareket eklendi" |
| `custom-form-validating` | "Oluştur & Ekle" basıldı | Name boşsa error; categories boşsa default "Diğer" (§8.6) |
| `custom-form-submitting` | Insert app_exercises | CTA spinner |
| `custom-form-success` | Insert ok | Sheet kapan + toast (varsa "Ekle" kullanıldıysa C1/C2/C3'e de ekle; "Sadece kütüphane" kullanıldıysa sadece kütüphane güncel) |
| `keyboard-open` | Search veya form input focus | Bottom sheet snap point yükselir (klavye üzerinde) |

### Props / TS interface

```ts
// components/workout/AddExerciseSheet.tsx
interface AddExerciseSheetProps {
  visible: boolean;
  initialTab?: 'library' | 'presets' | 'new';   // default 'library'
  onClose: () => void;
  onAddToDay: (refs: string[]) => void;          // selection sonucu — 1 veya N ref
  // refs: slug (preset) veya UUID (custom). C2/C3'te app_workouts insert chain'ini parent yönetir.
  workoutContext: {
    dateISO: string;
    activeProgramId?: string;
  };
}

// components/workout/ExerciseListRow.tsx
interface ExerciseListRowProps {
  exercise: ResolvedExercise;
  statHint?: string;             // örn "PR 22 kg" veya "Last 3g önce"
  selectionMode: 'single' | 'multi';
  isSelected: boolean;
  onTap: () => void;             // single mode: ekle+kapat; multi mode: toggle select
  onLongPress: () => void;       // single mode'da long-press multi'ye geçirir
}

// components/workout/SegmentedTabs.tsx
interface SegmentedTabsProps<T extends string> {
  options: Array<{ key: T; label: string; count?: number; icon?: React.ReactNode }>;
  value: T;
  onChange: (v: T) => void;
}

// components/workout/CategoryChipStrip.tsx
interface CategoryChipStripProps {
  selectedCategory: CategoryKey | 'all';
  onSelect: (cat: CategoryKey | 'all') => void;
  // MVP'de tek seçim; multi-filter MVP sonrası
}

// components/workout/NewCustomExerciseForm.tsx
interface NewCustomExerciseFormProps {
  onCreateAndAdd: (input: NewCustomExerciseInput) => void;
  onCreateLibraryOnly: (input: NewCustomExerciseInput) => void;
  onCancel: () => void;
}

interface NewCustomExerciseInput {
  name: string;                  // trimmed, 1-60 char
  categories: CategoryKey[];     // empty → default ['other'] (§8.6)
  notes?: string;
}

// components/workout/MultiSelectBar.tsx
interface MultiSelectBarProps {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}
```

### Interaction notes

- **Açılış animasyonu:** Bottom sheet slide-up 220ms cubic-bezier. Backdrop fade-in. Initial snap point ~%85 height; klavye açılınca %95.
- **Dismiss:** Drag handle aşağı pull + threshold geç + release → kapan. Backdrop tap → kapan. Hardware back (Android) → kapan veya multi-select aktifse önce select mode'dan çık.
- **Tab geçişi:** Tap → instant switch (no animation gecikme); listeyi de değiştirir; search query korunur, category filter korunur.
- **Search input:**
  - Debounced 200ms.
  - Multi-token: "incline bench" → her iki kelimeyi içeren eşleşmeler (preset adı + kategoriler + notlar).
  - Eşleşme yoksa: "Aramada sonuç yok. Yeni Özel oluştur." link.
  - Klavye return key → blur (focus listede ilk satıra geçmez — RN'de sheet içi focus management).
- **Category chip:** Tap → tek seçim (radio); ikinci tap → All'a döner. Visual: seçili chip gold border + fill.
- **Single-tap mode:**
  - Row tap → optimistic insert + sheet close (200ms) + parent ekran refresh.
  - Insert detayı: preset ise slug'la `app_workouts.exercise_ref` insert; custom ise UUID; aktif programdaysa lazy/sanal kart bypass — direkt persisted insert (kullanıcı bilinçli ekledi).
- **Long-press → multi-select:**
  - 500ms hold; haptic medium impact.
  - İlk seçim row long-press oluyor; header "Seçim Modu"na döner; alt sticky bar belirir.
  - Diğer row'lar single-tap = toggle (artık long-press değil — tek tap multi seçim ekler/kaldırır).
  - "İptal" header'da → multi mode kapanır + seçimler iptal.
  - "N hareket · Ekle" → bulk insert (her ref için `app_workouts` insert, sıralı setIndex yok — egzersiz başına ayrı kart). Mutation kuyrukta, optimistic UI.
- **"Yeni Özel" form:**
  - Name input autoFocus.
  - Categories chip multi-select (boşsa default `other`).
  - "Oluştur & Ekle" → `app_exercises` insert (custom) + `app_workouts` insert (day'e) + sheet kapan.
  - "Sadece kütüphaneme ekle" → `app_exercises` insert; sheet **kapanmaz**, tab "Kütüphanem"a döner ve yeni eklenen üstte highlight.
- **Liste virtualization:** 54 preset + N custom için FlashList. estimatedItemSize ~64.
- **Empty state link tap:** "Yeni Özel oluştur" → tab "new"e geç.
- **Haptic:**
  - Long-press başlangıcı: medium impact.
  - Row tap (single mode): light impact.
  - Multi-select toggle: selection.
  - "Ekle" success: notification.

### Edge cases

- **Aynı gün aynı egzersiz iki kez eklenmek istense:** Şema `UNIQUE(user_id, workout_date, exercise_ref)` engeller. Single-tap'te DB error → toast: "Bu hareket bugün zaten var." Multi-select'te de aynı; duplicates skipped + toast "2 hareket eklendi, 1 zaten vardı" gibi.
- **Klavye açıkken sheet snap:** %95 height. Klavye close → %85'e geri.
- **Çok uzun egzersiz adı (Türkçe 60 char):** Row 2 satıra wrap; ad t-primary, kategori + stat alt satıra.
- **Custom egzersiz adı duplicate:** Aynı isimde custom var. **Önerim:** izin ver (kullanıcı bilinçli). Aynı isim 2 row görünür; karışıklığı kullanıcı çözer. Karar gerekli.
- **Search Türkçe karakter (i ile ı / I ile İ):** Locale-aware lowercasing zorunlu. `text.toLocaleLowerCase('tr')` (RN'de Intl varsayılan değil — `intl-collator` polyfill veya manuel char map). Karar gerekli — i18n testlerinde yakalanmalı.
- **Network down + bulk insert:** Kuyrukta retry. Offline-first MVP'de yok; "Çevrimdışı — eklenenler sonra senkronize edilecek" banner mı? **Önerim:** basit fail + UndoToast.
- **Multi-select 50+ seçim:** Performance — UI hala responsive olmalı. State array; mutation paralel.
- **"Kütüphanem" sekmesi: hangi egzersizler dahil?** Custom + **tüm tarihçede** kullanılmış preset'ler (rev 12). `app_workouts.exercise_ref` distinct'ten türetilir; tarih sınırı yok.
- **Yeni custom egzersiz adı çakışması preset'le:** "Bench Press" custom oluşturulmak istense (preset zaten var). **Önerim:** uyar: "Aynı isimde bir hazır hareket var. Devam etmek istiyor musun?" Karar gerekli.
- **Accessibility:** Multi-select toggle VoiceOver: "Bench Press, seçildi" / "Bench Press, seçilmedi". Long-press için VO action: "Toggle selection mode".
- **Custom egzersiz oluşturulduktan sonra silinmesi:** Modal içinde yok; D1 Library tab'ında yapılır (sonraki seans). Burada sadece "create" vardır.

### Prototip referansı

- **workout-prototype/index.html → Phone 1 (Exercises tab)**: app bar + search + filter + category chip strip + alfabetik liste yapısı doğrudan referans. Bottom nav prototipte var; modal'da yok (modal sheet içinde bottom nav gizli).
- **Farklar (MVP):**
  - Modal **bottom sheet** olarak açılır, full-screen route değil. Drag handle üstte; close X üst sağda.
  - 3 sekme (Kütüphanem / Hazır / Yeni Özel) — prototipte 2 sekme (Exercises / Programs). MVP'de modal sadece egzersiz scope; sekme yapısı farklı.
  - Multi-select bar prototipte yok; MVP yeni feature.
  - Custom egzersiz formu prototipte yok; MVP yeni.
- Token'lar: search input, chip stripe, list row stilleri prototipten birebir.

### Karara bağlandı (rev 3)

- **"Kütüphanem" tabının kapsamı:** Custom egzersizler + **tüm tarihçede kullanılmış** preset slug'lar (distinct from `app_workouts.exercise_ref`). Tarih filtresi yok; eski denemeler de listede kalır. 03 §8.8 (rev 12).

### Açık sorular (kalan)

- **Category chip multi-select mi single mi?** **Önerim:** single (MVP basit); multi sonra.
- **"Yeni Özel" sheet içinde mi yoksa ayrı modal mı?** Sketch sheet içinde 3. tab. Alternatif: "Yeni Özel" → ayrı bottom sheet (modal-in-modal). **Önerim:** aynı sheet'in 3. tab'ında (sketch'teki gibi); modal yığını yok.
- **Multi-select'te category filter değişirse seçimler kaybolur mu?** **Önerim:** seçimler korunur (filter sadece görünüm değiştirir). Karar gerekli.
- **Long-press trigger hold süresi:** 400ms mi 500ms mi? **Önerim:** 500ms (yanlış tetik önlemek için).
- **Single-tap mode'da hızlı ardarda 2 tap (yanlışlık önleme):** Optimistic insert + 200ms close → kullanıcı 2. tap'i yapmadan modal zaten kapanır. Edge OK.
- **Custom egzersiz "kategori yok = Diğer" gösterimi:** §8.6 default. Form'da chip seçilmediğinde küçük helper text "Seçim yapılmazsa: Diğer". Karar gerekli — gösterilsin mi?
- **Sheet açıkken parent ekranın scroll'u:** Disabled. Backdrop tap = sheet kapan.
- **Bottom nav modal sırasında:** Bottom sheet açıkken bottom nav gizli (sheet alta kadar uzanır).
- **Custom egzersize gif / image MVP'de var mı?** Preset'lerin gif'i var (`data/ex-preview.js`); custom için boş mu yoksa kullanıcı gif yükleyebilir mi? **Önerim:** custom için gif yok (MVP), preview modal'da sadece açıklama.

---

## D1 Library — Exercises tab

### Niyet & yolculuk konteksti
Kullanıcının **egzersiz havuzunu** tek ekranda görüp yönettiği yer. C4 Add Exercise modal "bir günde egzersiz seçme" eylemine odaklıyken, D1 günle bağlantısız bir **kütüphane görünümü**: tüm preset hareketler + kullanıcının custom egzersizleri tek alfabetik liste, search + kategori filtre, her satırda PR/son kullanım hint'i. Row tap → ex preview modal (gif + açıklama + tips); kart üzerinde ⋯ menüsü ile **custom egzersizler** için edit/delete, **preset'ler** için sadece preview ("Bu hareket hazır havuzdan, düzenlenemez" notu).

D1, **bottom nav'in 2. sekmesi** (`Library / Kütüphane`) altında — segmented control üst kısımda Exercises ↔ Programs (§3.1, D4 kararı). İç path `app/(app)/workout/` sabit, UI string i18n key `nav.library`. D1, doğrudan kullanıcı yolculuklarının ana adımı değil — **destek ekran**: 1. yolculukta yeni kullanıcı henüz custom oluşturmadıysa kütüphanesi sadece preset'ler (54 hareket) listesi olur; 2./3. yolculukta kullanıcı zaman zaman "hangi hareketleri yaptım, PR'ım ne?" sorgusu için açar; C4'ten farklı olarak buradan **gün'e ekleme yok** — buradan kütüphane yönetimi yapılır.

§3.1 (Library/Kütüphane sekme adı), §3.7 (Add Exercise modal sekmeleri — D1 ile component reuse) ve §8.8 (rev 12 — empty Dumbbell icon, responsive layout) doğrultusunda.

### Layout sketch

**Default state (populated):**

```
┌─────────────────────────────┐
│  [status bar]               │
│  ☰   Workout         [+ New]│  ← app bar: menu + title + add-pill
│      24 hareket             │     (24 = custom + tüm tarihçede kullanılmış preset distinct count)
│                             │
│ [▣ Exercises  24][▤ Programs 4]│  ← segmented control (D1 = sol aktif)
│                             │
│ ┌─────────────────────────┐ │
│ │ 🔍 Hareket ara         🔽│ │  ← search input + filter funnel icon
│ └─────────────────────────┘ │
│                             │
│ ▓All ░Göğüs ░Sırt ░Omuz ▶  │  ← kategori chip strip (horizontal scroll)
│                             │
│ ▔ A ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔  │  ← alfabetik letter head (sticky)
│ ┃ Arnold Press       22 PR │  ← accent bar (sol kenar, kategori rengi) + ad + PR
│ │ • Omuz · 2 gün önce   ›   │     alt satır: cat-chip + lastUsed + chev
│ ┃ ───────────────────────  │
│ ┃ Bench Press        90 PR │
│ │ • Göğüs · dün           › │
│ ┃ ───────────────────────  │
│ ▔ C ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔  │
│ ┃ Cable Row          68 PR │
│ │ • Sırt · bugün          › │
│ ┃ ...                       │
│         (scroll devam)       │
│                             │
│ [Cal][Lib][Dash][Soc][More] │  ← bottom nav (Lib aktif)
└─────────────────────────────┘
```

**Empty state (yeni kullanıcı / hiç hareket yok):**

```
┌─────────────────────────────┐
│  ☰   Workout         [+ New]│
│      0 hareket              │
│                             │
│ [▣ Exercises  0][▤ Programs 0]│
│                             │
│         [Dumbbell-48pt]     │  ← lucide Dumbbell, t-tertiary
│                             │
│   Henüz kütüphanende        │
│   hareket yok               │
│                             │
│   Bir antrenmana hareket    │
│   ekledikçe burada listelenir│
│   veya kendi özelini oluştur.│
│                             │
│       ┌─────────────┐       │
│       │ + Yeni Özel │       │  ← tek CTA (rev 13 — sadeleştirildi)
│       └─────────────┘       │
│                             │
│ [Cal][Lib][Dash][Soc][More] │
└─────────────────────────────┘
```

> **Not — empty state'in tetik koşulu:** "Kütüphane boş" demek = `app_exercises` (custom) count = 0 **ve** `app_workouts.exercise_ref` distinct preset slug count = 0. Yani kullanıcı bir günde Bench Press'i bir kez ekleyip silmiş bile olsa o slug "tarihçede kullanılmış" sayılır ve listede kalır (§8.8 rev 12: C4 Kütüphanem ile tutarlı kapsam). Empty state çoğunlukla **yeni kullanıcı** veya **misafir + henüz hiç workout girmemiş** durumda görünür.

> **"Hazır Listele" CTA kaldırıldı (rev 13):** D1 niyetine (özel egzersiz oluşturma + kütüphane yönetimi) odaklı kalmak için empty state tek CTA: "+ Yeni Özel". Preset keşfi B1 hint kartı + C1 secondary CTA + C4 modal "Hazır Hareketler" tab'ı üzerinden devam eder. Preset hareketler kütüphaneye "kullanmadan" girmez — bu zaten §8.8 C4 Kütüphanem kapsamıyla tutarlı.

### Component breakdown

| Component | Konum | Görevi |
|---|---|---|
| `app/(app)/workout/index.tsx` | route | Library ana ekranı; segmented state burada (`'exercises' \| 'programs'`); ikisi de aynı route — content swap |
| `AppScreen` | `components/ui/AppScreen.tsx` | SafeAreaView + bg |
| `LibraryAppBar` | `components/workout/LibraryAppBar.tsx` | Menu icon + title ("Workout") + subtitle (item count) + add-pill ("+ New") |
| `WorkoutSegmentedControl` | `components/workout/WorkoutSegmentedControl.tsx` | İki sekme: Exercises / Programs. C4'tekiyle **görsel olarak tutarlı** ama state ayrı (C4 modal içi; bu ekran route'u) — ortak `SegmentedTabs` primitive paylaşılır (components/ui/SegmentedTabs.tsx, C4'te tanıtıldı) |
| `LibrarySearchRow` | `components/workout/LibrarySearchRow.tsx` | Search input + filter funnel icon. C4 SearchInput primitive reuse |
| `CategoryChipStrip` | `components/workout/CategoryChipStrip.tsx` | **C4 ile birebir aynı component** (single-select, All + 8 kategori). |
| `ExerciseLibraryList` | `components/workout/ExerciseLibraryList.tsx` | Alfabetik gruplanmış FlashList — D1'in ana içeriği. C4'teki ExerciseList'ten **farklı**: bu liste row'da PR + lastUsed göstergesi içerir, selection mode yok (tek tap = preview aç) |
| `LibraryExerciseRow` | `components/workout/LibraryExerciseRow.tsx` | Tek satır: sol accent bar (primary cat rengi) + ad + alt satırda cat-chip + lastUsed + sağda PR pill + chev. Long-press → ⋯ menü açar (bottom sheet) |
| `LibraryLetterHead` | `components/workout/LibraryLetterHead.tsx` | Sticky letter section header. FlashList stickyHeaderIndices |
| `ExerciseRowMenu` | `components/workout/ExerciseRowMenu.tsx` | ⋯ bottom sheet: Preview, (custom ise) Edit, (custom ise) Delete, (preset ise) "Hazır hareket — sadece görüntülenir" disabled satırı |
| `ExPreviewModal` | `components/ui/ExPreviewModal.tsx` | C2 ile **ortak** — gif + açıklama + tips; web `components/ex-preview-modal.js` portu |
| `CustomExerciseEditSheet` | `components/workout/CustomExerciseEditSheet.tsx` | Custom egzersiz düzenleme bottom sheet — name + categories + note. C4'teki NewCustomExerciseForm'un edit varyantı |
| `LibraryEmptyState` | `components/workout/LibraryEmptyState.tsx` | Dumbbell-48pt + başlık + açıklama + 2 yan yana CTA (responsive — §8.8) |
| `AddExerciseSheet` | `components/workout/AddExerciseSheet.tsx` | **C4 ile aynı component**; "+ New" pill ya da empty CTA "Hazır Listele" buradan tetikler. Önemli: D1'den açılan C4 modal'ının `workoutContext` yok — `onAddToDay` yerine `onAddToLibrary` mode (bkz. Interaction notes) |
| `BottomTabBar` | `components/ui/BottomTabBar.tsx` | B1 ile aynı; Library sekmesi aktif |

### State varyantları

| State | Tetik | Görünüm |
|---|---|---|
| `loading` | İlk mount, query running (custom + distinct preset slugs) | Skeleton: 5-6 row shimmer; segment + search yapı sabit |
| `empty` | Custom count = 0 + distinct preset count = 0 | Yukarıdaki empty layout |
| `populated` | En az 1 satır | Alfabetik liste |
| `search-active` | Search input dolu | Liste filtrelenir; eşleşme yoksa "Aramada sonuç yok" satır + "Yeni Özel oluştur" link |
| `category-filter-active` | Category chip seçildi (All değil) | Liste o kategori birincil veya ikincil olanlarla filtrelenir |
| `row-menu-open` | Row long-press veya ⋯ tap | ExerciseRowMenu bottom sheet açılır |
| `preview-open` | Row single-tap veya ⋯ → Preview | ExPreviewModal açılır (gif + açıklama + tips) |
| `edit-sheet-open` | ⋯ → Edit (sadece custom) | CustomExerciseEditSheet açılır, mevcut değerler doldurulmuş |
| `delete-confirm-open` | ⋯ → Delete (sadece custom) | Native Alert: "Bu egzersizi sil? Geçmiş antrenmanların etkilenmez." [İptal] [Sil] |
| `add-sheet-open` | "+ New" pill tap veya empty CTA "+ Yeni Özel" | C4 AddExerciseSheet açılır (library mode — bkz. Interaction) |
| `library-after-delete` | Custom delete success | Satır kaybolur (optimistic) + UndoToast: "Egzersiz silindi. [Geri al]" (5sn) |
| `error-load` | Query fail | Üst banner: "Yükleme sorunu. [Tekrar dene]" + cache'den render devam |
| `guest-mode` | Auth yok | Görsel ayrım yok; veri kaynağı AsyncStorage (`@logwise/guest/exercises`); preset slug'ları da AsyncStorage `@logwise/guest/workouts.exercise_ref` distinct'ten gelir |

### Props / TS interface

```ts
// app/(app)/workout/index.tsx
export default function WorkoutScreen() {
  // segmented state: 'exercises' | 'programs'
  // her iki sekmenin içeriği bu route altında render
}

// components/workout/LibraryAppBar.tsx
interface LibraryAppBarProps {
  countLabel: string;             // "24 hareket" / "24 exercises"
  onMenuPress: () => void;        // hamburger → ... (More? veya boş slot — karar)
  onAddPress: () => void;         // "+ New" → C4 AddExerciseSheet (library mode)
}

// components/workout/WorkoutSegmentedControl.tsx
interface WorkoutSegmentedControlProps {
  value: 'exercises' | 'programs';
  onChange: (v: 'exercises' | 'programs') => void;
  exerciseCount: number;
  programCount: number;
}

// components/workout/ExerciseLibraryList.tsx
interface ExerciseLibraryListProps {
  items: LibraryExercise[];        // alfabetik sıralı, preset+custom karışık
  searchQuery: string;
  categoryFilter: CategoryKey | 'all';
  onRowPress: (ex: LibraryExercise) => void;       // → preview modal
  onRowLongPress: (ex: LibraryExercise) => void;   // → ExerciseRowMenu
  onRowMenuPress: (ex: LibraryExercise) => void;   // ⋯ icon tap — long-press ile aynı sonuç
}

interface LibraryExercise {
  ref: string;                    // slug VEYA UUID (§4.3 polymorphic)
  name: string;
  categories: CategoryKey[];      // primary = [0]; accent bar rengi
  isPreset: boolean;              // true → preset bundle'dan; false → custom (app_exercises row)
  stats?: {
    prDisplay?: string;           // "90 kg × 5" — calcPR'dan; yoksa undefined
    lastUsedDisplay?: string;     // "bugün" / "2 gün önce" / "1 hafta önce" — relative; yoksa undefined
    timesUsed?: number;           // tüm tarihçede kaç kez (opsiyonel — gelecekte detay panelinde)
  };
  notes?: string;                 // sadece custom için
}

// components/workout/LibraryExerciseRow.tsx
interface LibraryExerciseRowProps {
  exercise: LibraryExercise;
  onPress: () => void;
  onLongPress: () => void;
  onMenuPress: () => void;        // ⋯ icon tap
}

// components/workout/ExerciseRowMenu.tsx
interface ExerciseRowMenuProps {
  visible: boolean;
  exercise: LibraryExercise;
  onClose: () => void;
  onPreview: () => void;
  onEdit?: () => void;            // sadece custom için
  onDelete?: () => void;          // sadece custom için
}

// components/workout/CustomExerciseEditSheet.tsx
interface CustomExerciseEditSheetProps {
  visible: boolean;
  exercise: LibraryExercise;      // custom (ref = UUID)
  onSave: (patch: CustomExercisePatch) => void;
  onCancel: () => void;
}

interface CustomExercisePatch {
  name?: string;
  categories?: CategoryKey[];
  notes?: string;
}

// components/workout/LibraryEmptyState.tsx
interface LibraryEmptyStateProps {
  onOpenNewCustom: () => void;    // "+ Yeni Özel" → C4 AddExerciseSheet, initialTab='new' (tek CTA — rev 13)
}
```

### Interaction notes

- **Segmented control tap (Exercises ↔ Programs):** Aynı route'un içeriği değişir; URL değişmez. State `route.params` yerine ekranın kendi state'i. Search/filter state **sekmeye özel** — Exercises filtresi Programs'a taşmaz.
- **"+ New" pill (app bar):** C4 AddExerciseSheet açılır — `workoutContext` yok (gün'e eklenmiyor). `onAddToDay` yerine bir varyant `mode: 'library'` ile çalışır:
  - Single-tap row → custom oluştur ([Yeni Özel] tab) **veya** preset kullanım eklemek için "Bu hareketi kullandığım say" yok; preset eklemek kütüphaneyi etkilemez (preset zaten havuzda, kullanım için gün'de ekle).
  - **Karar gerekli:** "+ New" sadece "Yeni Özel" tab'ında mı açılır (initialTab='new'), yoksa 3 tab da görünür mü? **Önerim:** initialTab='new' — D1'den ana niyet kütüphaneye yeni öğe eklemek, preset zaten kullanım = workout ekleme.
- **Row tap → Preview:** ExPreviewModal açılır. C2/C3'teki 👁 tap ile aynı component, aynı içerik (gif + uzun açıklama + tips). Custom egzersizler için gif yok (§C4 açık sorusu); modal sadece custom name + categories + notes göster.
- **Row long-press veya ⋯ icon → ExerciseRowMenu:** Bottom sheet açılır. Custom ise 3 satır (Preview, Edit, Delete); preset ise 2 satır (Preview, "Hazır hareket — düzenlenemez" disabled bilgi satırı).
- **Edit (custom):** CustomExerciseEditSheet açılır, mevcut değerler doldurulmuş. Save → optimistic update + `app_exercises` UPDATE. İsim değişirse `app_workouts.exercise_ref` etkilenmez (ref UUID, isim resolve'da çekilir).
- **Delete (custom):** Native Alert confirm. Onay → optimistic kaldır + `app_exercises` DELETE.
  - **Cascade davranışı (rev 13 — kesin karar):** `app_workouts.exercise_ref` text alanı **soft reference** (FK değil). Custom egzersiz silinince `app_exercises` DELETE; ilgili `app_workouts` ve `app_sets` satırları **persist eder**. Resolve sırasında UUID bulunamazsa fallback display: `"(silinmiş egzersiz)"`. Modal mesajı: "Geçmiş antrenmanların etkilenmez, sadece kütüphaneden kalkar." Soft-delete tablosu (`deleted_at` kolonu) yok — şema sade.
  - UndoToast: "Bench Press v2 silindi. [Geri al]" 5sn.
- **Search input:** Debounced 200ms. Multi-token, Türkçe-aware lowercase (C4 ile ortak utility — bkz. açık sorular). Eşleşme yoksa: "Aramada sonuç yok. [+ Yeni Özel oluştur]" link.
- **Category chip:** C4 ile aynı davranış — single-select (radio). İkincil kategorisi de eşleşen egzersiz dahil (örn. Deadlift `[back, leg]` → "Back" filtresinde görünür).
- **PR pill:** Tap → preview açılmaz, PR detay (hangi tarih, hangi set type) bir tooltip veya inline expand olabilir. **MVP'de:** decorative; tap'i row tap'iyle aynı (preview aç). Açık soru.
- **Hamburger menü icon (app bar):** **Hamburger korunur** (rev 13 — workout-prototype'a sadık). Tap → bottom sheet More. B1 Calendar'da avatar kalır (calendar-prototype-v2 referansı); her ekran kendi prototip imzasını taşır. Bottom nav More zaten 5. öğe olarak ayrı duruyor — hamburger ile More bottom sheet ortak `<MoreSheet>` component'i çağırır, iki entry point parallel çalışır.
- **App bar add-pill ile FAB karşılaştırması:** Day Detail'de FAB var (her zaman); D1'de FAB **yok**, sadece app bar "+ New" pill. C4'ün açılış noktası ana farklılık.
- **Sticky letter heads:** FlashList `stickyHeaderIndices` veya SectionList. Scroll sırasında "A", "B", "C" yapışkan kalır; UX kolay tarama için.
- **Pull-to-refresh:** Üstten swipe → query invalidate (TanStack Query). Kullanıcının başka cihazdan eklediği custom egzersizleri çeker.
- **Empty state CTA sadeleştirildi (rev 13):** Empty state tek CTA → **"+ Yeni Özel"**. "Hazır Listele" CTA'sı kaldırıldı. Preset keşfi B1 hint kartı + C1 secondary CTA + C4 modal üzerinden devam eder. D1 niyetine (kütüphane yönetimi + özel egzersiz oluşturma) odaklı, daha temiz arayüz.
- **Haptic:** Row long-press → medium impact. Delete confirm → medium impact. Pull-to-refresh → default RN.

### Edge cases

- **Aynı isimle hem preset hem custom (örn. kullanıcı "Bench Press" custom oluşturdu):** Liste iki satır gösterir. Custom satırı isim sonuna küçük "(Özel)" hint metni alır — karışmasın diye. (Karar gerekli, C4 açık sorularıyla ortak.)
- **Custom egzersiz `categories = []`:** §8.6 default `['other']` — empty array DB'ye gelmemeli; gelirse render "Diğer" chip ile.
- **Preset slug bundle'da yok ama tarihçede var (eski preset silindi/rename'lendi):** Resolve fail → row "(bilinmeyen hareket: <slug>)" ile fallback. Edit/delete pasif.
- **Custom egzersiz çok uzun isim (60+ char):** Row 2 satır wrap.
- **PR display yok (egzersiz hiç set yapılmamış ama tarihçede ref var):** "—" göster veya pill gizle. **Önerim:** pill yok (lastUsed da yok → kullanıcı henüz set girmedi, hatasız kaldı).
- **Locale switch (TR ↔ EN):** Letter heads değişir (Türkçe Ç, Ğ, Ş, Ü, İ harfleri ayrı section). Preset adlar TR/EN i18n key'ten. Custom adlar kullanıcı verdiği şekilde kalır.
- **Çok büyük kütüphane (100+ custom):** FlashList virtualization ile sorunsuz. Performans testi: scroll 60fps p95 hedef.
- **Network down + cache:** TanStack Query cache'den göster, üst banner: "Çevrimdışı — son senkron N dakika önce".
- **Misafir mode + kullanıcı hesap açtı (migration):** D1 hemen yeni hesabın `app_exercises`'ı + tarihçe preset slug'larıyla render. Misafir AsyncStorage temizlendi (§3.9.1).
- **Accessibility:** Row VO okuma: "Bench Press, Göğüs kategorisi, PR 90 kilo 5 tekrar, dün kullanıldı, detay için iki kere dokun. Düzenleme menüsü için uzun bas." Custom için ek: "Özel egzersiz."

### Prototip referansı

- **workout-prototype/index.html → Phone 1 (Exercises tab)**: doğrudan referans. App bar (menu + title + count sub + "+ New" pill), seg-tabs, search-row, cat-strip, alfabetik liste (letter-head + ex-row), bottom nav — hepsi birebir.
- **Farklar (MVP):**
  - Hamburger menu icon **avatar'a döner** (B1 ile tutarlılık) — bkz. açık sorular.
  - `ex-row` yapısı: prototipte solda accent-bar + ad + cat-chip + lastUsed + sağda PR pill + chev. MVP'de **aynı**. Long-press = ExerciseRowMenu açılır; prototipte yok — yeni davranış.
  - `last-used` metni prototipte İngilizce ("2 days ago"); MVP i18n key resolve eder ("2 gün önce" TR / "2 days ago" EN).
  - Empty state prototipte yok — MVP yeni component (Dumbbell + 2 CTA).
- Token'lar: `--cat-*` accent bar renkleri, `--accent` PR pill gold, `--brd-subtle` row separator — hepsi birebir port.

### Karara bağlandı (rev 4)

- **App bar sol icon = hamburger** (workout-prototype'a sadık). B1 Calendar avatar pattern kendi prototipinde kalır; her ekran kendi prototipinin app bar dilini takip eder. Hamburger tap → bottom sheet More (bottom nav 5. öğe ile parallel ortak entry). 03 §8.9 (rev 13).
- **Empty state tek CTA = "+ Yeni Özel"** ("Hazır Listele" CTA'sı kaldırıldı). Preset keşfi B1 hint kartı + C1 secondary CTA + C4 modal üzerinden. D1 niyetine odaklı, daha temiz UI. 03 §8.9 (rev 13).
- **Custom delete = soft reference + fallback display:** `app_workouts.exercise_ref` text alanı (FK yok); custom silinince app_workouts persist eder; resolve fail → `"(silinmiş egzersiz)"`. Şema sade (soft-delete kolonu yok). 03 §8.9 (rev 13).
- **App bar count sub'da kapsam:** Tarihçede kullanılmış preset slug'lar + tüm custom egzersizler (distinct). §8.8 C4 Kütüphanem kapsamıyla **birebir tutarlı**. Count tek sayı. 03 §8.9 (rev 13).
- **D1 + C4 ortak component'ler:** `SegmentedTabs`, `SearchInput`, `CategoryChipStrip`, `AddExerciseSheet` paylaşılır. D1'in "+ New" pill ile C4 açılışı `initialTab='new'` (Yeni Özel) ile başlar — niyet kütüphaneye yeni öğe eklemek.

### Açık sorular (kalan)

- **PR pill tap davranışı:** Decorative mi yoksa PR detay tooltip/sheet mi? **Önerim:** MVP'de decorative (tap = row tap = preview). PR detay (hangi tarih, hangi set type) sonra.
- **Aynı isim preset+custom karışıklığı:** Custom satırına "(Özel)" hint mi eklensin, yoksa isim çakışması engellensin mi? C4 açık sorularıyla ortak — birlikte karar.
- **Türkçe lowercase / search locale-aware:** C4 ile ortak utility. `text.toLocaleLowerCase('tr')` veya manuel char map (i→ı, İ→i, Ç→ç). Karar gerekli — implementation aşamasında.
- **Stat hint formatı (PR + lastUsed):** Prototipte row'da hem PR hem lastUsed birlikte. Bazı egzersizlerde ikisi de yoksa row yapısı ne olur? **Önerim:** stat alanı tamamen gizlenir (chev kalır), row daha kompakt görünür.
- **PR resmî hesap kaynağı (`lib/calc.ts`):** Web `calcPR` mantığı (en yüksek weight × reps ürünü mü, yoksa epley 1RM mi)? Implementation karar.

---

## D2 Library — Programs tab

### Niyet & yolculuk konteksti
Kullanıcının **programlarını** yönettiği ekran. D1 ile aynı route altında segmented control'ün **sağ sekmesi**. Merkezde **aktif program featured card** (workout-prototype'ın özü): compliance % + streak + next day + 7-günlük day-chip grid + "Today's workout" CTA. Altında **pasif programlar compact liste**. App bar sağda "+ New" → §8.4.1 NewProgramSheet (isim + opsiyonel açıklama) → save → Program Edit ekranına (D3 — bu seansta scope dışı, ileride spec).

**3. yolculuğun (Program takipli kullanıcı)** ana destek ekranı. 1. yolculuktaki yeni kullanıcı program edinene kadar D2 boş veya hazır program listesi entry'siyle başlar. §3.8 PresetProgramModal **B1 ve C1 entry point'leridir** — D2'de **ayrı bir entry** olmayabilir; "+ New" sadece sıfırdan oluşturma için. Hazır program seçmek için kullanıcı Calendar empty hint kartına veya Day Detail empty state'ine yönlendirilir. (Karar gerekli — bkz. açık sorular.)

§3.1 (Library/Kütüphane), §3.8 (PresetProgramModal), §8.4.1 (Sıfırdan oluştur akışı), §8.6 (compliance % formülü), 3. yolculuğun "tek aktif program" + "compliance yüzde" kararları doğrultusunda.

### Layout sketch

**Default state (aktif program var + 2-3 pasif program):**

```
┌─────────────────────────────┐
│  [status bar]               │
│  ☰   Workout         [+ New]│  ← app bar (D1 ile aynı yapı)
│      4 program              │
│                             │
│ [▣ Exercises 24][▤ Programs 4]│  ← segmented (D2 = sağ aktif)
│                             │
│ ┌─ ACTIVE PROGRAM ────────┐ │  ← featured card (workout-prototype merkezi)
│ │ ⬩ aktif program          │ │  ← kicker
│ │ Pull / Push / Legs       │ │  ← program adı (display font)
│ │ Weekly · Hafta 3/6 · Lineer│ │  ← meta satırı
│ │                  [✎][⋯]  │ │  ← edit + ⋯ menu (sağ üst)
│ │                          │ │
│ │ ┌─────┬─────┬─────────┐  │ │
│ │ │ Uyum│Seri │ Sıradaki │  │ │  ← ap-stats
│ │ │ 87% │ 12g │ Salı     │  │ │     (Uyum gold)
│ │ └─────┴─────┴─────────┘  │ │
│ │                          │ │
│ │ ┌──┬──┬──┬──┬──┬──┬──┐  │ │  ← ap-days (7 chip)
│ │ │P│ S│[S]│Ç │ P│ C│ C│  │ │     (bugün = gold border)
│ │ │—│5e│5e│4e│—│5e│5e│  │ │     (off-day = "—" + cyan)
│ │ └──┴──┴──┴──┴──┴──┴──┘  │ │
│ │                          │ │
│ │ ┌──────────┐ ┌─────────┐│ │
│ │ │▶ Bugünkü │ │ Haftayı ││ │  ← CTA row
│ │ │ workout │ │ gör     ││ │
│ │ └──────────┘ └─────────┘│ │
│ └─────────────────────────┘ │
│                             │
│ ──── Diğer programlar ──── │  ← section head
│                3 kayıtlı    │
│                             │
│ ┌─────────────────────────┐ │
│ │ PPL — Deload Week        │ │  ← pg-row: ad + meta + tip badge + chev
│ │ 6 hareket/gün · 3 gün   ›│ │
│ │              [weekly]    │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Upper / Lower Split      │ │
│ │ 4 gün · 32 set         ›│ │
│ │              [weekly]    │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Core Burner              │ │
│ │ 6 hareket · 18 set     ›│ │
│ │              [daily]     │ │
│ └─────────────────────────┘ │
│                             │
│ [Cal][Lib][Dash][Soc][More] │
└─────────────────────────────┘
```

**Empty state (yeni kullanıcı / hiç program yok):**

```
┌─────────────────────────────┐
│  ☰   Workout         [+ New]│
│      0 program              │
│                             │
│ [▣ Exercises 0 ][▤ Programs 0]│
│                             │
│                             │
│         [Dumbbell-48pt]     │  ← Dumbbell yerine "calendar-grid" lucide?
│                             │     (karar — bkz. açık sorular)
│                             │
│   Henüz programın yok       │
│                             │
│   Hazır bir programdan      │
│   başla veya sıfırdan       │
│   kendi programını oluştur. │
│                             │
│  ┌────────┐ ┌────────────┐ │
│  │ Hazır  │ │+ Yeni      │ │  ← responsive (≥360pt yan yana)
│  │ Seç    │ │ Program    │ │
│  └────────┘ └────────────┘ │
│                             │
│ [Cal][Lib][Dash][Soc][More] │
└─────────────────────────────┘
```

**Pasif programa tap (orta state — preview/aksiyon sheet):**

```
┌─────────────────────────────┐
│         (scrim)             │
│                             │
│  ┌────── bottom sheet ────┐ │
│  │ ════                   │ │  ← drag handle
│  │                        │ │
│  │ PPL — Deload Week      │ │
│  │ 6 hareket/gün · 3 gün  │ │
│  │ Weekly · 5 hafta önce  │ │
│  │                        │ │
│  │ ┌─────────────────┐    │ │
│  │ │ Aktif Et         │    │ │  ← primary CTA
│  │ └─────────────────┘    │ │
│  │ ┌─────────────────┐    │ │
│  │ │ Düzenle          │    │ │  ← secondary → Program Edit (D3)
│  │ └─────────────────┘    │ │
│  │                        │ │
│  │      Programı sil      │ │  ← danger text link
│  │                        │ │
│  └────────────────────────┘ │
└─────────────────────────────┘
```

### Component breakdown

| Component | Konum | Görevi |
|---|---|---|
| `app/(app)/workout/index.tsx` | route | D1 ile **aynı route**; segmented state Programs ise body bu içerik |
| `LibraryAppBar` | `components/workout/LibraryAppBar.tsx` | D1 ile aynı — count "4 program" |
| `WorkoutSegmentedControl` | `components/workout/WorkoutSegmentedControl.tsx` | D1 ile aynı; bu sekmede Programs aktif |
| `ActiveProgramCard` | `components/workout/ActiveProgramCard.tsx` | Featured card: ap-head (kicker + adı + meta + edit/⋯) + ap-stats (3 stat) + ap-days (7-chip grid) + ap-cta-row ("Bugünkü workout" + "Haftayı gör") |
| `ProgramDayChipGrid` | `components/workout/ProgramDayChipGrid.tsx` | 7 hücreli grid — her hücre: dow short + count veya "—". Bugün = gold border + gold text |
| `ActiveProgramStats` | `components/workout/ActiveProgramStats.tsx` | 3 stat: Uyum (compliance %, gold), Seri (streak gün), Sıradaki (next workout dow long) |
| `OtherProgramsList` | `components/workout/OtherProgramsList.tsx` | Pasif programlar compact liste; section head + N satır |
| `ProgramListRow` | `components/workout/ProgramListRow.tsx` | Tek satır: ad + meta + tip badge (weekly/daily) + chev. Tap → ProgramActionSheet |
| `ProgramActionSheet` | `components/workout/ProgramActionSheet.tsx` | Bottom sheet: pasif programa tap → Aktif Et / Düzenle / (danger) Sil + program meta |
| `ProgramsEmptyState` | `components/workout/ProgramsEmptyState.tsx` | Empty: icon (Dumbbell veya CalendarRange) + başlık + 2 CTA |
| `NewProgramSheet` | `components/workout/NewProgramSheet.tsx` | **§8.4.1 ana implementasyonu**: sadece "Program adı" zorunlu input + opsiyonel "Açıklama" input + Kaydet → insert app_programs + navigate Program Edit (D3) |
| `PresetProgramModal` | `components/calendar/PresetProgramModal.tsx` | **B1 / C1 ile ortak component**; D2'de empty state CTA "Hazır Seç"ten (karar gerekli) veya app bar entry'sinden açılabilir |
| `ActivateConfirmModal` | `components/workout/ActivateConfirmModal.tsx` | "PPL şu an aktif. Üzerine yazmak ister misin?" — pasif programı aktif ederken aktif varsa onay (§3 3. yolculuk "tek aktif program" kuralı) |
| `DeleteProgramModal` | `components/workout/DeleteProgramModal.tsx` | "Silmek istediğine emin misin? Log'lar etkilenmez." (§3 3. yolculuk) — Cascade kararı D1 ile aynı: app_workouts persist |
| `BottomTabBar` | `components/ui/BottomTabBar.tsx` | B1/D1 ile aynı |

### State varyantları

| State | Tetik | Görünüm |
|---|---|---|
| `loading` | İlk mount, query running | ActiveProgramCard skeleton + others list skeleton |
| `empty` | Program count = 0 | ProgramsEmptyState |
| `populated-active` | Aktif program var (+ N pasif) | ActiveProgramCard + OtherProgramsList |
| `populated-no-active` | Programlar var ama hiçbiri aktif değil | ActiveProgramCard yok; üstte hint: "Hiçbir programı aktif etmedin. [Aktif Et] yapmak için bir programa dokun." + OtherProgramsList |
| `new-sheet-open` | "+ New" pill tap | NewProgramSheet açılır (§8.4.1) |
| `creating` | NewProgramSheet save tap | CTA spinner + insert app_programs |
| `created-navigating` | Insert ok → Program Edit'e push | Sheet kapanır + router.push('/workout/program/[id]/edit') (D3 route) |
| `action-sheet-open` | Pasif programa tap | ProgramActionSheet açılır |
| `activate-confirm-open` | Pasif programa "Aktif Et" tap + halihazırda aktif program varsa | ActivateConfirmModal: "PPL şu an aktif. Üzerine yazmak ister misin?" [İptal] [Aktif Et] |
| `activating` | Confirm OK | Optimistic: yeni active card en üstte render; arkada `app_programs.activated_at` mutation chain |
| `delete-confirm-open` | Pasif programa "Sil" tap | DeleteProgramModal: "Sil? Geçmiş antrenmanların etkilenmez." [İptal] [Sil] |
| `deleting` | Confirm OK | Optimistic kaldırma + `app_programs` + `app_program_days` delete |
| `preset-modal-open` | Empty CTA "Hazır Seç" veya app bar alternatif entry (karar) | PresetProgramModal (B1 component) |
| `error-load` | Query fail | Üst banner: "Yükleme sorunu." + cache'den render devam |
| `compliance-loading` | Active program var ama compliance hesabı henüz tamamlanmadı | Stat değeri skeleton: "—%" |
| `guest-mode` | Auth yok | Görsel ayrım yok; veri kaynağı AsyncStorage |

### Props / TS interface

```ts
// components/workout/ActiveProgramCard.tsx
interface ActiveProgramCardProps {
  program: ActiveProgramSummary;
  todayDow: number;                  // 0=Pzt ... 6=Paz (kullanıcı locale'ine göre)
  locale: 'tr' | 'en';
  onEdit: () => void;                // ✎ → D3 Program Edit
  onMenuPress: () => void;           // ⋯ → action sheet (Pasifleştir / Sil / Paylaş?)
  onOpenTodayWorkout: () => void;    // "Bugünkü workout" → router.push('/calendar/day/' + todayISO)
  onViewWeek: () => void;            // "Haftayı gör" → router.push('/calendar') + view=week
}

interface ActiveProgramSummary {
  id: string;
  name: string;
  description?: string;
  cycleType: 'none' | 'weekly' | 'deload';
  deloadEvery?: number;
  offDays: number[];                  // [5,6] = Cmt,Paz (locale-aware indexing)
  activatedAt: string;                // ISO date
  weekNumber: number;                 // activated_at'tan bugüne hafta sayısı (compute)
  weekTotal?: number;                 // cycle'da plan varsa toplam (örn. PPL 6 hafta); yoksa undefined
  cycleStateLabel?: string;           // "Lineer" / "Deload" — current state
  daysSummary: ProgramDaySummary[];   // 7 hücre
  compliance: number;                 // 0-100 — §8.6 calcCompliance
  streakDays: number;                 // bugüne kadar consecutive logged program days
  nextDow?: number;                   // bir sonraki egzersiz günü dow; bugün ise bugün
}

interface ProgramDaySummary {
  dow: number;                        // 0..6
  exerciseCount: number;              // 0 = rest
  isToday: boolean;
  isRest: boolean;                    // exerciseCount === 0 veya offDays.includes(dow)
}

// components/workout/ProgramDayChipGrid.tsx
interface ProgramDayChipGridProps {
  days: ProgramDaySummary[];          // 7 entry
  dowLabels: { short: string[]; long: string[] };  // locale-aware
}

// components/workout/ActiveProgramStats.tsx
interface ActiveProgramStatsProps {
  compliance: number;                 // 0-100
  streakDays: number;
  nextDow?: number;
  dowLabels: { long: string[] };
}

// components/workout/OtherProgramsList.tsx
interface OtherProgramsListProps {
  programs: PassiveProgramSummary[];
  onRowPress: (program: PassiveProgramSummary) => void;
}

interface PassiveProgramSummary {
  id: string;
  name: string;
  description?: string;
  cycleType: 'none' | 'weekly' | 'deload';
  exerciseCount: number;              // toplam egzersiz sayısı
  dayCount: number;                   // off-day haricinde gün sayısı
  totalSetsEstimate?: number;         // opsiyonel — gelecekte (set count program_days'ten compute)
  lastActiveAt?: string;              // pasifleştirilme tarihi (varsa)
}

// components/workout/ProgramActionSheet.tsx
interface ProgramActionSheetProps {
  visible: boolean;
  program: PassiveProgramSummary;
  hasActiveProgram: boolean;          // true ise "Aktif Et" tap → ActivateConfirmModal
  onClose: () => void;
  onActivate: () => void;
  onEdit: () => void;                 // → D3
  onDelete: () => void;
}

// components/workout/NewProgramSheet.tsx
interface NewProgramSheetProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (input: NewProgramInput) => void;   // → insert app_programs + navigate Program Edit
}

interface NewProgramInput {
  name: string;                       // trimmed, 1-60 char
  description?: string;               // opsiyonel
}

// components/workout/ActivateConfirmModal.tsx
interface ActivateConfirmModalProps {
  visible: boolean;
  currentActiveProgramName: string;
  targetProgramName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// components/workout/DeleteProgramModal.tsx
interface DeleteProgramModalProps {
  visible: boolean;
  programName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// components/workout/ProgramsEmptyState.tsx
interface ProgramsEmptyStateProps {
  onChoosePreset: () => void;         // → PresetProgramModal (B1 component reuse) — karar
  onCreateNew: () => void;            // → NewProgramSheet
}
```

### Interaction notes

- **Segmented Programs tap:** D1 ile aynı route'ta state flip; query: aktif program (1 satır) + diğer programlar (N satır) — TanStack Query iki ayrı query veya tek joined query (`app_programs` user_id eşleşen, activated_at sort).
- **"+ New" pill (app bar):** **§8.4.1 NewProgramSheet** açılır — sadece "Program adı" zorunlu input + opsiyonel "Açıklama" input. Sheet üstünde başlık "Yeni Program", alta "Kaydet" primary buton.
  - Validation: name 1-60 char, trim, çakışma kontrolü yok (aynı isimle 2 program OK).
  - Save → `app_programs` insert (name, description, cycle_type='none', off_days=[], activated_at=null). Insert sonrası **router.push('/workout/program/[id]/edit')** — D3 Program Edit ekranı (bu seansta spec yok, ileride).
  - Sheet dismiss: backdrop tap, drag down, "İptal" link → kapanır, hiçbir şey yazılmaz.
  - **MVP scope notu (D3):** Program Edit ekranı tam spec ileriki seansta yazılır. Bu seansta D2 spec'i sadece "router.push '/workout/program/[id]/edit' tetiklenir" kararını içerir; D3'ün kendi 9-bölüm spec'i ayrı.
- **Active program card "Bugünkü workout" CTA:** `router.push('/calendar/day/' + todayISO)` → C3 Day Detail (program day). Aktif kullanıcı için en sık aksiyon.
- **Active program card "Haftayı gör" CTA:** `router.push({ pathname: '/calendar', params: { view: 'week' } })` → B1 Calendar, Week view.
- **Active program ✎ (edit) icon:** `router.push('/workout/program/' + program.id + '/edit')` → D3 Program Edit.
- **Active program ⋯ menu:** Bottom sheet: "Pasifleştir" (activated_at → null; active program yok state'ine geç), "Sil" (DeleteProgramModal), "Paylaş" (MVP dışı — gri/disable veya gizli). Karar: paylaş satırı MVP'de **gizli**, MVP sonrası eklenir.
- **Pasif program satırına tap:** ProgramActionSheet açılır (3 aksiyon + sil link). **Tap doğrudan aktif etmez** — kullanıcı tıklayıp seçeneklerden birini seçer. Sebep: yanlışlıkla "üzerine yazmayı" engellemek.
- **Pasif programda "Aktif Et":**
  - hasActiveProgram=false → optimistic activate + sheet kapan + UI'da card yer değiştirir (active'e geçer).
  - hasActiveProgram=true → ActivateConfirmModal: "PPL şu an aktif. Üzerine yazmak ister misin?" Confirm → eski active → null, yeni active set → invalidate query.
- **Pasif programda "Düzenle":** router.push → D3.
- **Pasif programda "Sil":** DeleteProgramModal → confirm → `app_programs` + `app_program_days` delete. `app_workouts` etkilenmez (geçmiş kayıt korunur). UndoToast 5sn.
- **Compliance hesabı (§8.6):** `calcCompliance(workouts, programDays, offDays, activatedAt, today)` — yapılan / yapılması gereken. Off_days dışlanır. `lib/calc.ts` içinde. Compliance sayısı 0-100 arası int (round). 100'e yakın değer **gold**; 50 altı **t-secondary**; 50-80 arası **default**. Gradient sayı renkleri implementation seçimi.
- **Streak hesabı:** `activated_at`'tan bugüne kadar olan ardışık program günlerinden log'lanan ardışık seriyi say. Off-day'leri **es geç** (kullanıcı off-day yapmadığı için zincir kırılmaz). MVP'de basit: `lib/calc.ts` → `calcProgramStreak`.
- **Day chip grid bugün indicator:** `isToday=true` hücre gold border + ap-day.is-today class (gold text). Rest day'lerde "—" + cyan (info renk).
- **Day chip grid tap:** MVP'de **passive** (decorative). Tap → no-op. Karar gerekli — alternatif: o gün Day Detail'e push (locale-aware o haftaki tarihe). **Önerim:** MVP'de no-op; sonra detaylandırılır.
- **PresetProgramModal entry'si D2'de:**
  - Empty state CTA "Hazır Seç" → modal açılır → preset seçilir → `app_programs` + `app_program_days` kopyalanır + aktif edilir → D2 yenilenir (active card görünür).
  - "+ New" pill **sadece sıfırdan oluşturmak için** (§8.4.1). Preset entry'si "+ New" ile değil, empty state CTA + B1 hint kartı + C1 secondary CTA olarak kalır.
  - **Karar gerekli:** D2 app bar'da "Hazır Seç" alternatif entry mi olmalı? **Önerim:** **yok** — kullanıcı zaten programları var (empty değil), preset seçmek üzerine yazmayı tetikler, B1/C1 yeterli.
- **Pull-to-refresh:** Compliance ve streak hesaplaması son workout'lara bağlı; refresh ile invalidate.
- **Haptic:** "+ New" tap → light impact. "Aktif Et" success → notification. Delete success → medium impact + UndoToast.

### Edge cases

- **Aktif program activated_at = bugünden sonra:** Program ileride başlıyor. Featured card yine üstte ama "Yarın başlıyor" badge mi yoksa "Aktif" mi? **Önerim:** activated_at <= bugün ise aktif; sonrası "Henüz başlamadı" sub-badge + day chip grid yine gösterilir. Karar gerekli.
- **Cycle deload week:** ap-meta'da "Hafta 4 (Deload)" + day chips ay azaltılmış (lib/calc.ts cycle resolver). Compliance hesabında deload week de tam sayılır.
- **Off-day tüm gün (7/7 off):** Program günü yok demek; geçersiz program. Validation NewProgramSheet veya D3'te. D2'de render OK ama compliance 0/0 = "—%".
- **Tek pasif program + 1 aktif:** OtherProgramsList tek satır gösterir; "Diğer programlar" head + count "1 kayıtlı".
- **0 aktif, 1 pasif:** populated-no-active state. Üst hint banner: "Hiçbir programı aktif etmedin. [Aktif Et] yapmak için bir programa dokun."
- **Compliance > 100 (kullanıcı off-day'de bile yaptıysa):** Cap @ 100 görsel; ham değer log'lansın (debug için). §8.6 formula off-days dışlar → ekstra workout doğru hesaplamada compliance'ı şişirmez. Edge'de teorik max 100.
- **Streak çok büyük (300+ gün):** Render "300g" — kompakt; uzun listede sığar. Display format `${n}g` (TR) / `${n}d` (EN — "days").
- **Program adında i18n karakterler:** Inter font destekler (Çç, Ğğ, Şş, Ü, İ). Display font Space Grotesk de destekler.
- **Network down + cached compliance:** Stale value göster + üst banner. Refresh edilince yeniden hesap.
- **Aktif program runtime değişti (kullanıcı B1'de preset seçti, D2'ye geldi):** Query invalidate ile yeni active card render. Animasyon: subtle fade.
- **Program adı çok uzun (60 char+):** Featured card h3 2 satır wrap; meta tek satır clip.
- **Program silindi ama hala aktif (race condition):** Mutation chain: önce activated_at = null (eğer aktifse), sonra delete. Veya transaction. Race önemli değil — soft fail OK.
- **Misafir mode tek aktif program kuralı:** AsyncStorage'da `@logwise/guest/programs` her satır `activated_at` veya yok. Mutation ile tek satır activated_at güncellenir.
- **Empty state'te "Hazır Seç" CTA aktif program oluşturduktan sonra D2 state'i değişir:** Optimistic ya da invalidate → empty → populated-active.
- **Accessibility:** Featured card VO: "Aktif program. Pull Push Legs. Hafta 3 bölü 6. Uyum yüzde 87. Seri 12 gün. Sıradaki Salı. Day chip grid 7 hücre." Pasif satır VO: "PPL Deload Week, 6 hareket bölü gün, 3 gün, haftalık tip. Detay için iki kere dokun."

### Prototip referansı

- **workout-prototype/index.html → Phone 2 (Programs tab)**: **birebir referans**. App bar (menu + title + count + "+ New"), seg-tabs, active-program featured card (ap-head + ap-stats + ap-days + ap-cta-row), pg-row pasif liste — hepsi port.
- **Farklar (MVP):**
  - Hamburger icon → avatar (D1 ile tutarlı).
  - "Today's workout" / "View week" CTA'ları i18n key'leriyle TR: "Bugünkü workout" / "Haftayı gör".
  - "Active program" kicker → TR: "aktif program" (lowercase, marka mono kicker stili).
  - ap-stats üçüncüsü "Next: Tue" → TR/EN locale-aware uzun gün adı.
  - ap-days "5 ex" → TR "5e" (kısaltma), EN "5 ex". **Karar gerekli** — kompakt mı uzun mu.
  - Empty state prototipte yok — MVP yeni component.
  - Pasif satır tap davranışı prototipte yok (statik mockup); MVP'de ProgramActionSheet.
  - ⋯ ve ✎ ikonları active card'da prototipte var; MVP'de ⋯ menu ve ✎ edit ayrı aksiyonlar.
- Token'lar: `--accent` (compliance gold + ap-cta-row primary + bugün indicator), `--info` (rest day), `--brd-subtle` (ap-day border), gradient effects implementation'da.

### Karara bağlandı (rev 4)

- **§8.4.1 NewProgramSheet ana implementasyonu D2'dedir:** "+ New" pill → sheet (sadece isim + opsiyonel açıklama) → save → app_programs insert (aktif değil — §8.4.1 "yeni program varsayılan olarak aktif edilmez") → router.push D3 Program Edit. Wizard yok.
- **Program Edit (D3) MVP scope'unda ama bu seansta spec yok:** Sıradaki seansa kalır (rev 13 onay — D3 önce, E1+F1+F2 sonra). D2'de sadece "router.push tetiklenir" + ✎ icon ve "Düzenle" link D3 entry'leri olarak yazıldı.
- **Tek aktif program kuralı (§3 3. yolculuk):** Pasif programa "Aktif Et" tap'i halihazırda aktif program varsa ActivateConfirmModal sorar; onay → eski activated_at = null + yeni activated_at = today. UI'da featured card yer değiştirir.
- **App bar sol icon = hamburger** (D1 ile tutarlı; workout-prototype'a sadık). 03 §8.9 (rev 13).
- **Empty state "Hazır Seç" CTA korunur:** D2 empty state'te 2 CTA: "Hazır Seç" (PresetProgramModal — B1 component reuse) + "+ Yeni Program" (NewProgramSheet). D1'den farklı — programlar için preset seçimi kullanıcıya değerli alternatif (B1 hint kartı dışında D2 doğal entry'dir).
- **"+ New" pill ayrımı korunur:** D2 "+ New" sadece sıfırdan oluşturma için (§8.4.1). Hazır preset entry'si **empty state CTA** + **B1 hint kartı** + **C1 secondary CTA**. Eski rev 11 prototip "Hazır / Sıfırdan segmented modal" taslağı iptal — ayrı akışlar nettir. 03 §8.9 (rev 13).

### Açık sorular (kalan)

- **Empty state icon:** Dumbbell (§8.8 tutarlılık) vs CalendarRange / ClipboardList lucide (program-spesifik)? D3 yazılırken karar — D3 empty state'leri de etkileyebilir. **Önerim:** CalendarRange (program mental modeline daha yakın).
- **Day chip grid tap davranışı:** No-op mu yoksa o günkü Day Detail'e push mu? **Önerim:** MVP'de no-op (passive); sonra detaylandırılabilir.
- **ap-days hücre count format:** "5 ex" (EN) / "5e" (TR kısaltma) mı yoksa sadece sayı + "e/ex" küçük etiketi mi? i18n implementasyonunda karar.
- **Compliance renk threshold:** 100 gold, 0 t-secondary, 50-80 default — gradient mi yoksa categorical mi? Implementation seçimi.
- **Pasif program "Paylaş" satırı:** MVP'de gizli (sosyal MVP dışı, 03 §8.9). Karar onayı yapıldı; D3 sonrasında re-evaluate.
- **Aktif program activated_at = gelecek tarih:** "Henüz başlamadı" sub-badge mi yoksa hala "aktif" mi? Cycle resolver D3'te netleşir.
- **OtherProgramsList sort sırası:** En son aktif edilmiş üstte mi (last_active_at), yoksa created_at desc mi? Implementation seçimi.
- **Active program "Bugünkü workout" CTA off-day'de:** Bugün off-day ise CTA hâlâ Day Detail'e push (RestDayBanner ile) mı, yoksa label "Bugün dinlenme" + disabled mi? **Önerim:** push (kullanıcı isterse manuel egzersiz ekleyebilir — RestDayBanner zaten C3'te bu durumu işler).

---

## D3 Program Edit

### Niyet & yolculuk konteksti
Programın **adı + cycle + off_days + gün-bazlı egzersizleri** düzenlenen ana yapılandırma ekranı. **Üç entry point** (rev 14 — hepsi tek route, state ayırt etmez):
1. **D2 "+ New" pill → NewProgramSheet save** sonrası: yeni oluşturulmuş program (sadece isim) → bu ekrana push; kullanıcı gün-gün doldurur, cycle seçer, aktif eder.
2. **D2 ActiveProgramCard ✎ icon** → aktif program edit.
3. **D2 OtherProgramsList row → ProgramActionSheet → "Düzenle"** → pasif program edit.

§8.4.1 (sıfırdan oluştur akışı — wizard yok), §3 3. yolculuk (tek aktif program, "Sadece bugün skip" → `app_day_meta`), §4.3 (polymorphic exercise_ref), §8.6 (compliance formülü) doğrultusunda. **3. yolculuğun 4. adımı (Program Detail / Edit)** ve **§8.4.1 "sıfırdan oluştur" akışının ikinci yarısı** bu ekranda birleşir.

Web `app.html`'in pgModal (showPgModal) pattern'i **referans dil**: 7-gün chip stripe + seçili gün altta + cycle settings + off-day toggle. **Mobile farkı (kullanıcı kararı rev 14):** Modal değil **tam ekran route**; 7 gün chip stripe yerine **dikey scroll + collapsible panels** (her gün ayrı genişleyen panel). Mobile ergonomisi: tek el ile uzun program oluşturma için scroll daha doğal.

> **Web'den önemli ayrılış (rev 14):** Web'de cycle = `none | deload` (sadece 2 seçenek). Mobil'de **§4.3 şeması** `cycle_type text "none" | "weekly" | "deload"` (3 seçenek) — `weekly` MVP'de **var** (haftalık tekrar — default). `none` = tek seferlik (deactivate'e kadar tekrarlanmaz, MVP'de hiç kullanılmıyor olabilir). `deload` = N hafta normal + 1 hafta deload döngüsü. **Karar gerekli:** `none` MVP'de aktif kalsın mı yoksa default `weekly` ile başlasın mı? (Bkz. açık sorular.)

### Layout sketch

**Default state (boş yeni program, sadece isim verilmiş):**

```
┌─────────────────────────────┐
│  [status bar]               │
│  ←   Yeni Program     [Kaydet]│  ← app bar: back + title + done
│                             │
│ ┌─ Program Adı ───────────┐ │  ← inline editable: tap → text input
│ │ Pull / Push / Legs      │ │     görünmediği zaman read-only display
│ └─────────────────────────┘ │
│ ┌─ Açıklama (opsiyonel) ──┐ │
│ │ 6 haftalık deload progr.│ │  ← multiline, opsiyonel
│ └─────────────────────────┘ │
│                             │
│ ┌─ DÖNGÜ AYARLARI ────────┐ │  ← section card
│ │ Tip:                    │ │
│ │ [Haftalık][Deload][Yok] │ │  ← chip select (rev 14 — 3 seçenek, default Haftalık)
│ │                         │ │
│ │ Deload her N haftada: 4 │ │  ← sadece tip=Deload ise görünür
│ │   [3][4][5][6][8]       │ │     chip select
│ └─────────────────────────┘ │
│                             │
│ ┌─ HAFTANIN GÜNLERİ ──────┐ │
│ │                         │ │
│ │ ┌─ Pazartesi ─ 3 hareket▾┐│  ← collapsible panel (default: bugün açık)
│ │ │ • Bench Press          ││     diğerleri kapalı
│ │ │ • Incline DB Press     ││
│ │ │ • Cable Fly            ││
│ │ │ [+ Egzersiz Ekle]   [☾]││  ← C4 entry + off-day toggle
│ │ └────────────────────────┘│
│ │                          │ │
│ │ ┌─ Salı ─ 0 hareket    ▸┐│  ← collapsed, sıfır hareket
│ │ └────────────────────────┘│
│ │                          │ │
│ │ ┌─ Çarşamba ─ 💤 Off  ▸ ┐│  ← off-day badge
│ │ └────────────────────────┘│
│ │                          │ │
│ │ ┌─ Perşembe ─ 0 hareket▸┐│
│ │ └────────────────────────┘│
│ │  ...                     │ │
│ └──────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │  ⚡ Programı Aktif Et    │ │  ← primary CTA (sadece aktif değilse)
│ └─────────────────────────┘ │
│                             │
│       Programı Sil          │  ← danger text link altta (sadece edit mode'da)
│                             │
└─────────────────────────────┘
```

**Expanded state (bir gün açık + drag aktif):**

```
│ ┌─ Pazartesi ─ 3 hareket ▾┐ │
│ │                          │ │
│ │ ⋮⋮ Bench Press        ×  │ │  ← drag handle (sol) + isim + sil
│ │ ⋮⋮ Incline DB Press   ×  │ │     long-press anywhere on row = drag
│ │ ⋮⋮ Cable Fly          ×  │ │
│ │                          │ │
│ │ [+ Egzersiz Ekle]        │ │  ← C4 modal entry
│ │                          │ │
│ │ ────────────────────     │ │
│ │ [💤 Dinlenme günü yap]    │ │  ← toggle: off-day yap/kaldır
│ │                          │ │
│ └──────────────────────────┘ │
```

**Off-day state (gün off-day):**

```
│ ┌─ Pazar ─ 💤 Dinlenme   ▾┐│
│ │                          │ │
│ │      💤                  │ │
│ │   Dinlenme Günü          │ │  ← empty state, sade
│ │                          │ │
│ │ Bu gün programında off   │ │
│ │ olarak işaretli.         │ │
│ │                          │ │
│ │ [Off günü kaldır]        │ │  ← toggle ters yön
│ └──────────────────────────┘ │
```

> **"Programı Aktif Et" davranışı:** §3 3. yolculuk — bu CTA aktif olmayan programlar için görünür. Halihazırda başka aktif program varsa **ActivateConfirmModal** sorar ("PPL şu an aktif. Üzerine yazmak ister misin?"). D2'deki ActiveProgramCard aksiyonuyla aynı pattern.

> **"Programı Aktif Et" CTA varlık koşulu:** Yeni oluşturulmuş program (henüz hiç gün dolu değil) için CTA disabled ("Önce egzersiz ekle"). En az 1 günde 1 egzersiz varsa enabled. Karar — bkz. açık sorular.

### Component breakdown

| Component | Konum | Görevi |
|---|---|---|
| `app/(app)/workout/program/[id]/edit.tsx` | route | Tam ekran route; URL param `id` (program UUID). State ayırt etmez (yeni mi mevcut mu) — tek render dalı |
| `AppScreen` | `components/ui/AppScreen.tsx` | SafeAreaView + scroll wrapper |
| `ProgramEditAppBar` | `components/workout/ProgramEditAppBar.tsx` | Back + title ("Yeni Program" yeni-create state'te / program adı edit state'te) + "Kaydet" pill (autosave varsayım, manual kaydet sadece final feedback için) |
| `ProgramNameEditor` | `components/workout/ProgramNameEditor.tsx` | Inline editable: tap → text input açar, blur → save. Boş bırakılamaz (validate) |
| `ProgramDescriptionEditor` | `components/workout/ProgramDescriptionEditor.tsx` | Multiline text, opsiyonel. Aynı inline edit pattern |
| `CycleSettingsCard` | `components/workout/CycleSettingsCard.tsx` | "Döngü Ayarları" section card: cycle type chip select + deload_every chip select (conditional) |
| `CycleTypeSelect` | `components/workout/CycleTypeSelect.tsx` | 3 chip: Haftalık / Deload / Yok (rev 14). Tek seçim, default Haftalık |
| `DeloadEverySelect` | `components/workout/DeloadEverySelect.tsx` | Chip select: 3/4/5/6/8. Sadece cycleType='deload' ise görünür |
| `ProgramDaysSection` | `components/workout/ProgramDaysSection.tsx` | "Haftanın Günleri" section başlığı + 7 day panel listesi (Pzt-Paz) |
| `ProgramDayPanel` | `components/workout/ProgramDayPanel.tsx` | Tek gün collapsible panel: başlık (gün adı + count veya off badge + chevron) + expanded body (egzersiz listesi + add buton + off toggle) veya off-day empty state |
| `ProgramDayHeader` | `components/workout/ProgramDayHeader.tsx` | Tap area: gün adı + count badge ("3 hareket" veya "💤 Dinlenme") + chevron up/down |
| `ProgramExerciseRow` | `components/workout/ProgramExerciseRow.tsx` | Drag handle (sol, 6-dot icon — §8.8 C2 ile aynı pattern) + egzersiz adı + sil X. Tek satır |
| `ProgramExerciseList` | `components/workout/ProgramExerciseList.tsx` | DraggableFlatList wrapper — gün-içi reorder; gün-gün taşıma için ayrı handler (uzun bas + dikey drag → "diğer güne taşı" sheet aç) |
| `AddExerciseToProgramDayButton` | `components/workout/AddExerciseToProgramDayButton.tsx` | "+ Egzersiz Ekle" buton → C4 AddExerciseSheet açar; **mode='program-day'** — single tap = o güne ekle + sheet kapan |
| `OffDayToggle` | `components/workout/OffDayToggle.tsx` | "💤 Dinlenme günü yap/kaldır" buton. Off-day yapılırsa o günün egzersiz listesi temizlenir mi yoksa korunur mu? (Karar — bkz. açık sorular) |
| `OffDayEmptyState` | `components/workout/OffDayEmptyState.tsx` | 💤 icon + "Dinlenme Günü" + 1 satır açıklama + "Off günü kaldır" buton |
| `ActivateProgramCTA` | `components/workout/ActivateProgramCTA.tsx` | Primary buton: "⚡ Programı Aktif Et" (aktif değilse) veya "✓ Aktif Program" disabled label (zaten aktifse) |
| `MoveExerciseToDaySheet` | `components/workout/MoveExerciseToDaySheet.tsx` | Long-press başka güne taşı → bottom sheet: "X hareketini hangi güne taşımak istersin?" + 7 gün listesi (mevcut gün disabled) |
| `ActivateConfirmModal` | `components/workout/ActivateConfirmModal.tsx` | **D2 ile ortak component** — "PPL şu an aktif. Üzerine yazmak ister misin?" |
| `DeleteProgramModal` | `components/workout/DeleteProgramModal.tsx` | **D2 ile ortak component** — "Sil? Geçmiş antrenmanların etkilenmez." |
| `AddExerciseSheet` | `components/workout/AddExerciseSheet.tsx` | **C4 ile ortak component** — mode `'program-day'` ile çağrılır. Single tap = `app_program_days` insert |
| `BottomTabBar` | (yok) | D3 tam ekran modal-pattern route; bottom nav **gizlenir** (Modal stack veya stack screen with `headerShown` benzeri). Karar — bkz. açık sorular |

### State varyantları

| State | Tetik | Görünüm |
|---|---|---|
| `loading` | İlk mount, query running | Skeleton: name + description shimmer, cycle card iskelet, 7 day panel skeleton (collapsed) |
| `loaded-empty` | Program meta var ama hiç egzersiz yok (yeni create) | Yukarıdaki default sketch; tüm günler `0 hareket` collapsed; bugünün günü açık |
| `loaded-partial` | Bazı günlerde egzersiz var, bazıları boş | Doluların başlığında count, boşlarda "0 hareket" |
| `loaded-active` | Bu program halihazırda aktif | ActivateProgramCTA yerine "✓ Aktif Program" disabled label; "Pasifleştir" link aşağıda |
| `editing-name` | ProgramNameEditor focus | Text input açık, autoFocus, klavye yukarıda; "Kaydet" pill app bar'da prominent |
| `editing-day-expanded` | Gün panel tap → expand | O gün açık, diğerleri kapalı (accordion behavior — karar gerekli, bkz. açık sorular) |
| `add-exercise-sheet-open` | "+ Egzersiz Ekle" tap | C4 modal açılır, program-day mode |
| `drag-active` | Egzersiz row long-press | Row elevation artar, shadow, scale 1.02; sibling row'lar yer açar |
| `move-to-day-sheet-open` | Drag + threshold dışına çıkış veya long-press menü "Başka güne taşı" | MoveExerciseToDaySheet açılır |
| `off-day-confirm` | OffDayToggle tap (+ o günde egzersiz varsa) | Native Alert: "Bu güne 3 egzersiz var. Off-day yaparsan listeden çıkarılacak. Devam?" [İptal] [Off-Day Yap] |
| `activate-confirm` | "Programı Aktif Et" tap + başka aktif varsa | ActivateConfirmModal açılır |
| `activating` | Confirm onay | CTA spinner; mutation chain (eski activated_at=null + yeni activated_at=today) |
| `activated` | Activate başarılı | Toast: "PPL aktif edildi." + CTA "✓ Aktif Program" disabled label'a döner |
| `delete-confirm` | "Programı Sil" link tap | DeleteProgramModal |
| `deleting` | Confirm onay | Optimistic kaybolma + router.back D2'ye + UndoToast (5sn) |
| `cycle-deload-conditional-fields` | cycleType = 'deload' | DeloadEverySelect görünür; diğer 2 tipte gizli |
| `saving` | Inline save sırasında (debounced) | App bar'da subtle "Kaydediliyor..." mikro-indicator (1sn) |
| `save-error` | Mutation fail | Inline banner üstte: "Kaydedilemedi. Tekrar dene." + retry link |
| `unsaved-back` | Kullanıcı back basınca + bekleyen unsaved değişiklik varsa | Native Alert: "Değişikliklerin kaydedilmedi. Yine de çık?" [Vazgeç] [Çık] (autosave varsayımıyla genelde gerekmez ama edge için var) |
| `guest-mode` | Auth yok | Görsel ayrım yok; veri AsyncStorage; `@logwise/guest/programs` + `@logwise/guest/program_days` |

### Props / TS interface

```ts
// app/(app)/workout/program/[id]/edit.tsx
export default function ProgramEditScreen() {
  // useLocalSearchParams → { id: string }
  // program detayı + program_days TanStack Query ile fetch
}

// components/workout/ProgramEditAppBar.tsx
interface ProgramEditAppBarProps {
  programName: string;
  hasUnsavedChanges: boolean;
  onBack: () => void;
  onSavePress?: () => void;       // autosave varsa rare; manual save için
  isSaving: boolean;
}

// components/workout/ProgramNameEditor.tsx
interface ProgramNameEditorProps {
  value: string;
  onChange: (v: string) => void;  // debounced save trigger
  autoFocus?: boolean;            // yeni program ise true
  error?: string;                 // validation
}

// components/workout/CycleSettingsCard.tsx
interface CycleSettingsCardProps {
  cycleType: 'weekly' | 'deload' | 'none';
  deloadEvery: number;            // 3 | 4 | 5 | 6 | 8
  onChangeCycleType: (v: 'weekly' | 'deload' | 'none') => void;
  onChangeDeloadEvery: (n: number) => void;
}

// components/workout/ProgramDayPanel.tsx
interface ProgramDayPanelProps {
  dayIndex: number;               // 0=Pzt ... 6=Paz (locale-aware indexing)
  dayLabel: string;               // "Pazartesi"
  exercises: ProgramDayExercise[]; // sıralı
  isOffDay: boolean;
  isToday: boolean;               // bugünün günü mü (gold border)
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAddExercise: () => void;      // → C4 sheet program-day mode
  onReorderExercises: (newOrder: ProgramDayExercise[]) => void;
  onDeleteExercise: (exerciseRef: string) => void;
  onMoveExerciseToDay: (exerciseRef: string) => void;  // → MoveExerciseToDaySheet
  onToggleOffDay: () => void;
}

interface ProgramDayExercise {
  ref: string;                    // slug VEYA UUID (§4.3 polymorphic)
  position: number;
  resolved: ResolvedExercise;     // bundle preset veya app_exercises
}

// components/workout/ProgramExerciseRow.tsx
interface ProgramExerciseRowProps {
  exercise: ProgramDayExercise;
  onDelete: () => void;
  onLongPress: () => void;        // drag başlat veya MoveToDaySheet aç (karar)
  onDragStart?: () => void;
}

// components/workout/MoveExerciseToDaySheet.tsx
interface MoveExerciseToDaySheetProps {
  visible: boolean;
  exerciseName: string;           // "Bench Press"
  currentDayIndex: number;
  daysWithCounts: Array<{ dayIndex: number; label: string; count: number; isOffDay: boolean }>;
  onSelectDay: (dayIndex: number) => void;
  onClose: () => void;
}

// components/workout/OffDayToggle.tsx
interface OffDayToggleProps {
  isOffDay: boolean;
  hasExercises: boolean;          // true ise toggle "off-day yap" basınca confirm gerekir
  onToggle: () => void;
}

// components/workout/ActivateProgramCTA.tsx
interface ActivateProgramCTAProps {
  isCurrentlyActive: boolean;
  canActivate: boolean;           // en az 1 günde 1 egzersiz olmalı
  disabledReason?: string;        // "Önce egzersiz ekle"
  onActivate: () => void;
  onDeactivate: () => void;       // is-active ise CTA "Pasifleştir"a döner
}
```

### Interaction notes

- **Autosave pattern (kritik):** Tüm değişiklikler **debounced autosave** (300-500ms): name, description, cycleType, deloadEvery, off_days array, program_days insertions/deletions/reorders. Manuel "Kaydet" buton **yok**; app bar'daki "Kaydet" sadece **explicit save & exit** için (D2'ye geri dön). Autosave varsayımıyla unsaved-back state nadir; sadece focused input + back race condition'ında devreye girer.
- **App bar back:** `router.back()` → D2'ye döner. Eğer focused input varsa önce blur (save trigger), sonra navigate.
- **Program adı edit:** Tap → text input açar, autoFocus, klavye yukarıda. Blur veya klavye "Done" → save + read-only display'e döner. Boş submit → error inline ("Program adı boş olamaz.").
- **Cycle type değişimi:** Chip tap → optimistic update + autosave. cycleType='deload' seçilince DeloadEverySelect 200ms fade-in. Diğer tiplere geçişte deloadEvery değer **korunur** (sonradan deload'a dönerse aynı).
- **Day panel expand/collapse:**
  - Default: bugünün günü expanded; diğerleri collapsed (rev 14 onaylanan default).
  - Tek tap header → toggle expand.
  - **Accordion mı multi-expand mı?** Karar gerekli. **Önerim:** multi-expand (kullanıcı 3 günü açık tutup karşılaştırabilir); accordion zorlayıcı.
  - Chevron icon up/down rotation animasyonu (150ms).
  - Expanded panel'de drag/reorder ve C4 entry aktif.
- **Add Exercise tap (gün-içi):**
  - C4 AddExerciseSheet `mode='program-day'` ile açılır; `workoutContext` yok, `programDayContext: { programId, dayIndex }` var.
  - Single tap row → `app_program_days` insert (program_id, day_index, exercise_ref, position=mevcut max+1) + sheet kapan.
  - Multi-select aynı pattern; bulk insert position sırayla.
  - Sheet kapandıktan sonra optimistic eklenen egzersiz row'lar görünür.
- **Drag/reorder (gün-içi):**
  - Long-press row anywhere (drag handle veya başka yer) → 400ms hold → drag aktif.
  - `react-native-draggable-flatlist`. Drop → `app_program_days.position` update (atomik veya sıralı patch).
  - Haptic: long-press → selection; drop → light impact.
- **Drag/move-to-day (gün-gün taşıma):**
  - **İki opsiyon (karar gerekli):**
    - **Opsiyon A (önerilen):** Long-press → row ⋯ menü açar → "Başka güne taşı" satırı → MoveExerciseToDaySheet.
    - **Opsiyon B:** Drag yukarı/aşağı + panel boundary'sini geç → animated transition + drop hangi panelde ise oraya. Karmaşık ama akıcı.
  - **Önerim:** Opsiyon A (MVP'de basit, gesture conflict yok); Opsiyon B MVP sonrası.
- **Off-day toggle:**
  - Boş gün için tap → direkt off-day yap (confirm yok).
  - Dolu gün için tap → confirm: "Bu güne 3 egzersiz var. Off-day yaparsan listeden çıkarılacak. Devam?"
  - **Egzersiz listesi nasıl temizleniyor?** İki opsiyon (karar gerekli):
    - **Opsiyon A:** Egzersizler `app_program_days`'den silinir (off-day'i kaldırırsa kullanıcı sıfırdan ekler).
    - **Opsiyon B:** Egzersizler korunur (DB'de kalır), UI'da off-day görünür; off kaldırılınca egzersizler geri gelir.
  - **Önerim:** Opsiyon A (sade veri modeli, off-day ↔ workout day exclusive). Opsiyon B teknik karmaşıklık.
- **Aktif et:**
  - Buton tap → `canActivate` check (en az 1 günde 1 egzersiz mi?). Yoksa disabled label "Önce egzersiz ekle".
  - Başka aktif program varsa ActivateConfirmModal sorar. Onay → mutation chain (eski deactivate + yeni activate) + toast.
  - Tap haptic: medium impact. Success: notification haptic.
- **Pasifleştir (zaten aktifse):** CTA "Pasifleştir" label'ına döner. Tap → `activated_at = null` (confirm yok — sade aksiyon). Toast: "Program pasifleştirildi."
- **Programı sil:** Danger text link altta. Tap → DeleteProgramModal. Onay → `app_programs` + `app_program_days` delete (app_workouts persist) + optimistic + router.back D2'ye + UndoToast.
- **Bottom nav:** D3'te **gizli** (full-screen edit pattern); ProgramEditAppBar app bar'da bottom nav yok. Geri dönüş app bar back ile. Karar gerekli (bkz. açık sorular).
- **Klavye davranışı:** Name/description input açıkken klavye yukarı iter; KeyboardAvoidingView sarması zorunlu. Day panel scroll klavye altında kalabilir.
- **Locale (TR/EN):** `L.days` array locale-aware. Pazartesi/Monday... Off-day badge 💤 emoji ortak.
- **Haptic özet:**
  - Cycle type chip → selection
  - Day panel expand → light impact
  - Drag long-press → selection
  - Drag drop → light impact
  - Off-day toggle → light impact
  - Activate success → notification
  - Delete confirm → medium impact

### Edge cases

- **Yeni program create-time URL:** NewProgramSheet save → insert → router.push('/workout/program/' + newId + '/edit'). URL param'ı id var; sayfa mount'ta query çeker, bulamazsa 404. Önerim: insert'in tamamlanması bekleniyor (await) sonra navigate; query cache hit anında.
- **Aktif program edit ortasında pasifleştirilirse:** State `loaded-active` → `loaded-partial`'a transition. ActivateProgramCTA görünür hale gelir.
- **Cycle type 'none' anlamı:** Tek seferlik program (haftalık tekrar yok); aktif edildiği gün başlar, kullanıcı pasifleştirene kadar devam eder. Compliance hesabı 'none' için nasıl? **Karar:** `none` = compliance hesaplanmaz (NaN veya hidden); sadece UI listesi gösterilir. MVP'de bu nadir kullanım — `weekly` default. (Bkz. açık sorular.)
- **`weekly` cycle özelliği:** Web `app.html`'de yok (sadece none/deload var). Mobile yeni. Davranış: hafta hafta tekrar — `weekly` ve `none` arasındaki fark: `weekly` = döngüsel ve compliance hesabı aktif; `none` = tek seferlik plan, compliance yok. Karar gerekli — bu ikisi gerçekten farklı mı yoksa `none` = `weekly` (compliance hesabı dahil) mu?
- **deloadEvery değer sınırı:** 3, 4, 5, 6, 8 (web'den). 4 default. Daha fazla seçenek MVP'de yok.
- **Off-day toggle ile aktif program çakışması:** Aktif program varken bir günü off-day yapmak → ertesi gün C3 Day Detail o günde rest day banner gösterir (§8.8 + §3 3. yolculuk). Eski lazy kart'lar şimdi off-day'e dönüştü → kullanıcı bir gün önce set girmişse `app_workouts` rows persist; off-day banner'a rağmen kartlar görünür (kullanıcı veri kaybetmez). Karar gerekli.
- **Day panel sıralaması locale:** TR'de Pzt başlangıç, EN'de Mon (her ikisi de Pzt — RN locale tutarlılığı). Pazar son. Web'de `["Pazartesi", "Salı", ...]` = locale-aware; mobile aynı.
- **Çok büyük program (her gün 10+ egzersiz):** 70+ row toplam; FlashList virtualization. Performans hedef: scroll 60fps p95.
- **Custom egzersiz silindi ama program_days'de hala ref var:** D1 soft reference kararı (rev 13): resolve fail → "(silinmiş egzersiz)" fallback display. Kullanıcı sil X ile temizleyebilir.
- **Network down + autosave fail:** Optimistic local güncellenmiş, mutation kuyrukta retry. Bağlantı geri gelince sync. Üst banner: "Çevrimdışı — değişiklikler senkron edilemiyor".
- **Hardware back (Android) edit ortasında:** Eğer focused input varsa önce blur (save), sonra back. Pending mutation varsa kuyrukta kalır.
- **Empty program (hiç gün dolu değil) save & exit:** Kaydedilir (program meta + name); aktif edilemez (CTA disabled). Kullanıcı sonra geri gelip doldurabilir. D2 OtherProgramsList'te "0 hareket / 0 gün" gösterir.
- **Misafir mode'da büyük program drag/reorder:** AsyncStorage write performance — burada potansiyel yavaşlama; debounced save 500ms tolere edilebilir.
- **Accessibility:** Day panel header VO: "Pazartesi, 3 hareket, kapalı, genişletmek için iki kere dokun". Drag row: "Bench Press, 1. sıra, taşımak için uzun bas". Off-day toggle: "Dinlenme günü, aktif değil, dokunarak değiştir".

### Prototip referansı

- **Web `app.html` showPgModal (satır 6518-6812)** — temel referans dilini sağlar:
  - Program adı text input (mobile: inline editable, web: modal input).
  - 7-gün chip stripe (web — count badge + off 💤) → **mobile collapsible panels'a dönüştürüldü (rev 14 kullanıcı kararı)**.
  - Seçili gün için: off-day toggle + seçili egzersizler chip listesi + arama + "hareketlerim / hazır hareketler" ayrı section'lar (mobile C4 modal'ı kullanır — entry yöntemi farklı, içerik aynı).
  - Cycle settings: `none / deload` (mobile: `weekly / deload / none`, default `weekly` — rev 14 yeni).
  - deloadEvery select: 3/4/5/6/8 (mobile aynı).
- **workout-prototype/index.html → Phone 2 ap-days**: 7-day chip grid visual dili (off-day "—" + bugün gold border) D3 day panel header'larında kısmen kullanılabilir — gün adı + count + chevron + (varsa) bugün indicator.
- **day-prototype/styles.css**: ex-card stili → ProgramExerciseRow'a benzer (sade row, drag handle 6-dot — §8.8 C2 ile aynı).
- **Farklar (MVP):**
  - Web modal → mobile **tam ekran route** (deeper edit, mobile ergonomi).
  - Web 7-day chip stripe → mobile **7 collapsible panel** (dikey scroll daha tek-el dostu).
  - Web "weekly" cycle yok → mobile `weekly` eklendi (default — haftalık tekrar standardı).
  - Web manuel "Kaydet" buton → mobile **autosave** (debounced).
  - Web egzersiz reorder yok → mobile **drag/reorder gün-içi** + opsiyonel "Başka güne taşı".

### Karara bağlandı (rev 5)

- **Tek route, state ayırt etmez:** NewProgramSheet save + ✎ edit + pasif ActionSheet "Düzenle" hepsi `/workout/program/[id]/edit`'e push. URL param `id`; ekran mount'ta query çeker. Yeni vs mevcut görsel ayrım yok — kullanıcı kararı (rev 14).
- **Gün layout = dikey scroll + collapsible panels:** 7 gün Pzt-Paz dikey listelenir; her gün collapsible (chevron). Default: bugünün günü açık, diğerleri kapalı. Wizard yok (§8.4.1). Kullanıcı kararı (rev 14).
- **Cycle type 3 seçenek (rev 14 — KAPATILDI):** `weekly` (default) / `deload` / `none`. `none` MVP'de kalır ama default değil — ileri kullanıcı için "haftalık tekrar istemiyorum, tek seferlik plan" seçeneği. Compliance hesabı `none` için atlanır (`lib/calc.ts` `null` döner; UI'da `—%`). `weekly` ve `deload` compliance aktif.
- **Off-day toggle = Opsiyon A (rev 14 KAPATILDI):** Dolu gün off-day yapılınca confirm modal ("3 egzersiz var, listeden çıkarılacak. Devam?") → onay → `app_program_days` satırları silinir. Off kaldırılırsa kullanıcı sıfırdan ekler. Sade veri modeli; off-day ↔ workout day exclusive.
- **Gün-gün taşıma = Opsiyon A (rev 14 KAPATILDI):** Egzersiz row long-press → ⋯ menü → "Başka güne taşı" → MoveToDaySheet (7 gün listesi, mevcut gün disabled). Tap → `app_program_days.day_index` update. Drag-cross-panel (Opsiyon B) MVP sonrası.
- **Aktif et CTA disabled koşul = en az 1 toplam egzersiz (rev 14 KAPATILDI):** Programın hiçbir gününde egzersiz yoksa CTA disabled + label "Önce egzersiz ekle". En az 1 (herhangi günde) → enabled. Boş program aktifleştirme reddedildi.
- **Autosave debounced (300-500ms):** Manuel "Kaydet" buton yok; app bar "Kaydet" sadece save & exit için (D2'ye dön). Hızlı tek-el deneyim için optimistic.
- **Bottom nav D3'te gizli:** Tam ekran edit pattern. Geri dönüş app bar back.
- **D2 ile ortak component'ler:** `ActivateConfirmModal`, `DeleteProgramModal`, `AddExerciseSheet` (C4 ile de ortak) D3 ve D2'de aynı kod paylaşır.

### Açık sorular (kalan — implementation veya sonra)

- **Day panel accordion mı multi-expand mı?** **Önerim:** multi-expand. Implementation aşamasında final karar.
- **D2 NewProgramSheet save sonrası D3 navigate türü:** `router.push` mu `router.replace` mı? **Önerim:** `push` (back D2'ye döner ve yeni program orada görünür).
- **Bottom nav gizleme yöntemi:** Expo Router'da `<Tabs screenOptions={{ tabBarStyle: { display: 'none' } }}>` per-screen mi, yoksa Stack modal mı? Implementation seçimi.
- **Autosave debounce final süre:** 300/500/700 ms? Test cihazında belirlenir.
- **Drag-during-keyboard-open:** Egzersiz row drag aktifken klavye açık (input focused gün adı edit'i)? Klavye blur edilsin, sonra drag mi izinli? Implementation aşamasında.
- **D2 active program activated_at = gelecek tarih:** "Henüz başlamadı" sub-badge mi yoksa aktif sayılır mı? Cycle resolver D3 implementation aşamasında netleşir.

---

## E1 More panel

### Niyet & yolculuk konteksti

More paneli, kullanıcının **kişisel ayarlarına ve oturum yönetimine** eriştiği minimal bottom sheet'tir. Bottom nav'ın 5. öğesine (More) tap veya B1 Calendar'daki avatar tap'i ile açılır — her iki entry point de **aynı sheet**'i açar (§3.1). MVP'de panel **minimal içerik** sunar: Logout (veya misafir için "Hesap Aç"), Language toggle, Theme toggle. Gelecekte Profile / Settings / Data / Feedback gibi bölümler burada yaşayacak; bu bölümler MVP'de **disabled/gri placeholder satır** olarak listelenir (Kullanıcı kararı: "Göster ama disabled").

Yolculuk bağlamları:
- **Auth'lu kullanıcı:** En altta "Çıkış Yap" (§3.6 logout: More menüden manuel). Üstte disabled profile/settings bölümleri.
- **Misafir kullanıcı:** "Çıkış Yap" yerine "Hesap Aç" sticky item (§3.9). Kayıt sayfasına yönlendirir.

### Layout sketch

**Auth'lu kullanıcı varyantı:**

```
┌─────────────────────────────┐
│  [scrim — siyah %60]        │  ← tap to dismiss
│                             │
│                             │
│                             │
│ ╔═════════════════════════╗ │
│ ║ ▔▔▔▔▔▔▔▔▔▔              ║ │  ← drag handle (4pt pill, --brd-subtle)
│ ║                         ║ │
│ ║  [AC]  Ali Çolak        ║ │  ← küçük profil özeti (avatar + display name)
│ ║        ali@example.com  ║ │    (disabled — profil sayfası MVP dışı)
│ ║                         ║ │
│ ║  ─────────────────────  ║ │  ← separator
│ ║                         ║ │
│ ║  🌐  Dil                ║ │  ← Language row
│ ║      TR  │  EN           ║ │    segmented pill sağ tarafta
│ ║                         ║ │
│ ║  ☾   Tema               ║ │  ← Theme row
│ ║      Koyu │ Açık         ║ │    segmented pill sağ tarafta
│ ║                         ║ │
│ ║  ─────────────────────  ║ │  ← separator
│ ║                         ║ │
│ ║  👤  Profil          →  ║ │  ← disabled (soluk, dokunulamaz)
│ ║  ⚙   Ayarlar         →  ║ │  ← disabled
│ ║  📊  Veri            →  ║ │  ← disabled
│ ║  💬  Geri Bildirim   →  ║ │  ← disabled
│ ║                         ║ │
│ ║  ─────────────────────  ║ │  ← separator
│ ║                         ║ │
│ ║  ⎋   Çıkış Yap          ║ │  ← danger rengi (--danger veya t-error)
│ ║                         ║ │
│ ╚═════════════════════════╝ │
└─────────────────────────────┘
```

**Misafir kullanıcı varyantı:**

```
│ ╔═════════════════════════╗ │
│ ║ ▔▔▔▔▔▔▔▔▔▔              ║ │
│ ║                         ║ │
│ ║  [M]  Misafir           ║ │  ← misafir badge (§3.9)
│ ║       Veri bu cihazda   ║ │
│ ║                         ║ │
│ ║  ─────────────────────  ║ │
│ ║                         ║ │
│ ║  🌐  Dil    TR │ EN      ║ │
│ ║  ☾   Tema  Koyu │ Açık   ║ │
│ ║                         ║ │
│ ║  ─────────────────────  ║ │
│ ║                         ║ │
│ ║  👤  Profil          →  ║ │  ← disabled
│ ║  ⚙   Ayarlar         →  ║ │  ← disabled
│ ║  📊  Veri            →  ║ │  ← disabled
│ ║  💬  Geri Bildirim   →  ║ │  ← disabled
│ ║                         ║ │
│ ║  ─────────────────────  ║ │
│ ║                         ║ │
│ ║  ✦   Hesap Aç           ║ │  ← gold/accent rengi, sticky (§3.9)
│ ║                         ║ │
│ ╚═════════════════════════╝ │
```

### Component breakdown

| Component | Konum | Görevi |
|---|---|---|
| `MoreSheet` | `components/shared/MoreSheet.tsx` | Bottom sheet container. `useAuthStore` ile `isGuest` flag okur, varyantı belirler. |
| `AppBottomSheet` | `components/ui/AppBottomSheet.tsx` | Genel amaçlı bottom sheet wrapper. Drag-to-dismiss, scrim tap dismiss, snap point. |
| `MoreUserHeader` | `components/shared/MoreUserHeader.tsx` | Avatar (initials veya "M" misafir), display name + email satırı (auth) veya "Misafir / Veri bu cihazda" (guest). Disabled — tap etki yok. |
| `MoreActionRow` | `components/shared/MoreActionRow.tsx` | Tek satır: icon + label + optional right-side widget (toggle pill veya chevron) + optional disabled state. Hem aktif hem disabled satırlarda kullanılır. |
| `LangTogglePill` | `components/ui/LangTogglePill.tsx` | TR / EN iki segmentli toggle. `usePreferencesStore` okur/yazar. Dil anında değişir. |
| `ThemeTogglePill` | `components/ui/ThemeTogglePill.tsx` | Koyu / Açık iki segmentli toggle. `usePreferencesStore` okur/yazar. Tema anında değişir. |
| `MoreSeparator` | `components/shared/MoreSeparator.tsx` | Yatay ince separator (1pt, `--brd-subtle`). Satır grupları arasında. |
| `LogoutRow` | `components/shared/LogoutRow.tsx` | Danger stilli satır: "Çıkış Yap". Tap → confirm dialog (bkz. interaction notes). Sadece auth'lu varyant. |
| `GuestRegisterRow` | `components/shared/GuestRegisterRow.tsx` | Accent stilli satır: "Hesap Aç". Tap → `router.push('/(auth)/register')` + sheet dismiss. Sadece misafir varyant. |

### State varyantları

| State | Tetik | Görünüm |
|---|---|---|
| `closed` | Default, tap dışarıya, drag down | Sheet görünmez, scrim yok |
| `open-auth` | More tap / avatar tap + auth'lu kullanıcı | Full auth layout: profil özeti + dil + tema + disabled satırlar + logout |
| `open-guest` | More tap / avatar tap + misafir kullanıcı | Guest layout: misafir başlık + dil + tema + disabled satırlar + "Hesap Aç" |
| `lang-switching` | LangTogglePill tap | Anında dil re-render (bütün app, i18n key değişir); toast yok (görsel geri bildirim yeterli) |
| `theme-switching` | ThemeTogglePill tap | Anında tema değişimi; `ThemeProvider` token swap; toast yok |
| `logout-confirming` | "Çıkış Yap" tap | Native Alert: "Çıkış yapmak istediğinden emin misin?" [Vazgeç] [Çıkış Yap] |
| `logging-out` | Confirm "Çıkış Yap" | Sheet kapanır, auth token temizlenir, `router.replace('/(auth)/welcome')` |
| `disabled-item-tap` | Profil / Ayarlar / Veri / Geri Bildirim tap | Toast: "Çok yakında!" (2sn, `t-secondary` renk, warning değil) |

### Props / TS interface

```ts
// components/shared/MoreSheet.tsx
interface MoreSheetProps {
  visible: boolean;
  onClose: () => void;
}

// components/shared/MoreActionRow.tsx
interface MoreActionRowProps {
  icon: React.ReactNode;           // lucide-react-native icon
  label: string;                   // i18n key veya direkt string
  rightWidget?: React.ReactNode;   // toggle pill, chevron, vb.
  disabled?: boolean;              // true = soluk, dokunulamaz
  variant?: 'default' | 'danger' | 'accent';  // default=normal, danger=logout, accent=hesap aç
  onPress?: () => void;            // disabled=true ise internal "yakında" toast
  testID?: string;
}

// components/ui/LangTogglePill.tsx
interface LangTogglePillProps {
  value: 'tr' | 'en';
  onChange: (lang: 'tr' | 'en') => void;
  compact?: boolean;               // default false; More'da compact=false (tam label)
}

// components/ui/ThemeTogglePill.tsx
interface ThemeTogglePillProps {
  value: 'dark' | 'light';
  onChange: (theme: 'dark' | 'light') => void;
  compact?: boolean;
}

// components/shared/MoreUserHeader.tsx
interface MoreUserHeaderProps {
  variant: 'auth' | 'guest';
  displayName?: string;           // auth'ta gerekli
  email?: string;                 // auth'ta opsiyonel (gösterilirse)
  initials?: string;              // "AC" gibi — avatar fallback
}
```

### Interaction notes

- **Açılış:** Bottom sheet `slide-up` animasyonu, 300ms ease-out. Scrim fade-in eş zamanlı.
- **Kapanış:** Drag down (drag threshold %30 yükseklik) veya scrim tap → slide-down + scrim fade-out. Back button (Android) → dismiss (scrim tıklaması ile aynı).
- **LangTogglePill:** Tap → `usePreferencesStore.setLocale(lang)` → `i18n` context re-render → tüm app etiketi değişir. AsyncStorage'a yazılır (`GUEST_KEYS.profile` veya `app_profiles.preferences.locale`).
- **ThemeTogglePill:** Tap → `usePreferencesStore.setTheme(theme)` → `ThemeProvider` token'ları swap → her yer anında güncellenir. AsyncStorage'a yazılır.
- **Disabled satırlar:** `MoreActionRow disabled={true}` → `opacity: 0.38`, `pointerEvents: 'none'` değil; tap **çalışır ama** internal toast tetikler — "Çok yakında!". (Sebebi: kullanıcı "tıklanamaz" zannetmesin, "henüz hazır değil" anlasın.)
- **Logout:** Tap → `Alert.alert(...)` confirm. Onay → `supabase.auth.signOut()` + `authStore.clear()` + `router.replace('/(auth)/welcome')`. `expo-secure-store` token temizlenir. Sheet dismiss'i logout confirm onayı ile birleşir (sheet önce kapanabilir veya kapanmadan navigate olabilir; her ikisi de kabul edilir).
- **Hesap Aç:** Tap → sheet önce dismiss → sonra `router.push('/(auth)/register')`. Dismiss + navigate sırası: sheet tam kapanmadan navigate olursa animation jarring — önce dismiss (250ms), sonra navigate.
- **Profil özeti dokunulamaz:** `MoreUserHeader` sadece görsel; tap etki üretmez (profile sayfası MVP dışı). Accessibility: `accessibilityRole="none"`.
- **Haptic:** Toggle tap → `Haptics.selectionAsync()`. Logout confirm → `Haptics.notificationAsync(NotificationFeedbackType.Warning)`. Hesap Aç → `Haptics.impactAsync(ImpactFeedbackStyle.Medium)`.
- **Snap points:** Tek snap — sheet yüksekliği içerik yüksekliğine göre (dinamik, ama min. 40% ekran, maks. 80%). Uzun cihazlarda boşluk oluşabilir (alt beyaz alan — scrim içinde kalır).

### Edge cases

- **Çok uzun display name:** "Ali Mehmet Uzun İsim Örneği" — tek satırda kesilir (`numberOfLines={1}`, `ellipsizeMode="tail"`).
- **Avatar initials Türkçe karakter:** "Ç" "Ğ" "İ" "Ş" "Ü" — UTF-8 güvenli; initials string `displayName.slice(0,2).toUpperCase()` yeterli.
- **Email uzunluğu:** "ali.cok.uzun.bir.kullanici.adi@ornek-uzun-domain.com" → tek satır, overflow clip.
- **Misafir kullanıcı "Çıkış Yap" yok:** Guest varyantında `LogoutRow` render edilmez. "Hesap Aç" tek aksiyonlu satır.
- **Tema koyu'dan açığa geçince sheet görünümü:** Token swap anında — sheet açıkken tema değişirse sheet de güncellenir (ThemeProvider tüm tree'yi sarar).
- **Dil değiştirince sheet içindeki etiketler:** Tüm i18n key'ler re-render olur, toggle pill state korunur. Kullanıcı TR'den EN'e geçerse "Çıkış Yap" → "Sign Out" anında değişir.
- **Offline:** Dil/tema değişimi saf local (AsyncStorage) — offline'da çalışır. Logout Supabase'e istek atar; offline'da logout fail → hata toast + tekrar dene. Token local'dan temizlemek yeterli mi? MVP'de evet — `signOut()` fail ise local token sil, yeniden Welcome'a yönlen.
- **Birden fazla hızlı toggle:** Debounce gerekmez (local state + AsyncStorage) ama rapid toggle animasyon titremesi riski → `ThemeTogglePill` `disabled` during animation (150ms).
- **Accessibility:** Sheet açılınca VoiceOver focus en üste (drag handle) atlar. Her satır `accessibilityRole="button"`. Disabled satırlar `accessibilityHint="Bu özellik henüz mevcut değil"`. Logout `accessibilityLabel="Çıkış yap, onay gerektirir"`.

### Prototip referansı

- **Doğrudan prototip yok.** E1 için hazır prototip dosyası bulunmuyor.
- Görsel dil kaynakları:
  - **calendar-prototype-v2** bottom nav'daki More öğesi — üç nokta (⋯) icon, position ve label stili.
  - **auth-prototype** modal/dialog stili — scrim arka plan, rounded card, separator çizgileri.
  - **workout-prototype** action sheet pattern'i — `AppBottomSheet` konsepti için.
- §3.1 (floating panel) + §3.4 (Language More'dan) + §3.6 (logout More'dan) + §3.9 ("Hesap Aç" sticky More'da) + §8.5 (Theme toggle More'da) kararlarıyla birebir hizalı.

### Karara bağlandı (rev 6)

- **Disabled placeholder satırlar gösterilir:** Profil, Ayarlar, Veri, Geri Bildirim — MVP'de işlevsiz ama panelde listelenir; disabled/soluk görünür, tap "Çok yakında!" toast verir. Kullanıcı kararı (2026-05-25).
- **İki entry point aynı sheet:** Bottom nav More tap + B1 avatar tap aynı `MoreSheet` component'ini açar. §3.1 "floating panel" = bottom sheet. (B1'deki açık soru kapatıldı.)
- **Auth vs guest iki varyant:** Logout (auth) ↔ Hesap Aç (guest) satırı birbiriyle yer değiştirir; geri kalan satırlar aynı.

### Açık sorular (kalan)

- **"Çok yakında!" toast tonu:** Default info toast mu, yoksa farklı bir icon/renk mi? `t-secondary` text + saat/bilgi icon önerisi. Implementation detayı.
- **Logout offline davranışı (kesin karar):** Supabase `signOut()` fail olursa lokal token silinsin mi yoksa hata gösterilsin mi? **Önerim:** lokal token temizle, Welcome'a yönlen — kullanıcı çıkmak istedi, güvenli davran. Detay implementation'da netleşir.
- **ThemeTogglePill label "Koyu / Açık" mı "Karanlık / Aydınlık" mı?** TR'de doğal hissettiren seçenek. **Önerim:** "Koyu / Açık" (web'deki "Dark Mode / Light Mode"'dan kısa). i18n key `theme.dark` / `theme.light`.

---

## F1 Dashboard placeholder

### Niyet & yolculuk konteksti

Dashboard, bottom nav'ın 3. sekmesidir (§3.1). MVP'de **işlevsiz** — tab'a tıklanabilir, ekran açılır, ancak içerik gerçek olmayan bir "Yakında" mesajıdır. Kullanıcı merak eder, bir şey beklemez; mesaj ne geleceğini kısaca tanımlar. Gelecekte dashboard: streak, progress charts, PR'lar, volume trend gibi istatistiksel içerikler barındıracak.

`PlaceholderScreen` ortak component'i kullanır — hem F1 hem F2 aynı component'i prop farklılığıyla çağırır (Kullanıcı kararı: tek ortak component). Bottom nav aktif (Dashboard sekmesi seçili görünür). Herhangi bir CTA yok — sade mesaj (Kullanıcı kararı: "Yok — sade mesaj").

### Layout sketch

```
┌─────────────────────────────┐
│  [status bar]               │
│                             │
│                             │
│                             │
│                             │
│                             │
│         [📊 icon]           │  ← BarChart2 (lucide), 56pt, t-tertiary
│                             │
│       Dashboard             │  ← başlık, Space Grotesk 22, t-primary
│                             │
│   Antrenman istatistiklerin │  ← açıklama, Inter 14, t-secondary, center
│   ve ilerleme grafiklerin   │
│   yakında burada olacak.    │
│                             │
│                             │
│                             │
│ [Cal][Lib][Dash][Soc][More] │  ← bottom nav (Dashboard aktif)
└─────────────────────────────┘
```

### Component breakdown

| Component | Konum | Görevi |
|---|---|---|
| `app/(app)/dashboard.tsx` | route | Ekran; `PlaceholderScreen`'i render eder, prop'ları geçer |
| `PlaceholderScreen` | `components/shared/PlaceholderScreen.tsx` | Ortak placeholder UI: icon + başlık + açıklama. F1 ve F2 paylaşır. |
| `AppScreen` | `components/ui/AppScreen.tsx` | SafeAreaView + bg |
| `BottomTabBar` | `components/ui/BottomTabBar.tsx` | 5 sekme, Dashboard aktif |

### State varyantları

| State | Tetik | Görünüm |
|---|---|---|
| `default` | Route mount | Yukarıdaki layout — tek ve tek. Yükleme yok, query yok. |

Bu ekran için ek state yok — tamamen statik render.

### Props / TS interface

```ts
// app/(app)/dashboard.tsx
export default function DashboardScreen() {
  return (
    <PlaceholderScreen
      icon="bar-chart-2"      // lucide icon name
      title={t('dashboard.title')}        // "Dashboard"
      description={t('dashboard.coming_soon')}  // "Antrenman istatistiklerin..."
    />
  );
}

// components/shared/PlaceholderScreen.tsx
interface PlaceholderScreenProps {
  icon: string;              // lucide-react-native icon name (string key)
  title: string;             // ekran başlığı
  description: string;       // 1-3 satır açıklama metni
  testID?: string;
}
```

### Interaction notes

- **Navigasyon:** Bottom nav Dashboard sekmesine tap → bu ekran mount olur. Back gesture: mevcut değil (tab root route), Android back = app minimize (system default).
- **Ekran içi etkileşim yok:** İkon, başlık, açıklama tıklanamaz.
- **Haptic:** Yok.
- **Animasyon:** Tab switch animasyonu Expo Router default (cross-fade veya slide — tab navigator default). Ekran içinde animasyon yok.

### Edge cases

- **Cihaz dili değişirse:** `t()` hook re-render → başlık ve açıklama anında güncellenir.
- **Erişilebilirlik:** `PlaceholderScreen` root view `accessibilityRole="none"`. İkon `accessibilityElementsHidden={true}` (dekoratif). Başlık `accessibilityRole="header"`. Açıklama `accessibilityRole="text"`.
- **Misafir kullanıcı:** Aynı ekran görünür (dashboard MVP dışı olduğu için auth/guest ayrımı yok).
- **Çok küçük ekran:** Dikey ortalama (`flex:1, justifyContent:'center'`) — metinler küçük ekranda da ortada kalır.

### Prototip referansı

- **Doğrudan prototip yok.** Dashboard için hazır prototip dosyası bulunmuyor.
- Görsel dil: `homepage-prototype-v2`'deki marka dili (siyah arka plan, sade tipografi) + `auth-prototype`'taki empty/info pattern'i.
- §3.1 (Dashboard: "bottom nav'da yeri tutulur") ve §3 (MVP kapsamı: "placeholder olarak görünür ama işlevsiz") kararıyla birebir hizalı.

### Karara bağlandı (rev 6)

- **PlaceholderScreen ortak component:** F1 ve F2 tek component paylaşır; prop'larla (icon, title, description) farklılaşır. Kullanıcı kararı (2026-05-25).
- **CTA yok:** Sade mesaj, "Haberdar et" butonu yok. Kullanıcı kararı (2026-05-25).

### Açık sorular (kalan)

- **i18n key'lerin final metni:** TR açıklama "Antrenman istatistiklerin ve ilerleme grafiklerin yakında burada olacak." — copy onayı? EN karşılığı "Your workout stats and progress charts are coming soon." — tutarlı ton?
- **İkon seçimi:** `BarChart2` (lucide) — net `dashboard` imgesi. Alternatif: `TrendingUp`. İmplementation sırasında görsel tercih.

---

## F2 Social placeholder

### Niyet & yolculuk konteksti

Social, bottom nav'ın 4. sekmesidir (§3.1). MVP'de **işlevsiz** — F1 ile birebir aynı yapı ve mantık; yalnızca icon, başlık ve açıklama metni farklı. Gelecekte sosyal özellikler: antrenman paylaşımı, arkadaş akışı, yorum, rozet gibi içerikler barındıracak.

`PlaceholderScreen` ortak component'ini F1 ile paylaşır.

### Layout sketch

```
┌─────────────────────────────┐
│  [status bar]               │
│                             │
│                             │
│                             │
│                             │
│                             │
│         [👥 icon]           │  ← Users (lucide), 56pt, t-tertiary
│                             │
│          Social             │  ← başlık, Space Grotesk 22, t-primary
│                             │
│   Antrenmanlarını paylaş,   │  ← açıklama, Inter 14, t-secondary, center
│   arkadaşlarını takip et.   │
│   Yakında burada.           │
│                             │
│                             │
│                             │
│ [Cal][Lib][Dash][Soc][More] │  ← bottom nav (Social aktif)
└─────────────────────────────┘
```

### Component breakdown

| Component | Konum | Görevi |
|---|---|---|
| `app/(app)/social.tsx` | route | Ekran; `PlaceholderScreen`'i render eder, prop'ları geçer |
| `PlaceholderScreen` | `components/shared/PlaceholderScreen.tsx` | F1 ile aynı ortak component |
| `AppScreen` | `components/ui/AppScreen.tsx` | SafeAreaView + bg |
| `BottomTabBar` | `components/ui/BottomTabBar.tsx` | 5 sekme, Social aktif |

### State varyantları

| State | Tetik | Görünüm |
|---|---|---|
| `default` | Route mount | Yukarıdaki layout — statik render, tek state. |

### Props / TS interface

```ts
// app/(app)/social.tsx
export default function SocialScreen() {
  return (
    <PlaceholderScreen
      icon="users"            // lucide icon name
      title={t('social.title')}              // "Social"
      description={t('social.coming_soon')}  // "Antrenmanlarını paylaş..."
    />
  );
}
```

F1 ile aynı `PlaceholderScreen` interface'i — bakınız F1.

### Interaction notes

F1 Dashboard ile birebir aynı — bakınız F1 interaction notes. Ekran içi etkileşim yok, haptic yok, navigasyon tab switch, back = system default.

### Edge cases

F1 ile birebir aynı — bakınız F1 edge cases.

### Prototip referansı

- **Doğrudan prototip yok.** Social için hazır prototip dosyası bulunmuyor.
- `calendar-prototype-v2`'deki bottom nav Social item'ı (Users icon + "Social" label) visual dili için referans alındı.
- §3.1 (Social: "bottom nav'da yeri tutulur") ve §3 (MVP kapsamı: "placeholder olarak görünür ama işlevsiz") kararıyla birebir hizalı.

### Karara bağlandı (rev 6)

- **PlaceholderScreen ortak component:** F1 ile aynı karar — bakınız F1 "Karara bağlandı". Kullanıcı kararı (2026-05-25).
- **CTA yok:** F1 ile aynı karar. Kullanıcı kararı (2026-05-25).

### Açık sorular (kalan)

- **i18n key'lerin final metni:** TR açıklama "Antrenmanlarını paylaş, arkadaşlarını takip et. Yakında burada." — copy onayı? EN karşılığı "Share your workouts and follow friends. Coming soon." — tutarlı ton?
- **İkon seçimi:** `Users` (lucide) — sosyal imgesi net. Alternatif: `Share2` veya `MessageCircle`. İmplementation sırasında görsel tercih.
