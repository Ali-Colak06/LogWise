# Kişisel alışkanlık takvimi

2026-10-18 — Web uygulamasının yan menüsündeki **Alışkanlıklar** sekmesi (`/app/habits`).
Yerel dosya sunucusunda `/app.html?view=habits`. Yalnızca izin verilen hesaba açık, günlük alışkanlık takvimi.
`habits.html` / `/habits` eski bağlantıları uygulama sekmesine yönlendirir.

## Davranış

- Birden fazla alışkanlık; takvimde tek seçili alışkanlık. Tümü görünümü yok.
- `app.html` içindeki mevcut ay takvimi çizimi iki görünüm tarafından aynen paylaşılır: aynı grid,
  gün başlıkları, hücre çizgileri, bugün dairesi/köşeleri, ay başlığı, yan menü ve mini takvim.
  Alışkanlık sekmesinde egzersiz pill'leri, dinlenme günü ve aktif program kartı gösterilmez.
- Takvimin üstünde kompakt alışkanlık seçimi, yönetim düğmeleri ve üç seri/aylık gösterge bulunur.
  Ayrı sayfa başlığı, hero, kart grubu veya farklı bir takvim kabuğu yoktur.
- Mini takvim de seçili alışkanlığın tamamlanan günlerini gösterir; ay okları ana takvimle aynı `cMonth` state'ini kullanır.
- Her gün planlı. Tamamlanan gün altın, boş geçmiş gün nötr, gelecek gün kapalı.
- Geçmiş kayıtlar düzenlenebilir; alışkanlığın oluşturulduğu tarihten önceki günler de kaydedilebilir.
- Bugün tamamlandıysa seri bugünden, tamamlanmadıysa dünden geriye sayılır.
- Üç gösterge: mevcut seri, gerçek içinde bulunulan ayda tamamlanan günler, tüm zamanların en uzun serisi.
- Takvimde eski aya gidilmesi “Bu ay” göstergesinin anlamını değiştirmez.
- Gün sınırı tüm cihazlarda `Europe/Istanbul`. Tarihler `YYYY-MM-DD`; tarihler arası işlem UTC öğlen üzerinden yapılır.
- İşaret değişimi başarılı sunucu yanıtından sonra görünür; hata olursa eski durum korunur, yeniden denenebilir.
- Sekme odağına dönüldüğünde kayıtlar yenilenir. Çevrimdışı yazma kuyruğu veya kişisel veri localStorage kopyası yok.
- Ad değiştirme ve onaylı silme var; silme alışkanlığı ve ona bağlı günleri kalıcı kaldırır.

## Onaylanan veri mimarisi (2026-10-18)

Kullanıcı, alışkanlıkların ayrı tablolarda saklanmasını açıkça onayladı. Mevcut Supabase projesi,
`window.LOGWISE_DB.sb` istemcisi ve LogWise Auth oturumu kullanılır. `private_habits` alışkanlıkları,
`private_habit_days` tamamlanan günleri, `private_habit_access` izin verilen hesap kimliğini tutar.
Web antrenmanlarının `user_data` JSON şeması ve mevcut kayıt akışı korunur.

**Yedekleme sınırı:** Veri Yönetimi'ndeki mevcut JSON dışa/içe aktarma yalnız `user_data` kapsamındadır;
alışkanlık tablolarını kapsamaz. Ayrı tablo kararı, yedekleme özelliğinin tamamlandığı anlamına gelmez.
Alışkanlık yedekleme/geri yükleme entegrasyonu ayrıca ele alınmalıdır.

## Yetkilendirme

`@itisci` public profil API'sinden doğrulanan hesap kimliği:
`ba569072-755d-4e68-b470-d78bacbdf0c6`.

`private_habit_access` en fazla bir hesap barındırır; authenticated istemci yalnız kendi erişim kaydını okuyabilir,
ekleme/değiştirme/silme yapamaz. Kullanıcı adı değişikliği bu kimlik bağlantısını değiştirmez.

`private_habits` ve `private_habit_days` RLS kuralları hem `auth.uid() = user_id` hem erişim kaydını zorlar.
Gün tablosundaki bileşik foreign key bir alışkanlığı başka hesaba bağlamayı engeller.
Anon role tablo yetkisi yoktur; diğer hesapların authenticated sorguları kayıt döndürmez, eklemeleri reddedilir.
Gelecek tarihler veritabanında da reddedilir.

HTML ve JS herkese indirilebilir statik kabuktur; hiçbir özel alışkanlık bilgisi içermez. Kişisel veriler
Supabase yanıtlarıyla gelir; service worker Supabase yanıtlarını cache'lemez. URL gizliliği ve noindex erişim kontrolü değildir.
Sekme sitemap'e eklenmez; `/app/habits` için HTTP noindex header'ı ve görünüm açıkken dinamik robots meta kullanılır.

## Canlıya alma sırası

1. Supabase proje yöneticisi olarak `supabase/migrations/20261018120000_private_habits.sql` dosyasını SQL Editor veya
   yetkili migration bağlantısıyla çalıştır. Yeni migration tek transaction'dır; mevcut antrenman tablolarını değiştirmez.
   Aynı migration'ı iki kez çalıştırma. `supabase_setup.sql` aynı yapının yeni kurulum snapshot'ını içerir.
