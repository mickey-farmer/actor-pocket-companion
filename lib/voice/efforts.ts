/**
 * Efforts & barks reference for game/animation VO.
 *
 * "Efforts" are the non-verbal vocal sounds a character makes (attacks, hits,
 * deaths, jumps, breaths); "barks" are short, repeatable in-game callouts.
 * Game sessions often record long lists of both, and they're the part of VO
 * most likely to injure a voice — so each category carries technique and
 * safety notes, not just prompts.
 */

export interface EffortCategory {
  id: string;
  name: string;
  summary: string;
  technique: string[];
  /** Drill prompts — each is one thing to perform. */
  prompts: string[];
  /** Relative vocal load, used to warn and to suggest logging the session. */
  load: 'light' | 'moderate' | 'heavy';
}

export const EFFORT_CATEGORIES: EffortCategory[] = [
  {
    id: 'breaths',
    name: 'Breaths & small sounds',
    summary:
      'Inhales, exhales, sighs, sniffs, swallows and throat-clears — the glue that makes a character feel alive between lines.',
    technique: [
      'Keep them specific: a breath is a reaction to something. Decide what.',
      'Stay on-mic and slightly off-axis so breaths don’t pop.',
      'Loud gasps are air, not voice — keep the throat open and relaxed.',
    ],
    prompts: [
      'Surprised gasp — something just jumped out at you',
      'Relieved exhale — the bomb didn’t go off',
      'Exhausted breathing after climbing stairs (5 seconds)',
      'Nervous shaky inhale before speaking',
      'Frustrated sigh at a teammate',
      'Quiet sniff — trying not to cry',
      'Holding breath underwater, then surfacing',
      'Stifled laugh you’re trying to hide',
    ],
    load: 'light',
  },
  {
    id: 'reactions',
    name: 'Reactions & emotes',
    summary:
      'Laughs, cries, surprise, disgust, thinking sounds, agreement and disagreement grunts — often requested in sets for emotes and cutscenes.',
    technique: [
      'Play the cause, not the sound: find what’s funny before you laugh.',
      'Give variety in a set: short/long, small/big, different pitches.',
      'Crying and sobbing are mostly breath and rhythm — don’t squeeze.',
    ],
    prompts: [
      'Small amused chuckle',
      'Big villainous laugh (support from the body — no throat squeeze)',
      'Disgusted “ugh” — you stepped in something',
      'Thinking “hmm…” while solving a puzzle',
      'Agreeing “mm-hm” — casual',
      'Skeptical “huh?”',
      'Delighted squeal — you found treasure',
      'Quiet crying that’s trying to stay hidden',
      'Startled yelp',
    ],
    load: 'moderate',
  },
  {
    id: 'exertion',
    name: 'Exertion & movement',
    summary:
      'Jumps, climbs, vaults, pushing, pulling, lifting and landing — the traversal set every playable character needs.',
    technique: [
      'Engage the body for real: push against a wall, crouch, lift something light.',
      'Let effort come from the core and breath, with an open throat.',
      'Give short, medium and long versions — games need variety to avoid repetition.',
    ],
    prompts: [
      'Small hop',
      'Big jump across a gap',
      'Landing hard after a fall',
      'Pulling yourself up a ledge',
      'Pushing a heavy crate — 3-second strain',
      'Lifting something heavy overhead',
      'Vaulting over a low wall',
      'Rolling to dodge',
      'Catching your breath after sprinting',
    ],
    load: 'moderate',
  },
  {
    id: 'attacks',
    name: 'Attacks',
    summary:
      'Light, medium and heavy attack efforts, plus special moves. Usually recorded in sets of several variations each.',
    technique: [
      'Think of hitting through the target: the sound has a direction.',
      'Light attacks are short and clipped; heavies have wind-up and release.',
      'Distortion and grit should come from safe technique (false-fold/distortion placement), not a squeezed throat. Stop if anything scratches or hurts.',
      'Do the biggest attacks toward the end of the session, after you’re warm — and space them out.',
    ],
    prompts: [
      'Light attack — quick jab (3 variations)',
      'Medium attack — sword slash (3 variations)',
      'Heavy attack — overhead hammer swing with wind-up',
      'Charging a special move, then release',
      'Throwing a grenade',
      'Combo: light, light, heavy',
      'Tired attack late in a long fight',
      'Kick',
    ],
    load: 'heavy',
  },
  {
    id: 'pain',
    name: 'Pain & hits',
    summary:
      'Taking damage: light, medium and heavy hits, burning, poison, falling damage, and being knocked down.',
    technique: [
      'Pain is a reaction: the breath is knocked out of you before any sound.',
      'Vary the part of the body hit — a gut punch and a stubbed toe sound different.',
      'Big pain screams are heavy load; keep them supported and limited in number.',
    ],
    prompts: [
      'Light hit — glancing blow',
      'Medium hit — punched in the stomach',
      'Heavy hit — knocked off your feet',
      'Burning — sustained pain (3 seconds)',
      'Poisoned — weakening, sick',
      'Falling damage on landing',
      'Getting up after being knocked down',
      'Being grabbed and struggling',
    ],
    load: 'heavy',
  },
  {
    id: 'deaths',
    name: 'Deaths',
    summary:
      'Quick deaths, long deaths, and knockouts. Often the most taxing items on the list — schedule them last.',
    technique: [
      'Decide how they die: a quick drop, a long fade, a shock.',
      'The final breath out does most of the work — you don’t need volume.',
      'Treat a long death scream like any scream: support, open throat, limited reps.',
    ],
    prompts: [
      'Quick death — instantly defeated',
      'Long death — slowly fading',
      'Surprised death — didn’t see it coming',
      'Falling off a cliff (trailing away)',
      'Knocked out, not dead',
      'Defiant last breath',
    ],
    load: 'heavy',
  },
  {
    id: 'barks',
    name: 'Barks & callouts',
    summary:
      'Short, repeatable in-game lines: enemy spotted, reloading, low health, taking cover, ability ready. Recorded many times with variations so they don’t sound canned.',
    technique: [
      'Match the situation’s distance: a whisper to a squadmate vs. shouting across a map.',
      'Barks repeat constantly in play — keep them clean and not over-acted.',
      'Record 3+ variations of each with different reads and intensities.',
    ],
    prompts: [
      'Enemy spotted!',
      'Reloading!',
      'I need healing!',
      'Taking cover!',
      'Ability ready.',
      'Target down.',
      'On my way.',
      'Low on ammo!',
      'Over here!',
      'Stealth: “Did you hear that?”',
    ],
    load: 'moderate',
  },
  {
    id: 'walla',
    name: 'Walla & crowd',
    summary:
      'Background crowd voices — murmur, reactions, and small unscripted lines for scenes and game worlds. Specific to the location, never real words that pop out.',
    technique: [
      'Build a mini-character and situation first (a vendor, a guard, a gossip).',
      'Improvise specific but unobtrusive content; avoid names and anything that would distract.',
      'Change voice, age and energy between passes so the crowd feels full.',
    ],
    prompts: [
      'Market vendor calling out wares (10 seconds)',
      'Gossiping at a tavern table',
      'Crowd reacting to a surprise announcement',
      'Soldier grumbling at camp',
      'Worried townsperson during an attack',
      'Kids playing in the street',
    ],
    load: 'moderate',
  },
];

