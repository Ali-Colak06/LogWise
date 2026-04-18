// LogWise — Hazır Program Şablonları
// Her program: {name, nameEN, desc, descEN, days: {"0"-"6": [hareketAdi, ...]}}
// Günler: 0=Pzt, 1=Sal, 2=Çar, 3=Per, 4=Cum, 5=Cmt, 6=Paz
window.LOGWISE_PRESET_PROGRAMS = [{
  name: "Push Pull Legs (PPL)",
  nameEN: "Push Pull Legs (PPL)",
  desc: "Haftada 6 gün, push/pull/legs döngüsü. Orta-ileri seviye.",
  descEN: "6 days/week push/pull/legs. Intermediate-advanced.",
  days: {
    "0": ["Bench Press", "Overhead Press", "Lateral Raise", "Triceps Pushdown", "Cable Crossover"],
    "1": ["Barbell Row", "Lat Pulldown", "Cable Row", "Biceps Curl", "Rear Delt Fly"],
    "2": ["Squat", "Leg Press", "Leg Curl", "Leg Extension", "Calf Raise"],
    "3": ["Dumbell Press", "Shoulder Press", "Dumbell Fly", "Overhead Triceps Extension"],
    "4": ["Deadlift", "Pull Up", "Dumbell Row", "Hammer Curl", "Shrug"],
    "5": ["Leg Press", "Lunge", "Hip Thrust", "Leg Curl", "Calf Raise"],
    "6": []
  }
}, {
  name: "Üst / Alt Bölünme",
  nameEN: "Upper / Lower Split",
  desc: "Haftada 4 gün, üst ve alt vücut dönüşümlü. Orta seviye.",
  descEN: "4 days/week upper/lower alternating. Intermediate.",
  days: {
    "0": ["Bench Press", "Barbell Row", "Overhead Press", "Biceps Curl", "Triceps Pushdown"],
    "1": ["Squat", "Deadlift", "Leg Press", "Leg Curl", "Calf Raise"],
    "2": [],
    "3": ["Dumbell Press", "Lat Pulldown", "Lateral Raise", "Hammer Curl", "Skull Crusher"],
    "4": ["Leg Press", "Lunge", "Hip Thrust", "Leg Extension", "Calf Raise"],
    "5": [],
    "6": []
  }
}, {
  name: "Full Body",
  nameEN: "Full Body",
  desc: "Haftada 3 gün, tüm vücut. Yeni başlayanlar için ideal.",
  descEN: "3 days/week full body. Ideal for beginners.",
  days: {
    "0": ["Bench Press", "Barbell Row", "Squat", "Overhead Press", "Biceps Curl"],
    "1": [],
    "2": ["Deadlift", "Dumbell Press", "Lat Pulldown", "Leg Press", "Triceps Pushdown"],
    "3": [],
    "4": ["Squat", "Cable Row", "Shoulder Press", "Leg Curl", "Hammer Curl"],
    "5": [],
    "6": []
  }
}, {
  name: "Bro Split (5 Gün)",
  nameEN: "Bro Split (5 Days)",
  desc: "Her gün farklı kas grubu. Klasik bölünme.",
  descEN: "Each day different muscle group. Classic split.",
  days: {
    "0": ["Bench Press", "İncline Dumbell Press", "Cable Crossover", "Dumbell Fly"],
    "1": ["Barbell Row", "Lat Pulldown", "Cable Row", "Dumbell Row", "Shrug"],
    "2": ["Overhead Press", "Lateral Raise", "Front Raise", "Rear Delt Fly"],
    "3": ["Biceps Curl", "Hammer Curl", "Preacher Curl", "Triceps Pushdown", "Skull Crusher"],
    "4": ["Squat", "Leg Press", "Leg Curl", "Leg Extension", "Calf Raise"],
    "5": [],
    "6": []
  }
}];
