// Parse the برنامج بلال PDF exports into clean customer records.
// Customers = accounts starting "41" (زبائن). Suppliers "40" and fund "53" skipped.
// Outputs import/parsed-customers.json and prints a summary for review.
import fs from "fs";
import path from "path";

const DIR = "import";

// ---- Arabic helpers ----
// pdf-parse emits lam-alef as presentation-form ligatures; restore them.
function fixArabic(s: string): string {
  return s
    .replace(/[ﻻﻼ]/g, "لا")
    .replace(/[ﻷﻸ]/g, "لأ")
    .replace(/[ﻹﻺ]/g, "لإ")
    .replace(/[ﻵﻶ]/g, "لآ")
    .replace(/ﷲ/g, "الله")
    .replace(/﻿/g, "");
}
function norm(s: string): string {
  return fixArabic(s)
    .replace(/[ً-ْٰ]/g, "") // diacritics
    .replace(/ـ/g, "") // tatweel
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ﷲ/g, "الله")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// ---- Location matching (ordered: specific before generic) ----
type Loc = { governorate?: string; district?: string; subDistrict?: string };
const RULES: { kw: string; loc: Loc }[] = [
  // North — specific towns first
  { kw: "الميناء", loc: { governorate: "North", district: "Tripoli", subDistrict: "El Mina" } },
  { kw: "ميناء", loc: { governorate: "North", district: "Tripoli", subDistrict: "El Mina" } },
  { kw: "القلمون", loc: { governorate: "North", district: "Tripoli", subDistrict: "Qalamoun" } },
  { kw: "قلمون", loc: { governorate: "North", district: "Tripoli", subDistrict: "Qalamoun" } },
  { kw: "البداوي", loc: { governorate: "North", district: "Tripoli", subDistrict: "Beddawi" } },
  { kw: "ابي سمراء", loc: { governorate: "North", district: "Tripoli", subDistrict: "Abi Samra" } },
  { kw: "ابو سمرا", loc: { governorate: "North", district: "Tripoli", subDistrict: "Abi Samra" } },
  { kw: "التبانة", loc: { governorate: "North", district: "Tripoli", subDistrict: "Tabbaneh" } },
  { kw: "باب الرمل", loc: { governorate: "North", district: "Tripoli", subDistrict: "Bab al-Ramel" } },
  { kw: "الزاهري", loc: { governorate: "North", district: "Tripoli", subDistrict: "Zahrieh" } },
  { kw: "القبة", loc: { governorate: "North", district: "Tripoli", subDistrict: "Qobbe" } },
  { kw: "محرم", loc: { governorate: "North", district: "Tripoli" } },
  { kw: "البحصاص", loc: { governorate: "North", district: "Tripoli" } },
  { kw: "جبل محسن", loc: { governorate: "North", district: "Tripoli" } },
  { kw: "طرابلس", loc: { governorate: "North", district: "Tripoli" } },
  // Zgharta
  { kw: "مجدليا", loc: { governorate: "North", district: "Zgharta", subDistrict: "Mejdlaya" } },
  { kw: "اهدن", loc: { governorate: "North", district: "Zgharta", subDistrict: "Ehden" } },
  { kw: "زغرتا", loc: { governorate: "North", district: "Zgharta" } },
  // Bcharre
  { kw: "حصرون", loc: { governorate: "North", district: "Bcharre", subDistrict: "Hasroun" } },
  { kw: "بشري", loc: { governorate: "North", district: "Bcharre" } },
  { kw: "بشرّي", loc: { governorate: "North", district: "Bcharre" } },
  // Batroun
  { kw: "شكا", loc: { governorate: "North", district: "Batroun", subDistrict: "Chekka" } },
  { kw: "تنورين", loc: { governorate: "North", district: "Batroun", subDistrict: "Tannourine" } },
  { kw: "البترون", loc: { governorate: "North", district: "Batroun" } },
  { kw: "بترون", loc: { governorate: "North", district: "Batroun" } },
  // Miniyeh-Danniyeh
  { kw: "سير الضنية", loc: { governorate: "North", district: "Miniyeh-Danniyeh", subDistrict: "Sir Ed Danniyeh" } },
  { kw: "سير الضني", loc: { governorate: "North", district: "Miniyeh-Danniyeh", subDistrict: "Sir Ed Danniyeh" } },
  { kw: "بخعون", loc: { governorate: "North", district: "Miniyeh-Danniyeh", subDistrict: "Bakhoun" } },
  { kw: "دير عمار", loc: { governorate: "North", district: "Miniyeh-Danniyeh", subDistrict: "Deir Ammar" } },
  { kw: "الضنية", loc: { governorate: "North", district: "Miniyeh-Danniyeh" } },
  { kw: "الضني", loc: { governorate: "North", district: "Miniyeh-Danniyeh" } },
  { kw: "المنية", loc: { governorate: "North", district: "Miniyeh-Danniyeh", subDistrict: "Minyeh" } },
  // Koura
  { kw: "اميون", loc: { governorate: "North", district: "Koura", subDistrict: "Amioun" } },
  { kw: "أميون", loc: { governorate: "North", district: "Koura", subDistrict: "Amioun" } },
  { kw: "ضهر العين", loc: { governorate: "North", district: "Koura", subDistrict: "Dahr el Ain" } },
  { kw: "راس مسقا", loc: { governorate: "North", district: "Koura", subDistrict: "Ras Maska" } },
  { kw: "انفه", loc: { governorate: "North", district: "Koura", subDistrict: "Anfeh" } },
  { kw: "أنفة", loc: { governorate: "North", district: "Koura", subDistrict: "Anfeh" } },
  { kw: "كوسبا", loc: { governorate: "North", district: "Koura", subDistrict: "Kousba" } },
  { kw: "بشمزين", loc: { governorate: "North", district: "Koura", subDistrict: "Bishmizzine" } },
  { kw: "دده", loc: { governorate: "North", district: "Koura", subDistrict: "Dedde" } },
  { kw: "الكورة", loc: { governorate: "North", district: "Koura" } },
  { kw: "كورة", loc: { governorate: "North", district: "Koura" } },
  // Akkar
  { kw: "حلبا", loc: { governorate: "Akkar", district: "Akkar", subDistrict: "Halba" } },
  { kw: "ببنين", loc: { governorate: "Akkar", district: "Akkar", subDistrict: "Bebnine" } },
  { kw: "بنين", loc: { governorate: "Akkar", district: "Akkar", subDistrict: "Bebnine" } },
  { kw: "القبيات", loc: { governorate: "Akkar", district: "Akkar", subDistrict: "Kobayat" } },
  { kw: "قبيات", loc: { governorate: "Akkar", district: "Akkar", subDistrict: "Kobayat" } },
  { kw: "فنيدق", loc: { governorate: "Akkar", district: "Akkar", subDistrict: "Fneideq" } },
  { kw: "وادي خالد", loc: { governorate: "Akkar", district: "Akkar", subDistrict: "Wadi Khaled" } },
  { kw: "برقايل", loc: { governorate: "Akkar", district: "Akkar", subDistrict: "Berqayel" } },
  { kw: "العبدة", loc: { governorate: "Akkar", district: "Akkar" } },
  { kw: "الكواشرة", loc: { governorate: "Akkar", district: "Akkar" } },
  { kw: "كواشرة", loc: { governorate: "Akkar", district: "Akkar" } },
  { kw: "منيارة", loc: { governorate: "Akkar", district: "Akkar", subDistrict: "Minyara" } },
  { kw: "خربة شار", loc: { governorate: "Akkar", district: "Akkar" } },
  { kw: "مرياطة", loc: { governorate: "Akkar", district: "Akkar" } },
  { kw: "العتيقة", loc: { governorate: "Akkar", district: "Akkar", subDistrict: "Akkar al-Atika" } },
  { kw: "الحيصة", loc: { governorate: "Akkar", district: "Akkar" } },
  { kw: "حرار", loc: { governorate: "Akkar", district: "Akkar" } },
  { kw: "المسعودية", loc: { governorate: "Akkar", district: "Akkar" } },
  { kw: "عكار", loc: { governorate: "Akkar", district: "Akkar" } },
  // Beirut
  { kw: "الاشرفية", loc: { governorate: "Beirut", district: "Beirut", subDistrict: "Achrafieh" } },
  { kw: "الأشرفية", loc: { governorate: "Beirut", district: "Beirut", subDistrict: "Achrafieh" } },
  { kw: "راس النبع", loc: { governorate: "Beirut", district: "Beirut" } },
  { kw: "الصنايع", loc: { governorate: "Beirut", district: "Beirut", subDistrict: "Sanayeh" } },
  { kw: "القنطاري", loc: { governorate: "Beirut", district: "Beirut", subDistrict: "Qantari" } },
  { kw: "الحمرا", loc: { governorate: "Beirut", district: "Beirut", subDistrict: "Hamra" } },
  { kw: "الاوزاعي", loc: { governorate: "Beirut", district: "Beirut" } },
  { kw: "بيروت", loc: { governorate: "Beirut", district: "Beirut" } },
  // Mount Lebanon — Metn
  { kw: "الدكوانة", loc: { governorate: "Mount Lebanon", district: "Metn", subDistrict: "Dekwaneh" } },
  { kw: "سن الفيل", loc: { governorate: "Mount Lebanon", district: "Metn", subDistrict: "Sin el Fil" } },
  { kw: "برج حمود", loc: { governorate: "Mount Lebanon", district: "Metn", subDistrict: "Bourj Hammoud" } },
  { kw: "المنصورية", loc: { governorate: "Mount Lebanon", district: "Metn", subDistrict: "Mansourieh" } },
  { kw: "جل الديب", loc: { governorate: "Mount Lebanon", district: "Metn" } },
  { kw: "الجديدة", loc: { governorate: "Mount Lebanon", district: "Metn", subDistrict: "Jdeideh" } },
  { kw: "بكفيا", loc: { governorate: "Mount Lebanon", district: "Metn", subDistrict: "Bikfaya" } },
  { kw: "البوشرية", loc: { governorate: "Mount Lebanon", district: "Metn" } },
  { kw: "زلقا", loc: { governorate: "Mount Lebanon", district: "Metn" } },
  { kw: "انطلياس", loc: { governorate: "Mount Lebanon", district: "Metn" } },
  { kw: "ضبية", loc: { governorate: "Mount Lebanon", district: "Metn" } },
  // Baabda
  { kw: "الحازمية", loc: { governorate: "Mount Lebanon", district: "Baabda", subDistrict: "Hazmieh" } },
  { kw: "الحدث", loc: { governorate: "Mount Lebanon", district: "Baabda", subDistrict: "Hadath" } },
  { kw: "الشياح", loc: { governorate: "Mount Lebanon", district: "Baabda", subDistrict: "Chiyah" } },
  { kw: "شياح", loc: { governorate: "Mount Lebanon", district: "Baabda", subDistrict: "Chiyah" } },
  { kw: "فرن الشباك", loc: { governorate: "Mount Lebanon", district: "Baabda", subDistrict: "Furn el Chebbak" } },
  { kw: "عين الرمانة", loc: { governorate: "Mount Lebanon", district: "Baabda" } },
  { kw: "بعبدا", loc: { governorate: "Mount Lebanon", district: "Baabda" } },
  { kw: "الجمهور", loc: { governorate: "Mount Lebanon", district: "Baabda" } },
  // Aley / Chouf
  { kw: "بشامون", loc: { governorate: "Mount Lebanon", district: "Aley" } },
  { kw: "عرمون", loc: { governorate: "Mount Lebanon", district: "Aley" } },
  { kw: "عاليه", loc: { governorate: "Mount Lebanon", district: "Aley" } },
  { kw: "بحمدون", loc: { governorate: "Mount Lebanon", district: "Aley", subDistrict: "Bhamdoun" } },
  { kw: "بعقلين", loc: { governorate: "Mount Lebanon", district: "Chouf", subDistrict: "Baakline" } },
  { kw: "بيت الدين", loc: { governorate: "Mount Lebanon", district: "Chouf", subDistrict: "Beiteddine" } },
  { kw: "دير القمر", loc: { governorate: "Mount Lebanon", district: "Chouf", subDistrict: "Deir el Qamar" } },
  { kw: "الباروك", loc: { governorate: "Mount Lebanon", district: "Chouf", subDistrict: "Barouk" } },
  { kw: "السمقانية", loc: { governorate: "Mount Lebanon", district: "Chouf", subDistrict: "Semqanieh" } },
  { kw: "كفرحيم", loc: { governorate: "Mount Lebanon", district: "Chouf", subDistrict: "Kfarhim" } },
  { kw: "كفرنبرخ", loc: { governorate: "Mount Lebanon", district: "Chouf" } },
  { kw: "سبلين", loc: { governorate: "Mount Lebanon", district: "Chouf" } },
  { kw: "داريا", loc: { governorate: "Mount Lebanon", district: "Chouf" } },
  { kw: "بيصور", loc: { governorate: "Mount Lebanon", district: "Aley" } },
  { kw: "الشوف", loc: { governorate: "Mount Lebanon", district: "Chouf" } },
  // Keserwan
  { kw: "ذوق", loc: { governorate: "Mount Lebanon", district: "Keserwan", subDistrict: "Zouk Mosbeh" } },
  { kw: "عجلتون", loc: { governorate: "Mount Lebanon", district: "Keserwan", subDistrict: "Ajaltoun" } },
  { kw: "جعيتا", loc: { governorate: "Mount Lebanon", district: "Keserwan" } },
  { kw: "بزمار", loc: { governorate: "Mount Lebanon", district: "Keserwan", subDistrict: "Bzoummar" } },
  { kw: "بزممار", loc: { governorate: "Mount Lebanon", district: "Keserwan", subDistrict: "Bzoummar" } },
  { kw: "غزير", loc: { governorate: "Mount Lebanon", district: "Keserwan", subDistrict: "Ghazir" } },
  { kw: "ريفون", loc: { governorate: "Mount Lebanon", district: "Keserwan" } },
  { kw: "صربا", loc: { governorate: "Mount Lebanon", district: "Keserwan" } },
  { kw: "جونية", loc: { governorate: "Mount Lebanon", district: "Keserwan", subDistrict: "Jounieh" } },
  { kw: "جونيه", loc: { governorate: "Mount Lebanon", district: "Keserwan", subDistrict: "Jounieh" } },
  { kw: "كسروان", loc: { governorate: "Mount Lebanon", district: "Keserwan" } },
  // Jbeil
  { kw: "عمشيت", loc: { governorate: "Mount Lebanon", district: "Jbeil", subDistrict: "Amchit" } },
  { kw: "أمشيت", loc: { governorate: "Mount Lebanon", district: "Jbeil", subDistrict: "Amchit" } },
  { kw: "نهر ابراهيم", loc: { governorate: "Mount Lebanon", district: "Jbeil" } },
  { kw: "المدفون", loc: { governorate: "Mount Lebanon", district: "Jbeil" } },
  { kw: "اهمج", loc: { governorate: "Mount Lebanon", district: "Jbeil" } },
  { kw: "قرطبا", loc: { governorate: "Mount Lebanon", district: "Jbeil" } },
  { kw: "حالات", loc: { governorate: "Mount Lebanon", district: "Jbeil" } },
  { kw: "البوار", loc: { governorate: "Mount Lebanon", district: "Keserwan" } },
  { kw: "الصفرا", loc: { governorate: "Mount Lebanon", district: "Keserwan" } },
  { kw: "جبيل", loc: { governorate: "Mount Lebanon", district: "Jbeil", subDistrict: "Byblos" } },
  // Beqaa
  { kw: "بر الياس", loc: { governorate: "Beqaa", district: "Zahle", subDistrict: "Bar Elias" } },
  { kw: "برالياس", loc: { governorate: "Beqaa", district: "Zahle", subDistrict: "Bar Elias" } },
  { kw: "شتورة", loc: { governorate: "Beqaa", district: "Zahle", subDistrict: "Chtaura" } },
  { kw: "قب الياس", loc: { governorate: "Beqaa", district: "Zahle", subDistrict: "Qab Elias" } },
  { kw: "زحلة", loc: { governorate: "Beqaa", district: "Zahle" } },
  { kw: "بعلبك", loc: { governorate: "Baalbek-Hermel", district: "Baalbek" } },
  { kw: "الهرمل", loc: { governorate: "Baalbek-Hermel", district: "Hermel" } },
  // South / Nabatieh
  { kw: "الغازية", loc: { governorate: "South", district: "Sidon", subDistrict: "Ghazieh" } },
  { kw: "صرفند", loc: { governorate: "South", district: "Sidon", subDistrict: "Sarafand" } },
  { kw: "صيدا", loc: { governorate: "South", district: "Sidon" } },
  { kw: "صور", loc: { governorate: "South", district: "Tyre" } },
  { kw: "جزين", loc: { governorate: "South", district: "Jezzine" } },
  { kw: "النبطية", loc: { governorate: "Nabatieh", district: "Nabatieh" } },
  { kw: "مرجعيون", loc: { governorate: "Nabatieh", district: "Marjeyoun" } },
  { kw: "حاصبيا", loc: { governorate: "Nabatieh", district: "Hasbaya" } },
  { kw: "بنت جبيل", loc: { governorate: "Nabatieh", district: "Bint Jbeil" } },
];

