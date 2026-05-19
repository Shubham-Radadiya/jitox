const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function twoDigits(n) {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o ? `${TENS[t]} ${ONES[o]}` : TENS[t];
}

function threeDigits(n) {
  if (n === 0) return "";
  if (n < 100) return twoDigits(n);
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return rest ? `${ONES[h]} Hundred ${twoDigits(rest)}` : `${ONES[h]} Hundred`;
}

function indianChunkWords(n) {
  if (n === 0) return "";
  if (n < 100) return twoDigits(n);
  if (n < 1000) return threeDigits(n);
  const th = Math.floor(n / 1000);
  const rest = n % 1000;
  const head = indianChunkWords(th);
  const tail = threeDigits(rest);
  return tail ? `${head} Thousand ${tail}` : `${head} Thousand`;
}

/**
 * Amount in words (Indian numbering: Lakh, Crore). Appends "Only".
 * @param {number|string} amount
 */
export function amountInWordsIndian(amount) {
  const raw = String(amount ?? "").replace(/,/g, "").trim();
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n < 0) return "—";
  if (n === 0) return "Zero Only";

  let remaining = n;
  const parts = [];

  if (remaining >= 10000000) {
    const c = Math.floor(remaining / 10000000);
    parts.push(`${indianChunkWords(c)} Crore`);
    remaining %= 10000000;
  }
  if (remaining >= 100000) {
    const l = Math.floor(remaining / 100000);
    parts.push(`${indianChunkWords(l)} Lakh`);
    remaining %= 100000;
  }
  if (remaining >= 1000) {
    const t = Math.floor(remaining / 1000);
    parts.push(`${indianChunkWords(t)} Thousand`);
    remaining %= 1000;
  }
  if (remaining > 0) {
    parts.push(threeDigits(remaining));
  }

  return `${parts.join(" ").replace(/\s+/g, " ").trim()} Only`;
}
