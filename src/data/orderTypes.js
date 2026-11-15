// Buyurtma turlari va Toshkent 3D Ustaxonasi konfiguratsiyalari

export const ORDER_TYPES = [
  {
    id: 'functional-part',
    title: 'Funktsional va Ehtiyot Qismlar',
    uzTitle: 'Ta’mirlash va Nostandart Qismlar',
    icon: '⚙️',
    badge: 'B2B Yuqori Talab',
    badgeColor: 'emerald',
    shortDesc: 'Singan shesternalar, kraniklar, kronshteynlar, uskunalar korpusi va avtomobil plastmassa detallari.',
    targetCustomer: 'Ta’mirlash ustaxonalari, maishiy texnika egalari, avtomobil egalari, sexlar',
    recommendedMaterial: 'PETG',
    defaultInfill: 60,
    defaultLayerHeight: 0.20,
    defaultQuantity: 1,
    typicalTurnaround: '24 Soat',
    basePriceUZS: 45000,
    modelPreset: 'gear',
    features: [
      'Singan jismoniy qism yoki o‘lchamlardan qayta chizma (revers-injiniring)',
      'PETG va Neylon orqali yuqori mustahkamlik va yeyilishga chidamlilik',
      'Muhandislik aniqligi: ±0.05 mm gacha bardoshlik',
      'Chet eldan qimmat va uzoq kutishga nisbatan 80% tejamkorlik'
    ],
    presets: [
      { name: 'Oshxona Kombayni Shesternasi', weightG: 32, timeHrs: 1.8, modelingFeeUZS: 50000 },
      { name: 'Konditsioner Jalyuzi Qisqichi', weightG: 12, timeHrs: 0.8, modelingFeeUZS: 30000 },
      { name: 'Og‘ir Yuk Kronshteyni (Devorga)', weightG: 75, timeHrs: 3.5, modelingFeeUZS: 40000 },
      { name: 'Uskunalar Regulyator Tutqichi (Knob)', weightG: 22, timeHrs: 1.2, modelingFeeUZS: 30000 }
    ]
  },
  {
    id: 'rapid-prototype',
    title: 'Tezkor Prototip va Muhandislik Korpuslari',
    uzTitle: 'Startaplar va Muhandislar Uchun',
    icon: '🚀',
    badge: 'Muhandislik va Startap',
    badgeColor: 'cyan',
    shortDesc: 'IoT korpuslari, elektronika qutilari, dron romlari va robototexnika qismlarini seriyadan oldin sinash.',
    targetCustomer: 'Apparat startaplari, muhandislar, mahsulot dizaynerlari, IoT dasturchilari',
    recommendedMaterial: 'PLA-TOUGH',
    defaultInfill: 30,
    defaultLayerHeight: 0.20,
    defaultQuantity: 1,
    typicalTurnaround: '24–48 Soat',
    basePriceUZS: 85000,
    modelPreset: 'drone-arm',
    features: [
      'Qimmat metall qoliplar yasatishdan oldin 24 soat ichida sinov prototipi',
      'Latun rezbali vtulka (heat-set insert) o‘rnatish imkoniyati',
      'Platalar (PCB) va qisqichli birikmalar (snap-fit) uchun mos',
      'Ergonomika va o‘lchamlarni minimal xarajat bilan tekshirish'
    ],
    presets: [
      { name: 'Dron (Kvadrkopter) Motor Yelkasi', weightG: 48, timeHrs: 2.5, modelingFeeUZS: 60000 },
      { name: 'Aqlli Uy Sensori Devor Qutisi', weightG: 65, timeHrs: 3.2, modelingFeeUZS: 80000 },
      { name: 'Qo‘l Diagnostika Qurilmasi Korpusi', weightG: 95, timeHrs: 4.5, modelingFeeUZS: 90000 },
      { name: 'DIN-Reyka Sanoat Rele Qutisi', weightG: 55, timeHrs: 2.8, modelingFeeUZS: 50000 }
    ]
  },
  {
    id: 'architectural-model',
    title: 'Arxitektura va Shaharsozlik Maketlari',
    uzTitle: 'Bino va Loyihalar Taqdimoti',
    icon: '🏛️',
    badge: 'Arxitektura va Qurilish',
    badgeColor: 'amber',
    shortDesc: 'Toshkent City turar-joy majmualari, zamonaviy villalar, master-reja va interyer masshtab maketlari.',
    targetCustomer: 'Arxitektorlar, qurilish kompaniyalari, dizaynerlar, shaharsozlar',
    recommendedMaterial: 'PLA-MATTE-WHITE',
    defaultInfill: 15,
    defaultLayerHeight: 0.16,
    defaultQuantity: 1,
    typicalTurnaround: '48–72 Soat',
    basePriceUZS: 250000,
    modelPreset: 'tower',
    features: [
      'Mukammal oppoq matoviy yuza va aniq fassad chiziqlari',
      '1:100, 1:200, 1:500 masshtabdagi modulli yig‘iluvchi qismlar',
      'Investorlar va shaharsozlik kengashi taqdimotlari uchun ideal',
      'Bambu printeridan katta ob’ektlar uchun ko‘p qismli yig‘ish'
    ],
    presets: [
      { name: 'Zamonaviy Osmono‘par Bino (1:200)', weightG: 210, timeHrs: 9.5, modelingFeeUZS: 150000 },
      { name: 'Shahar Tashqarisidagi Villa Maketi', weightG: 180, timeHrs: 8.0, modelingFeeUZS: 120000 },
      { name: 'Turar-Joy Kvartali Bosh Rejasi', weightG: 340, timeHrs: 14.0, modelingFeeUZS: 200000 },
      { name: 'Xonadon Rejasi va Interyer Kesimi', weightG: 130, timeHrs: 6.0, modelingFeeUZS: 100000 }
    ]
  },
  {
    id: 'educational-project',
    title: 'Talabalar va Ta’lim Loyihalari (ToshTech)',
    uzTitle: 'Robototexnika va Diplom Ishtirokchilari',
    icon: '🎓',
    badge: '20% Talabalar Chegirmasi',
    badgeColor: 'purple',
    shortDesc: 'Robot klublari shassisi, diplom va kurs ishlari detallari, anatomik va ilmiy o‘quv maketlari.',
    targetCustomer: 'ToshTech, TATU, Turin, Inha, Vestminster talabalari va to‘garaklar',
    recommendedMaterial: 'PLA',
    defaultInfill: 25,
    defaultLayerHeight: 0.20,
    defaultQuantity: 1,
    typicalTurnaround: '24 Soat',
    basePriceUZS: 35000,
    modelPreset: 'gripper',
    features: [
      'Talaba guvohnomasi bilan barcha buyurtmalarga 20% chegirma',
      'Xakatonlar va diplom topshirish muddatlarida tezkor navbat',
      '3D chop etish uchun chizmani bepul optimallashtirish bo‘yicha maslahat',
      'Universitet laboratoriyalari uchun paketli narxlar'
    ],
    presets: [
      { name: '2-Barmoqli Robot Tutqichi (Servo Gripper)', weightG: 45, timeHrs: 2.2, modelingFeeUZS: 30000 },
      { name: 'Formula Student Aerodinamik Qanotchasi', weightG: 60, timeHrs: 3.0, modelingFeeUZS: 40000 },
      { name: 'Ko‘rgazmali Reduktor Mexanizmi', weightG: 90, timeHrs: 4.2, modelingFeeUZS: 50000 },
      { name: 'Biomeditsina Yurak Anatomik Maketi', weightG: 70, timeHrs: 3.8, modelingFeeUZS: 40000 }
    ]
  },
  {
    id: 'custom-merch',
    title: 'Esdalik Sovg‘alari, Art va Merch',
    uzTitle: 'Shaxsiy Buyurtmalar va Korporativ Sovg‘a',
    icon: '🎨',
    badge: 'Ijodiy va Chakana',
    badgeColor: 'pink',
    shortDesc: 'Stol aksessuarlari, anime figuralari, kompaniya logotipli breloklar, litofaniya fotosuratli tungi chiroqlar.',
    targetCustomer: 'Aholisi, brendlar, sovg‘a izlovchilar, Instagram va Telegram xaridorlari',
    recommendedMaterial: 'PLA-SILK-GOLD',
    defaultInfill: 20,
    defaultLayerHeight: 0.16,
    defaultQuantity: 1,
    typicalTurnaround: '24–48 Soat',
    basePriceUZS: 40000,
    modelPreset: 'planter',
    features: [
      'Tillarang ipak, marmarsimon va ikki rangli yaltiroq filamentlar',
      'Buyum yuzasiga shaxsiy ism yoki kompaniya logotipini bosib chiqarish',
      'Chiroyli qadoqlash va sovg‘a qutisi',
      'Dona holatda ham buyurtma qabul qilinadi'
    ],
    presets: [
      { name: 'Low-Poly Geometrik Kaktus Idishi', weightG: 50, timeHrs: 2.4, modelingFeeUZS: 25000 },
      { name: 'Toshkent Teleminorasi Stol Suveniri', weightG: 40, timeHrs: 2.0, modelingFeeUZS: 30000 },
      { name: 'Litofaniya Fotosuratli Yorug‘lik Kubigi', weightG: 85, timeHrs: 4.8, modelingFeeUZS: 40000 },
      { name: '10 dona Kompaniya Logotipli Brelok', weightG: 90, timeHrs: 3.6, modelingFeeUZS: 30000 }
    ]
  },
  {
    id: 'b2b-batch',
    title: 'Kichik Seriyali B2B Ishlab Chiqarish (10–100+ dona)',
    uzTitle: 'Kichik Partiyada Tayyorlash',
    icon: '🏭',
    badge: '35% Gacha Ulgurji Chegirma',
    badgeColor: 'blue',
    shortDesc: '50 million so‘mlik qimmat po‘lat qoliplarsiz plastmassa qismlarni tezkor seriyada chop etish.',
    targetCustomer: 'Elektronika sexlari, mebel ishlab chiqaruvchilar, montajchilar',
    recommendedMaterial: 'PETG',
    defaultInfill: 40,
    defaultLayerHeight: 0.24,
    defaultQuantity: 25,
    typicalTurnaround: '3–5 Kun',
    basePriceUZS: 450000,
    modelPreset: 'gear',
    features: [
      'Pillapoyali chegirma: 10-24 dona (-15%), 25-49 dona (-25%), 50+ dona (-35%)',
      'Birinchi namuna bepul chop etilib, tasdiqlangach to‘liq partiya ishga tushadi',
      'Barcha qismlarda rang va o‘lcham bir xilligi kafolatlanadi',
      'Qolip tayyorlashga oylar sarflamay, ertagayoq ishlab chiqarishni boshlash'
    ],
    presets: [
      { name: '25 dona Kabel Qisqichi (Clip)', weightG: 250, timeHrs: 11.0, modelingFeeUZS: 40000 },
      { name: '50 dona Elektronika Prokladkasi', weightG: 200, timeHrs: 8.5, modelingFeeUZS: 30000 },
      { name: '20 dona Dastgoh Uskunasi Tutqichi', weightG: 600, timeHrs: 22.0, modelingFeeUZS: 50000 }
    ]
  },
  {
    id: 'cad-modeling-only',
    title: '3D Chizma va Revers-Injiniring Xizmati',
    uzTitle: 'Faqat Chizma va Modellashtirish',
    icon: '📐',
    badge: 'Muhandislik Chizmasi',
    badgeColor: 'teal',
    shortDesc: 'Faylingiz yo‘qmi? Singan detalni Chilonzor ustaxonamizga olib keling yoki fotosuratini yuboring — 3D model chizib beramiz.',
    targetCustomer: '3D modeli bo‘lmagan mijozlar, ustalar, kashfiyotchilar, korxonalar',
    recommendedMaterial: 'PETG',
    defaultInfill: 50,
    defaultLayerHeight: 0.20,
    defaultQuantity: 1,
    typicalTurnaround: '24 Soat',
    basePriceUZS: 80000,
    modelPreset: 'gear',
    features: [
      'Elektron shtangensirkul bilan mikron darajasida aniq o‘lchash',
      '.STEP, .STL, .OBJ va SolidWorks formatlarida tayyor fayl berish',
      'Kuchlanish va 3D bosmaga mosligini tahlil qilish',
      'Ustaxonamizda 1 dona bepul sinov nusxasini chop etib tekshirish'
    ],
    presets: [
      { name: 'Oddiy Tutqich yoki Qopqoqni Modellashtirish', weightG: 25, timeHrs: 1.0, modelingFeeUZS: 60000 },
      { name: 'Singan Shesterna Tishlarini Qayta Tiklash', weightG: 35, timeHrs: 1.5, modelingFeeUZS: 90000 },
      { name: 'Murakkab Egri Chiziqli Korpus Chizmasi', weightG: 70, timeHrs: 3.0, modelingFeeUZS: 150000 }
    ]
  }
];