// Foreign / non-Lebanese markers → leave location blank.
const FOREIGN = ["طرطوس", "حمص", "حلب", "سوريا", "دمشق", "تلكلخ", "تل كلخ", "china", "turkey", "ankara", "india", "uae", "syria"];

function matchLocation(ref: string): Loc {
  if (!ref) return {};
  const low = ref.toLowerCase();
  if (FOREIGN.some((f) => low.includes(f))) return {};
  for (const r of RULES) if (ref.includes(r.kw)) return r.loc;
  return {};
}

// ---- Junk filter ----
const JUNK = new Set(
  [
    "صندوق", "زبون نقدي", "نمرة", "صندوق استلام", "ذمم مدينه", "ذمم مدينة", "ذمم",
    "كراس", "صندوق نقدي", "صندوق لل", "visa card", "card visa", "magazine", ".........",
  ].map(norm)
);
function isJunkName(name: string): boolean {
  const n = norm(name);
  if (!n || n.length < 2) return true;
  if (/^[\d\s.]+$/.test(n)) return true;
  if (JUNK.has(n)) return true;
  return false;
}

const ACCT = /^(40|41|53)\d{8}$/;
function isPhoneLike(s: string): boolean {
  const d = s.replace(/\D/g, "");
  return d.length >= 6 && d.length <= 13;
}

