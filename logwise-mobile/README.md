# LogWise Mobile

React Native + Expo + TypeScript mobil uygulama. LogWise web ürününün evrimi.

> **Bağlam:** Bu klasör `LogWise/` monorepo'sunun mobil parçasıdır. Tasarım sistemi ve kararlar `../docs/mobile-design-system/` altındadır. Repo sözleşmesi: `../AGENTS.md`.

## Kurulum

```bash
cd logwise-mobile
npm install              # veya: npx expo install (Expo SDK ile uyumlu versiyonlar için)
cp .env.example .env     # ardından gerçek Supabase anon key'i gir
npm run start            # Expo dev server
```

İlk çalıştırmadan önce **`app.json` içindeki `extra.supabaseAnonKey`** veya `.env` içindeki `EXPO_PUBLIC_SUPABASE_ANON_KEY` doldurulmalı.

## Komutlar

| Komut | İş |
|---|---|
| `npm start` | Expo dev server (Expo Go uyumlu) |
| `npm run android` | Android emülatör/cihaz |
| `npm run ios` | iOS simülatör (macOS gerekli) |
| `npm run typecheck` | `tsc --noEmit` — CI gate |
| `npm run lint` | ESLint |
| `npm test` | Jest unit testleri |

## Klasör yapısı

`03-mvp-decisions.md §2.1` referans alınmıştır. Detay için o belgeye bak.

```
app/                     # Expo Router file-based routes
├── _layout.tsx          # Root layout
├── (auth)/              # welcome, login, register, forgot-password
└── (app)/               # calendar, workout, dashboard, social, more
components/              # ui, calendar, day, workout, shared
lib/                     # supabase, calc, exercise-utils, guest-storage, migration
data/                    # presets-exercises, presets-programs, i18n-tr, i18n-en
stores/                  # Zustand (auth, preferences, ui)
queries/                 # TanStack Query hooks
theme/                   # tokens, colors, ThemeProvider
types/                   # database (auto-gen), domain, i18n
hooks/                   # useAuth, useI18n
assets/                  # fonts, images
```

## Mutlak kurallar (özet — detay için `../AGENTS.md` + `../docs/mobile-design-system/03-mvp-decisions.md`)

- **TypeScript strict** + `noUncheckedIndexedAccess` zorunlu (`tsconfig.json`).
- **Misafir mod**: Supabase'e ÇAĞRI YOK — sadece AsyncStorage (`GUEST_KEYS` sabitleri, prefix `@logwise/guest/`).
- **Preset hareketler** `app_exercises`'a kopyalanmaz — bundle'da JSON kalır.
- **`exercise_ref`** her yerde polymorphic text (slug VEYA UUID), FK değil.
- **RIR enum**: `"F" | "-" | "1" | "2" | "3" | "4+"` (DB+UI tek dil — web "0" değil).
- **Set type**: `"working" | "warmup" | "drop"` (superset MVP'de yok; şema field'ı yer tutar).
- **Bottom nav D3 Program Edit'te gizli.**
- **Sentry sadece production** (`beforeSend` ile dev event'leri filtrelenir).

## Test stratejisi (§10.2)

Zorunlu coverage: `lib/calc.ts`, `lib/exercise-utils.ts`, `lib/migration.ts`, `lib/guest-storage.ts`. UI test (RNTL) ve E2E (Maestro/Detox) MVP dışı.

CI gate: `tsc --noEmit && eslint . && jest`.