export const MATERIALS = [
  {
    id: 'PETG',
    name: 'PETG Mustahkam (3DShef Chilonzor)',
    uzName: 'PETG Muhandislik Polimeri',
    type: 'Mustahkam Texnik Polimer',
    densityGcm3: 1.27,
    costPerKgUZS: 220000,
    costPerGUZS: 220,
    bestFor: 'Shesternalar, kronshteynlar, tashqi detallar, 75°C gacha issiqqa chidamli',
    colors: [
      { name: 'Signal Zarg‘aldoq', hex: '#ff6600', rough: 0.25 },
      { name: 'Yarim Shaffof Kulrang', hex: '#4a5568', rough: 0.2, transparent: true, opacity: 0.85 },
      { name: 'Yaltiroq Qora', hex: '#111111', rough: 0.15 },
      { name: 'Sanoat Oqi', hex: '#e2e8f0', rough: 0.2 }
    ]
  },
  {
    id: 'PLA',
    name: 'PLA Standart (Sunlu / eSun)',
    uzName: 'PLA Bioplastik',
    type: 'Ekologik Toza Polimer',
    densityGcm3: 1.24,
    costPerKgUZS: 180000,
    costPerGUZS: 180,
    bestFor: 'Prototip, ko‘rgazmali maketlar, talabalar loyihalari, dekorativ buyumlar',
    colors: [
      { name: 'Qop-Qora', hex: '#1a1a1a', rough: 0.4 },
      { name: 'Opppoq Oq', hex: '#f0f0f0', rough: 0.3 },
      { name: 'Yorqin Moviy', hex: '#00c3ff', rough: 0.35 },
      { name: 'Qizil', hex: '#e62429', rough: 0.35 }
    ]
  },
  {
    id: 'PLA-SILK',
    name: 'Ipak PLA Metall Yaltiroq',
    uzName: 'Ipak Yaltiroq Premium',
    type: 'Dekorativ Premium',
    densityGcm3: 1.25,
    costPerKgUZS: 260000,
    costPerGUZS: 260,
    bestFor: 'Sovg‘alar, mukofotlar, shaxsiy suvenirlar, Toshkent yodgorliklari',
    colors: [
      { name: 'Zar Tillarang', hex: '#d4af37', metal: 0.6, rough: 0.25 },
      { name: 'Kumushrang', hex: '#c0c0c0', metal: 0.65, rough: 0.25 },
      { name: 'Misrang', hex: '#b76e79', metal: 0.55, rough: 0.28 }
    ]
  },
  {
    id: 'TPU',
    name: 'TPU 95A Egiluvchan Rezina',
    uzName: 'Rezinasimon Elastomer',
    type: 'Elastomer Rezina',
    densityGcm3: 1.21,
    costPerKgUZS: 320000,
    costPerGUZS: 320,
    bestFor: 'Zichlagichlar, bamperlar, zarbani yutuvchi muftalar, elastik qismlar',
    colors: [
      { name: 'Neon Yashil', hex: '#39ff14', rough: 0.4 },
      { name: 'Qora Rezina', hex: '#222222', rough: 0.5 },
      { name: 'Shaffof Rezina', hex: '#e0f2fe', rough: 0.2, transparent: true, opacity: 0.7 }
    ]
  },
  {
    id: 'ABS-P1S',
    name: 'ABS / ASA Termobardosh (Bambu P1S)',
    uzName: 'Yuqori Haroratga Chidamli',
    type: 'Yopiq Kamera Polimeri',
    densityGcm3: 1.05,
    costPerKgUZS: 250000,
    costPerGUZS: 250,
    bestFor: 'Avtomobil kapot osti detallari, 95°C gacha issiqqa chidamli qismlar',
    colors: [
      { name: 'Matoviy Qora', hex: '#18181b', rough: 0.6 },
      { name: 'Texnik Kulrang', hex: '#64748b', rough: 0.55 }
    ]
  }
];

