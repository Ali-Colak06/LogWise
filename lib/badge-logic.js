// LogWise — Rozet Mantığı
// Rozet adı/kategori etiketleri, istatistik hesaplama, rozet açma/iptal mantığı.
// Bağımlılıklar (aynı sayfadaki başka script tag'inde tanımlı olmalı):
//   - window.LOGWISE_BADGES (data/badges.js)           — her zaman
//   - calcStreak(workouts)   — index.html inline scope — checkBadges/calcBadgeStats/getNextBadge için
//   - fmt(date)              — index.html inline scope — checkBadges için
// NOT: checkBadges/calcBadgeStats/getNextBadge yalnızca index.html tarafından çağrılır.
//       profile.html sadece getBadgeName ve getBadgeCatLabel kullanır (bu yüzden calcStreak/fmt'e ihtiyaç duymaz).
// Classic script tag'leri global lexical scope'u paylaşır; lib/badge-logic.js yüklendikten sonra
// inline script'te calcStreak/fmt tanımlansa bile, fonksiyonlar çağrıldığında bunlar erişilebilir olur.

window.LOGWISE_BADGE_LOGIC = (function () {
  const getBadgeName = (b, lang) => {
    if (b.cat === "workout" && b.val === 1) return lang === "tr" ? "İlk Antrenman" : "First Workout";
    if (b.cat === "workout") return lang === "tr" ? b.val + " Antrenman" : b.val + " Workouts";
    if (b.cat === "streak") return lang === "tr" ? b.val + " Gün Seri" : b.val + " Day Streak";
    if (b.cat === "pr") return b.val + "kg PR";
    if (b.cat === "volume") {
      const v = b.val >= 1e6 ? b.val / 1e6 + "M" : b.val >= 1e3 ? b.val / 1e3 + "K" : b.val;
      return lang === "tr" ? v + " Hacim" : v + " Volume";
    }
    if (b.cat === "sets") return b.val + " Set" + (lang === "en" ? "s" : "");
    if (b.cat === "variety") return lang === "tr" ? b.val + " Farklı Hareket" : b.val + " Exercises";
    return b.id;
  };

  const getBadgeCatLabel = (cat, lang) => {
    const m = {
      workout: ["Antrenman", "Workouts"],
      streak: ["Seri", "Streak"],
      pr: ["Ağırlık PR", "Weight PR"],
      volume: ["Hacim", "Volume"],
      sets: ["Setler", "Sets"],
      variety: ["Çeşitlilik", "Variety"]
    };
    return (m[cat] || [cat, cat])[lang === "tr" ? 0 : 1];
  };

  return {
    getBadgeName,
    getBadgeCatLabel
  };
})();
