// Life Path guide pages (/guides/life-path-number/<n>). Each page gives a
// genuine overview of the number, then shows what only a personal reading can
// add (the other core numbers, timing, compatibility), so readers who want the
// full picture book a plan. Wording stays in "numerology says / traditionally"
// territory: self-insight, not prediction or advice.
import { NUMBER_MEANINGS } from "@/lib/numerology";

export type LifePathGuide = {
  number: number;
  title: string; // "The Seeker"
  keywords: string[];
  overview: string[];
  strengths: string[];
  challenges: string[];
  love: string;
  career: string;
  careerFields: string[];
  /** Stone slugs (Category.slug) traditionally paired with this number. */
  crystals: string[];
  /** Numbers that often feel naturally easy together; a teaser, the reading does the real comparison. */
  harmonious: number[];
  /** What a personal reading reveals that this page can't. Sells the plans. */
  readingHooks: string[];
};

const guides: Omit<LifePathGuide, "title">[] = [
  {
    number: 1,
    keywords: ["independence", "leadership", "ambition", "new beginnings"],
    overview: [
      "Life Path 1 is the number of the pioneer. People born on this path tend to arrive with a strong sense of self and a quiet (or not so quiet) need to do things their own way. One is the first number, and it carries the energy of beginnings: starting businesses, setting trends and stepping into the unknown before anyone else does.",
      "The lesson of the 1 is learning to lead without standing alone. When the drive for independence is balanced with openness to others, a Life Path 1 becomes the person others naturally follow.",
    ],
    strengths: ["Self-motivated and decisive", "Original thinker who trusts their instincts", "Courageous when starting something new", "Natural confidence that inspires others", "Determined to finish what they begin"],
    challenges: ["Impatience with slower people or processes", "Finding it hard to ask for help", "Can come across as stubborn or self-focused", "Restless when not in control of their own direction"],
    love: "In relationships, a 1 needs a partner who respects their independence and has a strong identity of their own. They love deeply but show it through action and protection rather than words. Space to grow, and a partner who cheers them on rather than competes, makes all the difference.",
    career: "Ones do best where they can lead, build or work for themselves. Rigid hierarchies tend to frustrate them; ownership and responsibility bring out their best.",
    careerFields: ["Entrepreneurship", "Management and leadership", "Design and innovation", "Sales and business development", "Freelance or self-employed work"],
    crystals: ["sunstone", "tiger-eye", "citrine"],
    harmonious: [3, 5],
    readingHooks: [
      "Your Expression number, which shows whether your talents support your drive to lead or pull you in another direction",
      "Your Soul Urge, the private motivation behind your ambition that most 1s never put into words",
      "The years when your Personal Year cycle favours launching something new, and the years to consolidate",
      "How your full chart compares with a partner's, beyond the Life Path alone",
    ],
  },
  {
    number: 2,
    keywords: ["harmony", "intuition", "partnership", "diplomacy"],
    overview: [
      "Life Path 2 is the peacemaker. Twos are sensitive to the moods and needs of the people around them, often sensing tension in a room before a word is spoken. Their gift is bringing people together, smoothing conflict and seeing both sides of every story.",
      "The journey of the 2 is learning that their own needs matter as much as everyone else's. When a 2 values themselves as highly as they value others, their natural intuition becomes a real strength.",
    ],
    strengths: ["Deeply empathetic and caring", "Excellent listener and mediator", "Patient, tactful and cooperative", "Strong intuition about people", "Loyal friend and partner"],
    challenges: ["Avoiding conflict even when it's needed", "Taking criticism very personally", "Putting others first until they feel drained", "Indecision when trying to please everyone"],
    love: "Relationships are central to a 2's life. They are devoted, romantic partners who notice the small things. They flourish with someone who offers emotional security and openly appreciates them, and struggle with partners who are cold or unpredictable.",
    career: "Twos shine in roles built on cooperation and care. They are the colleague who holds a team together and the advisor people trust with sensitive matters.",
    careerFields: ["Counselling and coaching", "Human resources", "Teaching and childcare", "Healthcare and therapy", "Mediation and client relations"],
    crystals: ["moonstone", "rose-quartz", "selenite"],
    harmonious: [6, 8],
    readingHooks: [
      "Your Expression number, which shows how your sensitivity can become a professional strength",
      "Your Soul Urge, revealing what you truly need from a partner (often different from what 2s ask for)",
      "Your Personal Year forecast, so you know which months suit big relationship or career decisions",
      "A compatibility overview based on both full charts, not just Life Paths",
    ],
  },
  {
    number: 3,
    keywords: ["creativity", "expression", "joy", "communication"],
    overview: [
      "Life Path 3 is the creator and communicator. Threes are expressive, imaginative and often the warmth in any gathering. Words, art, music, humour: a 3 needs an outlet, and when they have one, they light up everyone around them.",
      "The challenge for a 3 is focus. With so many ideas and interests, the lesson is choosing a few to develop fully, and expressing deeper feelings rather than hiding them behind a smile.",
    ],
    strengths: ["Creative and full of ideas", "Charming, witty communicator", "Optimistic and uplifting", "Socially confident", "Inspires others to express themselves"],
    challenges: ["Scattering energy across too many projects", "Avoiding difficult emotions with humour", "Sensitivity to criticism of their work", "Inconsistency when bored"],
    love: "Threes are playful, affectionate partners who need fun and conversation in a relationship. They are drawn to people who appreciate their creativity and give them room to socialise. Emotional honesty, on both sides, is what turns romance into something lasting.",
    career: "A 3 thrives anywhere self-expression is part of the job. Repetitive, isolated work drains them quickly.",
    careerFields: ["Writing and content creation", "Design, art and photography", "Performing arts and media", "Marketing and social media", "Teaching and public speaking"],
    crystals: ["citrine", "sunstone", "turquoise"],
    harmonious: [1, 5, 9],
    readingHooks: [
      "Your Expression number, pinpointing which creative path suits you best",
      "Your Soul Urge, explaining what makes you feel truly fulfilled, not just entertained",
      "The Personal Year cycles that favour putting your work out into the world",
      "A career and life purpose deep dive to turn talent into direction",
    ],
  },
  {
    number: 4,
    keywords: ["stability", "discipline", "hard work", "foundations"],
    overview: [
      "Life Path 4 is the builder. Fours are practical, dependable and methodical. They see what needs to be done and do it properly, step by step. Families, teams and businesses lean on 4s because they create the structure everything else stands on.",
      "The lesson of the 4 is flexibility. Life does not always follow the plan, and a 4 grows the most when they learn to trust the process even when it changes.",
    ],
    strengths: ["Reliable and hardworking", "Organised, with excellent attention to detail", "Honest and loyal", "Patient with long-term goals", "Builds lasting security"],
    challenges: ["Resistance to sudden change", "Can be overly cautious or rigid", "Working too hard and resting too little", "Difficulty expressing feelings openly"],
    love: "Fours show love through commitment and consistency. They are steady, faithful partners who build a home and a future step by step. They need trust and stability, and appreciate a partner who brings a little spontaneity without upending their world.",
    career: "Fours excel where precision, planning and persistence matter. They are the people who turn plans into reality.",
    careerFields: ["Engineering and architecture", "Finance and accounting", "Project management", "Law and administration", "Skilled trades and craftsmanship"],
    crystals: ["pyrite", "black-agate", "red-jasper"],
    harmonious: [2, 7, 8],
    readingHooks: [
      "Your Expression number, showing where your discipline will pay off the most",
      "Your Soul Urge, which often reveals a creative or adventurous side many 4s keep hidden",
      "A Personal Year and monthly forecast to plan big moves around your natural cycles",
      "Career and life purpose guidance in a live session with your numerologist",
    ],
  },
  {
    number: 5,
    keywords: ["freedom", "adventure", "change", "curiosity"],
    overview: [
      "Life Path 5 is the explorer. Fives crave freedom, variety and experience. They learn by doing, travelling and trying everything at least once. Adaptable and quick-thinking, they are at their best when life is moving.",
      "The lesson of the 5 is using freedom wisely. When a 5 finds commitments that feel like a choice rather than a cage, their energy becomes a powerful force for change.",
    ],
    strengths: ["Adaptable and resourceful", "Curious, quick learner", "Adventurous and brave", "Magnetic, persuasive personality", "Thrives on change others find stressful"],
    challenges: ["Restlessness and boredom with routine", "Difficulty with long-term commitment", "Impulsive decisions", "Overindulgence when life feels dull"],
    love: "Fives are exciting, generous partners who need a relationship that feels like an adventure. They do best with someone secure enough to give them space and curious enough to join them. Trust and freedom are what keep a 5 committed.",
    career: "Fives need variety, movement and people. Careers with travel, new challenges or constant learning suit them far better than desk-bound routine.",
    careerFields: ["Travel and tourism", "Sales and marketing", "Journalism and media", "Entrepreneurship", "Events, hospitality and performance"],
    crystals: ["turquoise", "green-aventurine", "tiger-eye"],
    harmonious: [1, 3, 7],
    readingHooks: [
      "Your Expression number, showing how to channel restless energy into real achievement",
      "Your Soul Urge, revealing the kind of freedom you actually need",
      "Your Personal Year forecast: when to travel, change direction or settle",
      "A compatibility overview to understand which partners give you room to grow",
    ],
  },
  {
    number: 6,
    keywords: ["love", "responsibility", "family", "nurturing"],
    overview: [
      "Life Path 6 is the nurturer. Sixes are warm, responsible and devoted to the people they love. Home and family sit at the centre of their world, and they are often the person everyone turns to for care, advice or a good meal.",
      "The lesson of the 6 is balance. A 6 grows when they learn that caring for others does not mean carrying everyone's problems, and that they deserve the same kindness they give.",
    ],
    strengths: ["Loving, generous and protective", "Strong sense of responsibility", "Creates beauty and harmony at home", "Excellent at caring and healing", "Loyal through good times and bad"],
    challenges: ["Taking on too much for others", "Perfectionism and high expectations", "Worrying about loved ones", "Struggling to accept help in return"],
    love: "Sixes are among the most devoted partners in numerology. They want a committed, loving home and give their whole heart to it. They flourish with a partner who appreciates them and shares the responsibilities, rather than leaning on them entirely.",
    career: "Sixes are fulfilled by work that helps, heals or beautifies. Roles where they can care for people or create something lovely suit them best.",
    careerFields: ["Healthcare and nursing", "Teaching and counselling", "Interior design and decor", "Hospitality and food", "Social work and community service"],
    crystals: ["rose-quartz", "green-jade", "moonstone"],
    harmonious: [2, 9],
    readingHooks: [
      "Your Expression number, showing how to turn your caring nature into a fulfilling career",
      "Your Soul Urge, revealing what you need for yourself, not just for others",
      "Your Personal Year forecast for family, home and relationship decisions",
      "A compatibility overview based on both full charts",
    ],
  },
  {
    number: 7,
    keywords: ["wisdom", "introspection", "spirituality", "truth"],
    overview: [
      "Life Path 7 is the seeker. Sevens are thinkers, analysts and spiritual explorers. They are not satisfied with surface answers; they want to understand how things really work, whether that's science, philosophy or the mysteries of life itself.",
      "Sevens often feel a little different from the people around them. Their lesson is learning to trust others and share their inner world, so their wisdom can be felt as well as known.",
    ],
    strengths: ["Deep, analytical mind", "Strong intuition and spiritual awareness", "Independent researcher and learner", "Calm and thoughtful under pressure", "Values truth and authenticity"],
    challenges: ["Withdrawing or isolating when overwhelmed", "Scepticism and difficulty trusting", "Overthinking instead of acting", "Feeling misunderstood"],
    love: "Sevens need a partner who respects their need for quiet time and can meet them in deep conversation. They don't open up quickly, but once they trust someone, their loyalty runs deep. Small talk bores them; meaningful connection is everything.",
    career: "Sevens do their best work where they can research, specialise and think independently. Noisy, shallow environments wear them out.",
    careerFields: ["Research and science", "Technology and data", "Psychology and philosophy", "Writing and academia", "Spiritual and healing practices"],
    crystals: ["amethyst", "lapis-lazuli", "clear-quartz"],
    harmonious: [4, 5],
    readingHooks: [
      "Your Expression number, showing how to share your insight with the world",
      "Your Soul Urge, explaining the inner longing many 7s spend years trying to name",
      "Your Personal Year cycle: when to study and withdraw, and when to step forward",
      "A live session to explore life purpose questions in depth",
    ],
  },
  {
    number: 8,
    keywords: ["abundance", "power", "ambition", "achievement"],
    overview: [
      "Life Path 8 is the achiever. Eights are ambitious, capable and built for success in the material world. They understand money, authority and how to make things happen at scale, and they are rarely afraid of a big goal.",
      "The lesson of the 8 is balance between the material and the personal. When an 8 uses their power generously and makes time for the people they love, success becomes deeply fulfilling.",
    ],
    strengths: ["Strategic, business-minded thinker", "Confident leader and decision-maker", "Resilient after setbacks", "Excellent with money and resources", "Driven to build something significant"],
    challenges: ["Workaholism", "Can appear controlling or intense", "Measuring worth by achievement", "Difficulty showing vulnerability"],
    love: "Eights are loyal, protective partners who want to provide well for the people they love. They are drawn to confident, independent partners and need someone who understands their ambition, while gently reminding them to slow down and enjoy what they've built.",
    career: "Eights thrive in leadership, business and finance, anywhere results are rewarded. They often rise to the top of whatever field they choose.",
    careerFields: ["Business ownership", "Finance, banking and investment", "Executive management", "Real estate", "Law and politics"],
    crystals: ["pyrite", "tiger-eye", "citrine"],
    harmonious: [2, 4, 6],
    readingHooks: [
      "Your Expression number, revealing the field where your ambition pays off best",
      "Your Soul Urge, showing what success actually needs to look like for you to feel fulfilled",
      "Your Personal Year forecast: the years for expansion, and the years for caution",
      "A career and life purpose deep dive in a live session",
    ],
  },
  {
    number: 9,
    keywords: ["compassion", "wisdom", "idealism", "completion"],
    overview: [
      "Life Path 9 is the humanitarian. Nines carry an old-soul quality: compassionate, wise and concerned with the bigger picture. They feel drawn to make a difference, whether through art, service, teaching or simply the way they treat people.",
      "Nine is the last single number, the number of completion. The lesson of the 9 is letting go: of the past, of old hurts and of the need to save everyone, so they can give from a full heart.",
    ],
    strengths: ["Generous and compassionate", "Broad-minded and accepting", "Creative and artistic", "Inspiring idealist", "Wise beyond their years"],
    challenges: ["Holding on to the past", "Giving until they are depleted", "Disappointment when others fall short of their ideals", "Keeping their own needs hidden"],
    love: "Nines love with great depth and generosity, and often attract people who need their help. They do best with a partner who shares their values and gives back as much as they receive, so love becomes a partnership, not a mission.",
    career: "Nines are fulfilled by meaningful work that serves something larger than themselves. Purpose matters more to them than status.",
    careerFields: ["Charity and non-profit work", "Teaching and mentoring", "Arts and creative work", "Healthcare and healing", "Law, advocacy and social causes"],
    crystals: ["amethyst", "howlite", "rose-quartz"],
    harmonious: [3, 6],
    readingHooks: [
      "Your Expression number, showing the specific way you are meant to make a difference",
      "Your Soul Urge, revealing what you need to feel personally fulfilled",
      "Your Personal Year forecast, especially important for 9s in a year of endings",
      "A compatibility overview to see which relationships truly nourish you",
    ],
  },
  {
    number: 11,
    keywords: ["intuition", "inspiration", "spiritual insight", "sensitivity"],
    overview: [
      "Life Path 11 is the first master number, the intuitive. Elevens carry a heightened sensitivity and inspiration, often sensing things before they happen and understanding people at a level that surprises them. Many feel a calling to guide, teach or inspire.",
      "Master numbers bring both gifts and pressure. An 11 also carries the gentle energy of the 2 (1 + 1), and their lesson is grounding their sensitivity so it uplifts them rather than overwhelms them.",
    ],
    strengths: ["Powerful intuition", "Inspiring presence", "Creative and visionary", "Deep empathy", "Spiritual awareness"],
    challenges: ["Nervous energy and anxiety", "Self-doubt despite real talent", "Feeling overwhelmed by others' emotions", "Swinging between high ideals and discouragement"],
    love: "Elevens seek a soul-level connection. They are devoted, intuitive partners who need someone patient, grounded and emotionally safe. A partner who understands their sensitivity, rather than dismissing it, helps an 11 flourish.",
    career: "Elevens shine in work that lets them inspire, heal or create. They are often drawn to spiritual, artistic or helping professions.",
    careerFields: ["Healing and counselling", "Teaching and spiritual guidance", "Arts, music and writing", "Psychology", "Inspirational speaking"],
    crystals: ["selenite", "moonstone", "amethyst"],
    harmonious: [2, 22],
    readingHooks: [
      "How your master number interacts with your Expression and Soul Urge numbers",
      "When to live fully as an 11, and when the grounding 2 energy serves you better",
      "Your Personal Year forecast, so your sensitivity works with your timing",
      "A live session with your numerologist to explore your calling",
    ],
  },
  {
    number: 22,
    keywords: ["vision", "mastery", "building legacy", "practical idealism"],
    overview: [
      "Life Path 22 is the master builder, often called the most powerful number in numerology. Twenty-twos combine the vision of the 11 with the practicality of the 4 (2 + 2). They have the rare ability to turn big dreams into real, lasting structures.",
      "With great potential comes great responsibility. The lesson of the 22 is patience: building a legacy takes time, and they grow by trusting their vision without being crushed by the weight of it.",
    ],
    strengths: ["Visionary and practical at once", "Exceptional organiser and leader", "Thinks on a large scale", "Disciplined and determined", "Builds things that outlast them"],
    challenges: ["Pressure to live up to their potential", "Perfectionism", "Overwork and burnout", "Frustration when progress is slow"],
    love: "Twenty-twos are steady, dedicated partners who want to build a meaningful life with someone. They need a partner who supports their big goals and helps them rest. Shared vision and mutual respect are the foundation of their best relationships.",
    career: "Twenty-twos are drawn to large projects: building organisations, systems or communities. They do well wherever vision and execution meet.",
    careerFields: ["Business founding and leadership", "Architecture and engineering", "Politics and public service", "International work and NGOs", "Large-scale project management"],
    crystals: ["clear-quartz", "obsidian", "green-jade"],
    harmonious: [4, 11],
    readingHooks: [
      "How your master number works with your other core numbers",
      "When to step into the full 22 vision and when to rely on the steady 4",
      "Your Personal Year forecast for timing major projects",
      "A career and life purpose deep dive in a live session",
    ],
  },
  {
    number: 33,
    keywords: ["compassion", "teaching", "healing", "unconditional love"],
    overview: [
      "Life Path 33 is the master teacher, the rarest of the master numbers. Thirty-threes carry a powerful nurturing energy, combining the creativity of the 3 with the care of the 6 (3 + 3). They are often drawn to heal, teach and uplift others.",
      "The lesson of the 33 is to serve without losing themselves. Their compassion is a gift, and it shines brightest when they also care for their own wellbeing.",
    ],
    strengths: ["Deep compassion", "Natural teacher and healer", "Creative and expressive", "Selfless and devoted", "Uplifts everyone around them"],
    challenges: ["Self-sacrifice", "Taking on others' burdens", "Very high standards for themselves", "Emotional overwhelm"],
    love: "Thirty-threes love unconditionally and give generously in relationships. They need a partner who offers the same care in return and helps them set healthy boundaries. Kindness and emotional depth matter far more to them than status or excitement.",
    career: "Thirty-threes are fulfilled by work that heals, teaches or inspires. They often find their purpose in service-led or creative careers.",
    careerFields: ["Teaching and mentoring", "Healing and wellness", "Counselling and social work", "Arts and creative expression", "Community leadership"],
    crystals: ["rose-quartz", "selenite", "green-aventurine"],
    harmonious: [6, 9],
    readingHooks: [
      "Whether your chart supports living fully as a 33, or through its 6 energy",
      "Your Expression and Soul Urge numbers and how they shape your calling",
      "Your Personal Year forecast for timing your plans",
      "A live session to explore your life purpose in depth",
    ],
  },
];

export const LIFE_PATH_GUIDES: LifePathGuide[] = guides.map((g) => ({ ...g, title: NUMBER_MEANINGS[g.number].title }));

export const LIFE_PATH_NUMBERS = LIFE_PATH_GUIDES.map((g) => g.number);

export function getLifePathGuide(n: number): LifePathGuide | null {
  return LIFE_PATH_GUIDES.find((g) => g.number === n) ?? null;
}

export function lifePathPath(n: number): string {
  return `/guides/life-path-number/${n}`;
}

/** Life Path numbers that list a stone among their crystals (for the crystal pages). */
export function lifePathsForCrystal(slug: string): number[] {
  return LIFE_PATH_GUIDES.filter((g) => g.crystals.includes(slug)).map((g) => g.number);
}