2. `@itisci` hesabında erişim tablosunun tek kendi satırını döndürdüğünü, başka hesapta boş döndüğünü ve anon
   erişimin reddedildiğini doğrula. Test için gerçek kişisel alışkanlık verisi eklemek gerekmez.
3. Web değişikliklerini normal Git/Cloudflare akışıyla yayınla. `sw.js` v68, güncel uygulama ve runtime modüllerini içerir.
4. Hesapla `/app` açıldığında yan menüde “Alışkanlıklar” görünmeli. `/app/habits` üzerinde ekle, işaretle, yeniden yükle
   ve işareti kaldır akışını kendi test alışkanlığınla doğrula. Oturumsuz veya başka hesap aynı URL'de veri görememeli.
   Takvim sekmesine dönünce yalnız antrenmanların, Alışkanlıklar'a dönünce yalnız seçili alışkanlığın görünmesini;
   tarayıcı geri/ileri düğmelerini, mini takvim ay oklarını ve mobil yan menüyü de doğrula.

2026-10-18: Kullanıcı migration'ı canlı Web projesi `hfmqywyfnqmpvskkzksv` SQL Editor'ünde
başarıyla çalıştırdığını bildirdi. Üç tablonun REST uç noktası anonim isteklerde `42501 / permission denied`
döndürerek tablo varlığı ve anonim erişimin kapalı olması doğrulandı. Önceki farklı proje seçimi düzeltildi;
Web istemcisinin proje adresi değiştirilmedi. Bu kontrol, izin verilen hesapla canlı CRUD ve diğer
authenticated hesapla RLS testinin yerine geçmez; bu akışlar kullanıcı oturumuyla ayrıca doğrulanmalıdır.
Bağlı yönetici oturumu/connection olmadan anon anahtarla schema/RLS kurulamaz.
Önizlemedeki örnek alışkanlıklar yalnız yerel test sunucusundadır; production sayfasında demo veya yetki atlama modu yoktur.

## Test

```sh
node --test scripts/test-habit-utils.js
node scripts/check-codegen.js
node --check components/habits-page.js
```

RLS/CRUD testleri canlıya bağlanmadan geçici bir PGlite PostgreSQL instance'ında çalışır.
Paket proje köküne eklenmez; geçici bir dizine kurulur:

```sh
npm install --prefix <temp-dir> --no-save --package-lock=false @electric-sql/pglite
node scripts/test-private-habits.js <temp-dir>/node_modules/@electric-sql/pglite
```

Tarih/seri testleri CI'de otomatik çalışır. PGlite güvenlik testi manuel kapıdır.

### İç rota yüklemesi

`app.html` içindeki yerel JS/CSS kaynakları `/data/`, `/lib/`, `/components/` ve `/styles/`
olarak kökten mutlak URL kullanır. `/app/habits` veya `/app/dashboard` doğrudan açıldığında kaynaklar
yanlışlıkla `/app/lib/...` altından istenmez. URL çözümlemesi regresyon testi tarih/seri test dosyasında yer alır.
Yerel gerçek-dosya HTTP kontrolünde `/app/habits` ve 25 runtime JS/CSS kaynağı başarılı döndü;
örnek Supabase istemcisi veya veri katmanı kullanılmadı. Canlı auth/RLS doğrulaması ayrı adımdır.
`.wrangler/` yerel geliştirme çıktısıdır ve `.assetsignore` ile asset yayınından çıkarılır.

Canlı Workers Static Assets kontrolünde eski `/app/* /app.html 200` kuralı doğrudan
`/app/habits` isteğini `/app` adresine yönlendirerek seçili görünümü kaybediyordu.
Workers Static Assets `200` rewrite desteklemediği için bu özel rota wildcard'dan önce
`302 /app?view=habits` kullanır. App'in mevcut query parser'ı görünümü açar ve History API
ile temiz `/app/habits` adresini korur; sayfa yenileme aynı görünümü tekrar açar.
Uygulama kabuğu `/app` ve `/app.html` de HTTP noindex taşır; public landing etkilenmez.
Kaynak: https://developers.cloudflare.com/workers/static-assets/redirects/

### Canlı yayın doğrulaması (2026-10-18)

- Entegrasyon ve yönlendirme düzeltmesi `web/work` üzerinden `master`'a fast-forward ile yayınlandı.
- Canlı `sw.js` sürümü `logwise-v68`; uygulamanın 25 yerel JS/CSS kaynağı HTTP 200 ve doğru MIME döndürdü.
- `/app/habits` -> `302 /app?view=habits` -> HTTP 200; iki yanıt da HTTP noindex taşıyor.
- Canlı tarayıcıda oturumsuz kullanıcı alışkanlık verisi/takvimi yerine giriş ekranını gördü;
  sayfa yenilendiğinde aynı alışkanlık görünümü korundu.
- Yetkili hesapla canlı ekle/işaretle/yeniden yükle/geri al testi henüz yapılmadı; kullanıcının oturumu gerekir.
