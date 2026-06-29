// Lebanese administrative divisions: Governorate (محافظة) → District (قضاء) →
// Sub-district / town (most relevant towns for FATCO's North Lebanon + Akkar
// base are detailed; other districts list major towns). The customer form
// always also offers an "Other…" free-text fallback.
//
// Each district carries approximate lat/lng (district centre) so the dashboard
// map can plot customer counts without external GeoJSON files.

export type District = {
  name: string;
  ar: string;
  lat: number;
  lng: number;
  towns: string[];
};

export type Governorate = {
  name: string;
  ar: string;
  districts: District[];
};

export const LEBANON: Governorate[] = [
  {
    name: "North",
    ar: "الشمال",
    districts: [
      {
        name: "Tripoli",
        ar: "طرابلس",
        lat: 34.436,
        lng: 35.834,
        towns: [
          "Tripoli",
          "El Mina",
          "Beddawi",
          "Qalamoun",
          "Abi Samra",
          "Tabbaneh",
          "Bab al-Ramel",
          "Zahrieh",
          "Mhamra",
          "Qobbe",
          "Mankoubin",
        ],
      },
      {
        name: "Koura",
        ar: "الكورة",
        lat: 34.3,
        lng: 35.81,
        towns: [
          "Amioun",
          "Kfar Aqqa",
          "Bterram",
          "Btouratij",
          "Dahr el Ain",
          "Kousba",
          "Bishmizzine",
          "Ras Maska",
          "Anfeh",
          "Kfar Hazir",
          "Dedde",
          "Bkeftine",
          "Fih",
        ],
      },
      {
        name: "Zgharta",
        ar: "زغرتا",
        lat: 34.4,
        lng: 35.9,
        towns: [
          "Zgharta",
          "Ehden",
          "Mejdlaya",
          "Kfarhata",
          "Ardeh",
          "Rachiine",
          "Mazraat en Nahr",
        ],
      },
      {
        name: "Bcharre",
        ar: "بشري",
        lat: 34.25,
        lng: 36.01,
        towns: ["Bcharre", "Hasroun", "Hadath El Jebbeh", "Bazoun", "Bqaa Kafra"],
      },
      {
        name: "Batroun",
        ar: "البترون",
        lat: 34.25,
        lng: 35.66,
        towns: ["Batroun", "Tannourine", "Douma", "Kfar Abida", "Chekka", "Hamat"],
      },
      {
        name: "Miniyeh-Danniyeh",
        ar: "المنية الضنية",
        lat: 34.45,
        lng: 36.0,
        towns: [
          "Minyeh",
          "Sir Ed Danniyeh",
          "Bakhoun",
          "Beqaa Safrin",
          "Assoun",
          "Deir Ammar",
          "Markabta",
        ],
      },
    ],
  },
  {
    name: "Akkar",
    ar: "عكار",
    districts: [
      {
        name: "Akkar",
        ar: "عكار",
        lat: 34.54,
        lng: 36.08,
        towns: [
          "Halba",
          "Bebnine",
          "Kobayat",
          "Fneideq",
          "Wadi Khaled",
          "Bire",
          "Berqayel",
          "Michmich",
          "Akkar al-Atika",
          "Mashha",
          "Tikrit",
          "Qoubaiyat",
          "Cheikh Mohammad",
          "Minyara",
          "Kouachra",
        ],
      },
    ],
  },
  {
    name: "Mount Lebanon",
    ar: "جبل لبنان",
    districts: [
      {
        name: "Jbeil",
        ar: "جبيل",
        lat: 34.12,
        lng: 35.65,
        towns: ["Byblos", "Amchit", "Aqoura", "Mastita"],
      },
      {
        name: "Keserwan",
        ar: "كسروان",
        lat: 34.0,
        lng: 35.65,
        towns: ["Jounieh", "Zouk Mosbeh", "Ajaltoun", "Ghazir", "Bzoummar"],
      },
      {
        name: "Metn",
        ar: "المتن",
        lat: 33.87,
        lng: 35.62,
        towns: ["Jdeideh", "Dekwaneh", "Bourj Hammoud", "Sin el Fil", "Mansourieh", "Bikfaya"],
      },
      {
        name: "Baabda",
        ar: "بعبدا",
        lat: 33.83,
        lng: 35.54,
        towns: ["Baabda", "Hazmieh", "Hadath", "Chiyah", "Furn el Chebbak"],
      },
      {
        name: "Aley",
        ar: "عاليه",
        lat: 33.8,
        lng: 35.6,
        towns: ["Aley", "Bhamdoun", "Souk el Gharb"],
      },
      {
        name: "Chouf",
        ar: "الشوف",
        lat: 33.7,
        lng: 35.6,
        towns: ["Beiteddine", "Baakline", "Deir el Qamar", "Barouk", "Semqanieh", "Kfarhim"],
      },
    ],
  },
  {
    name: "Beirut",
    ar: "بيروت",
    districts: [
      {
        name: "Beirut",
        ar: "بيروت",
        lat: 33.895,
        lng: 35.478,
        towns: ["Achrafieh", "Ras Beirut", "Hamra", "Mazraa", "Sanayeh", "Verdun", "Qantari"],
      },
    ],
  },
  {
    name: "Beqaa",
    ar: "البقاع",
    districts: [
      {
        name: "Zahle",
        ar: "زحلة",
        lat: 33.85,
        lng: 35.9,
        towns: ["Zahle", "Bar Elias", "Chtaura", "Qab Elias"],
      },
      {
        name: "Western Beqaa",
        ar: "البقاع الغربي",
        lat: 33.65,
        lng: 35.78,
        towns: ["Joub Jannine", "Saghbine", "Kamed el Loz"],
      },
      {
        name: "Rachaya",
        ar: "راشيا",
        lat: 33.5,
        lng: 35.84,
        towns: ["Rachaya", "Kfarmechki"],
      },
    ],
  },
  {
    name: "Baalbek-Hermel",
    ar: "بعلبك الهرمل",
    districts: [
      {
        name: "Baalbek",
        ar: "بعلبك",
        lat: 34.0,
        lng: 36.21,
        towns: ["Baalbek", "Douris", "Deir el Ahmar"],
      },
      {
        name: "Hermel",
        ar: "الهرمل",
        lat: 34.39,
        lng: 36.38,
        towns: ["Hermel", "Qasr"],
      },
    ],
  },
  {
    name: "South",
    ar: "الجنوب",
    districts: [
      {
        name: "Sidon",
        ar: "صيدا",
        lat: 33.56,
        lng: 35.37,
        towns: ["Sidon", "Ghazieh", "Sarafand", "Haret Saida"],
      },
      {
        name: "Tyre",
        ar: "صور",
        lat: 33.27,
        lng: 35.2,
        towns: ["Tyre", "Qana", "Bourj el Shemali"],
      },
      {
        name: "Jezzine",
        ar: "جزين",
        lat: 33.54,
        lng: 35.58,
        towns: ["Jezzine", "Roum"],
      },
    ],
  },
  {
    name: "Nabatieh",
    ar: "النبطية",
    districts: [
      {
        name: "Nabatieh",
        ar: "النبطية",
        lat: 33.38,
        lng: 35.48,
        towns: ["Nabatieh", "Kfar Roummane", "Habbouche"],
      },
      {
        name: "Marjeyoun",
        ar: "مرجعيون",
        lat: 33.36,
        lng: 35.59,
        towns: ["Marjeyoun", "Khiam"],
      },
      {
        name: "Hasbaya",
        ar: "حاصبيا",
        lat: 33.4,
        lng: 35.68,
        towns: ["Hasbaya", "Chebaa"],
      },
      {
        name: "Bint Jbeil",
        ar: "بنت جبيل",
        lat: 33.12,
        lng: 35.43,
        towns: ["Bint Jbeil", "Ainata"],
      },
    ],
  },
];

export const GOVERNORATES = LEBANON.map((g) => g.name);

export function districtsOf(governorate: string): District[] {
  return LEBANON.find((g) => g.name === governorate)?.districts ?? [];
}

export function townsOf(governorate: string, district: string): string[] {
  return districtsOf(governorate).find((d) => d.name === district)?.towns ?? [];
}

// Flat list of all districts with coordinates, for the dashboard map.
export const ALL_DISTRICTS: { name: string; ar: string; lat: number; lng: number; governorate: string }[] =
  LEBANON.flatMap((g) =>
    g.districts.map((d) => ({
      name: d.name,
      ar: d.ar,
      lat: d.lat,
      lng: d.lng,
      governorate: g.name,
    }))
  );
