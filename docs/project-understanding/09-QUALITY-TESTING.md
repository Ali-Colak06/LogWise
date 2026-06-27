# 09 — QUALITY & TESTING

> Etiketler: `DOĞRULANDI` / `ÇIKARIM` / `BELİRSİZ` / `ESKİ OLABİLİR`. Kanıt = dosya + sembol.
> **Kural:** Bir aracın config'inin bulunması, CI/release'de **çalıştırıldığı** anlamına gelmez —
> kullanıldığı yer doğrulanır.

---

## 1. Gerçekte mevcut kalite kapıları

| Kapı | Var mı? | Nerede tanımlı | CI'de çalışıyor mu? | Kanıt |
|---|---|---|---|---|
| TypeScript typecheck | ✅ (manuel) | `package.json` `typecheck: tsc --noEmit`; sıkı `tsconfig.check.json` | ❌ **CI'de yok** | `DOĞRULANDI` |
| Codegen drift check | ✅ | `scripts/check-codegen.js` | ✅ **Tek CI kapısı** | `DOĞRULANDI` — `.github/workflows/codegen-check.yml` |
| Unit testler | ⚠️ Altyapı var, **test YOK** | jest/ts-jest/jest-expo (`package.json`) | ❌ | `DOĞRULANDI` — `__tests__/lib/.gitkeep` (boş) |
| Integration testler | ❌ Yok | — | ❌ | `DOĞRULANDI` (negatif) |
| Lint | ✅ (manuel) | `package.json` `lint: eslint .` + `eslint-config-expo` | ❌ **CI'de yok** | `DOĞRULANDI` |
| Web JS syntax | ✅ (manuel) | `node --check <path>` | ❌ | `DOĞRULANDI` — `AGENTS.md §6` |
| Manuel release checklist | ✅ (mobil) | `logwise-mobile/PRODUCTION-CHECKLIST.md` | — | `DOĞRULANDI` |
| Error monitoring | ✅ Mobil crash-only | `lib/sentry.ts` | runtime | `DOĞRULANDI` |
| Build doğrulama | kısmi | codegen `--check`; web `node --check` | codegen CI'de | `DOĞRULANDI` |

> **En kritik bulgu:** `__tests__/` **boştur** (yalnız `.gitkeep`). jest/ts-jest **yapılandırılmış**
> ama **hiç otomatik test yazılmamış**. Tek otomatik kapı codegen drift'tir; typecheck/lint **manuel**
> ve CI'de zorlanmaz. `DOĞRULANDI` — `find __tests__` (yalnız `.gitkeep`), `codegen-check.yml`.

---

## 2. Test kapsamı matrisi (kritik alanlar)

| Alan | Otomatik test | Manuel test | Eksik | Kullanıcı etkisi | Prod öncesi gereklilik |
|---|---|---|---|---|---|
| Auth + session | ❌ | ✅ `PRODUCTION-CHECKLIST §5` (A1-A5) | otomatik | Giriş kırılırsa erişim yok | **Zorunlu** |
| Guest mode | ❌ | ✅ (B1/C/migration adımları) | otomatik | Veri yerel kaybı | **Zorunlu** |
| Guest→auth migration | ❌ | ✅ `§5` (guest→hesap) | otomatik (atomiklik/duplicate) | **Veri kaybı/duplikasyon** | **Zorunlu** |
| Workout CRUD | ❌ | ✅ (C1-C4) | otomatik | Yanlış kayıt | **Zorunlu** |
| Set CRUD | ❌ | ✅ (set ekle/sil/düzenle) | otomatik | Hatalı set/ağırlık | **Zorunlu** |
| Programlar | ❌ | ✅ (D1-D3) | otomatik | Program bozulması | Yüksek |
| **Tek aktif program kuralı** | ❌ | kısmi (duplicate guard) | otomatik + DB kısıtı | Çoklu aktif program | Yüksek |
| PR hesabı | ❌ | gözlemsel | birim test (saf fonksiyon!) | Yanlış PR | Orta |
| Estimated 1RM (web) | ❌ | araç sayfası elle | birim test | Yanlış 1RM | Orta |
| Dashboard | ❌ | gözlemsel | `computeDashboard` birim testi (saf!) | Yanlış istatistik | Orta |
| RLS / authorization | ❌ | yok | **canlı RLS testi** | **Veri sızıntısı** | **Zorunlu** |
| Offline davranışı | ❌ | yok | otomatik + manuel | Sessiz veri kaybı | Yüksek |
| Çoklu cihaz | ❌ | yok | manuel senaryo | LWW veri kaybı | Yüksek |
| Codegen | ✅ `--check` | — | — | web/mobil veri ayrışması | (kapalı) |
| Web–mobil parity | ❌ | yok | parity kontrol listesi | Tutarsız ürün | Orta |
| Worker authz + R2 | ❌ | yok | endpoint testi | Yetkisiz upload/erişim | Yüksek |

