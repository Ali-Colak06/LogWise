// LogWise — Hareket Önizleme (Gif + Açıklama + İpucu) Verisi
// Anahtar: preset hareket adı (Türkçe)
// Değer: { gif: null | "url", desc: [TR uzun açıklama, EN uzun açıklama], tips: [[TR ipucu, EN ipucu], ...] }
// getExPreview helper bunu okur ve hareket modal'ında gösterir.
window.LOGWISE_EX_PREVIEW = {
  "Bench Press": {
    gif: null,
    desc: ["Düz bankta barbell press. Göğüs kasları (pectoralis major), ön deltoid ve triceps aynı anda çalışır. Üst vücut kuvvetinin temel bileşik hareketi.", "Barbell press on a flat bench. Works the pectorals, front deltoids, and triceps together. The foundational compound for upper body strength."],
    tips: [["Omuz bıçaklarını bankta birbirine sıkıştır ve kilitli tut.", "Retract and lock shoulder blades into the bench before unracking."], ["Barı göğsünün orta-alt kısmına değdir; sektirme.", "Touch bar to mid-lower chest without bouncing."], ["Ayaklar yere tam bassın; kalça banktan kalkmamalı.", "Keep feet flat on floor; hips must stay on the bench."], ["Kontrollü indir (~2 sn), güçlü ve hızlı it.", "Lower slowly (~2 sec), then press up powerfully."], ["Nefesi inerken al, iterken ver.", "Inhale on the way down, exhale as you press."]]
  },
  "İncline Bench Press": {
    gif: null,
    desc: ["30–45° eğik bankta barbell press. Üst göğüs bölgesini ve ön omuzları standart bench'e göre daha fazla çalıştırır. Tam göğüs gelişimi için önemlidir.", "Barbell press on a 30–45° incline bench. Targets the upper chest and front deltoids more than flat bench. Essential for complete chest development."],
    tips: [["Banco 30–45° arasında ayarla; fazla eğik olursa omuz baskısı artar.", "Set bench to 30–45°; steeper angles overload the shoulders."], ["Bar üst göğse iner — boyun veya yüze değil.", "Bar descends to upper chest — not toward neck or face."], ["Dirsekleri hafifçe içe al (~75°); tam yanlara açma.", "Tuck elbows slightly (~75°); don't fully flare them out."], ["Göğsü hareket boyunca kasılı hissedecek şekilde sıkıştır.", "Feel the chest squeezing throughout the entire movement."]]
  },
  "Dumbell Press": {
    gif: null,
    desc: ["Dumbbell ile düz bankta göğüs press. Her kol bağımsız çalışır; kas dengesizliklerini giderir ve hareket açısı daha geniş olabilir.", "Flat dumbbell chest press. Each arm works independently, correcting imbalances. Allows a greater range of motion at the bottom."],
    tips: [["Dumbbellları hafifçe birbirine yaklaştırarak sık — göğüs aktivasyonunu artırır.", "Squeeze dumbbells slightly toward each other at the top for extra chest contraction."], ["Her iki tarafın aynı ağırlık ve tekrarı yapmasına dikkat et.", "Ensure both sides match in weight and reps to prevent imbalance."], ["Alt noktada dirsekler 90° bükük, dumbbelllar omuz hizasında.", "At the bottom, elbows at 90°, dumbbells in line with shoulders."]]
  },
  "İncline Dumbell Press": {
    gif: null,
    desc: ["Eğik bankta dumbbell press. Üst göğüsü izole eder, hareket açısı barbell'e göre daha serbesttir. Bütün göğüs programının önemli bir parçasıdır.", "Incline dumbbell press. Isolates the upper chest with a freer range of motion than barbell. An important part of any complete chest program."],
    tips: [["Banco 30–45° arasında — fazla dik omuzları aşırı yorar.", "Set bench to 30–45° — too steep overworks the shoulders."], ["Her iki kolu eşit şekilde kaldır; biri ileride olmamalı.", "Raise both arms equally; one side shouldn't lead the other."], ["Hareketi tamamlarken dumbbellları birbirine yaklaştır ve üst göğsü sık.", "Bring dumbbells together at the top and squeeze the upper chest."]]
  },
  "Dumbell Fly": {
    gif: null,
    desc: ["Dumbbell ile göğüs açma-kapama (fly) hareketi. Göğüs kasını yatay düzlemde izole eder. Büyük bir gerilim açısı sağlar.", "Dumbbell chest fly. Isolates the chest in the horizontal plane. Provides a large stretch at the bottom."],
    tips: [["Dirsekleri hafifçe bük — tamamen düz tutma, eklem stresi artar.", "Keep a soft elbow bend throughout — fully straight arms increase joint stress."], ["Geniş açıdan indir; göğüste derin bir gerilim hissedeceksin.", "Lower through a wide arc until you feel a deep chest stretch."], ["Ağırlıktan değil, hissettirenden git; form her zaman önce.", "Prioritize the feel over the load; form always comes first."]]
  },
  "Cable Crossover": {
    gif: null,
    desc: ["Çift kablo makinesinde göğüs çaprazlama hareketi. Hareket boyunca sürekli gerilim sağlar. Özellikle iç göğüs ve alt göğüsü izole etmek için idealdir.", "Chest crossover on a dual cable machine. Provides constant tension throughout the movement. Ideal for isolating the inner and lower chest."],
    tips: [["Kablo yüksekliğini değiştirerek farklı göğüs bölgelerini hedefleyebilirsin.", "Change cable height to target different chest regions (upper/mid/lower)."], ["Hareketi bitirirken elleri birbiriyle kapat ve 1 sn sık.", "Fully close and cross hands at the end, hold for 1 second."], ["Gövdeyi hafifçe öne eğ; dik durmak göğsü devre dışı bırakır.", "Lean torso slightly forward; standing fully upright removes chest tension."]]
  },
  "Şınav": {
    gif: null,
    desc: ["Temel vücut ağırlığı egzersizi. Göğüs, omuz ve triceps kaslarını birlikte çalıştırır. Ekipman gerektirmez, her yerde yapılabilir.", "Fundamental bodyweight exercise. Works chest, shoulders, and triceps together. Requires no equipment, can be done anywhere."],
    tips: [["Vücut baştan topuğa düz bir çizgi oluşturmalı; bel ne düşmeli ne de kabarmalı.", "Body should form a straight line from head to heels; hips neither sag nor pike."], ["Göğsü yere değdir — tam ROM için çalış.", "Touch chest to floor — aim for full range of motion."], ["Ayakları yükseltince (decline) üst göğüs, dizleri yere koyunca kolaylaşır.", "Elevated feet (decline) hits upper chest; knees on floor for an easier variation."], ["Nefes alarak in, iterken ver.", "Inhale going down, exhale pressing up."]]
  },
  "Dips": {
    gif: null,
    desc: ["Paralel barlarda baskı egzersizi. Öne eğilince göğüs, dik durulursa triceps vurgulanır. Ciddi ağırlık eklenebilen güçlü bir bileşik harekettir.", "Upper body pressing on parallel bars. Leaning forward emphasizes chest; staying upright emphasizes triceps. Can be loaded heavily over time."],
    tips: [["Göğüs için öne ~30° eğil; triceps için gövdeyi dik tut.", "Lean forward ~30° for chest emphasis; stay upright for triceps."], ["Omuzları kulağa doğru çöktürme — omuz bıçaklarını gergin tut.", "Don't let shoulders shrug up — keep them depressed and retracted."], ["Tam aşağı in (90°), tam yukarı çık ama dirsekleri kilitleme.", "Go to 90° at the elbow at bottom, fully extend at top without locking."]]
  },
  "Deadlift": {
    gif: null,
    desc: ["Yerden barbell kaldırma. En temel güç hareketlerinden biri. Sırt, bacak, kalça, core ve kavrama gücü dahil neredeyse tüm vücudu çalıştırır.", "Barbell lift from the floor. One of the most fundamental strength movements. Works back, legs, glutes, core, and grip — virtually the whole body."],
    tips: [["Bar ayak ortasının üzerinde olmalı; kaldırmadan önce bacaklar barla temas etsin.", "Bar over mid-foot; shins should contact the bar before pulling."], ["Kalçaları öne it ve sırtı düz tut — kamburluk kesinlikle olmamalı.", "Drive hips through at the top — maintain neutral spine, no rounding."], ["Kaldırmadan önce derin nefes al ve karnı sabitle (Valsalva).", "Take a deep breath and brace core before each rep (Valsalva maneuver)."], ["Bar vücuda yakın kalsın — ayaklardan uzaklaşmasın.", "Keep bar close to body throughout — don't let it drift forward."], ["Erken aşamada bacaklarla it, geç aşamada kalçayla tamamla.", "Think: push the floor away early (legs), then drive hips through late."]]
  },
  "Squat": {
    gif: null,
    desc: ["Barbell arka squat. Bacakların temel bileşik hareketi. Quadriceps, hamstring, gluteus ve core kaslarını güçlü biçimde çalıştırır.", "Barbell back squat. The primary lower body compound movement. Works quads, hamstrings, glutes, and core powerfully."],
    tips: [["Diz ayak parmakları yönünde açılsın — içe çökmemeli.", "Knees should track over toes — don't let them cave inward."], ["Kalçayı paralelin altına indir (esnekliğin izin verdiği kadar).", "Break parallel with the hips if your flexibility allows."], ["Nefesi inerken al, yukarı çıkarken ver.", "Inhale going down, exhale on the way up."], ["Topuklar yerde kalsın — kaldırılmamalı.", "Keep heels on the ground throughout the entire movement."], ["Core kilitli, göğüs yukarı bakmalı — öne kapanma.", "Brace core hard, chest up — don't fold forward at the hips."]]
  },
  "Leg Press": {
    gif: null,
    desc: ["Bacak press makinesi. Squat'ın aksine omurga yükü olmadan quadriceps, hamstring ve gluteusları çalıştırır. Başlangıç seviyesi için güvenli bir seçenek.", "Leg press machine. Works quads, hamstrings, and glutes without spinal loading. A safer option especially for beginners."],
    tips: [["Ayak pozisyonu önemlidir: yukarıda=hamstring/glute, aşağıda=quad vurgusu.", "Foot placement matters: high = more hamstring/glute, low = more quad."], ["Dizleri platforma tam uzanarak kilitleme — eklem stresini artırır.", "Don't lock out knees fully at the top — stop just short to protect joints."], ["Sırtını makine sırtlığından kaldırma, tüm hareket boyunca bassın.", "Keep lower back pressed firmly against the pad throughout."], ["Kontrollü indir (2-3 sn), güçlü ve hızlı çık.", "Lower slowly (2-3 sec), press up powerfully."]]
  },
  "Lunge": {
    gif: null,
    desc: ["İleri hamle. Tek bacak gücü, denge ve koordinasyon için mükemmeldir. Quadriceps ve gluteusları birlikte çalıştırır.", "Forward lunge. Excellent for single-leg strength, balance, and coordination. Works quads and glutes together."],
    tips: [["Adım atınca ön diz ayak parmağının önüne geçmemeli.", "When stepping, front knee should not go past the toes."], ["Gövdeyi dik tut — aşırı öne eğilme.", "Keep torso upright — don't lean excessively forward."], ["Arka diz yere yakın insin ama değmemeli.", "Rear knee comes close to the floor but should not touch it."], ["Her iki tarafı eşit tekrarla çalıştır.", "Train both sides with equal reps and weight."]]
  },
  "Leg Curl": {
    gif: null,
    desc: ["Bacak bükme makinesi. Hamstring kaslarını izole eder. Yatarak veya oturarak yapılır. Bacak güç dengesini korumak için kritiktir.", "Leg curl machine. Isolates the hamstring muscles. Performed lying or seated. Critical for balanced leg strength."],
    tips: [["Hareket boyunca kalçanın banktan kalkmasını engelle.", "Prevent hips from lifting off the pad during the movement."], ["Tam uzanmaya izin ver — hamstring gerilimi önemlidir.", "Allow full extension — the hamstring stretch is important."], ["Kontrollü indir; hamstring yaralanmalarından korunmak için form şart.", "Lower with control; proper form is essential to prevent hamstring injuries."]]
  },
  "Leg Extension": {
    gif: null,
    desc: ["Oturarak bacak uzatma makinesi. Quadriceps kaslarını izole eder. Genellikle squat ve leg press'in tamamlayıcısı olarak kullanılır.", "Seated leg extension machine. Isolates the quadriceps. Usually used as a complement to squat and leg press."],
    tips: [["Tam uzanmaya git ama dizleri kilitleme.", "Extend fully but don't lock out knees at the top."], ["Kontrollü indir — eksantrik faz çok önemlidir.", "Lower slowly — the eccentric (lowering) phase is very important."], ["Diz rahatsızlığı varsa dikkatli ol; çok ağır yüklemekten kaçın.", "Be cautious with knee issues; avoid going excessively heavy."]]
  },
  "Hip Thrust": {
    gif: null,
    desc: ["Gluteus maximus izolasyon hareketi. Banka yaslanılarak barbell veya bant ile yapılır. Kalça kasını en etkili çalıştıran egzersizler arasındadır.", "Glute isolation movement using a bench, with barbell or band. One of the most effective exercises for targeting gluteus maximus."],
    tips: [["Omuz bıçaklarını banka daya — omuzlar banka temas halinde olmalı.", "Rest upper back/shoulder blades on the bench edge."], ["Kalçayı tam uzat — üst noktada sanki ayakta duruyormuş gibi sık.", "Fully extend hips at top — squeeze glutes as hard as if standing."], ["Ayaklar yere düz bassın, topuklardan it.", "Press through heels with feet flat on the floor."], ["Barbell için ped kullan — direkt temas rahatsız edicidir.", "Use a barbell pad — direct contact can be quite uncomfortable."]]
  },
  "Glute Bridge": {
    gif: null,
    desc: ["Sırt üstü yatarak kalça kaldırma. Hip thrust'ın ekipmansız versiyonu. Kalça aktivasyonu ve başlangıç seviyesi antrenmanları için çok yaygındır.", "Lying glute bridge. Bodyweight version of the hip thrust. Very common for glute activation and beginner training."],
    tips: [["Ayaklar kalça genişliğinde, dizler yaklaşık 90° bükük.", "Feet hip-width apart, knees bent to about 90°."], ["Üst noktada en az 1 saniye güçlüce sık.", "Squeeze glutes at the top for at least 1 second."], ["Diz bandı veya kalça üstü ağırlık ekleyerek zorlaştırabilirsin.", "Add a resistance band around knees or weight on hips to increase difficulty."]]
  },
  "Pull Up": {
    gif: null,
    desc: ["Barfikse asılarak çıkma. Sırt kaslarının en temel bileşik hareketi. Latissimus dorsi, biceps ve core kaslarını birlikte çalıştırır.", "Pull-up from a dead hang. The foundational compound for back muscles. Works latissimus dorsi, biceps, and core together."],
    tips: [["Geniş, overhand tutuş lat'ları vurgular; dar tutuş biceps'i.", "Wide overhand grip emphasizes lats; narrower grip shifts more to biceps."], ["Her tekrarda ölü asılmaya dön — tam ROM şart.", "Return to a full dead hang each rep — full range of motion is essential."], ["Çıkış boyunca kürek kemiklerini aşağı çek — omuzları kulağa yaklaştırma.", "Depress shoulder blades throughout — don't let shoulders shrug up."], ["Vücut sallanmasın — kontrollü ve yavaş indir.", "No swinging — controlled and slow descent."]]
  },
  "Lat Pulldown": {
    gif: null,
    desc: ["Kablo makinesinde yukarıdan çekiş. Pull-up yapamayan kullanıcılar için mükemmel alternatif. Latissimus dorsi ve biceps başarıyla çalıştırılır.", "Cable pulldown from overhead. Excellent alternative for those who can't do pull-ups yet. Works latissimus dorsi and biceps effectively."],
    tips: [["Bar üst göğse çekilmeli — boyun veya yüze değil.", "Pull bar to upper chest — not toward neck or face."], ["Çekerken dirsekleri aşağı ve hafifçe arkaya götür.", "Drive elbows down and slightly back during the pull."], ["Çıkışta tam uzanmaya izin ver — lat gerilimi önemlidir.", "Allow full stretch at the top — lat elongation matters."], ["Hafifçe arkaya yaslan (~30°); aşırı eğilme.", "Lean back slightly (~30°) — but avoid excessive lean."]]
  },
  "Barbell Row": {
    gif: null,
    desc: ["Eğilerek barbell sıra çekme. Sırt kalınlığı için en etkili hareketlerden biri. Rhomboid'ler, orta trap, lat ve biceps birlikte çalışır.", "Bent-over barbell row. One of the most effective movements for back thickness. Works rhomboids, middle traps, lats, and biceps."],
    tips: [["Gövde yaklaşık 45° eğik — yatay pozisyon değil.", "Torso should be roughly 45° — not completely horizontal."], ["Bar göbeğe veya alt göğse değmeli.", "Pull bar to lower abdomen or lower chest."], ["Her tekrarda nefes al ve core'u kilitle — sırtın için deadlift gibi.", "Brace core before each rep — treat it like a deadlift for spine safety."], ["Çekiş sırasında dirsekleri arkaya doğru götür.", "Drive elbows back behind the body during the pull."]]
  },
  "Cable Row": {
    gif: null,
    desc: ["Oturarak kablo çekme. Sırt kaslarını sürekli gerilimle çalıştırır. Orta sırt ve rhomboid'ler için özellikle etkilidir.", "Seated cable row. Works back muscles under constant tension. Particularly effective for mid-back and rhomboids."],
    tips: [["Hareket boyunca sırtı düz tut — hareketle birlikte öne sallanma.", "Keep back straight — don't sway forward with each rep."], ["Bitişte kürek kemiklerini sık ve 1 sn tut.", "Squeeze shoulder blades together at the end and hold for 1 second."], ["Tam gerilim için hareketi tam uzanarak başlat.", "Start from a full stretch for maximum range of motion."], ["Dirsekler gövdeye yakın kalsın — dışa açılmasın.", "Keep elbows close to the body — don't let them flare outward."]]
  },
  "Dumbell Row": {
    gif: null,
    desc: ["Tek kol dumbbell sıra çekme. Her kolu bağımsız çalıştırır; kas dengesizliklerini düzeltir. Sırt kalınlığı ve lat gelişimi için mükemmeldir.", "Single arm dumbbell row. Works each arm independently, correcting imbalances. Excellent for back thickness and lat development."],
    tips: [["Destek el ve dizi banka koy — sırt düz ve paralel.", "Place support hand and knee on bench — keep back flat and parallel."], ["Dumbbell'ı kalça yanına çek — öne değil, geriye.", "Pull dumbbell toward hip — back and up, not forward."], ["Kürek kemiğini harekete dahil et; sadece kolunla çekme.", "Engage the shoulder blade; don't just pull with the arm."]]
  },
  "T-Bar Row": {
    gif: null,
    desc: ["T-bar makinesinde veya köşeye sıkıştırılmış barbell ile sıra çekme. Sırt kalınlığını geliştirmede çok etkilidir. Orta sırt kaslarını güçlü çalıştırır.", "Row using a T-bar machine or landmine setup. Very effective for building back thickness. Powerfully works mid-back muscles."],
    tips: [["Gövdeyi yaklaşık 45° eğik tut — fazla dik durma.", "Keep torso roughly 45° — don't stand too upright."], ["Bar göbeğe veya alt göğse çekilmeli.", "Pull toward abdomen or lower chest."], ["Çekiş boyunca kürek kemiklerini sıkıştır ve tut.", "Squeeze and hold shoulder blades together throughout the pull."]]
  },
  "Pullover": {
    gif: null,
    desc: ["Banka en-çapraz yatarak dumbbell hareketi. Hem lat'ları hem göğüsü (serratus anterior dahil) çalıştıran benzersiz bir egzersizdir.", "Lying dumbbell pullover. A unique movement working both lats and chest (including serratus anterior)."],
    tips: [["Bankta sadece omuz bıçakları temas etmeli — en-çapraz yat.", "Lie across bench with only shoulder blades touching — perpendicular position."], ["Dirsekleri hafifçe bükük tut; kilitleme.", "Maintain a soft elbow bend throughout — don't lock out."], ["Başın altına kadar in — lat'lar tam gerilsin.", "Lower to below head level for a full lat stretch."]]
  },
  "Overhead Press": {
    gif: null,
    desc: ["Ayakta barbell omuz press. Tüm deltoid başlarını, triceps ve üst trap kaslarını çalıştıran temel bileşik omuz hareketi.", "Standing barbell overhead press. Fundamental compound shoulder movement working all deltoid heads, triceps, and upper traps."],
    tips: [["Bar alt çeneye yakın başlar; basarken kulakların üstüne hizalan.", "Bar starts just below chin; end position directly over ears."], ["Sırtı aşırı kamburlaştırma — core'u sıkı tut.", "Avoid excessive back arch — keep core braced throughout."], ["Bacak bükme olmadan tam güçle it — teknik egzersiz bu şekilde.", "No knee bend — strict overhead press with no leg drive."], ["Nefes al → kilitlen → it → ver sırası önemlidir.", "Inhale → brace → press → exhale — this sequence matters."]]
  },
  "Shoulder Press": {
    gif: null,
    desc: ["Oturarak veya ayakta dumbbell/barbell ile omuz press. Tüm deltoid kaslarını ve triceps'i çalıştırır. Overhead Press'in esnek bir alternatifidir.", "Seated or standing dumbbell/barbell shoulder press. Works all deltoid heads and triceps. A flexible alternative to the strict overhead press."],
    tips: [["Oturarak sırtı sırtlığa yasla — omurga koruması için.", "When seated, keep back firmly against the pad for spinal support."], ["Barı kulak hizasına kadar indir — çok aşağıya gitme.", "Lower bar to ear level — don't go excessively low."], ["Dumbbellı basarken kontrollü yüksel; yanlara açma.", "Press upward with control; don't flare dumbbells outward."]]
  },
  "Lateral Raise": {
    gif: null,
    desc: ["Yana kaldırma hareketi. Deltoidin yan (medial) bölümünü izole eder. Omuz genişliği ve V şekli için en önemli izolasyon hareketlerinden biridir.", "Lateral raise. Isolates the medial (side) deltoid. One of the most important isolation movements for shoulder width and V-taper."],
    tips: [["Küçük ağırlık kullan — bu harekette form her şeydir.", "Use light weight — form is everything in lateral raises."], ["Başparmakları biraz aşağı eğ (kutu dökmek gibi) — medial delti daha iyi aktive eder.", "Tilt thumbs slightly down as if pouring water — better medial delt activation."], ["Kolu omuz hizasının biraz üstüne kaldır, kontrollü indir.", "Raise to just above shoulder level, then lower slowly."], ["Dirsekleri hafifçe bükük tut — tam düz kol stres yaratır.", "Keep a slight elbow bend — fully straight arms create unnecessary joint stress."]]
  },
  "Front Raise": {
    gif: null,
    desc: ["Öne kaldırma hareketi. Deltoidin ön (anterior) bölümünü izole eder. Barbell, dumbbell veya kablo ile yapılabilir.", "Front raise. Isolates the anterior (front) deltoid. Can be done with barbell, dumbbells, or cable."],
    tips: [["Kolu omuz hizasına kadar kaldır; aşırı yukarı gitme.", "Raise to shoulder level; don't go excessively higher."], ["Gövdeyi sabit tut — momentum kullanma.", "Keep torso still — don't use body swing for momentum."], ["Ön omuzlar zaten bir çok harekette çalışır; çok fazla ek hacim ekleme.", "Front delts already get work from pressing; don't overdo additional volume."]]
  },
  "Rear Delt Fly": {
    gif: null,
    desc: ["Arka deltoid açma hareketi. Genellikle ihmal edilen arka omuz kasını çalıştırır. Omuz sağlığı ve dik duruş için kritiktir.", "Rear deltoid fly. Targets the often-neglected posterior deltoid. Critical for shoulder health and upright posture."],
    tips: [["Öne eğik veya makine/kablo ile yapılabilir; kontrol her zaman önce.", "Can be done bent over or on a cable/machine; control is always first."], ["Hareket boyunca dirsekleri hafifçe bükük tut.", "Keep a slight elbow bend throughout the movement."], ["Kürek kemiklerini sık harekentin sonunda — sadece kolla değil sırtla yap.", "Retract shoulder blades at peak — use your back, not just the arms."]]
  },
  "Biceps Curl": {
    gif: null,
    desc: ["Klasik biceps curl. Barbell veya dumbbell ile yapılır. Biceps brachii ve brachialis kaslarını çalıştırır.", "Classic biceps curl with barbell or dumbbells. Works biceps brachii and brachialis muscles."],
    tips: [["Dirsekleri gövde yanında sabit tut — öne sallanmasın.", "Keep elbows locked at sides — don't let them swing forward."], ["Üst noktada 1 sn sık; inişi kontrollü yap (~2-3 sn).", "Squeeze at the top for 1 sec; lower slowly in 2-3 sec."], ["Tam aşağı in — bicepsin tam gerilmesi için önemlidir.", "Go to full extension at the bottom — important for full bicep stretch."]]
  },
  "Hammer Curl": {
    gif: null,
    desc: ["Nötr (dik) tutuşla curl. Brachialis ve brachioradialis kaslarını vurgular. Ön kol ve biceps kalınlığı için önemlidir.", "Neutral grip curl. More emphasis on brachialis and brachioradialis. Important for forearm and overall arm thickness."],
    tips: [["Başparmak yukarı bakacak şekilde tut — nötr kavrama.", "Hold with thumbs pointing up — neutral grip."], ["Her iki kolu aynı anda veya dönüşümlü yapabilirsin.", "Can be done simultaneously or alternating arms."], ["Dirsekleri sabit tut — sadece ön kol hareket etmeli.", "Keep upper arms stationary — only the forearm should move."]]
  },
  "One Arm Cable Curl": {
    gif: null,
    desc: ["Tek kol kablo curl. Her kolu bağımsız çalıştırır, sürekli gerilim sağlar. Kasların eşit gelişimi için faydalıdır.", "Single arm cable curl. Works each arm independently with constant tension. Useful for equal muscular development."],
    tips: [["Kablo alçak pozisyonda — ayak seviyesinden çek.", "Cable set to low position — pull from ankle level."], ["Dirsek sabit kalmalı; sadece ön kol hareket eder.", "Upper arm stays fixed; only the forearm moves."], ["Her iki kola eşit tekrar uygula.", "Apply equal reps to both arms."]]
  },
  "Preacher Curl": {
    gif: null,
    desc: ["Scott sehpasında (preacher bench) biceps curl. Dirsekleri sehpaya kilitler, momentum kullanımını engeller. Saf biceps izolasyonu sağlar.", "Biceps curl on a preacher bench. Locks elbows on the pad, eliminating momentum. Provides pure biceps isolation."],
    tips: [["Koltuk altları sehpanın üstünde; dirsekler pad'e tam oturmalı.", "Armpits at the top of the pad; elbows fully supported on the pad."], ["Tam gerilim için tam aşağı in ama dirseği hiperekstanse etme.", "Go to full extension at the bottom but don't hyperextend the elbow."], ["İniş kontrolü çok kritik — yavaş ve kasılı indir.", "Eccentric (lowering) control is crucial — slow and controlled."]]
  },
  "Reverse Curl": {
    gif: null,
    desc: ["Ters tutuşla (pronated) curl. Brachialis ve brachioradialis kaslarını güçlü çalıştırır. Ön kol kalınlığı için değerlidir.", "Reverse (pronated) grip curl. Powerfully works brachialis and brachioradialis. Valuable for forearm thickness."],
    tips: [["Ellerimizi aşağı bakacak şekilde tut — overhand kavrama.", "Hold with palms facing down — overhand grip."], ["Dirsekleri sabit tut; sadece ön kol hareket etmeli.", "Keep elbows stationary; only the forearms should move."], ["Küçük ağırlıkla başla — bu kavramada daha az güç üretilir.", "Start with lighter weight — grip is generally weaker in this position."]]
  },
  "Triceps Pushdown": {
    gif: null,
    desc: ["Kablo makinesiyle triceps kasılma hareketi. Üç kafa kas grubu olan triceps'i izole eder. En yaygın triceps egzersizlerinden biridir.", "Cable triceps pushdown. Isolates the three-headed triceps muscle. One of the most common triceps exercises."],
    tips: [["Dirsekleri gövde yanında sabit tut; öne gelmemeli.", "Keep elbows locked at your sides throughout."], ["Hareketin altında tam uzat ve 1 sn sık.", "Fully extend at the bottom and hold for 1 second."], ["Halatta elleri biraz dışa aç — ekstra triceps aktivasyonu sağlar.", "With a rope, slightly flare hands apart at the bottom for extra activation."], ["Momentum kullanma; kontrolü her noktada koru.", "No swinging — maintain control at all points."]]
  },
  "Skull Crusher": {
    gif: null,
    desc: ["Yatarak barbell triceps uzatma. Triceps uzun başını (long head) en iyi çalıştıran hareketlerden biridir. Ciddi yüklenme yapılabilir.", "Lying triceps extension with barbell. One of the best exercises for the triceps long head. Can be loaded significantly."],
    tips: [["Barı alnın hizasına değil, başın biraz arkasına getir — uzun başı daha iyi çalıştırır.", "Lower bar slightly behind the forehead — better long head stretch."], ["Dirsekler yukarıya bakmalı — dışa açılmamalı.", "Keep elbows pointing toward ceiling — don't let them flare out."], ["EZ-bar düz bar'a göre bileği/dirseği daha az zorlar.", "EZ-bar reduces wrist/elbow discomfort compared to straight bar."]]
  },
  "Overhead Triceps Extension": {
    gif: null,
    desc: ["Baş üstü triceps uzatma. Triceps uzun başını tam gerilimde çalıştırır. Dumbbell, barbell veya kablo ile yapılabilir.", "Overhead triceps extension. Works the long head of triceps under full stretch. Can be done with dumbbell, barbell, or cable."],
    tips: [["Dirsekleri kulak yanında sabit tut — öne gelmemeli.", "Keep elbows by ears, pointing upward — don't let them drift forward."], ["Tam aşağı in — maksimum uzama bu hareketin temel avantajıdır.", "Lower fully — maximum stretch is the primary benefit of this movement."], ["Kablo versiyonu sürekli gerilim için tercih edilebilir.", "Cable version is preferred for constant tension throughout."]]
  },
  "Kickback": {
    gif: null,
    desc: ["Dumbbell ile triceps izolasyon hareketi. Öne eğilerek yapılır. Triceps'in medial ve lateral başlarını çalıştırır.", "Dumbbell triceps isolation done bent over. Works the medial and lateral heads of the triceps."],
    tips: [["Gövde yere paralel — yeterince öne eğil.", "Torso should be parallel to floor — lean forward enough."], ["Üst kol sabit ve omuz hizasında; sadece ön kol hareket eder.", "Upper arm stationary at shoulder height — only the forearm moves."], ["Üst noktada tam uzat ve güçlüce sık.", "Fully extend and squeeze hard at the top."]]
  },
  "Calf Raise": {
    gif: null,
    desc: ["Baldır kaslarını çalıştıran yükselme hareketi. Gastrocnemius ve soleus kaslarını hedef alır. Ayakta, makinede veya basamak kenarında yapılabilir.", "Calf raise targeting the calf muscles. Works gastrocnemius and soleus. Can be done standing, on a machine, or on a step edge."],
    tips: [["Tam yukarı yüksel ve alt noktada tam in — tam ROM kritik.", "Rise all the way up and stretch fully at the bottom — full ROM is critical."], ["Üst noktada 1-2 sn sık.", "Pause and squeeze at the top for 1-2 seconds."], ["Baldır kasları yüksek tekrara adapte olur; 15-25 rep iyi çalışır.", "Calves adapt quickly; higher reps (15-25) work well for them."]]
  },
  "Shrug": {
    gif: null,
    desc: ["Omuz silkme hareketi. Trapez kasının üst bölümünü (upper trapezius) çalıştırır. Barbell, dumbbell veya makinede yapılabilir.", "Shoulder shrug. Works the upper trapezius. Can be done with barbell, dumbbells, or machine."],
    tips: [["Boyun döndürme yok — sadece omuzları dikey olarak kaldır.", "No neck rolling — simply elevate the shoulders straight up."], ["Üst noktada 1-2 sn tut.", "Hold at the top for 1-2 seconds."], ["Ağır kullanabilirsin ama inişi her zaman kontrollü yap.", "Can go heavy but always lower with control."]]
  },
  "Plank": {
    gif: null,
    desc: ["İzometrik core stabilizasyon egzersizi. Karın kasları, sırt alt kısmı ve omuzları statik olarak çalıştırır. Temel bir core hareketi.", "Isometric core stabilization. Works the abdominals, lower back, and shoulders statically. A foundational core movement."],
    tips: [["Kalça ne çok düşmeli ne de yükselmelidir — baştan topuğa düz çizgi.", "Hips should neither sag nor pike — maintain a straight line from head to heels."], ["Nefesini tutma; karın kaslarını sıkarken normal nefes al.", "Don't hold breath; keep breathing normally while squeezing core."], ["Zamanı kademeli artır — 20-30 sn ile başla ve her hafta artır.", "Gradually increase duration — start at 20-30 sec and add each week."], ["Dirsek plank, bilek problemi olanlar için daha az stres yaratır.", "Forearm plank creates less wrist stress for those with wrist issues."]]
  },
  "Crunch": {
    gif: null,
    desc: ["Klasik karın kasılma hareketi. Rectus abdominis (altı paket kası) için temel izolasyon egzersizi.", "Classic abdominal crunch. Fundamental isolation exercise for the rectus abdominis (six-pack muscle)."],
    tips: [["Boyuna baskı yapma — elleri başın yanına koy, çeneyi göğse değdirme.", "Don't pull on the neck — hands beside head, chin not jammed to chest."], ["Küçük hareket yeterli — sadece omuz bıçakları yerden kalkmalı.", "Small movement is enough — just lift shoulder blades off the floor."], ["Nefesi kasılırken ver, inerken al.", "Exhale as you crunch up, inhale on the way down."]]
  },
  "Cable Crunch": {
    gif: null,
    desc: ["Diz çökerek kablo makinesiyle karın kasılma hareketi. Karına dirençli yük ekler. Rectus abdominis ve oblikler yüksek aktivasyonla çalışır.", "Kneeling cable crunch. Adds resistance to the abs. High activation for rectus abdominis and obliques."],
    tips: [["Hareket boyunca kalçaları topuklarda tut; sadece boynu eğme.", "Hinge from the hips toward heels throughout — don't just flex the neck."], ["Alt noktada nefes ver ve karını maksimum sık.", "Exhale at the bottom and squeeze abs maximally."], ["Halatı yüz yanında tut — yukarı sallanmasın.", "Hold the rope by your head — don't let it swing upward."]]
  },
  "Russian Twist": {
    gif: null,
    desc: ["Gövde rotasyonu egzersizi. Oblik kasları ve transversus abdominis kaslarını çalıştırır. Yan karın kaslarının gelişimi için idealdir.", "Torso rotation exercise. Works the obliques and transverse abdominis. Ideal for lateral core development."],
    tips: [["Bacakları yerde tutabilirsin; kaldırınca zorluk artar.", "Legs can be on the ground; raising them adds difficulty."], ["Her yana tam dön — kısmi rotasyon etkinliği düşürür.", "Rotate fully to each side — partial rotation reduces effectiveness."], ["Ağırlıklı yapıyorsan hafiften başla; bel stresi olabilir.", "Start light if weighted — can strain the lower back if too heavy."]]
  },
  "Mountain Climber": {
    gif: null,
    desc: ["Dinamik plank pozisyonundan diz çekme hareketi. Core, omuzlar ve kardiyo sistemini aynı anda çalıştırır. Yüksek yoğunluklu antrenmanlar için mükemmeldir.", "Dynamic knee drive from plank position. Works core, shoulders, and cardiovascular system simultaneously. Excellent for high-intensity training."],
    tips: [["Kalçayı sabit tut — yukarı veya aşağı hareket etmemeli.", "Keep hips level — don't let them rise or drop."], ["Eller omuz altında tam hizalı olsun.", "Make sure hands are directly below shoulders."], ["Hızlı yapınca kardiyo, yavaş yapınca core odaklı olur.", "Fast pace = cardio focus; slow pace = core focus."]]
  },
  "Burpee": {
    gif: null,
    desc: ["Tam vücut kardiyo ve kuvvet egzersizi. Squat, plank, şınav ve zıplamayı birleştirir. Kondisyon ve yağ yakımı için en etkili hareketlerden biridir.", "Full body cardio and strength exercise combining squat, plank, push-up, and jump. One of the most effective movements for conditioning and fat loss."],
    tips: [["Şınav tam olsun — sadece göğüs yere gelsin.", "Full push-up during the burpee — chest touches the floor."], ["Zıplamanın ardından tam yüksel; kolları yukarı kaldır.", "Jump fully at the top — reach arms overhead."], ["Nefes al → aşağı in → yukarı çık → ver ritmi önemli.", "Breathing rhythm: inhale on descent, exhale on ascent."]]
  },
  "Yürüyüş Bandı": {
    gif: null,
    desc: ["Koşu bandında yürüyüş veya koşu. En yaygın kardiyo egzersizlerinden biridir. Hız ve eğim ayarı ile zorluk kolayca değiştirilebilir.", "Treadmill walking or running. One of the most common cardio exercises. Difficulty easily adjustable via speed and incline settings."],
    tips: [["Eğim artırmak kalori yakımını önemli ölçüde artırabilir.", "Increasing incline can boost calorie burn significantly."], ["Yürüyüşte kollarını doğal salla — kenarlığa tutunma.", "If walking, let arms swing naturally — don't hold the side rails."], ["LISS (düşük yoğunluklu sabit hız) yağ yakımı için etkilidir.", "Low-intensity steady state (LISS) is effective for fat burning."]]
  },
  "Bisiklet": {
    gif: null,
    desc: ["Sabit veya dışarıda bisiklet sürmek. Dizlere az yük bindiren, güçlü bir kardiyo egzersizi. Quadriceps ve kalça kaslarını da çalıştırır.", "Stationary or outdoor cycling. A powerful cardio exercise with low impact on the knees. Also works quads and hip muscles."],
    tips: [["Oturma yüksekliğini ayarla — diz tam uzanmalı ama kilitlenmemeli.", "Adjust seat height so knee almost fully extends but doesn't lock."], ["Kadansı (devir/dk) yüksek tut, ağır vites kullanmak dizi yorar.", "Keep cadence high; heavy gearing puts extra stress on knees."], ["HIIT için interval çalışması kalorileri çok daha hızlı yakar.", "Interval training burns calories much faster than steady pace."]]
  },
  "Dead Hang": {
    gif: null,
    desc: ["Barfikse ağırlıkla asılı durmak. Kavrama gücünü, ön kol kaslarını ve omuz sağlığını geliştirir. Basit ama çok etkilidir.", "Hanging from a bar under load. Develops grip strength, forearm muscles, and shoulder health. Simple but very effective."],
    tips: [["Omuzları kulağa doğru çöktürme — omuzlar aktif ve aşağıda kalmalı.", "Don't let shoulders shrug to ears — keep them active and depressed."], ["Ön kol kaslarını kasarak tut; pasif sarkmak yerine aktif asıl.", "Actively engage forearms; active hanging is better than passive sagging."], ["Süreyi kademeli artır — 20-30 sn'den başla.", "Gradually increase duration — start at 20-30 seconds."]]
  },
  "Wrist Curls": {
    gif: null,
    desc: ["Bilek bükme hareketi. Ön kolun fleksör kaslarını çalıştırır. Kavrama gücü ve ön kol dengesi için kullanılır.", "Wrist curling movement. Works the flexor muscles of the forearm. Used for grip strength and forearm balance."],
    tips: [["Hafif ağırlıkla başla; bu kaslar küçük ve kolay yaralanabilir.", "Start light; these are small muscles that fatigue and injure easily."], ["Hareketi tam yapın; bilek yukarı ve aşağı tam gidebilmeli.", "Use full range of motion; wrist should flex and extend fully."], ["Ön kolu banka üstüne koy — sadece bilek hareket etmeli.", "Rest forearm on a bench — only the wrist should move."]]
  },
  "Wrist Extensions": {
    gif: null,
    desc: ["Bilek uzatma hareketi. Ön kolun ekstansör kaslarını çalıştırır. Bilek dengesi ve dirsek sağlığı için önemlidir.", "Wrist extension movement. Works the extensor muscles of the forearm. Important for wrist balance and elbow health."],
    tips: [["Fleksörlerden daha zayıf olan ekstansörler için hafif ağırlık kullan.", "Use lighter weight — extensors are generally weaker than flexors."], ["Aşırı yükleme 'tenis dirseği' (lateral epikondilitis) riskini artırır.", "Overloading increases risk of lateral epicondylitis (tennis elbow)."], ["Rehabilitasyon veya önleyici olarak düzenli çalıştır.", "Train regularly as rehabilitation or preventive care."]]
  },
  "Jumping Jack": {
    gif: null,
    desc: ["Zıplayarak kol-bacak açma kapama. Klasik kardiyo ısınma hareketi. Tüm vücut koordinasyonunu ve kardiyovasküler sistemi aktive eder.", "Jump with simultaneous arm and leg opening/closing. Classic cardio warm-up movement. Activates whole-body coordination and cardiovascular system."],
    tips: [["Yumuşak yüzey tercih et veya ayakkabı giy — eklemler için iyidir.", "Prefer a soft surface or wear shoes — gentler on the joints."], ["Her zıplamada topuk yere değmesin; ayak parmakları üzerine in.", "Land on the balls of your feet, not flat-footed."], ["Kardiyovasküler ısınma olarak 2-3 dakika yeterlidir.", "2-3 minutes is sufficient as a cardiovascular warm-up."]]
  },
  "Chest Press": {
    gif: null,
    desc: ["Makinede göğüs press. Sabit hareket yolu ve destekli pozisyon sayesinde güvenlidir. Başlangıç seviyesi için ideal bir göğüs egzersizi.", "Machine chest press. Safe due to its fixed movement path and supported position. Ideal chest exercise for beginners."],
    tips: [["Koltuk ve sırtlık yüksekliğini ayarla — kollar omuz hizasında başlamalı.", "Adjust seat and back pad — arms should start at shoulder height."], ["Kontrollü geri çekil — makinenin ağırlığını aniden bırakma.", "Return slowly — don't let the machine's weight snap back."], ["Hareketin başında ve sonunda göğsü kasılı hissetmeye çalış.", "Focus on feeling the chest squeeze at the start and end of each rep."]]
  }
};