export const VOCAL_SAFETY_NOTES = [
  'Warm up before any efforts session, and cool down after.',
  'Order your list light to heavy: breaths and reactions first, attacks and deaths last.',
  'Hydrate, and keep water within reach throughout.',
  'Pain, scratchiness, or a voice that “catches” is a stop sign, not something to push through.',
  'You can ask to spread screams across sessions, or do fewer reps. Pros do.',
  'Hoarseness that lasts more than two weeks, or any sudden voice change after a hard session, is a reason to see an ENT or laryngologist.',
];

export const WARMUP_STEPS: { title: string; detail: string; seconds: number }[] = [
  {
    title: 'Body release',
    detail: 'Roll shoulders and neck gently, stretch arms overhead, shake out. Loosen the jaw with a slow yawn.',
    seconds: 60,
  },
  {
    title: 'Breath',
    detail: 'Low, easy breaths into the belly and back. Exhale on a long, steady “sss” — count how long you can sustain it without strain.',
    seconds: 60,
  },
  {
    title: 'Lip trills',
    detail: 'Trill the lips (a “brrr”) on a comfortable pitch, then glide up and down gently.',
    seconds: 60,
  },
  {
    title: 'Straw phonation',
    detail: 'Hum through a straw (or on a “vvv”/“zzz”) sliding through your range. Easy volume — this balances the voice without effort.',
    seconds: 90,
  },
  {
    title: 'Sirens',
    detail: 'Glide from low to high and back on “ng” or “oo”. Smooth, no pushing at the top.',
    seconds: 60,
  },
  {
    title: 'Resonance & placement',
    detail: 'Hum “mmm” and feel the buzz in the lips and face; open to “mah-may-mee-moh-moo”. Visit the placements your characters use.',
    seconds: 60,
  },
  {
    title: 'Articulation',
    detail: 'Tongue twisters, crisp and fast: “Red leather, yellow leather”, “Unique New York”, “Toy boat”.',
    seconds: 60,
  },
  {
    title: 'Character check-in',
    detail: 'Speak a sample line in each voice you’re recording today, starting with the easiest and ending with the most extreme.',
    seconds: 60,
  },
];
