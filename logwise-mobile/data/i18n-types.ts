/**
 * LogWise Mobile — Translation type contract
 *
 * `Translations` interface = TR + EN sözlüklerinin **birebir aynı şekli** olması
 * gerektiğini derleme zamanında zorlar. Bir dile anahtar eklemeyi unutursan
 * `tsc` derleme hatası verir.
 *
 * Yeni anahtar eklerken sıra:
 *   1) Bu dosyaya alanı ekle (tip)
 *   2) `i18n-tr.ts` ve `i18n-en.ts` her ikisine değer ekle (yoksa derleme patlar)
 *
 * Dot-path key tip-safety'yi `lib/i18n.ts` üzerindeki `TranslationKey` union'ı sağlar.
 */

export interface Translations {
  common: {
    save: string;
    saved: string;
    cancel: string;
    close: string;
    search: string;
    more: string;
    times: string;
  };
  nav: {
    calendar: string;
    exercises: string;
    programs: string;
    feedback: string;
    dashboard: string;
    social: string;
    today: string;
    month: string;
    week: string;
    history: string;
    library: string;               // ADIM 6: bottom tab (TR Kütüphane)
    more: string;                  // ADIM 6
  };
  auth: {
    login: string;
    register: string;
    logout: string;
    email: string;
    password: string;
    fullname: string;
    username: string;                 // "Username" / "Kullanıcı adı"
    confirmPw: string;
    noAccount: string;
    hasAccount: string;
    // ADIM 4 — A1-A5 ekranları
    tagline: string;                  // A1 Welcome subhead: "Train smart. Log smarter."
    subheadLogin: string;             // A2 Login subhead: "Sign in to continue"
    subheadRegister: string;          // A3 Register subhead: "Create your account"
    submitLogin: string;              // CTA "Sign in"
    submitRegister: string;           // CTA "Create account"
    submittingLogin: string;          // loading "Giriş yapılıyor..."
    submittingRegister: string;       // loading "Hesap oluşturuluyor..."
    forgotPasswordQ: string;          // "Forgot password?" link
    legal: string;                    // "By continuing you agree to Terms & Privacy"
    // A4 Forgot Password
    forgotTitle: string;              // "Reset your password"
    forgotSubtitle: string;           // "Enter the email on your account..."
    forgotSubmit: string;             // "Send reset link"
    forgotSent: string;               // "We sent an email to {email}"
    forgotTip: string;                // "Check spam folder if it doesn't arrive..."
    backToLogin: string;              // "Back to sign in"
    // A5 Verify
    verifyTitle: string;              // "Check your email"
    verifySubtitle: string;           // "We sent a verification link..."
    verifyContinue: string;           // "Email confirmation MVP'de kapali, Calendar'a git"
    goToCalendar: string;
    verifyEmailSent: string;          // toast: kayit sonrasi "dogrulama maili gonderildi"
    verifyAfterConfirm: string;       // "Onayladiktan sonra giris yapabilirsin"
    verifyResend: string;             // "Yeniden gonder"
    verifyResent: string;             // toast: "dogrulama maili tekrar gonderildi"
    verifySpamTip: string;            // "spam/gereksiz klasorunu kontrol et" ipucu
    // Error messages
    errInvalidCredentials: string;    // "Email or password is wrong"
    errEmailTaken: string;            // "This email is already in use. Sign in."
    errWeakPassword: string;          // "Password is too weak (min 8 chars)"
    errNetwork: string;               // "Connection issue. Try again."
    errRateLimit: string;             // "Too many attempts. Wait a few minutes."
    errInvalidEmail: string;          // "Please enter a valid email"
    errPasswordsMismatch: string;     // "Passwords don't match"
    errFullnameTooShort: string;      // "Name must be at least 2 characters"
    errEmailRequired: string;         // "Email is required"
    errPasswordRequired: string;      // "Password is required"
    errUsernameRequired: string;      // "Username is required"
    errUsernameInvalid: string;       // "3-20 chars: letters, numbers and _"
    errUsernameTaken: string;         // "This username is taken"
    // Toasts
    welcomeBack: string;              // "Welcome back!" / "Tekrar hosgeldin!"
    accountCreated: string;           // "Account created — welcome!"
    resetEmailSent: string;           // "Reset email sent"
    loggedOut: string;                // "Logged out"
  };
  guest: {
    label: string;
    warn: string;
    loginCta: string;
    // ADIM 4 — A1 Welcome
    continueAsGuest: string;          // "Continue as Guest"
    guestNote: string;                // "Misafir verisi yalnizca bu cihazda saklanir."
  };
  exercise: {
    add: string;
    new: string;
    name: string;
    search: string;
    none: string;
    notFound: string;
    edit: string;
    custom: string;
    preset: string;
    addSelected: string;
    allCategories: string;
    alreadyAdded: string;
    presetDesc: string;
    confirmDelete: string;
    editSuccess: string;
    desc: string;
    note: string;
    noDescAvail: string;
    showDesc: string;
    lastSession: string;
    firstSession: string;
    previewBtn: string;
    previewDesc: string;
    previewTips: string;
    previewNoContent: string;
    previewImgSoon: string;
  };
  set: {
    add: string;
    label: string;
    kg: string;
    reps: string;
    rir: string;
    type: string;
    warmup: string;
    working: string;
    drop: string;
    superset: string;
    prev: string;
  };
  workout: {
    duration: string;
    durationMinutes: string;
    hourShort: string;
    minuteShort: string;
    backToCalendar: string;
    todayLabel: string;
    noWorkoutsYet: string;
    dayNote: string;
    notesSaved: string;
    moveUp: string;
    moveDown: string;
  };
  program: {
    exercises: string;
    new: string;
    name: string;
    edit: string;
    active: string;
    activate: string;
    deactivate: string;
    activeProgram: string;
    confirmDelete: string;
    create: string;
    weekly: string;
    daily: string;
    dailyPlural: string;
    addDaily: string;
    selectDaily: string;
    noneDaily: string;
    type: string;
    dailyExercises: string;
    createDaily: string;
    presetTitle: string;
    addPreset: string;
    presetDesc: string;
    week: string;
    compliance: string;
    activeSince: string;
    deload: string;
    deloadWeek: string;
    cycleType: string;
    cycleNone: string;
    cycleDeload: string;
    deloadEvery: string;
    everyNWeeks: string;
    added: string;
    missingExAdded: string;
    confirmOverwrite: string;
    progress: string;
    weekNum: string;
    complianceRate: string;
  };
  offDay: {
    label: string;
    set: string;
    remove: string;
    banner: string;
  };
  history: {
    pr: string;
    maxKg: string;
    volume: string;
    none: string;
  };
  dash: {
    totalWorkouts: string;
    totalSets: string;
    totalVolume: string;
    streak: string;
    streakDays: string;
    thisWeek: string;
    thisMonth: string;
    prs: string;
    noPRs: string;
    muscleFreq: string;
    weekly: string;
    monthly: string;
    progress: string;
    selectEx: string;
    weight: string;
    volPerSet: string;
    est1RM: string;
    noData: string;
    bestSet: string;
    avgWeight: string;
    sessions: string;
    exProgress: string;
    overview: string;
    frequency: string;
    est1RMLabel: string;
    brzycki1RM: string;
    weekLabel: string;
    workoutDays: string;
  };
  rest: {
    timer: string;
    start: string;
    skip: string;
    done: string;
    autoStart: string;
  };
  timer: {
    label: string;
    start: string;
    stop: string;
    reset: string;
    save: string;
    saved: string;
    total: string;
  };
  superset: {
    label: string;
    giant: string;
    addTo: string;
    remove: string;
  };
  feedback: {
    title: string;
    msg: string;
    bug: string;
    feature: string;
    general: string;
    other: string;
    category: string;
    rating: string;
    submit: string;
    sent: string;
    prev: string;
    none: string;
  };
  data: {
    management: string;
    exportJSON: string;
    exportCSV: string;
    importJSON: string;
    importSuccess: string;
    importError: string;
    exportSuccess: string;
    confirmImport: string;
    tab: string;
    measureTab: string;
  };
  measure: {
    title: string;
    add: string;
    weight: string;
    height: string;
    bodyFat: string;
    chest: string;
    waist: string;
    hips: string;
    bicepL: string;
    bicepR: string;
    thighL: string;
    thighR: string;
    neck: string;
    shoulders: string;
    none: string;
    saved: string;
    delete: string;
  };
  badge: {
    title: string;
    unlocked: string;
    none: string;
    earned: string;
    progress: string;
    locked: string;
    all: string;
    recent: string;
    next: string;
  };
  notif: {
    enable: string;
    enabled: string;
    denied: string;
    workoutToday: string;
    reminder: string;
    noPermission: string;
  };
  aria: {
    menu: string;
    prevMonth: string;
    nextMonth: string;
    toggleTheme: string;
    addExercise: string;
    closeModal: string;
    navigation: string;
    mainContent: string;
  };
  share: {
    workout: string;
    caption: string;
    success: string;
    noData: string;
  };
  social: {
    leaderboard: string;
    feed: string;
    selectExForLb: string;
    noLeaderboardData: string;
    rank: string;
    user: string;
    searchUsers: string;
    noUsersFound: string;
    viewProfile: string;
    noFeedData: string;
    followSuggestion: string;
    shared: string;
    communityPRs: string;
  };
  username: {
    label: string;
    placeholder: string;
    required: string;
    taken: string;
    invalid: string;
    choose: string;
    saved: string;
  };
  onboard: {
    welcome: string;
    step1: string;
    step2: string;
    step3: string;
    start: string;
    skip: string;
  };
  refresh: {
    pull: string;
    releasing: string;
    refreshing: string;
  };
  unit: {
    kg: string;
  };
  comments: {
    title: string;
    none: string;
    loading: string;
    addPlaceholder: string;
    replyPlaceholder: string;
    post: string;
    reply: string;
    edit: string;
    delete: string;
    edited: string;
    save: string;
    cancel: string;
    like: string;
    showReplies: string;
    hideReplies: string;
    deleteConfirm: string;
    loginRequired: string;
    tooLong: string;
  };
  // ADIM 5 — Calendar B1 / Day Detail C1 / Web welcome / Migration
  calendar: {
    monthTitle: string;            // app bar title format helper (locale-aware)
    weekRangeLabel: string;        // helper, format dynamic
    today: string;                 // pill label
    hintTitle: string;             // empty hint kart başlık
    hintDesc: string;              // empty hint 1-satır açıklama
    hintCtaOpenToday: string;      // [Bugünü Aç]
    hintCtaChoosePreset: string;   // [Program Seç]
    weekNumber: string;            // "Hf %d"
    weekDaysAbbr: string;          // "gün" / "days" — hafta header stats
    weekExAbbr: string;            // "egz" / "ex" — hafta header stats
    presetModalTitle: string;      // "Hazır Program Seç"
    presetModalSubtitle: string;
    presetCtaStart: string;        // "Bu Programı Başlat"
    presetCtaLater: string;        // "Daha sonra kendim ekleyeceğim"
    exShort: string;               // "hareket" / "ex" — week collapsed count
    setShort: string;              // "set" / "set" — week collapsed count
    startWorkout: string;          // "Antrenmana Başla" / "Start workout"
    timerPause: string;            // "Durdur" / "Pause"
    timerResume: string;           // "Devam" / "Resume"
    timerFinish: string;           // "Bitir" / "Finish"
    monthsShort: readonly [
      string, string, string, string, string, string,
      string, string, string, string, string, string,
    ];
  };
  day: {
    todayTag: string;              // "Bugün"
    statExercises: string;         // "Egzersiz"
    statSets: string;              // "Set"
    statVolume: string;            // "Hacim"
    emptyTitle: string;            // "Bu gün için henüz egzersiz yok"
    emptyDesc: string;             // "Bir hareket ekle veya hazır programdan başla."
    ctaAddExercise: string;        // "+ Egzersiz Ekle"
    ctaChoosePreset: string;       // "Hazır Program"
    back: string;                  // app bar back aria
    prevDay: string;               // ←
    nextDay: string;               // →
    workout: string;               // "Antrenman" / "Workout" — generic
    rest: string;                  // "Dinlenme" / "Rest"
    restDayShort: string;          // "Dinlenme günü" / "Rest day"
  };
  web: {
    welcomeTitle: string;          // "LogWise Mobile"
    welcomeBody1: string;          // 1. paragraf
    welcomeBody2: string;          // 2. paragraf
    welcomeOpenUrlLabel: string;   // "logwise.fit"
    welcomeCtaStart: string;       // "Mobil'e Başla"
    welcomeCtaOpenWeb: string;     // "Web'e Git"
    welcomeDontShowAgain: string;  // "Bu mesajı bir daha gösterme"
  };
  migration: {
    overlayTitle: string;          // "Verileriniz aktarılıyor..."
    overlaySubtitle: string;       // "Bu birkaç saniye sürebilir."
    overlayLong: string;           // 15s sonrası "İşlem biraz uzadı, lütfen bekleyin..."
    successToast: string;          // "{ex} egzersiz, {wk} antrenman aktarıldı" (templated)
    errorToast: string;            // "Aktarım hata aldı, tekrar denenebilir."
  };
  library: {
    title: string;                 // app bar başlık ("Workout")
    countExercises: string;        // "{n} hareket"  templated
    countPrograms: string;         // "{n} program"  templated
    segExercises: string;          // "Hareketler"
    segPrograms: string;           // "Programlar"
    newPill: string;               // "+ Yeni"
    searchPlaceholder: string;
    noResults: string;             // "Aramada sonuç yok"
    emptyExTitle: string;
    emptyExDesc: string;
    emptyExCta: string;            // "+ Yeni Özel"
    emptyPgTitle: string;
    emptyPgDesc: string;
    emptyPgChoosePreset: string;   // "Hazır Seç"
    emptyPgCreate: string;         // "+ Yeni Program"
    preview: string;
    edit: string;
    delete: string;
    presetReadonly: string;        // "Hazır hareket — düzenlenemez"
    customBadge: string;           // "(Özel)"
    presetBadge: string;           // "(Preset)"
    deleteExTitle: string;
    deleteExBody: string;          // "Geçmiş antrenmanların etkilenmez..."
    deletedToast: string;          // "{name} silindi"
    activeProgram: string;         // kicker "aktif program"
    otherPrograms: string;         // "Diğer programlar"
    otherCount: string;            // "{n} kayıtlı"  templated
    statCompliance: string;        // "Uyum"
    statStreak: string;            // "Seri"
    statNext: string;              // "Sıradaki"
    ctaTodayWorkout: string;       // "Bugünkü workout"
    ctaViewWeek: string;           // "Haftayı gör"
    activate: string;              // "Aktif Et"
    deactivate: string;            // "Pasifleştir"
    noActiveHint: string;
    newProgramTitle: string;       // "Yeni Program"
    programNameLabel: string;
    programNamePlaceholder: string;
    programDescLabel: string;
    save: string;
    cancel: string;
    activateConfirmTitle: string;  // "Aktif programı değiştir"
    activateConfirmBody: string;   // "{name} şu an aktif. Üzerine yazılsın mı?" templated
    deleteProgramTitle: string;
    deleteProgramBody: string;     // "Sil? Geçmiş antrenmanların etkilenmez."
    perDayExercises: string;       // "{n} hareket/gün" templated
    dayCount: string;              // "{n} gün" templated
    duplicateProgram: string;      // "{name} zaten ekli." templated (PRIORITY 0)
    cycleWeekly: string;
    cycleDeload: string;
    cycleNone: string;
  };
  programEdit: {
    titleNew: string;              // "Yeni Program"
    save: string;                  // app bar "Kaydet"
    nameLabel: string;
    descLabel: string;             // "Açıklama (opsiyonel)"
    cycleSettings: string;         // "Döngü Ayarları"
    cycleType: string;             // "Tip"
    deloadEvery: string;           // "Deload her N haftada"
    weekDays: string;              // "Haftanın Günleri"
    exerciseCount: string;         // "{n} hareket" templated
    offBadge: string;              // "Dinlenme"
    addExercise: string;           // "+ Egzersiz Ekle"
    makeOffDay: string;            // "Dinlenme günü yap"
    removeOffDay: string;          // "Off günü kaldır"
    offDayEmptyTitle: string;      // "Dinlenme Günü"
    offDayEmptyDesc: string;
    moveToDay: string;             // "Başka güne taşı"
    moveToDayTitle: string;        // "{name} hangi güne?" templated
    removeExercise: string;        // "Çıkar" (⋮ menü)
    discardedEmpty: string;        // "Boş program kaydedilmedi" (auto-delete toast)
    activateCta: string;           // "⚡ Programı Aktif Et"
    activeLabel: string;           // "✓ Aktif Program"
    activateDisabled: string;      // "Önce egzersiz ekle"
    deleteLink: string;            // "Programı Sil"
    offDayConfirmTitle: string;
    offDayConfirmBody: string;     // "{n} egzersiz var, çıkarılacak. Devam?" templated
    nameRequired: string;          // validation
    savingToast: string;           // "Kaydedildi"
    activatedToast: string;        // "{name} aktif edildi" templated
  };
  more: {
    guestTitle: string;            // "Misafir"
    guestSubtitle: string;         // "Veri bu cihazda"
    lang: string;                  // "Dil"
    theme: string;                 // "Tema"
    themeDark: string;             // "Koyu"
    themeLight: string;            // "Açık"
    rowProfile: string;
    rowSettings: string;
    rowData: string;
    rowFeedback: string;
    logout: string;                // "Çıkış Yap"
    register: string;              // "Hesap Aç"
    comingSoon: string;            // "Çok yakında!"
    logoutConfirmTitle: string;
    logoutConfirmBody: string;
  };
  placeholder: {
    dashboardTitle: string;
    dashboardDesc: string;
    socialTitle: string;
    socialDesc: string;
  };
  dayExtra: {
    addSet: string;                // "+ Set Ekle"
    colSet: string;                // "#"
    colType: string;               // "Tip"
    colKg: string;                 // "KG"
    colReps: string;               // "Tekrar"
    colRir: string;                // "RIR"
    typeWorking: string;
    typeWarmup: string;
    typeDrop: string;
    last: string;                  // "Son:"  prefix
    restDayTitle: string;          // "Dinlenme Günü"
    restDayBody: string;
    restDayAddAnyway: string;      // "Yine de egzersiz ekle"
    deleteCardTitle: string;
    deleteCardBody: string;
    deleteCardProgramTitle: string;  // program egz: "Sadece bugün mü, programdan mı?"
    deleteOnlyToday: string;       // "Sadece bugün"
    deleteFromProgram: string;     // "Programdan"
    setTypeTitle: string;          // bottom sheet başlık
    addExerciseTitle: string;      // "Egzersiz Ekle"
    tabLibrary: string;            // "Hareketler"
    tabNew: string;                // "Yeni Özel"
    catAll: string;                // "Tümü"
    newExName: string;             // "Egzersiz adı"
    newExCategory: string;         // "Kategori (opsiyonel)"
    newExNote: string;             // "Not (opsiyonel)"
    createAndAdd: string;          // "Oluştur & Ekle"
    libraryOnly: string;           // "Sadece kütüphaneme ekle"
    multiAddCta: string;           // "{n} hareket · Ekle" templated
    addedToast: string;            // "{n} hareket eklendi" templated
    alreadyExists: string;         // "Bu hareket bugün zaten var"
    reorderHandle: string;         // drag handle a11y — "Sırala / sürükle"
  };
  days: readonly [string, string, string, string, string, string, string];
  daysFull: readonly [string, string, string, string, string, string, string];
  months: readonly [
    string, string, string, string, string, string,
    string, string, string, string, string, string,
  ];
  cats: readonly [
    string, string, string, string, string,
    string, string, string, string,
  ];
}

export type Locale = 'tr' | 'en';
