# Kişisel alışkanlık takvimi

2026-10-18 — Web `/habits` (`habits.html`). Yalnızca izin verilen hesaba açık, günlük alışkanlık takvimi.

## Davranış

- Birden fazla alışkanlık; takvimde tek seçili alışkanlık. Tümü görünümü yok.
- Her gün planlı. Tamamlanan gün altın, boş geçmiş gün nötr, gelecek gün kapalı.
- Geçmiş kayıtlar düzenlenebilir; alışkanlığın oluşturulduğu tarihten önceki günler de kaydedilebilir.
- Bugün tamamlandıysa seri bugünden, tamamlanmadıysa dünden geriye sayılır.
- Üç gösterge: mevcut seri, gerçek içinde bulunulan ayda tamamlanan günler, tüm zamanların en uzun serisi.
- Takvimde eski aya gidilmesi “Bu ay” göstergesinin anlamını değiştirmez.
- Gün sınırı tüm cihazlarda `Europe/Istanbul`. Tarihler `YYYY-MM-DD`; tarihler arası işlem UTC öğlen üzerinden yapılır.
- İşaret değişimi başarılı sunucu yanıtından sonra görünür; hata olursa eski durum korunur, yeniden denenebilir.
- Sekme odağına dönüldüğünde kayıtlar yenilenir. Çevrimdışı yazma kuyruğu veya kişisel veri localStorage kopyası yok.
- Ad değiştirme ve onaylı silme var; silme alışkanlığı ve ona bağlı günleri kalıcı kaldırır.

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
Sayfa sitemap'e eklenmez; noindex HTML meta ve HTTP header ile verilir.

## Canlıya alma sırası

1. Supabase proje yöneticisi olarak `supabase/migrations/20261018120000_private_habits.sql` dosyasını SQL Editor veya
   yetkili migration bağlantısıyla çalıştır. Yeni migration tek transaction'dır; mevcut antrenman tablolarını değiştirmez.
   Aynı migration'ı iki kez çalıştırma. `supabase_setup.sql` aynı yapının yeni kurulum snapshot'ını içerir.
2. `@itisci` hesabında erişim tablosunun tek kendi satırını döndürdüğünü, başka hesapta boş döndüğünü ve anon
   erişimin reddedildiğini doğrula. Test için gerçek kişisel alışkanlık verisi eklemek gerekmez.
3. Web değişikliklerini normal Git/Cloudflare akışıyla yayınla. `sw.js` v66, yeni HTML ve runtime modüllerini içerir.
4. Hesapla `/app` açıldığında yan menüde “Alışkanlıklarım” görünmeli. `/habits` üzerinde ekle, işaretle, yeniden yükle
   ve işareti kaldır akışını kendi test alışkanlığınla doğrula. Oturumsuz veya başka hesap aynı URL'de veri görememeli.

Bu geliştirme sırasında canlı migration uygulanmadı; izole PostgreSQL testleri canlı Supabase kurulumu yerine geçmez.
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
