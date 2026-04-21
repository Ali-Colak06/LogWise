// LogWise — Hazır Hareket (Preset Exercise) Listesi
// 55 hareket; her biri için slug `id` (İngilizce kebab-case), Türkçe ad (name),
// opsiyonel İngilizce ad (nameEN) ve ait olduğu kategori(ler).
// Kategori isimleri Türkçe kalıyor (CAT_LABELS_EN ile çevriliyor).
// Kategoriler: Göğüs, Omuz, Triceps, Biceps, Bilek, Sırt, Bacak, Kalça, Kalf, Trapez, Karın, Kardiyo
//
// id KURALI (Faz EX-ID):
//   - İngilizce ad varsa ondan türet, yoksa name'den (zaten çoğu İng.)
//   - kebab-case, sadece [a-z0-9-] karakterler
//   - Türkçe karakter: İ→i, ş→s, ü→u, ç→c, ğ→g, ı→i, ö→o
//   - id'ler GLOBAL OLARAK BENZERSİZ olmalı (ex-descriptions.js ve ex-preview.js key'i olarak kullanılıyor)
window.LOGWISE_PRESET_EXERCISES = [{
  id: "chest-press",
  name: "Chest Press",
  categories: ["Göğüs"]
}, {
  id: "chest-fly",
  name: "Chest Fly",
  categories: ["Göğüs"]
}, {
  id: "dumbell-press",
  name: "Dumbell Press",
  categories: ["Göğüs"]
}, {
  id: "incline-dumbell-press",
  name: "İncline Dumbell Press",
  nameEN: "Incline Dumbell Press",
  categories: ["Göğüs"]
}, {
  id: "dumbell-fly",
  name: "Dumbell Fly",
  categories: ["Göğüs"]
}, {
  id: "incline-dumbell-fly",
  name: "Incline Dumbell Fly",
  categories: ["Göğüs"]
}, {
  id: "bench-press",
  name: "Bench Press",
  categories: ["Göğüs"]
}, {
  id: "incline-bench-press",
  name: "İncline Bench Press",
  nameEN: "Incline Bench Press",
  categories: ["Göğüs"]
}, {
  id: "close-grip-bench-press",
  name: "Close-Grip Bench Press",
  categories: ["Göğüs", "Triceps"]
}, {
  id: "cable-crossover",
  name: "Cable Crossover",
  categories: ["Göğüs"]
}, {
  id: "pec-deck",
  name: "Pec Deck",
  categories: ["Göğüs"]
}, {
  id: "overhead-press",
  name: "Overhead Press",
  categories: ["Omuz"]
}, {
  id: "shoulder-press",
  name: "Shoulder Press",
  categories: ["Omuz"]
}, {
  id: "machine-shoulder-press",
  name: "Machine Shoulder Press",
  categories: ["Omuz"]
}, {
  id: "arnold-press",
  name: "Arnold Press",
  categories: ["Omuz"]
}, {
  id: "lateral-raise",
  name: "Lateral Raise",
  categories: ["Omuz"]
}, {
  id: "cable-lateral-raise",
  name: "Cable Lateral Raise",
  categories: ["Omuz"]
}, {
  id: "front-raise",
  name: "Front Raise",
  categories: ["Omuz"]
}, {
  id: "rear-delt-fly",
  name: "Rear Delt Fly",
  categories: ["Omuz"]
}, {
  id: "face-pull",
  name: "Face Pull",
  categories: ["Omuz", "Trapez"]
}, {
  id: "upright-row",
  name: "Upright Row",
  categories: ["Omuz", "Trapez"]
}, {
  id: "push-up",
  name: "Şınav",
  nameEN: "Push Up",
  categories: ["Göğüs", "Omuz", "Triceps"]
}, {
  id: "pike-push-up",
  name: "Pike Push Up",
  categories: ["Omuz", "Triceps"]
}, {
  id: "dips",
  name: "Dips",
  categories: ["Göğüs", "Omuz", "Triceps"]
}, {
  id: "triceps-pushdown",
  name: "Triceps Pushdown",
  categories: ["Triceps"]
}, {
  id: "kickback",
  name: "Kickback",
  categories: ["Triceps"]
}, {
  id: "overhead-triceps-extension",
  name: "Overhead Triceps Extension",
  categories: ["Triceps"]
}, {
  id: "skull-crusher",
  name: "Skull Crusher",
  categories: ["Triceps"]
}, {
  id: "biceps-curl",
  name: "Biceps Curl",
  categories: ["Biceps"]
}, {
  id: "hammer-curl",
  name: "Hammer Curl",
  categories: ["Biceps"]
}, {
  id: "one-arm-cable-curl",
  name: "One Arm Cable Curl",
  categories: ["Biceps"]
}, {
  id: "preacher-curl",
  name: "Preacher Curl",
  categories: ["Biceps"]
}, {
  id: "reverse-curl",
  name: "Reverse Curl",
  categories: ["Biceps", "Bilek"]
}, {
  id: "dead-hang",
  name: "Dead Hang",
  categories: ["Bilek"]
}, {
  id: "farmer-carry",
  name: "Farmer Carry",
  categories: ["Bilek", "Trapez", "Karın"]
}, {
  id: "wrist-extensions",
  name: "Wrist Extensions",
  categories: ["Bilek"]
}, {
  id: "wrist-curls",
  name: "Wrist Curls",
  categories: ["Bilek"]
}, {
  id: "lat-pulldown",
  name: "Lat Pulldown",
  categories: ["Sırt", "Biceps"]
}, {
  id: "straight-arm-pulldown",
  name: "Straight Arm Pulldown",
  categories: ["Sırt"]
}, {
  id: "pull-up",
  name: "Pull Up",
  categories: ["Sırt", "Biceps"]
}, {
  id: "chin-up",
  name: "Chin Up",
  categories: ["Sırt", "Biceps"]
}, {
  id: "assisted-pull-up",
  name: "Assisted Pull Up",
  categories: ["Sırt", "Biceps"]
}, {
  id: "dumbell-row",
  name: "Dumbell Row",
  categories: ["Sırt", "Biceps"]
}, {
  id: "cable-row",
  name: "Cable Row",
  categories: ["Sırt", "Biceps"]
}, {
  id: "machine-row",
  name: "Machine Row",
  categories: ["Sırt", "Biceps"]
}, {
  id: "single-arm-row-machine",
  name: "Single Arm Row Machine",
  categories: ["Sırt", "Biceps"]
}, {
  id: "barbell-row",
  name: "Barbell Row",
  categories: ["Sırt", "Biceps"]
}, {
  id: "t-bar-row",
  name: "T-Bar Row",
  categories: ["Sırt", "Biceps"]
}, {
  id: "pullover",
  name: "Pullover",
  categories: ["Sırt", "Biceps"]
}, {
  id: "deadlift",
  name: "Deadlift",
  categories: ["Sırt", "Bacak", "Kalça"]
}, {
  id: "romanian-deadlift",
  name: "Romanian Deadlift",
  categories: ["Bacak", "Kalça"]
}, {
  id: "squat",
  name: "Squat",
  categories: ["Bacak", "Kalça"]
}, {
  id: "goblet-squat",
  name: "Goblet Squat",
  categories: ["Bacak", "Kalça"]
}, {
  id: "hack-squat",
  name: "Hack Squat",
  categories: ["Bacak"]
}, {
  id: "smith-machine-squat",
  name: "Smith Machine Squat",
  categories: ["Bacak", "Kalça"]
}, {
  id: "leg-press",
  name: "Leg Press",
  categories: ["Bacak", "Kalça"]
}, {
  id: "lunge",
  name: "Lunge",
  categories: ["Bacak", "Kalça"]
}, {
  id: "walking-lunge",
  name: "Walking Lunge",
  categories: ["Bacak", "Kalça"]
}, {
  id: "bulgarian-split-squat",
  name: "Bulgarian Split Squat",
  categories: ["Bacak", "Kalça"]
}, {
  id: "step-up",
  name: "Step Up",
  categories: ["Bacak", "Kalça"]
}, {
  id: "leg-curl",
  name: "Leg Curl",
  categories: ["Bacak"]
}, {
  id: "seated-leg-curl",
  name: "Seated Leg Curl",
  categories: ["Bacak"]
}, {
  id: "leg-extension",
  name: "Leg Extension",
  categories: ["Bacak"]
}, {
  id: "calf-raise",
  name: "Calf Raise",
  categories: ["Kalf"]
}, {
  id: "seated-calf-raise",
  name: "Seated Calf Raise",
  categories: ["Kalf"]
}, {
  id: "shrug",
  name: "Shrug",
  categories: ["Trapez"]
}, {
  id: "hip-thrust",
  name: "Hip Thrust",
  categories: ["Kalça"]
}, {
  id: "glute-bridge",
  name: "Glute Bridge",
  categories: ["Kalça"]
}, {
  id: "glute-kickback",
  name: "Glute Kickback",
  categories: ["Kalça"]
}, {
  id: "cable-kickback",
  name: "Cable Kickback",
  categories: ["Kalça"]
}, {
  id: "hip-abduction-machine",
  name: "Hip Abduction Machine",
  categories: ["Kalça"]
}, {
  id: "back-extension",
  name: "Back Extension",
  categories: ["Sırt", "Kalça"]
}, {
  id: "plank",
  name: "Plank",
  categories: ["Karın"]
}, {
  id: "side-plank",
  name: "Side Plank",
  categories: ["Karın"]
}, {
  id: "crunch",
  name: "Crunch",
  categories: ["Karın"]
}, {
  id: "cable-crunch",
  name: "Cable Crunch",
  categories: ["Karın"]
}, {
  id: "ab-wheel",
  name: "Ab Wheel",
  categories: ["Karın"]
}, {
  id: "russian-twist",
  name: "Russian Twist",
  categories: ["Karın"]
}, {
  id: "cable-woodchopper",
  name: "Cable Woodchopper",
  categories: ["Karın"]
}, {
  id: "hanging-leg-raise",
  name: "Hanging Leg Raise",
  categories: ["Karın"]
}, {
  id: "mountain-climber",
  name: "Mountain Climber",
  categories: ["Karın", "Kardiyo"]
}, {
  id: "burpee",
  name: "Burpee",
  categories: ["Kardiyo"]
}, {
  id: "jumping-jack",
  name: "Jumping Jack",
  categories: ["Kardiyo"]
}, {
  id: "treadmill",
  name: "Yürüyüş Bandı",
  nameEN: "Treadmill",
  categories: ["Kardiyo"]
}, {
  id: "cycling",
  name: "Bisiklet",
  nameEN: "Cycling",
  categories: ["Kardiyo"]
}, {
  id: "stair-climber",
  name: "Stair Climber",
  categories: ["Kardiyo"]
}, {
  id: "rowing-machine",
  name: "Rowing Machine",
  categories: ["Kardiyo"]
}, {
  id: "superman",
  name: "Superman",
  categories: ["Sırt"]
}, {
  id: "moonwalk",
  name: "Ay Yürüyüşü",
  nameEN: "Moonwalk",
  categories: ["Kardiyo"]
}];