type Rec = {
  name: string;
  phone: string | null;
  ref: string;
  loc: Loc;
  sources: string[];
};

async function readPdf(file: string): Promise<string> {
  const { PDFParse }: any = await import("pdf-parse");
  const buf = fs.readFileSync(path.join(DIR, file));
  const p = new PDFParse({ data: new Uint8Array(buf) });
  const r = await p.getText();
  return r.text ?? "";
}

function parseRows(text: string, source: string, raw: Rec[]) {
  for (const line of text.split("\n")) {
    const f = line.split("\t").map((x) => x.trim());
    if (f.length < 4) continue;
    if (!/^\d+$/.test(f[0])) continue; // must start with index
    const ai = f.findIndex((x) => ACCT.test(x.replace(/\D/g, "")) && x.replace(/\D/g, "").length === 10);
    if (ai < 3) continue; // need at least name+address before account
    const acct = f[ai].replace(/\D/g, "");
    if (!acct.startsWith("41")) continue; // customers only
    const name = f[1];
    const before = f[ai - 1];
    let phone: string | null = null;
    let ref: string;
    if (isPhoneLike(before) && !ACCT.test(before.replace(/\D/g, ""))) {
      phone = before.replace(/\D/g, "");
      ref = f.slice(2, ai - 1).join(" ").trim();
    } else {
      ref = f.slice(2, ai).join(" ").trim();
    }
    if (ref === "0") ref = "";
    if (phone === "0" || (phone && phone.length < 6)) phone = null;
    if (isJunkName(name)) continue;
    raw.push({
      name: fixArabic(name),
      phone,
      ref: fixArabic(ref),
      loc: matchLocation(ref),
      sources: [source],
    });
  }
}

