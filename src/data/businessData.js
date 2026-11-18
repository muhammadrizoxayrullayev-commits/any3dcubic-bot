// Toshkent 3D Ustaxonasi: Biznes Taklifi, Moliyaviy Model va SWOT Ma'lumotlari

export const BUSINESS_DATA = {
  overview: {
    startupName: 'Toshkent 3D Bosma va Prototip Ustaxonasi',
    uzName: 'Toshkent 3D Ustaxonasi',
    mission: 'Raqamli 3D modellarni Toshkentdagi mahalliy ustaxonalar, muhandislar va talabalar uchun qimmat qoliplarsiz tayyor mahsulotga aylantirish.',
    locationDistrict: 'Sergeli tumani, Yuqori Darxon mahallasi (41.235141, 69.207236), Toshkent',
    coreAdvantage: 'Nostandart va topilmaydigan plastmassa qismlarni 24-48 soat ichida qolip xarajatisiz ishlab chiqarish.'
  },

  // 1. Uskunalar va Boshlang'ich CAPEX
  equipment: {
    recommendedSetup: [
      {
        item: '2 × Bambu Lab A1 (256 × 256 × 256 mm)',
        minUZS: 3200000,
        maxUZS: 11800000,
        defaultUZS: 7000000,
        supplier: 'Mahalliy Bambu.uz / 3DShef Chilonzor',
        note: 'Bir vaqtning o‘zida bir nechta buyurtmani parallel bosish uchun asosiy tezkor ishchi mashinalar'
      },
      {
        item: '1 × Bambu Lab P1S Yopiq Kamerali (256 × 256 mm)',
        minUZS: 2600000,
        maxUZS: 5500000,
        defaultUZS: 3800000,
        supplier: 'Bambu.uz / 3DShef shourumi',
        note: 'Texnik muhandislik polimerlari (ABS, ASA, PETG-CF) uchun yopiq qizdiriluvchi kamera'
      },
      {
        item: 'Boshlang‘ich Filament Zaxirasi (PLA, PETG, TPU, ABS)',
        minUZS: 1500000,
        maxUZS: 3000000,
        defaultUZS: 2200000,
        supplier: '3DShef va 3dBozor Toshkent',
        note: '10-12 g‘altak eng ko‘p talab qilinadigan ranglar va texnik materiallar'
      },
      {
        item: 'Zaxira Soplo (Nozzle), Asboblar va Shtangensirkul',
        minUZS: 500000,
        maxUZS: 1500000,
        defaultUZS: 900000,
        supplier: 'Mahalliy 3DShef ehtiyot qismlari',
        note: 'Toblangan po‘lat 0.4mm va 0.6mm soplolar, moylash asboblari, faskasolyar'
      },
      {
        item: 'Kompyuter / CAD Modellashtirish Ishchi Stansiyasi',
        minUZS: 4000000,
        maxUZS: 8000000,
        defaultUZS: 5500000,
        supplier: 'Malika bozori / Asoschilar noutbuki',
        note: 'SolidWorks, Fusion 360 va Bambu Studio uchun videokartali noutbuk yoki PK'
      },
      {
        item: 'Mebel, Stellaj va 1500VA UPS Elektr Himoyasi',
        minUZS: 1000000,
        maxUZS: 2500000,
        defaultUZS: 1800000,
        supplier: 'Toshkent elektr mollari bozori',
        note: 'Toshkentdagi elektr uzilishlaridan ko‘p soatlik bosmani saqlab qoluvchi 1500VA UPS batareya'
      }
    ],
    rationaleWhyThree: 'Biz 10 ta emas, 3 ta printer bilan boshlaymiz. Korxona avval talabni isbotlashi kerak. Nega 3 ta? Ular bir vaqtda turli ishlarni bajarish, sifatni solishtirish va bitta mashinaga xizmat ko‘rsatilayotganda ishlab chiqarish to‘xtab qolmasligini ta’minlaydi.'
  },

  // 2. Elektr Energiyasi Xarajatlari (2026 Tarif)
  electricity: {
    tariffRatePerKwhUZS: 1100, // 2026-yil 1-iyundan O'zbekistondagi rasmiy tijorat tarifi
    avgPrinterWatts: 150,
    workingDaysPerMonth: 26,
    defaultOperatingHoursPerDay: 8,
    formulaExplanation: '3 printer × 0.15 kVt × 8 soat × 26 kun × 1,100 so‘m/kVt*soat = oyiga 103,000 so‘m printer elektr sarfi.',
    fullWorkshopAllowanceMinUZS: 300000,
    fullWorkshopAllowanceMaxUZS: 700000,
    judgeInsight: 'Hakamlar uchun muhim xulosa: Elektr energiyasi bizning asosiy xarajatimiz EMAS (oyiga atigi 103,000 – 500,000 so‘m). Asosiy xavf — PRINTERLARNING BO‘SH TURISHIDIR. Ishlamay turgan printer elektr yemasligi bilan daromad keltirmaydi!'
  },

  // 3. Joylashuv Strategiyasi va Tumanlar Tahlili
  locations: [
    {
      id: 'sergeli',
      name: 'Sergeli tumani, Yuqori Darxon',
      uzName: 'Sergeli tumani (Asosiy Ustaxona: 41.235141, 69.207236)',
      isRecommended: true,
      tag: 'Asosiy Ishlab Chiqarish Ustaxonasi',
      targetRentUZS: '2,500,000 – 3,500,000 so‘m / oy',
      spaceSize: '25 – 35 m²',
      pros: [
        'Yuqori Darxon mahallasi, Navro‘z 6-tor ko‘chasi, 3-uy (Lokatsiya: 41.235141, 69.207236)',
        'Toshkent bo‘ylab Yandex Go va BTS orqali buyurtmalarni tezkor yetkazib berish uchun qulay logistika tuguni',
        'Sokin muhit, 3D printerlar va dastgohlar uchun to‘liq moslashtirilgan elektr quvvati',
        'Mijozlar ustaxonadan bepul olib ketishlari uchun qulay marshrut'
      ],
      cons: [
        'Mijozlar kelishidan oldin lokatsiyani xaritadan ochib olishlari tavsiya etiladi'
      ],
      verdict: 'Barqaror ishlab chiqarish, qulay logistika va mustaqil ish joyining eng maqbul balansi.'
    },
    {
      id: 'mirzo-ulugbek',
      name: 'Mirzo Ulug‘bek tumani',
      uzName: 'Mirzo Ulug‘bek tumani (Talabalar markazi)',
      isRecommended: false,
      tag: 'IT va Universitetlar Qamrovi',
      targetRentUZS: '3,500,000 – 5,000,000 so‘m / oy',
      spaceSize: '20 – 30 m²',
      pros: [
        'ToshTech, TATU, Inha va Turin universitetlariga yaqin',
        'Sanoat 3D bosmachisi Additive Technology ham shu tumanda joylashgan',
        'Muhandislik talabalarining bevosita oqimi'
      ],
      cons: [
        'Kvadrat metr uchun tijorat ijarasi ancha baland',
        'Toshkent bo‘ylab kuryerlar harakati uchun tirbandlik yuqori'
      ],
      verdict: 'Universitetlar bilan rasmiy shartnomalar tuzilgach kengayish uchun ikkinchi bosqich.'
    },
    {
      id: 'yangihayot',
      name: 'Yangihayot tumani',
      uzName: 'Yangihayot tumani (Byudjet varianti)',
      isRecommended: false,
      tag: 'Minimal Doimiy Xarajat',
      targetRentUZS: '2,000,000 so‘m / oy (OLX dagi 20 m² ofis e’loni)',
      spaceSize: '20 m²',
      pros: [
        'Eng past oylik ijara xarajati (oyiga 2 mln so‘m)',
        'Barcha buyurtmalar 100% onlayn yetkazib berish orqali bo‘lsa, boshlang‘ich pulni tejaydi'
      ],
      cons: [
        'Xomashyo do‘konlari (3DShef) va talabalardan uzoq',
        'Mijozlar uchun Yandex Go yetkazib berish narxi va vaqti oshadi'
      ],
      verdict: 'Boshlang‘ich grant yoki sarmoya 15 mln so‘mdan kam bo‘lsa zaxira varianti.'
    }
  ],

  // 4. Raqobatchilar va Hamkorlar Tahlili
  competitors: [
    {
      name: 'Additive Technology (Mirzo Ulug‘bek)',
      focus: 'Sanoat qismlari, fotopolimer (Resin), SLS va yirik seriyalar',
      pricing: 'Yuqori minimal buyurtma qiymati (kamida 400,000+ so‘m)',
      ourEdge: 'Biz bitta donalik kichik ehtiyot qismlarni ham (35,000 so‘mdan) 24 soatda qabul qilamiz va singan detalni bepul o‘lchab beramiz.'
    },
    {
      name: '3dBozor (Toshkent)',
      focus: 'Printerlar, filament g‘altaklari va ehtiyot qismlar sotuvi',
      pricing: 'Chakana savdo',
      ourEdge: 'Biz uskunaning o‘zini emas, tayyor xizmat va buyum ishlab chiqarishni taklif qilamiz. Biz ular uchun raqobatchi emas, doimiy mijozmiz.'
    },
    {
      name: '3DShef (Chilonzor Shourumi)',
      focus: 'Bambu Lab rasmiy dileri, filamentlar va kafolatli servis',
      pricing: 'Uskuna va xomashyo',
      ourEdge: 'Ular bilan do‘stona hamkorlik qilib, sarf materiallarini ulgurji narxda va kechikishsiz olamiz.'
    },
    {
      name: 'Codex 3D Print (Yandex Xarita)',
      focus: 'Umumiy tijorat 3D bosmasi',
      pricing: 'Noma’lum individual narxlar',
      ourEdge: 'Bizning veb-saytimizda shaffof narx kalkulyatori, onlayn buyurtma va singan maishiy texnika qismlarini qayta tiklash ixtisoslashuvi bor.'
    }
  ],

  // 5. SWOT Tahlili va Amaliy Yechimlar
  swot: {
    strengths: [
      { title: 'Kam Boshlang‘ich Sarmoya', desc: 'Zamonaviy Bambu Lab printerlari hamyonbop: 15–20 mln so‘m bilan ish boshlash mumkin.' },
      { title: 'Yuqori Foyda Marjasi', desc: 'Xomashyo 1 grammi 200 so‘m turadi; tayyor maxsus buyum 1,200–2,500 so‘m/grammga sotiladi.' },
      { title: 'Qolip Xarajatining Yo‘qligi', desc: '5,000 dollarlik metall qoliplarsiz 1 dona yoki 50 dona mahsulotni darhol chiqarish mumkin.' },
      { title: '24–48 Soatlik Tezkorlik', desc: 'Mijoz Xitoy yoki Turkiyadan 1 oy kutmasdan Toshkentda ertagayoq tayyor qismni oladi.' }
    ],
    weaknesses: [
      { title: 'Qolipli Quyishga Nisbatan Sekinroq', desc: 'FDM bosma 1 dona detal uchun 1 dan 4 soatgacha vaqt oladi, 200 tadan ortiq ommaviy seriyada cheklangan.' },
      { title: 'Texnik Xizmat va Kalibrlash', desc: 'Aniq ±0.05 mm o‘lcham uchun soploni tozalash, tasmalar tarangligi va stol sathini doimiy sozlash kerak.' },
      { title: 'Qo‘lda Ishlov Berish', desc: 'Qo‘llab-quvvatlovchi elementlarni (support) tozalash va yuzani silliqlash vaqt talab qiladi.' },
      { title: 'Qatlamlararo Bog‘liqlik', desc: 'Z o‘qi bo‘yicha mustahkamlik bir oz pastroq, qism yo‘nalishini to‘g‘ri joylashtirish muhim.' }
    ],
    opportunities: [
      { title: 'IT Park va ToshTech Rivoji', desc: 'Toshkentda yangi texnologiya markazlari va universitet to‘garaklariga prototiplar zarur.' },
      { title: 'Ustaxonalar Bilan B2B Hamkorlik', desc: 'Chilonzordagi maishiy texnika va avtoservislar bilan topilmaydigan shesternalarni yetkazish bo‘yicha shartnomalar.' },
      { title: 'Telegram va Instagram Orqali Sotuv', desc: 'Shaxsiy buyurtmalar, anime figuralari va avtomobil klipslarini to‘g‘ridan-to‘g‘ri messenjerda sotish.' },
      { title: '3D Modellashtirish Mahorat Darslari', desc: 'Maktab o‘quvchilari va havaskorlar uchun dam olish kunlari 3D bosma to‘garaklari tashkil etish.' }
    ],
    threatsAndSolutions: [
      {
        threat: 'Material Importi Kechikishi',
        detail: 'Filament narxi va keltirilishi xalqaro yuk tashishga bog‘liq.',
        solution: 'Chilonzordagi 3DShef orqali doimo 2 oylik xomashyo (PLA va PETG) zaxirasini saqlash.'
      },
      {
        threat: 'Elektr Energiyasidagi Kutilmagan Uzilishlar',
        detail: 'Elektr o‘chishi 8 soatlik qimmat buyurtmani yaroqsiz qilib qo‘yishi mumkin.',
        solution: '1500VA quvvatli UPS batareyasi va Bambu Lab printerining elektr qaytganda davom ettirish funksiyasini qo‘llash.'
      },
      {
        threat: 'Yangi Havaskor Raqobatchilar',
        detail: 'Har kim uyiga arzon printer sotib olib buyurtma olishga urinishi mumkin.',
        solution: 'Biz professional CAD muhandislik chizmasi, kafolatlangan aniqlik va yuridik B2B shartnomalar bilan ajralib turamiz.'
      }
    ]
  },

  // 6. Real Hayotiy Keys: Oshxona Kombayni Shesternasi
  caseStudy: {
    title: 'Real Hayotiy Misol: Oshxona Kombayni Shesternasini Tiklash',
    problem: 'Mijozning qimmat import oshxona kombaynining ichki plastmassa yetaklovchi tishli g‘ildiragi sinib qoldi. Butun qurilma ishdan to‘xtadi.',
    oldOption: {
      source: 'Chet eldan (Germaniya/Turkiya) pochta orqali buyurtma qilish',
      time: '3–4 hafta kutish vaqti',
      costUSD: 30,
      costUZS: 380000,
      note: 'Bojxona to‘lovi, pochta kechikishi, bir oy texnika ishlamay yotadi.'
    },
    tashkent3dSolution: {
      step1: 'Mijoz singan shesternani ustaxonamizga (Sergeli tumani, Yuqori Darxon) olib keldi (yoki shtangensirkul o‘lchamlarini yubordi).',
      step2: 'Muhandisimiz SolidWorks dasturida 45 daqiqada tish qadami va diametrini aniq chizib chiqdi.',
      step3: 'Bambu Lab A1 printerida mustahkam oq PETG polimerida 1 soat 45 daqiqada chop etildi.',
      costUSD: 6,
      costUZS: 75000,
      savingsPercent: '80% Pul va 95% Vaqt Tejaldi!'
    }
  },

  // 7. Oylik Xarajatlar va Zararsizlik Nuqtasi (Break-Even)
  monthlyBudget: {
    fixedExpenses: {
      rentUZS: 3000000, // Ijara: 3 mln so'm
      electricityUZS: 500000, // Elektr: 0.5 mln so'm
      internetPackagingMiscUZS: 500000, // Internet, qadoqlash: 0.5 mln so'm
      marketingAndLogisticsUZS: 800000 // Marketing va yetkazish: 0.8 mln so'm
    },
    variableExpensesPerOrder: {
      filamentCostAverageUZS: 15000,
      wearAndTearElectricityUZS: 5000
    },
    sampleAverageOrderPriceUZS: 120000,
    sampleAverageContributionMarginUZS: 100000, // 120k - 20k = 100k marja
    breakEvenOrdersFormula: 'Zararsizlik = Jami Doimiy Xarajat (4,800,000 so‘m) ÷ Buyurtma Marjasi (100,000 so‘m) = 48–50 ta buyurtma/oy',
    dailyTarget: 'Doimiy xarajatlarni to‘liq qoplash uchun ish kuniga atigi ~1.9 ta buyurtma kifoya!'
  },

  // 8. 90 Kunlik Ishga Tushirish Yo‘l Xaritasi
  roadmap: [
    {
      month: '1-Oy',
      title: 'Talabni Tekshirish va Sinov Buyurtmalari',
      icon: '🎯',
      actions: [
        'Chilonzordagi 25 ta ustaxona va ToshTech talabalar to‘garaklari bilan yuzma-yuz suhbat o‘tkazish',
        'Uzoq muddatli ijara shartnomasi tuzishdan oldin kamida 10 ta dastlabki pullik buyurtma olish',
        'Tanlangan Chilonzor binosida elektr shartnomasini (1,100 so‘mlik tarif) tekshirish',
        'Telegram buyurtma boti va Instagram portfoliolarini ishga tushirish'
      ]
    },
    {
      month: '2-Oy',
      title: 'Ustaxonani Jihozlash va Ishlab Chiqarish',
      icon: '🖨️',
      actions: [
        'Mahalliy 3DShef dileridan 2 ta Bambu Lab A1 printeri va 15 kg filament sotib olish',
        '1500VA UPS elektr himoya tizimi va maxsus tebranishga qarshi stellajlarni o‘rnatish',
        'Buyurtmalarni 24 soat ichida topshirish sifat nazorati qoidalarini joriy qilish',
        'Dastlabki 40 ta tijorat buyurtmasini 98% sifat ko‘rsatkichi bilan mijozlarga yetkazish'
      ]
    },
    {
      month: '3-Oy',
      title: 'Doimiy B2B Shartnomalar va Kengayish',
      icon: '📈',
      actions: [
        'Toshkentdagi 5 ta yirik maishiy texnika servisi bilan doimiy ehtiyot qism yetkazish shartnomasini imzolash',
        'ToshTech universiteti bilan diplom ishlari uchun 20% maxsus chegirma dasturini rasmiylashtirish',
        'Zararsizlik chegarasiga erishish (oyiga 50+ buyurtma)',
        'ABS/ASA qismlari uchun 3-printer (Bambu Lab P1S Yopiq Kamerali)ni xarid qilish'
      ]
    }
  ]
};
