// Rudraksha guide (/guides/rudraksha). Meanings follow the commonly cited
// Vedic tradition: ruling deity, planet and traditional association. Mukhis
// we stock link to their product pages; the rest invite an enquiry.
export type MukhiGuide = {
  mukhi: number;
  deity: string;
  planet: string;
  meaning: string;
  /** Product id when we sell it. */
  productId?: string;
};

export const MUKHI_GUIDES: MukhiGuide[] = [
  { mukhi: 1, deity: "Lord Shiva", planet: "Sun", meaning: "The rarest and most revered bead, traditionally associated with focus, spiritual awareness and higher consciousness." },
  { mukhi: 2, deity: "Ardhanarishvara (Shiva and Parvati)", planet: "Moon", meaning: "Associated with unity, harmony in relationships and emotional balance." },
  { mukhi: 3, deity: "Agni (fire)", planet: "Mars", meaning: "Linked with confidence, energy and letting go of past burdens." },
  { mukhi: 4, deity: "Lord Brahma", planet: "Mercury", meaning: "Traditionally worn for knowledge, creativity, concentration and clear communication. A popular choice for students and professionals.", productId: "4-mukhi-rudraksha" },
  { mukhi: 5, deity: "Kalagni Rudra (Shiva)", planet: "Jupiter", meaning: "The most widely worn Rudraksha, associated with peace of mind, health and meditation. The classic bead for japa malas and everyday wear.", productId: "5-mukhi-rudraksha" },
  { mukhi: 6, deity: "Lord Kartikeya", planet: "Venus", meaning: "Associated with willpower, emotional stability and grounded confidence." },
  { mukhi: 7, deity: "Goddess Lakshmi", planet: "Saturn", meaning: "Traditionally worn for prosperity, abundance and overcoming financial obstacles." },
  { mukhi: 8, deity: "Lord Ganesha", planet: "Rahu", meaning: "Associated with removing obstacles and bringing success to new beginnings." },
  { mukhi: 9, deity: "Goddess Durga", planet: "Ketu", meaning: "Linked with courage, energy and inner strength." },
  { mukhi: 10, deity: "Lord Vishnu", planet: "No ruling planet", meaning: "Traditionally worn for protection and a sense of peace and security." },
  { mukhi: 11, deity: "Lord Hanuman", planet: "No ruling planet", meaning: "Associated with courage, wisdom and fearlessness." },
  { mukhi: 12, deity: "Surya (the Sun god)", planet: "Sun", meaning: "Linked with radiance, leadership and self-confidence." },
  { mukhi: 13, deity: "Kamadeva and Indra", planet: "Venus", meaning: "Associated with charm, attraction and fulfilling desires." },
  { mukhi: 14, deity: "Lord Hanuman / Shiva (Deva Mani)", planet: "Saturn", meaning: "A rare bead traditionally linked with intuition, foresight and protection." },
];

export const RUDRAKSHA_PATH = "/guides/rudraksha";