async function main() {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".pdf"));
  const raw: Rec[] = [];
  const perFile: Record<string, number> = {};
  for (const file of files) {
    const before = raw.length;
    const text = await readPdf(file);
    parseRows(text, file, raw);
    perFile[file] = raw.length - before;
  }

  // Dedup by normalized name + phone digits.
  const map = new Map<string, Rec>();
  for (const r of raw) {
    const key = norm(r.name) + "|" + (r.phone ?? "");
    const ex = map.get(key);
    if (!ex) {
      map.set(key, r);
    } else {
      // merge: prefer a record that has a location/phone/ref
      if (!ex.loc.governorate && r.loc.governorate) ex.loc = r.loc;
      if (!ex.phone && r.phone) ex.phone = r.phone;
      if (!ex.ref && r.ref) ex.ref = r.ref;
      if (!ex.sources.includes(r.sources[0])) ex.sources.push(r.sources[0]);
    }
  }
  const customers = [...map.values()];

  fs.writeFileSync(
    path.join(DIR, "parsed-customers.json"),
    JSON.stringify(customers, null, 0)
  );

  // ---- Summary ----
  const withPhone = customers.filter((c) => c.phone).length;
  const withLoc = customers.filter((c) => c.loc.governorate).length;
  const byGov: Record<string, number> = {};
  for (const c of customers)
    if (c.loc.governorate) byGov[c.loc.governorate] = (byGov[c.loc.governorate] ?? 0) + 1;

  console.log("=== PER FILE (customer rows parsed, pre-dedup) ===");
  for (const [k, v] of Object.entries(perFile)) console.log(`  ${v}\t${k}`);
  console.log(`\nRaw customer rows: ${raw.length}`);
  console.log(`After de-dup:      ${customers.length}`);
  console.log(`With phone:        ${withPhone}`);
  console.log(`With location:     ${withLoc}`);
  console.log("\nBy governorate:");
  for (const [g, n] of Object.entries(byGov).sort((a, b) => b[1] - a[1])) console.log(`  ${n}\t${g}`);

  console.log("\n=== SAMPLE (25) ===");
  for (const c of customers.slice(0, 25)) {
    const loc = [c.loc.subDistrict, c.loc.district, c.loc.governorate].filter(Boolean).join(", ") || "—";
    console.log(`  ${c.name} | ${c.phone ?? "—"} | ${loc} | ref:${c.ref || "—"}`);
  }
  console.log("\nWrote import/parsed-customers.json");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
