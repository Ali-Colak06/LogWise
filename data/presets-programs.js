// LogWise — Hazır Program Şablonları
// Her program: {name, nameEN, desc, descEN, days: {"0"-"6": [hareketId, ...]}}
// Günler: 0=Pzt, 1=Sal, 2=Çar, 3=Per, 4=Cum, 5=Cmt, 6=Paz
//
// NOT (Faz EX-ID): days dizilerindeki stringler artık hareket ADI değil, hareket ID'si (slug).
// Örn. ["bench-press", "squat"] — karşılıkları LOGWISE_PRESET_EXERCISES içinde id ile bulunur.
// Yeni program eklerken ID kullan; isim istenen yerde helper ile çözülür.
window.LOGWISE_PRESET_PROGRAMS = [{
  name: "Push Pull Legs (PPL)",
  nameEN: "Push Pull Legs (PPL)",
  desc: "Haftada 6 gün, push/pull/legs döngüsü. Orta-ileri seviye.",
  descEN: "6 days/week push/pull/legs. Intermediate-advanced.",
  days: {
    "0": ["bench-press", "overhead-press", "lateral-raise", "triceps-pushdown", "cable-crossover"],
    "1": ["barbell-row", "lat-pulldown", "cable-row", "biceps-curl", "rear-delt-fly"],
    "2": ["squat", "leg-press", "leg-curl", "leg-extension", "calf-raise"],
    "3": ["dumbell-press", "shoulder-press", "dumbell-fly", "overhead-triceps-extension"],
    "4": ["deadlift", "pull-up", "dumbell-row", "hammer-curl", "shrug"],
    "5": ["leg-press", "lunge", "hip-thrust", "leg-curl", "calf-raise"],
    "6": []
  }
}, {
  name: "Üst / Alt Bölünme",
  nameEN: "Upper / Lower Split",
  desc: "Haftada 4 gün, üst ve alt vücut dönüşümlü. Orta seviye.",
  descEN: "4 days/week upper/lower alternating. Intermediate.",
  days: {
    "0": ["bench-press", "barbell-row", "overhead-press", "biceps-curl", "triceps-pushdown"],
    "1": ["squat", "deadlift", "leg-press", "leg-curl", "calf-raise"],
    "2": [],
    "3": ["dumbell-press", "lat-pulldown", "lateral-raise", "hammer-curl", "skull-crusher"],
    "4": ["leg-press", "lunge", "hip-thrust", "leg-extension", "calf-raise"],
    "5": [],
    "6": []
  }
}, {
  name: "Full Body",
  nameEN: "Full Body",
  desc: "Haftada 3 gün, tüm vücut. Yeni başlayanlar için ideal.",
  descEN: "3 days/week full body. Ideal for beginners.",
  days: {
    "0": ["bench-press", "barbell-row", "squat", "overhead-press", "biceps-curl"],
    "1": [],
    "2": ["deadlift", "dumbell-press", "lat-pulldown", "leg-press", "triceps-pushdown"],
    "3": [],
    "4": ["squat", "cable-row", "shoulder-press", "leg-curl", "hammer-curl"],
    "5": [],
    "6": []
  }
}, {
  name: "Bro Split (5 Gün)",
  nameEN: "Bro Split (5 Days)",
  desc: "Her gün farklı kas grubu. Klasik bölünme.",
  descEN: "Each day different muscle group. Classic split.",
  days: {
    "0": ["bench-press", "incline-dumbell-press", "cable-crossover", "dumbell-fly"],
    "1": ["barbell-row", "lat-pulldown", "cable-row", "dumbell-row", "shrug"],
    "2": ["overhead-press", "lateral-raise", "front-raise", "rear-delt-fly"],
    "3": ["biceps-curl", "hammer-curl", "preacher-curl", "triceps-pushdown", "skull-crusher"],
    "4": ["squat", "leg-press", "leg-curl", "leg-extension", "calf-raise"],
    "5": [],
    "6": []
  }
}];