> **Düşük asılı meyve:** `lib/calc.ts`, `lib/dashboard.ts`, `lib/calc.js`, `scripts/build-*.js` saf
> fonksiyonlardır → birim testi **kolay ve yüksek değerli** (şu an 0 test). `ÇIKARIM` (saf imzalar).

---

## 3. Minimum release checklist'leri

### Web release
- [ ] Değişen her `.js` için `node --check`. **[Doküman]** `AGENTS.md §6`.
- [ ] Yeni statik dosya varsa `sw.js` `CACHE_NAME` bump + `PRECACHE_URLS`. `DOĞRULANDI`.
- [ ] i18n TR+EN eşzamanlı. `DOĞRULANDI`.
- [ ] Etkilenen view tarayıcıda render. `Çıkarım`.
- [ ] (Yoksa eklenmeli) Supabase RLS/sızıntı dumanı testi.

### Mobil release
- [ ] `npx tsc -p tsconfig.check.json --noEmit` → 0 hata. **[Doküman]** `PRODUCTION-CHECKLIST §7`.
- [ ] `PRODUCTION-CHECKLIST.md` §1-§9 (config/EAS/manuel test/Sentry). `DOĞRULANDI`.
- [ ] Migration manuel testi (guest→hesap). `DOĞRULANDI`.
- [ ] `app.json version` semver bump. `DOĞRULANDI`.

### Database / RLS değişikliği
- [ ] Politika her tabloda **ayrı** doğrulanır (genelleme yok — bkz. 06). `DOĞRULANDI`.
- [ ] `user_data_select_public` gibi public-okuma policy'leri gözden geçirilir.
- [ ] `supabase_setup.sql` güncellenir **ve** canlı DB'ye uygulanır (migration dosyası yok — manuel risk).
- [ ] (Yoksa eklenmeli) RPC'ler repoya yazılır (`check_app_username_available` eksik — bkz. 06).

### Worker release
- [ ] `wrangler deploy`; secret'lar (`SUPABASE_URL`/`ANON_KEY`/`WORKER_URL`/`ALLOWED_ORIGIN`) ayarlı.
  ⚠️ `wrangler.toml` yorumundaki secret adları kodla uyumsuz — temizlenmeli (bkz. 08). `DOĞRULANDI`.
- [ ] Sahiplik (`avatars/<uid>/`) + 5 MB limit dumanı testi.

### Ortak kanonik veri / codegen değişikliği
- [ ] Kanonik JSON (`data/presets-exercises.json` / `ex-guides.json`) düzenle → generator çalıştır.
- [ ] `node scripts/check-codegen.js` yeşil (web + mobil çıktı). `DOĞRULANDI`.
- [ ] **Codegen-DIŞI** `presets-programs` / `i18n` değiştiyse web+mobil **elle** senkronla (drift!). `DOĞRULANDI`.

---

## 4. En ciddi kalite boşlukları (detay 10'da)
1. **Sıfır otomatik test** (saf fonksiyonlar bile test edilmemiş). `DOĞRULANDI`.
2. **CI yalnız codegen** — typecheck/lint/test gate'siz push mümkün. `DOĞRULANDI`.
3. **RLS/authorization testi yok** — güvenlik tamamen elle gözden geçirmeye bağlı. `DOĞRULANDI`.
4. **Offline/çoklu-cihaz senaryoları test edilmiyor** — sessiz veri kaybı erken yakalanmaz. `ÇIKARIM`.
