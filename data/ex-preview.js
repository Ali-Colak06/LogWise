// LogWise — Hareket Önizleme (Gif + Açıklama + İpucu) Verisi
// Anahtar: preset hareket id'si (slug — Faz EX-ID sonrası)
// Değer: { gif: null | "url", desc: [TR uzun açıklama, EN uzun açıklama], tips: [[TR ipucu, EN ipucu], ...] }
// getExPreview helper bunu okur ve hareket modal'ında gösterir.
//
// NOT (Faz EX-ID): Anahtarlar artık Türkçe isim değil, slug (kebab-case).
// Kullanıcı kodu hem slug hem isim verebilir — resolveKey helper'ı isimden slug'a
// otomatik çeviri yapar.
window.LOGWISE_EX_PREVIEW = {
  "bench-press": {
    gif: null,
    desc: ["Düz bankta barbell press. Göğüs kasları (pectoralis major), ön deltoid ve triceps aynı anda çalışır. Üst vücut kuvvetinin temel bileşik hareketi.", "Barbell press on a flat bench. Works the pectorals, front deltoids, and triceps together. The foundational compound for upper body strength."],
    tips: [["Omuz bıçaklarını bankta birbirine sıkıştır ve kilitli tut.", "Retract and lock shoulder blades into the bench before unracking."], ["Barı göğsünün orta-alt kısmına değdir; sektirme.", "Touch bar to mid-lower chest without bouncing."], ["Ayaklar yere tam bassın; kalça banktan kalkmamalı.", "Keep feet flat on floor; hips must stay on the bench."], ["Kontrollü indir (~2 sn), güçlü ve hızlı it.", "Lower slowly (~2 sec), then press up powerfully."], ["Nefesi inerken al, iterken ver.", "Inhale on the way down, exhale as you press."]]
  },
  "incline-bench-press": {
    gif: null,
    desc: ["30–45° eğik bankta barbell press. Üst göğüs bölgesini ve ön omuzları standart bench'e göre daha fazla çalıştırır. Tam göğüs gelişimi için önemlidir.", "Barbell press on a 30–45° incline bench. Targets the upper chest and front deltoids more than flat bench. Essential for complete chest development."],
    tips: [["Banco 30–45° arasında ayarla; fazla eğik olursa omuz baskısı artar.", "Set bench to 30–45°; steeper angles overload the shoulders."], ["Bar üst göğse iner — boyun veya yüze değil.", "Bar descends to upper chest — not toward neck or face."], ["Dirsekleri hafifçe içe al (~75°); tam yanlara açma.", "Tuck elbows slightly (~75°); don't fully flare them out."], ["Göğsü hareket boyunca kasılı hissedecek şekilde sıkıştır.", "Feel the chest squeezing throughout the entire movement."]]
  },
  "dumbell-press": {
    gif: null,
    desc: ["Dumbbell ile düz bankta göğüs press. Her kol bağımsız çalışır; kas dengesizliklerini giderir ve hareket açısı daha geniş olabilir.", "Flat dumbbell chest press. Each arm works independently, correcting imbalances. Allows a greater range of motion at the bottom."],
    tips: [["Dumbbellları hafifçe birbirine yaklaştırarak sık — göğüs aktivasyonunu artırır.", "Squeeze dumbbells slightly toward each other at the top for extra chest contraction."], ["Her iki tarafın aynı ağırlık ve tekrarı yapmasına dikkat et.", "Ensure both sides match in weight and reps to prevent imbalance."], ["Alt noktada dirsekler 90° bükük, dumbbelllar omuz hizasında.", "At the bottom, elbows at 90°, dumbbells in line with shoulders."]]
  },
  "incline-dumbell-press": {
    gif: null,
    desc: ["Eğik bankta dumbbell press. Üst göğüsü izole eder, hareket açısı barbell'e göre daha serbesttir. Bütün göğüs programının önemli bir parçasıdır.", "Incline dumbbell press. Isolates the upper chest with a freer range of motion than barbell. An important part of any complete chest program."],
    tips: [["Banco 30–45° arasında — fazla dik omuzları aşırı yorar.", "Set bench to 30–45° — too steep overworks the shoulders."], ["Her iki kolu eşit şekilde kaldır; biri ileride olmamalı.", "Raise both arms equally; one side shouldn't lead the other."], ["Hareketi tamamlarken dumbbellları birbirine yaklaştır ve üst göğsü sık.", "Bring dumbbells together at the top and squeeze the upper chest."]]
  },
  "dumbell-fly": {
    gif: null,
    desc: ["Dumbbell ile göğüs açma-kapama (fly) hareketi. Göğüs kasını yatay düzlemde izole eder. Büyük bir gerilim açısı sağlar.", "Dumbbell chest fly. Isolates the chest in the horizontal plane. Provides a large stretch at the bottom."],
    tips: [["Dirsekleri hafifçe bük — tamamen düz tutma, eklem stresi artar.", "Keep a soft elbow bend throughout — fully straight arms increase joint stress."], ["Geniş açıdan indir; göğüste derin bir gerilim hissedeceksin.", "Lower through a wide arc until you feel a deep chest stretch."], ["Ağırlıktan değil, hissettirenden git; form her zaman önce.", "Prioritize the feel over the load; form always comes first."]]
  },
  "cable-crossover": {
    gif: null,
    desc: ["Çift kablo makinesinde göğüs çaprazlama hareketi. Hareket boyunca sürekli gerilim sağlar. Özellikle iç göğüs ve alt göğüsü izole etmek için idealdir.", "Chest crossover on a dual cable machine. Provides constant tension throughout the movement. Ideal for isolating the inner and lower chest."],
    tips: [["Kablo yüksekliğini değiştirerek farklı göğüs bölgelerini hedefleyebilirsin.", "Change cable height to target different chest regions (upper/mid/lower)."], ["Hareketi bitirirken elleri birbiriyle kapat ve 1 sn sık.", "Fully close and cross hands at the end, hold for 1 second."], ["Gövdeyi hafifçe öne eğ; dik durmak göğsü devre dışı bırakır.", "Lean torso slightly forward; standing fully upright removes chest tension."]]
  },
  "push-up": {
    gif: null,
    desc: ["Temel vücut ağırlığı egzersizi. Göğüs, omuz ve triceps kaslarını birlikte çalıştırır. Ekipman gerektirmez, her yerde yapılabilir.", "Fundamental bodyweight exercise. Works chest, shoulders, and triceps together. Requires no equipment, can be done anywhere."],
    tips: [["Vücut baştan topuğa düz bir çizgi oluşturmalı; bel ne düşmeli ne de kabarmalı.", "Body should form a straight line from head to heels; hips neither sag nor pike."], ["Göğsü yere değdir — tam ROM için çalış.", "Touch chest to floor — aim for full range of motion."], ["Ayakları yükseltince (decline) üst göğüs, dizleri yere koyunca kolaylaşır.", "Elevated feet (decline) hits upper chest; knees on floor for an easier variation."], ["Nefes alarak in, iterken ver.", "Inhale going down, exhale pressing up."]]
  },
  "dips": {
    gif: null,
    desc: ["Paralel barlarda baskı egzersizi. Öne eğilince göğüs, dik durulursa triceps vurgulanır. Ciddi ağırlık eklenebilen güçlü bir bileşik harekettir.", "Upper body pressing on parallel bars. Leaning forward emphasizes chest; staying upright emphasizes triceps. Can be loaded heavily over time."],
    tips: [["Göğüs için öne ~30° eğil; triceps için gövdeyi dik tut.", "Lean forward ~30° for chest emphasis; stay upright for triceps."], ["Omuzları kulağa doğru çöktürme — omuz bıçaklarını gergin tut.", "Don't let shoulders shrug up — keep them depressed and retracted."], ["Tam aşağı in (90°), tam yukarı çık ama dirsekleri kilitleme.", "Go to 90° at the elbow at bottom, fully extend at top without locking."]]
  },
  "deadlift": {
    gif: null,
    desc: ["Yerden barbell kaldırma. En temel güç hareketlerinden biri. Sırt, bacak, kalça, core ve kavrama gücü dahil neredeyse tüm vücudu çalıştırır.", "Barbell lift from the floor. One of the most fundamental strength movements. Works back, legs, glutes, core, and grip — virtually the whole body."],
    tips: [["Bar ayak ortasının üzerinde olmalı; kaldırmadan önce bacaklar barla temas etsin.", "Bar over mid-foot; shins should contact the bar before pulling."], ["Kalçaları öne it ve sırtı düz tut — kamburluk kesinlikle olmamalı.", "Drive hips through at the top — maintain neutral spine, no rounding."], ["Kaldırmadan önce derin nefes al ve karnı sabitle (Valsalva).", "Take a deep breath and brace core before each rep (Valsalva maneuver)."], ["Bar vücuda yakın kalsın — ayaklardan uzaklaşmasın.", "Keep bar close to body throughout — don't let it drift forward."], ["Erken aşamada bacaklarla it, geç aşamada kalçayla tamamla.", "Think: push the floor away early (legs), then drive hips through late."]]
  },
  "squat": {
    gif: null,
    desc: ["Barbell arka squat. Bacakların temel bileşik hareketi. Quadriceps, hamstring, gluteus ve core kaslarını güçlü biçimde çalıştırır.", "Barbell back squat. The primary lower body compound movement. Works quads, hamstrings, glutes, and core powerfully."],
    tips: [["Diz ayak parmakları yönünde açılsın — içe çökmemeli.", "Knees should track over toes — don't let them cave inward."], ["Kalçayı paralelin altına indir (esnekliğin izin verdiği kadar).", "Break parallel with the hips if your flexibility allows."], ["Nefesi inerken al, yukarı çıkarken ver.", "Inhale going down, exhale on the way up."], ["Topuklar yerde kalsın — kaldırılmamalı.", "Keep heels on the ground throughout the entire movement."], ["Core kilitli, göğüs yukarı bakmalı — öne kapanma.", "Brace core hard, chest up — don't fold forward at the hips."]]
  },
  "leg-press": {
    gif: null,
    desc: ["Bacak press makinesi. Squat'ın aksine omurga yükü olmadan quadriceps, hamstring ve gluteusları çalıştırır. Başlangıç seviyesi için güvenli bir seçenek.", "Leg press machine. Works quads, hamstrings, and glutes without spinal loading. A safer option especially for beginners."],
    tips: [["Ayak pozisyonu önemlidir: yukarıda=hamstring/glute, aşağıda=quad vurgusu.", "Foot placement matters: high = more hamstring/glute, low = more quad."], ["Dizleri platforma tam uzanarak kilitleme — eklem stresini artırır.", "Don't lock out knees fully at the top — stop just short to protect joints."], ["Sırtını makine sırtlığından kaldırma, tüm hareket boyunca bassın.", "Keep lower back pressed firmly against the pad throughout."], ["Kontrollü indir (2-3 sn), güçlü ve hızlı çık.", "Lower slowly (2-3 sec), press up powerfully."]]
  },
  "lunge": {
    gif: null,
    desc: ["İleri hamle. Tek bacak gücü, denge ve koordinasyon için mükemmeldir. Quadriceps ve gluteusları birlikte çalıştırır.", "Forward lunge. Excellent for single-leg strength, balance, and coordination. Works quads and glutes together."],
    tips: [["Adım atınca ön diz ayak parmağının önüne geçmemeli.", "When stepping, front knee should not go past the toes."], ["Gövdeyi dik tut — aşırı öne eğilme.", "Keep torso upright — don't lean excessively forward."], ["Arka diz yere yakın insin ama değmemeli.", "Rear knee comes close to the floor but should not touch it."], ["Her iki tarafı eşit tekrarla çalıştır.", "Train both sides with equal reps and weight."]]
  },
  "leg-curl": {
    gif: null,
    desc: ["Bacak bükme makinesi. Hamstring kaslarını izole eder. Yatarak veya oturarak yapılır. Bacak güç dengesini korumak için kritiktir.", "Leg curl machine. Isolates the hamstring muscles. Performed lying or seated. Critical for balanced leg strength."],
    tips: [["Hareket boyunca kalçanın banktan kalkmasını engelle.", "Prevent hips from lifting off the pad during the movement."], ["Tam uzanmaya izin ver — hamstring gerilimi önemlidir.", "Allow full extension — the hamstring stretch is important."], ["Kontrollü indir; hamstring yaralanmalarından korunmak için form şart.", "Lower with control; proper form is essential to prevent hamstring injuries."]]
  },
  "leg-extension": {
    gif: null,
    desc: ["Oturarak bacak uzatma makinesi. Quadriceps kaslarını izole eder. Genellikle squat ve leg press'in tamamlayıcısı olarak kullanılır.", "Seated leg extension machine. Isolates the quadriceps. Usually used as a complement to squat and leg press."],
    tips: [["Tam uzanmaya git ama dizleri kilitleme.", "Extend fully but don't lock out knees at the top."], ["Kontrollü indir — eksantrik faz çok önemlidir.", "Lower slowly — the eccentric (lowering) phase is very important."], ["Diz rahatsızlığı varsa dikkatli ol; çok ağır yüklemekten kaçın.", "Be cautious with knee issues; avoid going excessively heavy."]]
  },
  "hip-thrust": {
    gif: null,
    desc: ["Gluteus maximus izolasyon hareketi. Banka yaslanılarak barbell veya bant ile yapılır. Kalça kasını en etkili çalıştıran egzersizler arasındadır.", "Glute isolation movement using a bench, with barbell or band. One of the most effective exercises for targeting gluteus maximus."],
    tips: [["Omuz bıçaklarını banka daya — omuzlar banka temas halinde olmalı.", "Rest upper back/shoulder blades on the bench edge."], ["Kalçayı tam uzat — üst noktada sanki ayakta duruyormuş gibi sık.", "Fully extend hips at top — squeeze glutes as hard as if standing."], ["Ayaklar yere düz bassın, topuklardan it.", "Press through heels with feet flat on the floor."], ["Barbell için ped kullan — direkt temas rahatsız edicidir.", "Use a barbell pad — direct contact can be quite uncomfortable."]]
  },
  "glute-bridge": {
    gif: null,
    desc: ["Sırt üstü yatarak kalça kaldırma. Hip thrust'ın ekipmansız versiyonu. Kalça aktivasyonu ve başlangıç seviyesi antrenmanları için çok yaygındır.", "Lying glute bridge. Bodyweight version of the hip thrust. Very common for glute activation and beginner training."],
    tips: [["Ayaklar kalça genişliğinde, dizler yaklaşık 90° bükük.", "Feet hip-width apart, knees bent to about 90°."], ["Üst noktada en az 1 saniye güçlüce sık.", "Squeeze glutes at the top for at least 1 second."], ["Diz bandı veya kalça üstü ağırlık ekleyerek zorlaştırabilirsin.", "Add a resistance band around knees or weight on hips to increase difficulty."]]
  },
  "pull-up": {
    gif: null,
    desc: ["Barfikse asılarak çıkma. Sırt kaslarının en temel bileşik hareketi. Latissimus dorsi, biceps ve core kaslarını birlikte çalıştırır.", "Pull-up from a dead hang. The foundational compound for back muscles. Works latissimus dorsi, biceps, and core together."],
    tips: [["Geniş, overhand tutuş lat'ları vurgular; dar tutuş biceps'i.", "Wide overhand grip emphasizes lats; narrower grip shifts more to biceps."], ["Her tekrarda ölü asılmaya dön — tam ROM şart.", "Return to a full dead hang each rep — full range of motion is essential."], ["Çıkış boyunca kürek kemiklerini aşağı çek — omuzları kulağa yaklaştırma.", "Depress shoulder blades throughout — don't let shoulders shrug up."], ["Vücut sallanmasın — kontrollü ve yavaş indir.", "No swinging — controlled and slow descent."]]
  },
  "lat-pulldown": {
    gif: null,
    desc: ["Kablo makinesinde yukarıdan çekiş. Pull-up yapamayan kullanıcılar için mükemmel alternatif. Latissimus dorsi ve biceps başarıyla çalıştırılır.", "Cable pulldown from overhead. Excellent alternative for those who can't do pull-ups yet. Works latissimus dorsi and biceps effectively."],
    tips: [["Bar üst göğse çekilmeli — boyun veya yüze değil.", "Pull bar to upper chest — not toward neck or face."], ["Çekerken dirsekleri aşağı ve hafifçe arkaya götür.", "Drive elbows down and slightly back during the pull."], ["Çıkışta tam uzanmaya izin ver — lat gerilimi önemlidir.", "Allow full stretch at the top — lat elongation matters."], ["Hafifçe arkaya yaslan (~30°); aşırı eğilme.", "Lean back slightly (~30°) — but avoid excessive lean."]]
  },
  "barbell-row": {
    gif: null,
    desc: ["Eğilerek barbell sıra çekme. Sırt kalınlığı için en etkili hareketlerden biri. Rhomboid'ler, orta trap, lat ve biceps birlikte çalışır.", "Bent-over barbell row. One of the most effective movements for back thickness. Works rhomboids, middle traps, lats, and biceps."],
    tips: [["Gövde yaklaşık 45° eğik — yatay pozisyon değil.", "Torso should be roughly 45° — not completely horizontal."], ["Bar göbeğe veya alt göğse değmeli.", "Pull bar to lower abdomen or lower chest."], ["Her tekrarda nefes al ve core'u kilitle — sırtın için deadlift gibi.", "Brace core before each rep — treat it like a deadlift for spine safety."], ["Çekiş sırasında dirsekleri arkaya doğru götür.", "Drive elbows back behind the body during the pull."]]
  },
  "cable-row": {
    gif: null,
    desc: ["Oturarak kablo çekme. Sırt kaslarını sürekli gerilimle çalıştırır. Orta sırt ve rhomboid'ler için özellikle etkilidir.", "Seated cable row. Works back muscles under constant tension. Particularly effective for mid-back and rhomboids."],
    tips: [["Hareket boyunca sırtı düz tut — hareketle birlikte öne sallanma.", "Keep back straight — don't sway forward with each rep."], ["Bitişte kürek kemiklerini sık ve 1 sn tut.", "Squeeze shoulder blades together at the end and hold for 1 second."], ["Tam gerilim için hareketi tam uzanarak başlat.", "Start from a full stretch for maximum range of motion."], ["Dirsekler gövdeye yakın kalsın — dışa açılmasın.", "Keep elbows close to the body — don't let them flare outward."]]
  },
  "dumbell-row": {
    gif: null,
    desc: ["Tek kol dumbbell sıra çekme. Her kolu bağımsız çalıştırır; kas dengesizliklerini düzeltir. Sırt kalınlığı ve lat gelişimi için mükemmeldir.", "Single arm dumbbell row. Works each arm independently, correcting imbalances. Excellent for back thickness and lat development."],
    tips: [["Destek el ve dizi banka koy — sırt düz ve paralel.", "Place support hand and knee on bench — keep back flat and parallel."], ["Dumbbell'ı kalça yanına çek — öne değil, geriye.", "Pull dumbbell toward hip — back and up, not forward."], ["Kürek kemiğini harekete dahil et; sadece kolunla çekme.", "Engage the shoulder blade; don't just pull with the arm."]]
  },
  "t-bar-row": {
    gif: null,
    desc: ["T-bar makinesinde veya köşeye sıkıştırılmış barbell ile sıra çekme. Sırt kalınlığını geliştirmede çok etkilidir. Orta sırt kaslarını güçlü çalıştırır.", "Row using a T-bar machine or landmine setup. Very effective for building back thickness. Powerfully works mid-back muscles."],
    tips: [["Gövdeyi yaklaşık 45° eğik tut — fazla dik durma.", "Keep torso roughly 45° — don't stand too upright."], ["Bar göbeğe veya alt göğse çekilmeli.", "Pull toward abdomen or lower chest."], ["Çekiş boyunca kürek kemiklerini sıkıştır ve tut.", "Squeeze and hold shoulder blades together throughout the pull."]]
  },
  "pullover": {
    gif: null,
    desc: ["Banka en-çapraz yatarak dumbbell hareketi. Hem lat'ları hem göğüsü (serratus anterior dahil) çalıştıran benzersiz bir egzersizdir.", "Lying dumbbell pullover. A unique movement working both lats and chest (including serratus anterior)."],
    tips: [["Bankta sadece omuz bıçakları temas etmeli — en-çapraz yat.", "Lie across bench with only shoulder blades touching — perpendicular position."], ["Dirsekleri hafifçe bükük tut; kilitleme.", "Maintain a soft elbow bend throughout — don't lock out."], ["Başın altına kadar in — lat'lar tam gerilsin.", "Lower to below head level for a full lat stretch."]]
  },
  "overhead-press": {
    gif: null,
    desc: ["Ayakta barbell omuz press. Tüm deltoid başlarını, triceps ve üst trap kaslarını çalıştıran temel bileşik omuz hareketi.", "Standing barbell overhead press. Fundamental compound shoulder movement working all deltoid heads, triceps, and upper traps."],
    tips: [["Bar alt çeneye yakın başlar; basarken kulakların üstüne hizalan.", "Bar starts just below chin; end position directly over ears."], ["Sırtı aşırı kamburlaştırma — core'u sıkı tut.", "Avoid excessive back arch — keep core braced throughout."], ["Bacak bükme olmadan tam güçle it — teknik egzersiz bu şekilde.", "No knee bend — strict overhead press with no leg drive."], ["Nefes al → kilitlen → it → ver sırası önemlidir.", "Inhale → brace → press → exhale — this sequence matters."]]
  },
  "shoulder-press": {
    gif: null,
    desc: ["Oturarak veya ayakta dumbbell/barbell ile omuz press. Tüm deltoid kaslarını ve triceps'i çalıştırır. Overhead Press'in esnek bir alternatifidir.", "Seated or standing dumbbell/barbell shoulder press. Works all deltoid heads and triceps. A flexible alternative to the strict overhead press."],
    tips: [["Oturarak sırtı sırtlığa yasla — omurga koruması için.", "When seated, keep back firmly against the pad for spinal support."], ["Barı kulak hizasına kadar indir — çok aşağıya gitme.", "Lower bar to ear level — don't go excessively low."], ["Dumbbellı basarken kontrollü yüksel; yanlara açma.", "Press upward with control; don't flare dumbbells outward."]]
  },
  "lateral-raise": {
    gif: null,
    desc: ["Yana kaldırma hareketi. Deltoidin yan (medial) bölümünü izole eder. Omuz genişliği ve V şekli için en önemli izolasyon hareketlerinden biridir.", "Lateral raise. Isolates the medial (side) deltoid. One of the most important isolation movements for shoulder width and V-taper."],
    tips: [["Küçük ağırlık kullan — bu harekette form her şeydir.", "Use light weight — form is everything in lateral raises."], ["Başparmakları biraz aşağı eğ (kutu dökmek gibi) — medial delti daha iyi aktive eder.", "Tilt thumbs slightly down as if pouring water — better medial delt activation."], ["Kolu omuz hizasının biraz üstüne kaldır, kontrollü indir.", "Raise to just above shoulder level, then lower slowly."], ["Dirsekleri hafifçe bükük tut — tam düz kol stres yaratır.", "Keep a slight elbow bend — fully straight arms create unnecessary joint stress."]]
  },
  "front-raise": {
    gif: null,
    desc: ["Öne kaldırma hareketi. Deltoidin ön (anterior) bölümünü izole eder. Barbell, dumbbell veya kablo ile yapılabilir.", "Front raise. Isolates the anterior (front) deltoid. Can be done with barbell, dumbbells, or cable."],
    tips: [["Kolu omuz hizasına kadar kaldır; aşırı yukarı gitme.", "Raise to shoulder level; don't go excessively higher."], ["Gövdeyi sabit tut — momentum kullanma.", "Keep torso still — don't use body swing for momentum."], ["Ön omuzlar zaten bir çok harekette çalışır; çok fazla ek hacim ekleme.", "Front delts already get work from pressing; don't overdo additional volume."]]
  },
  "rear-delt-fly": {
    gif: null,
    desc: ["Arka deltoid açma hareketi. Genellikle ihmal edilen arka omuz kasını çalıştırır. Omuz sağlığı ve dik duruş için kritiktir.", "Rear deltoid fly. Targets the often-neglected posterior deltoid. Critical for shoulder health and upright posture."],
    tips: [["Öne eğik veya makine/kablo ile yapılabilir; kontrol her zaman önce.", "Can be done bent over or on a cable/machine; control is always first."], ["Hareket boyunca dirsekleri hafifçe bükük tut.", "Keep a slight elbow bend throughout the movement."], ["Kürek kemiklerini sık harekentin sonunda — sadece kolla değil sırtla yap.", "Retract shoulder blades at peak — use your back, not just the arms."]]
  },
  "biceps-curl": {
    gif: null,
    desc: ["Klasik biceps curl. Barbell veya dumbbell ile yapılır. Biceps brachii ve brachialis kaslarını çalıştırır.", "Classic biceps curl with barbell or dumbbells. Works biceps brachii and brachialis muscles."],
    tips: [["Dirsekleri gövde yanında sabit tut — öne sallanmasın.", "Keep elbows locked at sides — don't let them swing forward."], ["Üst noktada 1 sn sık; inişi kontrollü yap (~2-3 sn).", "Squeeze at the top for 1 sec; lower slowly in 2-3 sec."], ["Tam aşağı in — bicepsin tam gerilmesi için önemlidir.", "Go to full extension at the bottom — important for full bicep stretch."]]
  },
  "hammer-curl": {
    gif: null,
    desc: ["Nötr (dik) tutuşla curl. Brachialis ve brachioradialis kaslarını vurgular. Ön kol ve biceps kalınlığı için önemlidir.", "Neutral grip curl. More emphasis on brachialis and brachioradialis. Important for forearm and overall arm thickness."],
    tips: [["Başparmak yukarı bakacak şekilde tut — nötr kavrama.", "Hold with thumbs pointing up — neutral grip."], ["Her iki kolu aynı anda veya dönüşümlü yapabilirsin.", "Can be done simultaneously or alternating arms."], ["Dirsekleri sabit tut — sadece ön kol hareket etmeli.", "Keep upper arms stationary — only the forearm should move."]]
  },
  "one-arm-cable-curl": {
    gif: null,
    desc: ["Tek kol kablo curl. Her kolu bağımsız çalıştırır, sürekli gerilim sağlar. Kasların eşit gelişimi için faydalıdır.", "Single arm cable curl. Works each arm independently with constant tension. Useful for equal muscular development."],
    tips: [["Kablo alçak pozisyonda — ayak seviyesinden çek.", "Cable set to low position — pull from ankle level."], ["Dirsek sabit kalmalı; sadece ön kol hareket eder.", "Upper arm stays fixed; only the forearm moves."], ["Her iki kola eşit tekrar uygula.", "Apply equal reps to both arms."]]
  },
  "preacher-curl": {
    gif: null,
    desc: ["Scott sehpasında (preacher bench) biceps curl. Dirsekleri sehpaya kilitler, momentum kullanımını engeller. Saf biceps izolasyonu sağlar.", "Biceps curl on a preacher bench. Locks elbows on the pad, eliminating momentum. Provides pure biceps isolation."],
    tips: [["Koltuk altları sehpanın üstünde; dirsekler pad'e tam oturmalı.", "Armpits at the top of the pad; elbows fully supported on the pad."], ["Tam gerilim için tam aşağı in ama dirseği hiperekstanse etme.", "Go to full extension at the bottom but don't hyperextend the elbow."], ["İniş kontrolü çok kritik — yavaş ve kasılı indir.", "Eccentric (lowering) control is crucial — slow and controlled."]]
  },
  "reverse-curl": {
    gif: null,
    desc: ["Ters tutuşla (pronated) curl. Brachialis ve brachioradialis kaslarını güçlü çalıştırır. Ön kol kalınlığı için değerlidir.", "Reverse (pronated) grip curl. Powerfully works brachialis and brachioradialis. Valuable for forearm thickness."],
    tips: [["Ellerimizi aşağı bakacak şekilde tut — overhand kavrama.", "Hold with palms facing down — overhand grip."], ["Dirsekleri sabit tut; sadece ön kol hareket etmeli.", "Keep elbows stationary; only the forearms should move."], ["Küçük ağırlıkla başla — bu kavramada daha az güç üretilir.", "Start with lighter weight — grip is generally weaker in this position."]]
  },
  "triceps-pushdown": {
    gif: null,
    desc: ["Kablo makinesiyle triceps kasılma hareketi. Üç kafa kas grubu olan triceps'i izole eder. En yaygın triceps egzersizlerinden biridir.", "Cable triceps pushdown. Isolates the three-headed triceps muscle. One of the most common triceps exercises."],
    tips: [["Dirsekleri gövde yanında sabit tut; öne gelmemeli.", "Keep elbows locked at your sides throughout."], ["Hareketin altında tam uzat ve 1 sn sık.", "Fully extend at the bottom and hold for 1 second."], ["Halatta elleri biraz dışa aç — ekstra triceps aktivasyonu sağlar.", "With a rope, slightly flare hands apart at the bottom for extra activation."], ["Momentum kullanma; kontrolü her noktada koru.", "No swinging — maintain control at all points."]]
  },
  "skull-crusher": {
    gif: null,
    desc: ["Yatarak barbell triceps uzatma. Triceps uzun başını (long head) en iyi çalıştıran hareketlerden biridir. Ciddi yüklenme yapılabilir.", "Lying triceps extension with barbell. One of the best exercises for the triceps long head. Can be loaded significantly."],
    tips: [["Barı alnın hizasına değil, başın biraz arkasına getir — uzun başı daha iyi çalıştırır.", "Lower bar slightly behind the forehead — better long head stretch."], ["Dirsekler yukarıya bakmalı — dışa açılmamalı.", "Keep elbows pointing toward ceiling — don't let them flare out."], ["EZ-bar düz bar'a göre bileği/dirseği daha az zorlar.", "EZ-bar reduces wrist/elbow discomfort compared to straight bar."]]
  },
  "overhead-triceps-extension": {
    gif: null,
    desc: ["Baş üstü triceps uzatma. Triceps uzun başını tam gerilimde çalıştırır. Dumbbell, barbell veya kablo ile yapılabilir.", "Overhead triceps extension. Works the long head of triceps under full stretch. Can be done with dumbbell, barbell, or cable."],
    tips: [["Dirsekleri kulak yanında sabit tut — öne gelmemeli.", "Keep elbows by ears, pointing upward — don't let them drift forward."], ["Tam aşağı in — maksimum uzama bu hareketin temel avantajıdır.", "Lower fully — maximum stretch is the primary benefit of this movement."], ["Kablo versiyonu sürekli gerilim için tercih edilebilir.", "Cable version is preferred for constant tension throughout."]]
  },
  "kickback": {
    gif: null,
    desc: ["Dumbbell ile triceps izolasyon hareketi. Öne eğilerek yapılır. Triceps'in medial ve lateral başlarını çalıştırır.", "Dumbbell triceps isolation done bent over. Works the medial and lateral heads of the triceps."],
    tips: [["Gövde yere paralel — yeterince öne eğil.", "Torso should be parallel to floor — lean forward enough."], ["Üst kol sabit ve omuz hizasında; sadece ön kol hareket eder.", "Upper arm stationary at shoulder height — only the forearm moves."], ["Üst noktada tam uzat ve güçlüce sık.", "Fully extend and squeeze hard at the top."]]
  },
  "calf-raise": {
    gif: null,
    desc: ["Baldır kaslarını çalıştıran yükselme hareketi. Gastrocnemius ve soleus kaslarını hedef alır. Ayakta, makinede veya basamak kenarında yapılabilir.", "Calf raise targeting the calf muscles. Works gastrocnemius and soleus. Can be done standing, on a machine, or on a step edge."],
    tips: [["Tam yukarı yüksel ve alt noktada tam in — tam ROM kritik.", "Rise all the way up and stretch fully at the bottom — full ROM is critical."], ["Üst noktada 1-2 sn sık.", "Pause and squeeze at the top for 1-2 seconds."], ["Baldır kasları yüksek tekrara adapte olur; 15-25 rep iyi çalışır.", "Calves adapt quickly; higher reps (15-25) work well for them."]]
  },
  "shrug": {
    gif: null,
    desc: ["Omuz silkme hareketi. Trapez kasının üst bölümünü (upper trapezius) çalıştırır. Barbell, dumbbell veya makinede yapılabilir.", "Shoulder shrug. Works the upper trapezius. Can be done with barbell, dumbbells, or machine."],
    tips: [["Boyun döndürme yok — sadece omuzları dikey olarak kaldır.", "No neck rolling — simply elevate the shoulders straight up."], ["Üst noktada 1-2 sn tut.", "Hold at the top for 1-2 seconds."], ["Ağır kullanabilirsin ama inişi her zaman kontrollü yap.", "Can go heavy but always lower with control."]]
  },
  "plank": {
    gif: null,
    desc: ["İzometrik core stabilizasyon egzersizi. Karın kasları, sırt alt kısmı ve omuzları statik olarak çalıştırır. Temel bir core hareketi.", "Isometric core stabilization. Works the abdominals, lower back, and shoulders statically. A foundational core movement."],
    tips: [["Kalça ne çok düşmeli ne de yükselmelidir — baştan topuğa düz çizgi.", "Hips should neither sag nor pike — maintain a straight line from head to heels."], ["Nefesini tutma; karın kaslarını sıkarken normal nefes al.", "Don't hold breath; keep breathing normally while squeezing core."], ["Zamanı kademeli artır — 20-30 sn ile başla ve her hafta artır.", "Gradually increase duration — start at 20-30 sec and add each week."], ["Dirsek plank, bilek problemi olanlar için daha az stres yaratır.", "Forearm plank creates less wrist stress for those with wrist issues."]]
  },
  "crunch": {
    gif: null,
    desc: ["Klasik karın kasılma hareketi. Rectus abdominis (altı paket kası) için temel izolasyon egzersizi.", "Classic abdominal crunch. Fundamental isolation exercise for the rectus abdominis (six-pack muscle)."],
    tips: [["Boyuna baskı yapma — elleri başın yanına koy, çeneyi göğse değdirme.", "Don't pull on the neck — hands beside head, chin not jammed to chest."], ["Küçük hareket yeterli — sadece omuz bıçakları yerden kalkmalı.", "Small movement is enough — just lift shoulder blades off the floor."], ["Nefesi kasılırken ver, inerken al.", "Exhale as you crunch up, inhale on the way down."]]
  },
  "cable-crunch": {
    gif: null,
    desc: ["Diz çökerek kablo makinesiyle karın kasılma hareketi. Karına dirençli yük ekler. Rectus abdominis ve oblikler yüksek aktivasyonla çalışır.", "Kneeling cable crunch. Adds resistance to the abs. High activation for rectus abdominis and obliques."],
    tips: [["Hareket boyunca kalçaları topuklarda tut; sadece boynu eğme.", "Hinge from the hips toward heels throughout — don't just flex the neck."], ["Alt noktada nefes ver ve karını maksimum sık.", "Exhale at the bottom and squeeze abs maximally."], ["Halatı yüz yanında tut — yukarı sallanmasın.", "Hold the rope by your head — don't let it swing upward."]]
  },
  "russian-twist": {
    gif: null,
    desc: ["Gövde rotasyonu egzersizi. Oblik kasları ve transversus abdominis kaslarını çalıştırır. Yan karın kaslarının gelişimi için idealdir.", "Torso rotation exercise. Works the obliques and transverse abdominis. Ideal for lateral core development."],
    tips: [["Bacakları yerde tutabilirsin; kaldırınca zorluk artar.", "Legs can be on the ground; raising them adds difficulty."], ["Her yana tam dön — kısmi rotasyon etkinliği düşürür.", "Rotate fully to each side — partial rotation reduces effectiveness."], ["Ağırlıklı yapıyorsan hafiften başla; bel stresi olabilir.", "Start light if weighted — can strain the lower back if too heavy."]]
  },
  "mountain-climber": {
    gif: null,
    desc: ["Dinamik plank pozisyonundan diz çekme hareketi. Core, omuzlar ve kardiyo sistemini aynı anda çalıştırır. Yüksek yoğunluklu antrenmanlar için mükemmeldir.", "Dynamic knee drive from plank position. Works core, shoulders, and cardiovascular system simultaneously. Excellent for high-intensity training."],
    tips: [["Kalçayı sabit tut — yukarı veya aşağı hareket etmemeli.", "Keep hips level — don't let them rise or drop."], ["Eller omuz altında tam hizalı olsun.", "Make sure hands are directly below shoulders."], ["Hızlı yapınca kardiyo, yavaş yapınca core odaklı olur.", "Fast pace = cardio focus; slow pace = core focus."]]
  },
  "burpee": {
    gif: null,
    desc: ["Tam vücut kardiyo ve kuvvet egzersizi. Squat, plank, şınav ve zıplamayı birleştirir. Kondisyon ve yağ yakımı için en etkili hareketlerden biridir.", "Full body cardio and strength exercise combining squat, plank, push-up, and jump. One of the most effective movements for conditioning and fat loss."],
    tips: [["Şınav tam olsun — sadece göğüs yere gelsin.", "Full push-up during the burpee — chest touches the floor."], ["Zıplamanın ardından tam yüksel; kolları yukarı kaldır.", "Jump fully at the top — reach arms overhead."], ["Nefes al → aşağı in → yukarı çık → ver ritmi önemli.", "Breathing rhythm: inhale on descent, exhale on ascent."]]
  },
  "treadmill": {
    gif: null,
    desc: ["Koşu bandında yürüyüş veya koşu. En yaygın kardiyo egzersizlerinden biridir. Hız ve eğim ayarı ile zorluk kolayca değiştirilebilir.", "Treadmill walking or running. One of the most common cardio exercises. Difficulty easily adjustable via speed and incline settings."],
    tips: [["Eğim artırmak kalori yakımını önemli ölçüde artırabilir.", "Increasing incline can boost calorie burn significantly."], ["Yürüyüşte kollarını doğal salla — kenarlığa tutunma.", "If walking, let arms swing naturally — don't hold the side rails."], ["LISS (düşük yoğunluklu sabit hız) yağ yakımı için etkilidir.", "Low-intensity steady state (LISS) is effective for fat burning."]]
  },
  "cycling": {
    gif: null,
    desc: ["Sabit veya dışarıda bisiklet sürmek. Dizlere az yük bindiren, güçlü bir kardiyo egzersizi. Quadriceps ve kalça kaslarını da çalıştırır.", "Stationary or outdoor cycling. A powerful cardio exercise with low impact on the knees. Also works quads and hip muscles."],
    tips: [["Oturma yüksekliğini ayarla — diz tam uzanmalı ama kilitlenmemeli.", "Adjust seat height so knee almost fully extends but doesn't lock."], ["Kadansı (devir/dk) yüksek tut, ağır vites kullanmak dizi yorar.", "Keep cadence high; heavy gearing puts extra stress on knees."], ["HIIT için interval çalışması kalorileri çok daha hızlı yakar.", "Interval training burns calories much faster than steady pace."]]
  },
  "dead-hang": {
    gif: null,
    desc: ["Barfikse ağırlıkla asılı durmak. Kavrama gücünü, ön kol kaslarını ve omuz sağlığını geliştirir. Basit ama çok etkilidir.", "Hanging from a bar under load. Develops grip strength, forearm muscles, and shoulder health. Simple but very effective."],
    tips: [["Omuzları kulağa doğru çöktürme — omuzlar aktif ve aşağıda kalmalı.", "Don't let shoulders shrug to ears — keep them active and depressed."], ["Ön kol kaslarını kasarak tut; pasif sarkmak yerine aktif asıl.", "Actively engage forearms; active hanging is better than passive sagging."], ["Süreyi kademeli artır — 20-30 sn'den başla.", "Gradually increase duration — start at 20-30 seconds."]]
  },
  "wrist-curls": {
    gif: null,
    desc: ["Bilek bükme hareketi. Ön kolun fleksör kaslarını çalıştırır. Kavrama gücü ve ön kol dengesi için kullanılır.", "Wrist curling movement. Works the flexor muscles of the forearm. Used for grip strength and forearm balance."],
    tips: [["Hafif ağırlıkla başla; bu kaslar küçük ve kolay yaralanabilir.", "Start light; these are small muscles that fatigue and injure easily."], ["Hareketi tam yapın; bilek yukarı ve aşağı tam gidebilmeli.", "Use full range of motion; wrist should flex and extend fully."], ["Ön kolu banka üstüne koy — sadece bilek hareket etmeli.", "Rest forearm on a bench — only the wrist should move."]]
  },
  "wrist-extensions": {
    gif: null,
    desc: ["Bilek uzatma hareketi. Ön kolun ekstansör kaslarını çalıştırır. Bilek dengesi ve dirsek sağlığı için önemlidir.", "Wrist extension movement. Works the extensor muscles of the forearm. Important for wrist balance and elbow health."],
    tips: [["Fleksörlerden daha zayıf olan ekstansörler için hafif ağırlık kullan.", "Use lighter weight — extensors are generally weaker than flexors."], ["Aşırı yükleme 'tenis dirseği' (lateral epikondilitis) riskini artırır.", "Overloading increases risk of lateral epicondylitis (tennis elbow)."], ["Rehabilitasyon veya önleyici olarak düzenli çalıştır.", "Train regularly as rehabilitation or preventive care."]]
  },
  "jumping-jack": {
    gif: null,
    desc: ["Zıplayarak kol-bacak açma kapama. Klasik kardiyo ısınma hareketi. Tüm vücut koordinasyonunu ve kardiyovasküler sistemi aktive eder.", "Jump with simultaneous arm and leg opening/closing. Classic cardio warm-up movement. Activates whole-body coordination and cardiovascular system."],
    tips: [["Yumuşak yüzey tercih et veya ayakkabı giy — eklemler için iyidir.", "Prefer a soft surface or wear shoes — gentler on the joints."], ["Her zıplamada topuk yere değmesin; ayak parmakları üzerine in.", "Land on the balls of your feet, not flat-footed."], ["Kardiyovasküler ısınma olarak 2-3 dakika yeterlidir.", "2-3 minutes is sufficient as a cardiovascular warm-up."]]
  },
  "chest-press": {
    gif: null,
    desc: ["Makinede göğüs press. Sabit hareket yolu ve destekli pozisyon sayesinde güvenlidir. Başlangıç seviyesi için ideal bir göğüs egzersizi.", "Machine chest press. Safe due to its fixed movement path and supported position. Ideal chest exercise for beginners."],
    tips: [["Koltuk ve sırtlık yüksekliğini ayarla — kollar omuz hizasında başlamalı.", "Adjust seat and back pad — arms should start at shoulder height."], ["Kontrollü geri çekil — makinenin ağırlığını aniden bırakma.", "Return slowly — don't let the machine's weight snap back."], ["Hareketin başında ve sonunda göğsü kasılı hissetmeye çalış.", "Focus on feeling the chest squeeze at the start and end of each rep."]]
  },
  "romanian-deadlift": {
    gif: null,
    desc: ["Kalça menteşesi odaklı barbell veya dumbbell hareketi. Hamstring ve glute kaslarını yoğun biçimde çalıştırır, alt sırt stabilizasyonunu da geliştirir. Deadlift ailesinin en değerli posterior chain varyasyonlarından biridir.", "A hip-hinge focused movement with barbell or dumbbells. Heavily trains the hamstrings and glutes while improving lower-back stability. One of the most valuable posterior-chain variations in the deadlift family."],
    tips: [["Dizleri hafif kır ve hareket boyunca açıyı büyük ölçüde koru.", "Keep a soft bend in the knees and maintain roughly the same angle throughout."], ["Barı bacaklara yakın indir; kalçayı geriye göndererek menteşe yap.", "Lower the bar close to the legs and hinge by pushing the hips back."], ["Alt noktada sırtı yuvarlama; hamstring gerilimi kaybolmadan dön.", "Do not round the back at the bottom; return when hamstring tension is still present."]]
  },
  "bulgarian-split-squat": {
    gif: null,
    desc: ["Arka ayağın yükseltildiği tek taraflı squat varyasyonu. Quadriceps, glute ve denge becerisini aynı anda geliştirir. Sağ-sol kuvvet farklarını görmek ve kapatmak için çok etkilidir.", "A unilateral squat variation with the rear foot elevated. Builds quads, glutes, and balance at the same time. Very effective for identifying and correcting left-right strength imbalances."],
    tips: [["Ön ayağı yeterince ileri yerleştir ki diz ve kalça rahat bir çizgide çalışsın.", "Place the front foot far enough forward so the knee and hip move comfortably."], ["Gövdeyi hafif öne eğebilirsin ama belini sabit ve kontrollü tut.", "A slight forward torso lean is fine, but keep the lower back stable and controlled."], ["Ön bacağın topuğundan iterek yukarı çık; arka ayak sadece destek olsun.", "Drive up through the front heel; let the rear foot act mostly as support."]]
  },
  "chin-up": {
    gif: null,
    desc: ["Avuç içleri sana bakacak şekilde yapılan barfiks varyasyonu. Lat kaslarıyla birlikte biceps daha fazla yük alır ve birçok kullanıcı için klasik pull-up'tan biraz daha ulaşılabilirdir. Üst vücut çekiş gücü için temel hareketlerden biridir.", "A pull-up variation performed with palms facing you. It places more emphasis on the biceps while still heavily training the lats, and is slightly more accessible than a standard pull-up for many lifters. It is a foundational upper-body pulling exercise."],
    tips: [["Tam asılı başlangıçtan çık ve tepe noktada çeneyi barın üstüne getir.", "Start from a full dead hang and bring the chin clearly above the bar at the top."], ["Dirsekleri aşağı ve geriye çekmeyi düşün; sadece ellerinle asılma.", "Think about pulling elbows down and back rather than hanging only from the hands."], ["Sallanma yerine kontrollü tempo kullan; inişi de aktif yap.", "Use a controlled tempo instead of swinging, and make the descent active as well."]]
  },
  "face-pull": {
    gif: null,
    desc: ["Kablo ve halatla yüze doğru çekilen üst sırt hareketi. Arka omuz, orta-üst trapez ve dış rotatörleri çalıştırarak postürü destekler. Press odaklı programlarda omuz dengesini korumak için çok faydalıdır.", "An upper-back cable movement where the rope is pulled toward the face. It trains the rear delts, mid-upper traps, and external rotators, helping support posture. It is especially useful for maintaining shoulder balance in press-heavy programs."],
    tips: [["Halatı yüz hizasına çek ve bitişte elleri hafif dışa aç.", "Pull the rope toward face level and slightly separate the hands at the finish."], ["Dirsekler omuz çizgisine yakın kalsın; çok aşağıdan çekme.", "Keep the elbows near shoulder height instead of pulling too low."], ["Ağırlığı değil, kürek kemiği ve arka omuz hissini kovala.", "Prioritize scapular and rear-delt feel over heavy weight."]]
  },
  "seated-calf-raise": {
    gif: null,
    desc: ["Oturarak yapılan baldır kaldırma varyasyonu. Diz bükülü olduğu için soleus kasını ayaktaki calf raise'e göre daha fazla vurgular. Alt bacak gelişimini tamamlamak için standing calf raise ile iyi eşleşir.", "A seated calf raise variation. Because the knees stay bent, it emphasizes the soleus more than standing calf raises do. It pairs well with standing calf raises for fuller lower-leg development."],
    tips: [["Alt noktada topukları iyice aşağı bırakıp baldırı esnet.", "Let the heels drop fully at the bottom to stretch the calves."], ["Tepe noktada kısa bir duraklama ekle; hızlı sekme yapma.", "Pause briefly at the top instead of bouncing through reps."], ["Kalf kasları yüksek tekrar ve kontrollü tempo ile iyi cevap verir.", "Calves respond well to higher reps and a controlled tempo."]]
  },
  "hanging-leg-raise": {
    gif: null,
    desc: ["Barfiks barında asılı pozisyonda yapılan core hareketi. Alt karın, kalça fleksörleri ve kavrama gücünü birlikte zorlar. Vücut ağırlığıyla yapılan en güçlü karın varyasyonlarından biridir.", "A core movement performed while hanging from a pull-up bar. It challenges the lower abs, hip flexors, and grip strength together. It is one of the most powerful bodyweight ab variations."],
    tips: [["Bacakları savurmak yerine kontrollü kaldır; salınımı minimumda tut.", "Raise the legs under control rather than swinging them up."], ["Belini hafifçe kıvırıp pelvisi içeri almak karın aktivasyonunu artırır.", "Slightly curling the pelvis under increases abdominal involvement."], ["Düz bacak çok zorsa önce diz çekiş varyasyonuyla başla.", "If straight-leg reps are too hard, start with knee raises first."]]
  },
  "pec-deck": {
    gif: null,
    desc: ["Makinede yapılan göğüs izolasyon hareketi. Sabit yol sayesinde denge ihtiyacını azaltır ve göğüs kasına odaklanmayı kolaylaştırır. Press hareketlerinden sonra kası sıkıştırmak için çok kullanışlıdır.", "A machine-based chest isolation movement. The fixed path reduces balance demands and makes it easier to focus on the chest. It is very useful for squeezing the pecs after pressing work."],
    tips: [["Kol pedleri veya tutacaklar omuzlarına uygun yükseklikte olsun.", "Set the pads or handles so they align comfortably with your shoulders."], ["Hareket sonunda göğsü bilinçli şekilde sık ve kısa durakla.", "Actively squeeze the chest at the end of each rep and pause briefly."], ["Omuzları öne yuvarlama; kürek kemiklerini kontrollü tut.", "Do not roll the shoulders forward; keep the shoulder blades controlled."]]
  },
  "arnold-press": {
    gif: null,
    desc: ["Dumbbell ile yapılan döner omuz press varyasyonu. Hareketin alt kısmındaki rotasyon sayesinde ön ve yan deltoidlere geniş bir çalışma açısı sunar. Omuz hipertrofisi için klasik shoulder press'e iyi bir alternatiftir.", "A rotating dumbbell shoulder-press variation. The rotation in the lower portion gives the front and side delts a broad working arc. It is a strong hypertrophy alternative to the classic shoulder press."],
    tips: [["Alt noktada avuç içleri sana baksın, yukarı çıkarken dışa döndür.", "Start with palms facing you at the bottom and rotate outward as you press up."], ["Hareketi akıcı yap; dönüş ve press tek parça gibi ilerlesin.", "Make the movement fluid so the rotation and press feel like one motion."], ["Aşırı ağır gitme; kontrollü tempo omuz konforu için önemlidir.", "Do not go excessively heavy; controlled tempo matters for shoulder comfort."]]
  },
  "close-grip-bench-press": {
    gif: null,
    desc: ["Dar tutuşla yapılan bench press varyasyonu. Triceps yükünü artırırken göğüs ve ön omuzları da çalıştırır. Press gücünü desteklemek ve kol hacmi kazanmak için çok etkilidir.", "A close-grip bench-press variation. It shifts more load to the triceps while still training the chest and front delts. It is very effective for improving pressing strength and adding arm size."],
    tips: [["Tutuşu aşırı dar yapma; bilek ve dirsek rahat kalacak bir genişlik seç.", "Do not go excessively narrow; choose a grip width that keeps wrists and elbows comfortable."], ["Barı alt göğüs-sternum hattına indirerek dirsekleri gövdeye yakın tut.", "Lower the bar toward the lower chest/sternum while keeping elbows relatively close to the torso."], ["Bench press gibi omuzları bankta sıkıştır ama kilidi tricepsle tamamla.", "Set the shoulders like a normal bench press, then finish the lockout with the triceps."]]
  },
  "hip-abduction-machine": {
    gif: null,
    desc: ["Kalçayı dışa açma makinesi. Glute medius ve kalça çevresi stabilizatörlerini hedef alır. Özellikle alt vücut programlarında kalça stabilitesi ve yan kalça gelişimi için yararlıdır.", "A machine for moving the legs outward against resistance. It targets the glute medius and hip stabilizers. It is helpful for hip stability and lateral glute development in lower-body programs."],
    tips: [["Hareket boyunca belden savrulmak yerine kalçadan açmaya odaklan.", "Focus on opening from the hips rather than swinging from the lower back."], ["Tepe noktada kısa bir sıkışma eklemek yan kalça hissini artırır.", "Adding a brief squeeze at the top increases lateral glute engagement."], ["Ağırlık çok yükselirse momentum başlar; kontrolü bozmayacak seviyede kal.", "If the weight gets too high, momentum takes over; stay in a controllable range."]]
  },
  "stair-climber": {
    gif: null,
    desc: ["Merdiven çıkışını taklit eden yoğun kardiyo cihazı. Kalp atışını hızlı yükseltir, aynı zamanda quadriceps ve glute kaslarını da yorar. Kısa sürede yüksek efor isteyen kondisyon çalışmaları için idealdir.", "A high-intensity cardio machine that mimics climbing stairs. It elevates heart rate quickly while also taxing the quads and glutes. It is ideal for conditioning sessions that need a lot of effort in limited time."],
    tips: [["Kollara aşırı yük verme; tutacakları sadece denge için hafif kullan.", "Do not lean heavily on the handles; use them lightly for balance only."], ["Adımları tam basarak çık; parmak ucunda minik adımlara kaçma.", "Step fully onto each step instead of taking tiny tiptoe steps."], ["Başlangıçta kısa bloklarla çalış; cihaz düşündüğünden daha sert olabilir.", "Start with short work blocks; the machine can be harder than it looks."]]
  },
  "rowing-machine": {
    gif: null,
    desc: ["Kürek ergometresinde yapılan tam vücut kardiyo egzersizi. Bacak itişi, gövde salınımı ve kol çekişini tek ritimde birleştirir. Hem kondisyon hem de iş kapasitesi geliştirmek için çok verimlidir.", "A full-body cardio exercise performed on a rowing ergometer. It combines leg drive, torso swing, and arm pull in one rhythm. It is highly efficient for building conditioning and work capacity."],
    tips: [["Çekiş sırası bacak-gövde-kol; dönüş sırası kol-gövde-bacak olsun.", "Drive in the order legs-torso-arms, then return arms-torso-legs."], ["Belden kamburlaşma; gövde salınımını kontrollü ve nötr omurgayla yap.", "Avoid rounding the lower back; keep the torso swing controlled with a neutral spine."], ["Dakika başına çok hızlı değil, güçlü ve ritmik çekişler hedefle.", "Aim for strong rhythmic strokes rather than simply rushing the stroke rate."]]
  },
  "seated-leg-curl": {
    gif: null,
    desc: ["Oturarak yapılan hamstring curl varyasyonu. Kalça bükülü pozisyonda olduğu için hamstringleri uzamış halde yükler ve arka bacak gelişimini destekler. Alt vücut programlarında squat ve hinge hareketlerini iyi tamamlar.", "A seated hamstring-curl variation. Because the hips stay flexed, it loads the hamstrings in a lengthened position and supports posterior-leg development. It complements squats and hinge movements very well in lower-body programs."],
    tips: [["Alt noktada dizleri tam açmaya yakın getirerek hamstring gerilimini hisset.", "At the bottom, approach full knee extension to feel the hamstring stretch."], ["Kalçanı koltuktan kaldırmadan pedin altında kontrollü çekiş yap.", "Curl under control without lifting the hips from the seat."], ["Eksantrik kısmı yavaşlatmak hamstring hissini belirgin artırır.", "Slowing the eccentric phase greatly increases hamstring tension."]]
  },
  "walking-lunge": {
    gif: null,
    desc: ["İleriye doğru yürüyerek yapılan lunge varyasyonu. Quadriceps, glute ve dengeyi dinamik biçimde çalıştırır. Sabit lunge'a göre koordinasyon ve kondisyon talebi biraz daha yüksektir.", "A lunge variation performed while moving forward. It trains the quads, glutes, and balance dynamically. Compared with a stationary lunge, it demands a bit more coordination and conditioning."],
    tips: [["Her adımda gövdeyi dik ve kontrollü tut; acele etme.", "Keep the torso upright and controlled on every step; do not rush."], ["Ön ayağın tüm tabanı yere bassın ve itişi oradan üret.", "Keep the whole front foot planted and drive from that base."], ["Adım uzunluğunu çok kısaltma; diz ve kalça rahat hareket etsin.", "Do not make the stride too short; allow the knee and hip to move comfortably."]]
  },
  "goblet-squat": {
    gif: null,
    desc: ["Dumbbell veya kettlebell göğüs önünde tutularak yapılan squat. Gövdeyi daha dik tutmayı öğretir ve yeni başlayanlar için squat formunu oturtmada çok etkilidir. Quadriceps, glute ve core aynı anda çalışır.", "A squat performed while holding a dumbbell or kettlebell in front of the chest. It teaches a more upright torso and is highly effective for learning squat mechanics. It trains the quads, glutes, and core together."],
    tips: [["Ağırlığı göğse yakın tut; kollarla öne taşımaya çalışma.", "Keep the load close to the chest instead of reaching it forward."], ["Dirsekleri hafif aşağı yönlendirip göğsü açık tut.", "Angle the elbows slightly down and keep the chest open."], ["Alt noktada topukların yerde kaldığından emin ol.", "Make sure the heels stay grounded at the bottom."]]
  },
  "incline-dumbell-fly": {
    gif: null,
    desc: ["Eğik bankta yapılan dumbbell fly varyasyonu. Üst göğüs liflerine daha fazla vurgu yapar ve press hareketlerinden farklı bir gerilim açısı sunar. Kontrollü yapıldığında göğüs izolasyonu için çok etkilidir.", "A dumbbell-fly variation performed on an incline bench. It emphasizes the upper chest fibers more and provides a different tension angle than pressing movements. When controlled well, it is very effective for chest isolation."],
    tips: [["Bank açısını çok dik yapma; 30-45 derece aralığı genelde iyi çalışır.", "Do not set the bench too steep; 30-45 degrees usually works well."], ["Dirsek açını sabit tutarak geniş bir yay çiz.", "Use a wide arc while keeping the elbow angle relatively fixed."], ["Alt noktada gereksiz derine zorlamadan göğüs gerilimini hisset.", "Feel the chest stretch at the bottom without forcing an excessive range."]]
  },
  "cable-lateral-raise": {
    gif: null,
    desc: ["Kabloyla yapılan yana kaldırma varyasyonu. Dumbbell'a göre hareket boyunca daha sürekli gerilim sağlayarak yan deltoidi hedefler. Omuz hipertrofisi için çok kullanışlı bir izolasyon hareketidir.", "A cable-based lateral-raise variation. Compared with dumbbells, it keeps more constant tension through the range and targets the side delts very directly. It is a very useful isolation exercise for shoulder hypertrophy."],
    tips: [["Kabloyu hafif çapraz açıdan çekmek yan delti daha net hissettirebilir.", "Pulling from a slight cross-body angle can improve side-delt feel."], ["Omuz silkme yerine kolu dirsek önderliğinde yana kaldır.", "Lead with the elbow and avoid turning the rep into a shrug."], ["Ağırlığı düşük tutup formu bozmamak genelde daha iyi sonuç verir.", "Keeping the weight lighter and the form cleaner usually works better here."]]
  },
  "upright-row": {
    gif: null,
    desc: ["Barbell, dumbbell veya kabloyla yapılan dikey çekiş hareketi. Omuzların yan kısmı ile üst trapezi birlikte çalıştırır. Kontrollü yük ve uygun hareket açıklığıyla iyi bir aksesuar seçenek olabilir.", "A vertical-pulling movement done with a barbell, dumbbells, or cable. It trains the side delts together with the upper traps. With controlled loading and a sensible range of motion, it can be a strong accessory option."],
    tips: [["Barı gövdeye yakın tut ve dirseklerin yukarı yönlenmesine izin ver.", "Keep the bar close to the body and let the elbows travel upward."], ["Omuzun rahatsız olduğu noktaya kadar zorlamadan çalış.", "Do not force the range beyond the point where the shoulders feel comfortable."], ["Momentum yerine yavaş ve kontrollü çekiş kullan.", "Use slow controlled pulls instead of momentum."]]
  },
  "single-arm-row-machine": {
    gif: null,
    desc: ["Tek kol kullanılan makine row varyasyonu. Sağ ve sol tarafı ayrı çalıştırarak kuvvet farklarını takip etmeyi kolaylaştırır. Sabit gövde desteği sayesinde sırt kasına odaklanmak daha rahattır.", "A single-arm machine row variation. By training each side separately, it makes it easier to spot and address strength imbalances. The fixed body support also makes it easier to focus directly on the back musculature."],
    tips: [["Her tekrarın sonunda kürek kemiğini bilinçli şekilde geriye çek.", "Actively retract the shoulder blade at the end of each rep."], ["Gövdeyi döndürmeden tek taraflı çekiş yap.", "Perform the pull without twisting the torso."], ["Zayıf tarafı önce çalıştırmak denge kurmaya yardımcı olabilir.", "Training the weaker side first can help keep both sides balanced."]]
  },
  "straight-arm-pulldown": {
    gif: null,
    desc: ["Dirsek açısını büyük ölçüde sabit tutarak yapılan kablo lat çekişi. Lat kaslarını izole etmeye yardımcı olur ve çekiş hissini öğretmek için çok faydalıdır. Pull-up ve row hareketlerine iyi bir yardımcıdır.", "A cable lat movement performed while keeping the elbows mostly fixed. It helps isolate the lats and is very useful for learning how to engage them. It works well as an accessory to pull-ups and rows."],
    tips: [["Dirsekleri çok bükmeden kolları yay gibi aşağı indir.", "Bring the arms down in an arc without turning it into an elbow flexion exercise."], ["Göğsü açık tutup latlarla koltuk altını kapatmayı düşün.", "Keep the chest open and think about closing the armpits with the lats."], ["Alt noktada kısa bir sıkışma eklemek hareketi daha verimli yapar.", "A brief squeeze at the bottom often makes the exercise more effective."]]
  },
  "back-extension": {
    gif: null,
    desc: ["Roman chair veya benzeri düzende yapılan arka zincir hareketi. Alt sırt, glute ve hamstringleri birlikte çalıştırır. Deadlift günü dışında posterior-chain hacmi eklemek için pratik bir seçenektir.", "A posterior-chain movement usually performed on a roman chair or similar setup. It trains the lower back, glutes, and hamstrings together. It is a practical way to add posterior-chain volume outside of deadlift work."],
    tips: [["Belden aşırı kırılma yerine kalçadan menteşe düşün.", "Think hip hinge first instead of excessive spinal extension."], ["Üstte gövdeyi nötr hizaya getirmen yeterli; fazla hiperextensiyon gereksizdir.", "Reaching a neutral torso at the top is enough; excessive hyperextension is unnecessary."], ["Ağırlık eklemeden önce vücut ağırlığıyla kontrollü tekrarlar oturt.", "Own the bodyweight version before adding external load."]]
  },
  "ab-wheel": {
    gif: null,
    desc: ["Karın tekeriyle öne uzanıp geri dönülen ileri seviye core hareketi. Karın duvarını, omuz stabilitesini ve pelvis kontrolünü güçlü şekilde zorlar. Doğru uygulandığında core kuvveti için çok etkilidir.", "An advanced core movement where you roll forward on an ab wheel and return. It strongly challenges the abdominal wall, shoulder stability, and pelvic control. When done correctly, it is extremely effective for building core strength."],
    tips: [["Bel çukurunu artırma; kaburgaları aşağıda tutup core'u kilitle.", "Do not let the lower back arch; keep the ribs down and the core braced."], ["İlk başta menzili kısa tutup zamanla uzat.", "Start with a shorter range and gradually increase it over time."], ["Kalçanın öne düşmesine izin verme; dönüşü karınla başlat.", "Do not let the hips collapse forward; initiate the return with the abs."]]
  },
  "cable-woodchopper": {
    gif: null,
    desc: ["Kabloyla çapraz yönde yapılan rotasyonel core hareketi. Oblikler, transversus abdominis ve gövde kontrolünü geliştirir. Sporda yön değiştirme ve kuvvet transferi için faydalı bir varyasyondur.", "A rotational core exercise performed diagonally with a cable. It develops the obliques, transverse abdominis, and trunk control. It is useful for change-of-direction and force transfer in sport."],
    tips: [["Dönüşü sadece kollarla değil, gövdeyle birlikte yap.", "Rotate through the trunk instead of moving only the arms."], ["Kalçaları ve ayakları gerektiği kadar çevirerek doğal bir rota izle.", "Allow the hips and feet to turn naturally as needed."], ["Ağırlık arttıkça form bozuluyorsa tekrar düşmek daha iyi olur.", "If form breaks as the weight rises, reduce the load and keep the movement clean."]]
  },
  "farmer-carry": {
    gif: null,
    desc: ["İki elde yük taşıyarak yapılan fonksiyonel kuvvet hareketi. Kavrama gücü, üst trapez, core stabilitesi ve genel iş kapasitesini aynı anda geliştirir. Basit görünmesine rağmen çok yüksek sistemik talep oluşturur.", "A functional strength movement where load is carried in both hands. It develops grip strength, upper traps, core stability, and general work capacity all at once. Despite its simplicity, it creates a high systemic training demand."],
    tips: [["Göğsü açık tut ve omuzları hafif aşağı-geride organize et.", "Keep the chest open and organize the shoulders slightly down and back."], ["Kısa, kontrollü adımlar kullan; yük seni yana çekmesin.", "Use short controlled steps and do not let the load pull you side to side."], ["Ağırlık taşırken karını aktif tutmak hareketin ana kısmıdır.", "Actively bracing the trunk during the walk is a core part of the movement."]]
  },
  "hack-squat": {
    gif: null,
    desc: ["Hack squat makinesinde yapılan alt vücut press varyasyonu. Quadriceps odaklı hacim oluşturmak için çok etkilidir ve denge ihtiyacını azaltır. Serbest squat sonrasında güvenli ek hacim vermek için sık kullanılır.", "A lower-body pressing variation performed on a hack squat machine. It is very effective for quad-focused volume and reduces balance demands. It is often used to add safer accessory volume after free-bar squats."],
    tips: [["Ayak yerleşimi quad veya glute vurgusunu değiştirebilir; pozisyonla oyna.", "Foot placement can shift the emphasis between quads and glutes, so experiment a bit."], ["Belini pedden ayırmadan kontrollü derinlikte çalış.", "Work through a controlled depth without letting the lower back peel off the pad."], ["Dizleri kilitleyip makineye yaslanmak yerine her tekrar aktif kal.", "Stay active on every rep instead of locking out and hanging on the machine."]]
  },
  "smith-machine-squat": {
    gif: null,
    desc: ["Smith makinesinde yapılan squat varyasyonu. Bar yolu sabit olduğu için denge talebini azaltır ve bazı kullanıcılar için hareket öğrenimini kolaylaştırır. Serbest squat yerine geçmek zorunda değildir ama kontrollü hacim için işe yarayabilir.", "A squat variation performed in a Smith machine. The fixed bar path reduces balance demands and can make the movement easier to learn for some lifters. It is not a required replacement for free squats, but it can be useful for controlled volume."],
    tips: [["Ayaklarını barın tam altı yerine biraz öne koymak çoğu kullanıcıya daha rahat gelir.", "Placing the feet slightly forward of the bar line often feels more natural for many lifters."], ["Makine yolu sabit olsa da core'u gevşetme; gövdeyi yine aktif tut.", "Even with the fixed track, keep the trunk active and braced."], ["Diz ve kalça çizgini rahat hissettiren stance'i seç.", "Choose the stance that lets the knees and hips move comfortably."]]
  },
  "assisted-pull-up": {
    gif: null,
    desc: ["Makine veya bant desteğiyle yapılan pull-up varyasyonu. Tam barfiks gücüne giden yolda hacim ve teknik pratiği sağlar. Latlar, biceps ve skapular kontrol aynı anda gelişir.", "A pull-up variation performed with machine or band assistance. It provides volume and technique practice on the way to full bodyweight pull-ups. The lats, biceps, and scapular control all improve together."],
    tips: [["Destek miktarını zamanla azaltarak ilerle.", "Progress by gradually reducing the amount of assistance."], ["Her tekrarın dibinde tam uzama ve üstte aktif çekiş koru.", "Keep a full stretch at the bottom and an active pull at the top of every rep."], ["Kendini makineye bırakmak yerine inişi de kontrollü yap.", "Control the lowering phase instead of dropping into the assistance."]]
  },
  "machine-row": {
    gif: null,
    desc: ["Makinede yapılan sırt çekiş hareketi. Denge ihtiyacı düşük olduğu için sırt kasına daha direkt odaklanmayı sağlar. Özellikle sırt kalınlığı ve güvenli hacim biriktirmek için etkilidir.", "A machine-based back-row movement. Because balance demands are low, it allows more direct focus on the back muscles. It is especially effective for building back thickness and accumulating safe volume."],
    tips: [["Göğsü pedde sabit tutarak dirsekleri geriye sür.", "Keep the chest fixed to the pad if available and drive the elbows back."], ["Bitişte kürek kemiklerini sık ama boynu kasma.", "Squeeze the shoulder blades at the end without tensing the neck."], ["Hareketi tam uzamadan başlatmak yerine gerilimli başlangıç kullan.", "Start from a full stretch so the row covers the full useful range."]]
  },
  "machine-shoulder-press": {
    gif: null,
    desc: ["Makinede yapılan omuz press hareketi. Sabit yol sayesinde denge ihtiyacını azaltır ve omuzlara kontrollü yük bindirir. Serbest ağırlık press'lerine destek olmak için iyi bir hypertrophy seçeneğidir.", "A shoulder-press movement performed on a machine. The fixed path reduces balance demands and applies load to the shoulders in a controlled way. It is a strong hypertrophy option to support free-weight pressing."],
    tips: [["Koltuk yüksekliğini ayarlayıp ellerin omuz hattına uygun başladığından emin ol.", "Adjust the seat so the handles start in a comfortable line with the shoulders."], ["Dirsekleri tamamen kilitlemeden tekrarları akıcı sürdür.", "Keep the reps flowing instead of hard-locking the elbows each time."], ["Omuz konforu için aşırı derine zorlamadan çalış.", "Avoid forcing an excessively deep range if the shoulders do not like it."]]
  },
  "cable-kickback": {
    gif: null,
    desc: ["Ayak bileğine takılan aparatla yapılan glute odaklı kablo hareketi. Kalçayı geriye itme paternini izole eder ve özellikle glute bağlantısı kurmak için faydalıdır. Alt vücut günlerinde yardımcı egzersiz olarak iyi çalışır.", "A glute-focused cable movement usually done with an ankle attachment. It isolates hip extension and is especially useful for building a strong mind-muscle connection with the glutes. It works well as an accessory on lower-body days."],
    tips: [["Belden savrulma yerine hareketi kalçadan üret.", "Drive the motion from the hip instead of swinging through the lower back."], ["Tepe noktada kısa bir duraklama eklemek glute hissini artırır.", "A short pause at the top increases the glute contraction."], ["Küçük ama kontrollü menzil çoğu zaman daha iyi sonuç verir.", "A smaller but controlled range often works better than an exaggerated swing."]]
  },
  "step-up": {
    gif: null,
    desc: ["Bir kutu ya da platform üzerine çıkılarak yapılan tek taraflı alt vücut hareketi. Quadriceps, glute ve dengeyi birlikte geliştirir. Evde veya salonda uygulanması kolay, çok işlevsel bir seçenektir.", "A unilateral lower-body movement performed by stepping onto a box or platform. It develops the quads, glutes, and balance together. It is a practical and highly functional choice at home or in the gym."],
    tips: [["Yukarı çıkarken arka ayağın itişini minimumda tut; işi ön bacak yapsın.", "Minimize the push from the trailing leg so the lead leg does the work."], ["Platform yüksekliğini kontrolü bozmayacak seviyede seç.", "Choose a platform height that does not compromise control."], ["İnişi de kontrollü yaparak diz stabilitesini koru.", "Control the lowering phase as well to reinforce knee stability."]]
  },
  "pike-push-up": {
    gif: null,
    desc: ["Kalça yukarıda V pozisyonuna yakın yapılan vücut ağırlığı press hareketi. Omuzlara klasik push-up'tan daha fazla yük bindirir ve handstand press paternine hazırlık sağlar. Ev tipi antrenmanlar için güçlü bir omuz seçeneğidir.", "A bodyweight pressing movement performed with the hips high in a V-like position. It loads the shoulders more than a standard push-up and helps build toward handstand-press mechanics. It is a strong shoulder option for minimalist training."],
    tips: [["Kalçayı yukarı taşıyarak gövde açısını omuz odaklı hale getir.", "Raise the hips high so the body angle shifts the work toward the shoulders."], ["Başını ellerin arasına değil, hafif önüne indir.", "Lower the head slightly in front of the hands rather than straight between them."], ["Zorsa elleri yükseltiye koyarak başlayabilirsin.", "If needed, start with the hands elevated to make the variation easier."]]
  },
  "superman": {
    gif: null,
    desc: ["Yüzüstü yerde yapılan basit arka zincir aktivasyon hareketi. Alt sırt, glute ve sırt üst kısmını hafif ama etkili biçimde devreye sokar. Özellikle ekipmansız antrenmanlarda destekleyici olarak kullanılır.", "A simple posterior-chain activation movement performed face down on the floor. It lightly but effectively engages the lower back, glutes, and upper back. It is especially useful as a supportive drill in equipment-free training."],
    tips: [["Kolları ve bacakları kaldırırken boynu kasma; bakışı yere yakın tut.", "Do not crank the neck while lifting the arms and legs; keep the gaze down."], ["Çok yükseğe çıkmak yerine kontrollü sıkışma hedefle.", "Aim for a controlled contraction rather than trying to lift as high as possible."], ["Kısa duraklamalar hareketin verimini artırır.", "Short pauses at the top make the drill more effective."]]
  },
  "side-plank": {
    gif: null,
    desc: ["Yan destek pozisyonunda yapılan izometrik core hareketi. Oblikler, kalça yan zinciri ve omuz stabilitesini birlikte çalıştırır. Lateral core kuvveti için en temel hareketlerden biridir.", "An isometric core exercise performed in a side-support position. It trains the obliques, lateral hip chain, and shoulder stability together. It is one of the foundational exercises for lateral core strength."],
    tips: [["Kulak-omuz-kalça-ayak çizgisini mümkün olduğunca düz tut.", "Keep the ear-shoulder-hip-foot line as straight as possible."], ["Alt belin çökmesine izin verme; kalçayı aktif yukarı taşı.", "Do not let the lower side sag; actively lift the hips."], ["Kolaylaştırmak için dizler bükülü versiyonla başlayabilirsin.", "You can start with a bent-knee version to make it easier."]]
  },
  "glute-kickback": {
    gif: null,
    desc: ["Vücut ağırlığı veya hafif dirençle yapılan kalçayı geriye itiş hareketi. Glute aktivasyonunu öğrenmek ve kalçayı hedefli çalıştırmak için basit ama etkili bir seçenektir. Isınma veya aksesuar bölümünde iyi çalışır.", "A hip-extension movement done with bodyweight or light resistance. It is a simple but effective way to learn glute activation and target the glutes directly. It works well in warm-ups or accessory work."],
    tips: [["Belden değil kalçadan hareket etmeye odaklan.", "Focus on moving from the hip instead of the lower back."], ["Tepe noktada glute'u kısa süre bilinçli sık.", "Intentionally squeeze the glute briefly at the top."], ["Tekrarı yavaş yapmak hissi belirgin artırır.", "Performing the reps slowly usually improves the feel a lot."]]
  }
};
