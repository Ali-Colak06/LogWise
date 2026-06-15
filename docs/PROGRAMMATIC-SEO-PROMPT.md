# LogWise Programmatic SEO Prompt

Use this prompt for the next LogWise SEO growth phase: programmatic exercise and program pages.

```txt
LogWise projesinde programmatic SEO sayfalarina gecmek istiyorum.

Proje yolu:
C:\Users\colak\Documents\LogWise-master

Once mutlaka:
- AGENTS.md oku ve kurallarina uy.
- git status ve git log --oneline -10 kontrol et.
- Gerekirse REFACTOR-GECMISI.md son bolumleri oku.
- JSX/Babel yok.
- React app /app altinda, gerekmiyorsa app tarafina dokunma.
- Landing ve SEO sayfalari statik HTML.
- Manuel dosya duzenlemelerinde apply_patch kullan.
- git add . kullanma; dosyalari ismen stage et.
- Commit gerekiyorsa Co-Authored-By: Codex <noreply@openai.com> satiri kullan.

Mevcut SEO durumu:
- Canonical domain: https://logwise.fit
- EN landing: /
- TR landing: /tr
- Learn sistemi: blog-content/*.md kaynaklarindan scripts/build-blog.js ile statik HTML uretiyor.
- Learn sistemi TR/EN varyantli, translationKey ile eslesiyor.
- Tool sayfalari mevcut:
  - /tools
  - /one-rep-max-calculator
  - /workout-log-template
  - /workout-volume-calculator
- scripts/build-blog.js sitemap.xml de uretiyor ve statik sayfalari sitemap'e ekliyor.
- Cloudflare Pages .html dosyalarini clean URL olarak sunuyor; gereksiz _redirects kurali ekleme.
- www.logwise.fit -> logwise.fit 301 redirect Cloudflare tarafinda duzeltildi.

Bu isin amaci:
Programmatic SEO ile kullanici aramalarina cevap veren statik library sayfalari uretmek:
- /library
- /library/exercises/bench-press
- /library/exercises/squat
- /library/exercises/deadlift
- /library/programs/push-pull-legs

Onemli: Bu buyuk bir mimari is. Once mevcut veri kaynaklarini, sayfa kaliplarini, sitemap mantigini ve service worker etkisini incele. Sonra kucuk ve guvenli bir ilk dilim uygula.

Beklenen strateji:
1. Once repo yapisini incele:
   - data/presets-exercises.js
   - data/ex-descriptions.js
   - data/ex-preview.js
   - data/presets-programs.js
   - scripts/build-blog.js
   - styles/landing.css
   - tools.html ve mevcut tool sayfalari
   - sw.js
2. Programmatic SEO icin en temiz yaklasimi sec:
   - Tercihen yeni bir generator script veya mevcut scripts/build-blog.js icinde genisletilmis static SEO generator mantigi.
   - Buyuk string kopyalama yerine veri tabanli template kullan.
   - Build step yok; Node script repo icinde calisir, tarayici icin Babel/JSX yok.
3. Ilk MVP kapsam:
   - Library hub ve dizin sayfalari:
     - /library
     - /library/exercises
     - /library/programs
   - Sadece 3 exercise sayfasi:
     - bench-press
     - squat
     - deadlift
   - Sadece 1 program sayfasi:
     - push-pull-legs
   - Daha sonra ayni sistemle yeni sayfa eklemek kolay olmali.

URL ve dosya yapisi:
- Clean URL hedefleri:
  - /library
  - /library/exercises
  - /library/programs
  - /library/exercises/bench-press
  - /library/exercises/squat
  - /library/exercises/deadlift
  - /library/programs/push-pull-legs
- Cloudflare Pages clean URL icin .html handling kullaniyorsa explicit redirect ekleme.
- Root /exercises ve /programs kullanilacaksa canonical dizinlere 301 alias olarak ele al:
  - /exercises -> /library/exercises
  - /programs -> /library/programs
- Dosya ciktilari icin mevcut mimariye uygun bir yapi oner ve uygula. Ornek:
  - library.html
  - library/exercises.html
  - library/programs.html
  - library/exercises/bench-press.html
  - library/exercises/squat.html
  - library/exercises/deadlift.html
  - library/programs/push-pull-legs.html
- Yeni klasor acilirsa AGENTS.md dosya haritasini guncelle.
- Buyuk mimari karar oldugu icin REFACTOR-GECMISI.md yeni bolum ekle.

Sayfa tasarimi:
- Mevcut static landing/tool tasarim diliyle uyumlu olsun.
- Ortak stiller styles/landing.css icinde olsun.
- Inline CSS buyutme.
- Sayfalar mobilde tasmasin, tablo/kartlar responsive olsun.
- UI metinleri net, pratik ve arama niyetine uygun olsun.

Exercise sayfa icerigi:
Her exercise sayfasi su bolumleri icersin:
- Hero:
  - Exercise adi
  - Kisa aciklama
  - CTA: "Track this lift in LogWise" -> /app
  - CTA: "Calculate your 1RM" -> /one-rep-max-calculator
- Quick facts:
  - Primary muscles
  - Equipment
  - Movement pattern
  - Difficulty veya best for
- How to do the exercise:
  - 4-6 maddelik sade form rehberi
- Common mistakes:
  - 3-5 yaygin hata
- How to progress:
  - reps, load, sets, volume, RIR mantigi
  - uygun yerde /workout-volume-calculator linki
- Tracking tips:
  - sets, reps, weight, RIR, notes
  - uygun yerde /workout-log-template linki
- Related tools:
  - /one-rep-max-calculator
  - /workout-volume-calculator
  - /tools
- Related exercises:
  - Bench press sayfasinda squat/deadlift degil, daha alakali varyasyonlar varsa veri kaynaklarindan sec.
  - MVP icin sadece mevcut 3 sayfa arasinda anlamli linkler kurmak yeterli olabilir.

Program sayfasi icerigi:
/library/programs/push-pull-legs sayfasi su bolumleri icersin:
- Hero:
  - Push Pull Legs programi
  - Kimler icin uygun
  - CTA: "Start tracking this program" -> /app
- Program overview:
  - haftalik frekans
  - gun yapisi
  - hedef kitle
- Weekly layout:
  - Push
  - Pull
  - Legs
  - tekrar eden gunler
- Exercise list:
  - data/presets-programs.js icindeki push-pull-legs verisini kullan.
  - Exercise linkleri varsa /library/exercises/{slug} sayfalarina bagla.
  - Sayfasi olmayan exercise linkleri icin ya link verme ya da ileride eklenecekse dikkatli davran.
- How to progress:
  - progressive overload
  - volume takibi
  - recovery
- Related tools:
  - /workout-volume-calculator
  - /workout-log-template
  - /one-rep-max-calculator
- Related reading:
  - uygun Learn yazilarina link ver.

SEO meta:
Her sayfada:
- title
- meta description
- canonical
- OG title/description/url/image
- Twitter card
- hreflang:
  - Sayfalar sadece EN ise en + x-default kullan.
  - TR versiyon uretilmeyecekse sahte TR hreflang ekleme.
- JSON-LD:
  - Exercise sayfalari icin WebPage + BreadcrumbList uygula.
  - HowTo kullanmayi dusunebilirsin, ama sadece adimlar gercekten net ve sayfada gorunuyorsa kullan.
  - Program sayfasi icin WebPage + BreadcrumbList + ItemList mantikli olabilir.
  - Medical/health claim abartisi yapma.

Sitemap:
- Yeni programmatic sayfalari sitemap.xml'e ekle.
- Bunu manuel sitemap editinden ziyade generator mantigiyle yap.
- lastmod tarihlerini bugunun tarihiyle veya kaynak mantigina uygun sekilde ayarla.
- node scripts/build-blog.js veya yeni generator neyse calistirinca sitemap guncellenmeli.

Navigasyon ve ic linkleme:
- /tools sayfasindan programmatic sayfalara gerekirse "Training library" veya "Popular lifts" bolumu ekle.
- Landing sayfalarinda cok kalabalik yapma; gerekiyorsa sadece /tools veya Learn uzerinden bagla.
- Learn yazilarindan dogal linkler ekle:
  - progressive-overload EN/TR -> bench press/squat/deadlift veya volume calculator baglami
  - workout-tracker-app-guide EN/TR -> exercise tracking veya PPL program sayfasi
- Learn kaynaklarini blog-content/*.md icinde duzenle; sonra generator calistir.

PWA / sw.js:
- Yeni statik HTML sayfalari eklenecek.
- Mevcut sw.js PRECACHE_URLS icinde tools/static SEO sayfalari varsa yeni sayfalari da ekle ve CACHE_NAME bump yap.
- Eger bu tur SEO sayfalari precache edilmiyorsa gerekcesini finalde acikla.

AGENTS.md ve REFACTOR-GECMISI.md:
- Yeni klasorler eklenecekse AGENTS.md dosya haritasini guncelle.
- Programmatic SEO generator veya yeni sayfa sistemi buyuk mimari karar sayilir; REFACTOR-GECMISI.md yeni bolum ekle.
- Yeni task recipe gerekiyorsa docs/ altinda belge ekleyip AGENTS.md ilgili bolumune ekle.

Kontroller:
- node --check scripts/build-blog.js
- Yeni generator script varsa node --check scripts/<generator>.js
- node scripts/build-blog.js veya ilgili generator
- sitemap.xml XML parse testi
- learn/posts.json JSON parse testi
- Değişen HTML inline script varsa inline script syntax kontrolu
- git diff --check
- local HTTP smoke test:
  - /library
  - /library/exercises
  - /library/programs
  - /library/exercises/bench-press
  - /library/exercises/squat
  - /library/exercises/deadlift
  - /library/programs/push-pull-legs
  - /tools
  - /one-rep-max-calculator
  - /workout-volume-calculator
  - /learn
- Mumkunse browser smoke test/screenshot:
  - desktop ve mobile viewport
  - sayfalar bos degil
  - CTA linkleri calisiyor
  - layout tasma/overlap yapmiyor

Commit:
- Mantiksal commit yap.
- Dosyalari ismen stage et; git add . kullanma.
- Commit mesaji onerisi:
  feat(seo): add programmatic lift pages
- Commit trailer:
  Co-Authored-By: Codex <noreply@openai.com>

Onemli uygulama notu:
Bu is buyukse tek seferde tum sistemi sisirme. Once generator + 3 lift + 1 program MVP'sini bitir, test et, commit et. Daha sonra diger exercise/program sayfalari icin ayni kalibi genisletmek daha guvenli.
```
