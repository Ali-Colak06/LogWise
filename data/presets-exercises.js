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
  id: "bench-press",
  name: "Bench Press",
  categories: ["Göğüs"]
}, {
  id: "incline-bench-press",
  name: "İncline Bench Press",
  nameEN: "Incline Bench Press",
  categories: ["Göğüs"]
}, {
  id: "cable-crossover",
  name: "Cable Crossover",
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
  id: "lateral-raise",
  name: "Lateral Raise",
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
  id: "push-up",
  name: "Şınav",
  nameEN: "Push Up",
  categories: ["Göğüs", "Omuz", "Triceps"]
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
  id: "pull-up",
  name: "Pull Up",
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
  id: "squat",
  name: "Squat",
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
  id: "leg-curl",
  name: "Leg Curl",
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
  id: "plank",
  name: "Plank",
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
  id: "russian-twist",
  name: "Russian Twist",
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
  id: "moonwalk",
  name: "Ay Yürüyüşü",
  nameEN: "Moonwalk",
  categories: ["Kardiyo"]
}];