export const QUALITY_PRESETS = [
  { id: '0.28', label: '0.28 mm — Tezkor Qoralama', speedMultiplier: 0.75, desc: 'Eng tez bosish, o‘lchamlarni sinab ko‘rish uchun qulay' },
  { id: '0.20', label: '0.20 mm — Standart (Tavsiya etiladi)', speedMultiplier: 1.0, desc: 'Mustahkamlik, silliqlik va tezlikning ideal balansi' },
  { id: '0.12', label: '0.12 mm — Yuqori Aniqlik', speedMultiplier: 1.5, desc: 'Deyarli ko‘rinmas qatlamlar, mayda shesternalar va ko‘rgazmali buyumlar uchun' }
];

export const INFILL_PRESETS = [
  { value: 15, label: '15% — Yengil / Ko‘rgazmali', desc: 'Haykalchalar, vizual arxitektura maketlari' },
  { value: 30, label: '30% — Standart Prototip', desc: 'Elektronika korpuslari, qutilar' },
  { value: 60, label: '60% — Yuqori Mustahkam', desc: 'Shesternalar, mexanik kronshteynlar, ehtiyot qismlar' },
  { value: 100, label: '100% — Monolit Muhandislik', desc: 'Og‘ir yuk tushadigan qismlar, kraniklar' }
];

export const EXCHANGE_RATE_UZS_PER_USD = 12650;
