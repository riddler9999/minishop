// Myanmar regions/states → townships, with DEMO shipping fees (Kyat) for
// delivery FROM Yangon. These fees are placeholder values — the owner will
// replace them with the real Royal Express price table later. A township may
// override its region's default fee.
//
// To update fees: edit `fee` on a region (applies to all its townships) or set
// a township `fee` to override for that township only.

export interface Township {
  name: string;
  fee?: number; // overrides region.fee when present
}
export interface Region {
  name: string;
  fee: number; // default fee for townships in this region
  townships: Township[];
}

const t = (names: string[], fee?: number): Township[] =>
  names.map((name) => (fee != null ? {name, fee} : {name}));

// Yangon: inner-city 2,500 default; peri-urban/outer townships 3,500.
const YANGON_INNER = [
  'လှိုင်', 'လှိုင်သာယာ', 'ကမာရွတ်', 'မရမ်းကုန်း', 'အင်းစိန်', 'မင်္ဂလာဒုံ',
  'ရွှေပြည်သာ', 'လမ်းမတော်', 'အလုံ', 'ကြည့်မြင်တိုင်', 'ဆိပ်ကမ်း', 'ပန်းဘဲတန်း',
  'ကျောက်တံတား', 'ဗိုလ်တထောင်', 'ပုဇွန်တောင်', 'မင်္ဂလာတောင်ညွန့်', 'တာမွေ',
  'ဗဟန်း', 'ဒဂုံ', 'စမ်းချောင်း', 'ရန်ကင်း', 'သင်္ဃန်းကျွန်း', 'သာကေတ',
  'ဒဂုံမြို့သစ်(တောင်)', 'ဒဂုံမြို့သစ်(မြောက်)', 'ဒဂုံမြို့သစ်(အရှေ့)', 'ဒဂုံမြို့သစ်(ဆိပ်ကမ်း)',
  'တောင်ဥက္ကလာပ', 'မြောက်ဥက္ကလာပ', 'ဒေါပုံ', 'ရွှေပေါက်ကံ', 'ဒလ', 'ဆိပ်ကြီးခနောင်တို',
];
const YANGON_OUTER = [
  'သန်လျင်', 'ကျောက်တန်း', 'တွံတေး', 'ကော့မှူး', 'ကွမ်းခြံကုန်း', 'ခရမ်း',
  'သုံးခွ', 'ကယန်း', 'သြန္တောင်', 'လှည်းကူး', 'မှော်ဘီ', 'တိုက်ကြီး', 'ဆိပ်ကမ်းသာ',
];

