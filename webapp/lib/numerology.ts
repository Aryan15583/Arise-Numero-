// Ported verbatim from the original main.js numerology calculator.
// Pythagorean letter-value system.

const PYTH: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
};

const VOWELS = new Set(["A", "E", "I", "O", "U"]);

function reduceNum(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n)
      .split("")
      .reduce((s, d) => s + parseInt(d, 10), 0);
  }
  return n;
}

export function calcLifePath(dob: string): number {
  const [y, m, d] = dob.split("-").map(Number);
  const mR = reduceNum(m);
  const dR = reduceNum(d);
  const yR = reduceNum(
    String(y)
      .split("")
      .reduce((s, c) => s + parseInt(c, 10), 0)
  );
  return reduceNum(mR + dR + yR);
}

export function calcExpression(name: string): number {
  const sum = name
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .split("")
    .reduce((s, c) => s + (PYTH[c] || 0), 0);
  return reduceNum(sum);
}

export function calcSoulUrge(name: string): number {
  const sum = name
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .split("")
    .filter((c) => VOWELS.has(c))
    .reduce((s, c) => s + (PYTH[c] || 0), 0);
  return reduceNum(sum);
}

export function calcBirthday(dob: string): number {
  const day = parseInt(dob.split("-")[2], 10);
  return reduceNum(day);
}

export const NUMBER_MEANINGS: Record<number, { title: string; desc: string }> = {
  1: { title: "The Leader", desc: "Independent, pioneering, and driven. You forge your own path with confidence and determination." },
  2: { title: "The Peacemaker", desc: "Diplomatic, empathetic, and cooperative. You excel at bringing harmony and understanding." },
  3: { title: "The Creator", desc: "Expressive, joyful, and imaginative. You inspire others through creativity and communication." },
  4: { title: "The Builder", desc: "Practical, disciplined, and reliable. You create lasting foundations through methodical effort." },
  5: { title: "The Explorer", desc: "Adventurous, versatile, and free-spirited. You thrive on change and new experiences." },
  6: { title: "The Nurturer", desc: "Compassionate, responsible, and caring. You find deep purpose in serving and protecting others." },
  7: { title: "The Seeker", desc: "Analytical, introspective, and spiritual. You are driven by a deep quest for truth and wisdom." },
  8: { title: "The Achiever", desc: "Ambitious, authoritative, and goal-oriented. You are built for material mastery and leadership." },
  9: { title: "The Humanitarian", desc: "Compassionate, idealistic, and giving. You are here to serve the greater good of humanity." },
  11: { title: "Master Intuitive", desc: "Highly sensitive and spiritually aware. You carry a powerful gift for insight and inspiration." },
  22: { title: "Master Builder", desc: "The most powerful number. You have the ability to turn visionary dreams into concrete reality." },
  33: { title: "Master Teacher", desc: "Pure expression of loving compassion. You are here to uplift and heal humanity through unconditional love." },
};

export function getMeaning(n: number) {
  return NUMBER_MEANINGS[n] || { title: `Number ${n}`, desc: "Your unique numeric energy carries its own powerful significance." };
}