export const REGIONS: Region[] = [
  {
    name: 'ရန်ကုန်တိုင်းဒေသကြီး',
    fee: 2500,
    townships: [...t(YANGON_INNER), ...t(YANGON_OUTER, 3500)],
  },
  {
    name: 'ပဲခူးတိုင်းဒေသကြီး',
    fee: 5000,
    townships: t(['ပဲခူး', 'တောင်ငူ', 'ပြည်', 'သာယာဝတီ', 'ဒိုက်ဦး', 'ညောင်လေးပင်', 'ဝေါ', 'ကျောက်တံခါး', 'ဖြူး', 'ပေါက်ခေါင်း']),
  },
  {
    name: 'ဧရာဝတီတိုင်းဒေသကြီး',
    fee: 5500,
    townships: t(['ပုသိမ်', 'ဟင်္သာတ', 'မအူပင်', 'ဖျာပုံ', 'ဝါးခယ်မ', 'မြောင်းမြ', 'ကျုံပျော်', 'လပွတ္တာ', 'ဘိုကလေး', 'ငပုတော', 'ပန်းတနော်']),
  },
  {
    name: 'မန္တလေးတိုင်းဒေသကြီး',
    fee: 6000,
    townships: t(['မန္တလေး', 'ပြင်ဦးလွင်', 'မြင်းခြံ', 'မိတ္ထီလာ', 'ကျောက်ဆည်', 'ရမည်းသင်း', 'မဒယ', 'ငါန်းဇွန်', 'ပုသိမ်ကြီး', 'အမရပူရ', 'ပျော်ဘွယ်']),
  },
  {
    name: 'နေပြည်တော်',
    fee: 6000,
    townships: t(['ပုဗ္ဗသီရိ', 'ဇမ္ဗူသီရိ', 'ဥတ္တရသီရိ', 'ဒက္ခိဏသီရိ', 'ပျဉ်းမနား', 'လယ်ဝေး', 'တပ်ကုန်း']),
  },
  {
    name: 'မကွေးတိုင်းဒေသကြီး',
    fee: 6500,
    townships: t(['မကွေး', 'ပခုက္ကူ', 'ရေနံချောင်း', 'အောင်လံ', 'မင်းဘူး', 'ဂန့်ဂေါ', 'ချောက်', 'သရက်', 'တောင်တွင်းကြီး', 'ပွင့်ဖြူ']),
  },
  {
    name: 'စစ်ကိုင်းတိုင်းဒေသကြီး',
    fee: 7000,
    townships: t(['မုံရွာ', 'ရွှေဘို', 'စစ်ကိုင်း', 'ကလေး', 'ကသာ', 'ကန့်ဘလူ', 'ဒီပဲယင်း', 'ယင်းမာပင်', 'တမူး', 'ကလေးဝ']),
  },
  {
    name: 'ရှမ်းပြည်နယ်',
    fee: 7000,
    townships: t(['တောင်ကြီး', 'လားရှိုး', 'ကျိုင်းတုံ', 'မူဆယ်', 'ညောင်ရွှေ', 'ကလော', 'သီပေါ', 'တာချီလိတ်', 'ပင်လုံ', 'အင်းလေး']),
  },
  {
    name: 'မွန်ပြည်နယ်',
    fee: 6500,
    townships: t(['မော်လမြိုင်', 'သထုံ', 'ကျိုက်ထို', 'ရေး', 'ဘီးလင်း', 'ချောင်းဆုံ', 'မုဒုံ', 'ပေါင်', 'သံဖြူဇရပ်']),
  },
  {
    name: 'ကရင်ပြည်နယ်',
    fee: 7000,
    townships: t(['ဘားအံ', 'မြဝတီ', 'ဖာပွန်', 'ကော့ကရိတ်', 'လှိုင်းဘွဲ့', 'ကြာအင်းဆိပ်ကြီး', 'သံတောင်']),
  },
  {
    name: 'ရခိုင်ပြည်နယ်',
    fee: 7500,
    townships: t(['စစ်တွေ', 'သံတွဲ', 'ကျောက်ဖြူ', 'တောင်ကုတ်', 'မောင်တော', 'ဘူးသီးတောင်', 'ရမ်းဗြဲ', 'မာန်အောင်', 'ငပလီ']),
  },
  {
    name: 'တနင်္သာရီတိုင်းဒေသကြီး',
    fee: 7500,
    townships: t(['ထားဝယ်', 'မြိတ်', 'ကော့သောင်း', 'သရက်ချောင်း', 'လောင်းလုံး', 'ရေဖြူ', 'ပုလော']),
  },
  {
    name: 'ကချင်ပြည်နယ်',
    fee: 8000,
    townships: t(['မြစ်ကြီးနား', 'ဗန်းမော်', 'မိုးကောင်း', 'ဖားကန့်', 'ဝိုင်းမော်', 'ချီဖွေ', 'ပူတာအို', 'မိုးညှင်း']),
  },
  {
    name: 'ကယားပြည်နယ်',
    fee: 8000,
    townships: t(['လွိုင်ကော်', 'ဒီးမော့ဆို', 'ဖရူဆို', 'ရှားတော', 'ဘောလခဲ']),
  },
  {
    name: 'ချင်းပြည်နယ်',
    fee: 8500,
    townships: t(['ဟားခါး', 'ဖလမ်း', 'တီးတိန်', 'မတူပီ', 'ကန်ပက်လက်', 'ထန်တလန်', 'မင်းတပ်']),
  },
];

export function regionNames(): string[] {
  return REGIONS.map((r) => r.name);
}
export function townshipsOf(regionName: string): Township[] {
  return REGIONS.find((r) => r.name === regionName)?.townships ?? [];
}
export function shippingFee(regionName: string, townshipName: string): number | null {
  const region = REGIONS.find((r) => r.name === regionName);
  if (!region) return null;
  const twn = region.townships.find((x) => x.name === townshipName);
  if (!twn) return null;
  return twn.fee ?? region.fee;
}
