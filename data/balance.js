// Progression, economy, encounter odds, and combat balance.
// Classic script: shared data only; no browser APIs or game-state mutations.

        // Element advantage web (each element beats two others):
        //   electric → water, fire
        //   fire     → grass, dark
        //   grass    → water, electric
        //   water    → fire, dark
        //   dark     → grass, electric
        const elementAdvantages = {
            electric: ['water',   'fire'    ],
            fire:     ['grass',   'dark'    ],
            grass:    ['water',   'electric'],
            water:    ['fire',    'dark'    ],
            dark:     ['grass',   'electric']
        };

        // ── Cost design notes (updated) ────────────────────────────────────────
        // Levels 1-3 stay cheap so new players unlock their first major quickly (same-day feel).
        // Levels 4-5 are 1.75-2× pricier to stretch mid/end-game timelines to ~5-6 days for
        // dedicated players (was 4 days) and ~2-3 weeks for casuals (was 14 days).
        // Three anchor majors (Readiness, Iron Will, Resonance) raised to reflect their power.
        // Grand total: ~38,500 coins (was 25,750). See economy analysis for full breakdown.
        const SKILL_TREE_DEFS = [
            {
                id: 'offense', name: 'Offense', icon: '⚔️', color: '#e74c3c',
                minors: [
                    { id: 'atk_up',        name: 'Battle Strength', icon: '💪', desc: '+3% ATK per level',           maxLevel: 5, costs: [100, 200, 300,  700, 1200] },
                    { id: 'ability_power', name: 'Ability Power',   icon: '✨', desc: '+4% ability damage per level', maxLevel: 5, costs: [150, 300, 450, 1000, 1500] }
                ],
                majors: [
                    { id: 'momentum',  name: 'Momentum',  icon: '💥', cost: 1200, requires: { atk_up: 3 },                    desc: '+8% damage on all attacks and abilities.' },
                    { id: 'readiness', name: 'Readiness', icon: '🎯', cost: 2000, requires: { atk_up: 5, ability_power: 3 },   desc: '+6% damage whenever an ability is armed.' }
                ]
            },
            {
                id: 'defense', name: 'Defense', icon: '🛡️', color: '#3498db',
                minors: [
                    { id: 'vitality',  name: 'Vitality',  icon: '❤️', desc: '+5% max HP per level',          maxLevel: 5, costs: [100, 200, 300,  700, 1200] },
                    { id: 'toughness', name: 'Toughness', icon: '🪨', desc: '+2% damage reduction per level', maxLevel: 5, costs: [150, 300, 450, 1000, 1500] }
                ],
                majors: [
                    { id: 'resilience', name: 'Resilience', icon: '🛡️', cost: 1000, requires: { vitality: 3 },               desc: '+10% max HP for all creatures in battle.' },
                    { id: 'iron_will',  name: 'Iron Will',  icon: '🔥', cost: 3500, requires: { vitality: 5, toughness: 3 },  desc: 'Each creature survives one fatal hit at 1 HP.' }
                ]
            },
            {
                id: 'progress', name: 'Progress', icon: '📚', color: '#2ecc71',
                minors: [
                    { id: 'training', name: 'Training', icon: '📖', desc: '+5% XP gained per level',          maxLevel: 5, costs: [ 75, 150, 225,  550,  900] },
                    { id: 'focus',    name: 'Focus',    icon: '🔍', desc: '+0.05× starting combo per level',  maxLevel: 5, costs: [100, 200, 300,  700, 1200] }
                ],
                majors: [
                    { id: 'swift',       name: 'Swift',       icon: '⚡', cost:  800, requires: { focus: 3 },    desc: 'Start each battle with an extra combo boost.' },
                    { id: 'mentor',      name: 'Mentor',      icon: '📚', cost: 1200, requires: { training: 3 }, desc: '+20% creature XP from every battle.' },
                    { id: 'persistence', name: 'Persistence', icon: '⏳', cost: 1500, requires: { focus: 5 },   desc: 'Empower and shield effects last one extra turn.' }
                ]
            },
            {
                id: 'fortune', name: 'Fortune', icon: '🍀', color: '#f1c40f',
                minors: [
                    { id: 'prosperity',  name: 'Prosperity',   icon: '✨', desc: '+5% Spirit rewards per level', maxLevel: 5, costs: [ 75, 150, 225,  550,  900] },
                    { id: 'hunters_eye', name: "Hunter's Eye", icon: '👁️', desc: '+3% catch rate per level',  maxLevel: 5, costs: [100, 200, 300,  700, 1200] }
                ],
                majors: [
                    { id: 'treasure_hunter', name: 'Treasure Hunter', icon: '💰', cost:  800, requires: { prosperity: 3 },                    desc: '+15% Spirit rewards from every battle.' },
                    { id: 'keen_eye',        name: 'Keen Eye',        icon: '👁️', cost:  500, requires: { hunters_eye: 3 },                   desc: '+15% catch rate on all creatures.' },
                    { id: 'resonance',       name: 'Resonance',       icon: '🌈', cost: 3000, requires: { prosperity: 5, hunters_eye: 5 },     desc: 'Team synergy bonuses 25% stronger.' }
                ]
            }
        ];

        // ===== SUMMON SYSTEM =====
        const SUMMON_RATES = { legendary: 0.02, epic: 0.13, rare: 0.35, common: 0.50 }; // coin (gold) rates

        const SUMMON_RATES_GEMS = { legendary: 0.10, epic: 0.40, rare: 0.50, common: 0.00 }; // premium gem rates — no commons

        const SUMMON_PITY  = 50;   // guaranteed legendary if not pulled within this many pulls

        const SUMMON_COSTS = { gems_single: 50, gems_ten: 450, coins_single: 1000 };

        const SUMMON_POOL  = {
            common:    [1,  4,  7, 10, 13, 21, 22, 24, 25, 27, 28, 30, 31, 33, 34],
            rare:      [2,  5,  8, 11, 14, 23, 26, 29, 32, 35],
            epic:      [3,  6,  9, 12, 15],
            legendary: [16, 17, 18, 19, 20]
        };

        const CREATURE_MAX_LEVEL = 30;

        // ===== EVOLUTION =====
        // Evolution is permanent, free, +10% stats per tier, stacks with merge. New sprite per tier.
        // Creatures can level freely to CREATURE_MAX_LEVEL — there is NO level gate blocking XP gain.
        // Evolution simply becomes available once a creature reaches the rarity-specific threshold.
        //   Common:    Evo 1 at Lv10,  Evo 2 at Lv20
        //   Rare:      Evo 1 at Lv13,  Evo 2 at Lv23
        //   Epic:      Evo 1 at Lv16,  Evo 2 at Lv26
        //   Legendary: Evo 1 at Lv20,  Evo 2 at Lv30
        // Legendaries are deliberately end-game material — reaching full evo2 stats right at the
        // level cap (30) is intentional, not an oversight.
        const EVO_GATES = {
            common:    [10, 20],
            rare:      [13, 23],
            epic:      [16, 26],
            legendary: [20, 30],
        };

        const EVO_STAT_MULT = 0.10;                       // +10% to all stats per evolution tier

        // Phase 8 — evolving now costs element essence of the creature's own element.
        // Base cost is keyed by RARITY (tier 1); tier 2 costs DOUBLE that same base.
        // (Existing evolved creatures are grandfathered — cost is only charged at the moment of evolving.)
        const EVO_ESSENCE_COST = { common: 15, rare: 20, epic: 25, legendary: 30 };

        // XP needed to go from `level` to `level+1`. Hand-tuned lookup table (NOT a formula) —
        // rebalanced 2026-07-22 to target ~150 same-level battles across the whole 1->30 climb,
        // rather than solving for a single power-law coefficient/exponent. Designed against the
        // battle-XP formula used everywhere else in the file (`round(20 + enemyLevel*6)` per
        // single same-level enemy, scaled by lineup size / boss / mode elsewhere):
        //   - Level 1->2 is a fast, single-battle onboarding step.
        //   - Levels 2->3 onward always take at least 2 battles (no more 1-battle levels beyond
        //     the very first) and climb smoothly through the midgame.
        //   - The hardest stretch (7 same-level battles/level) is levels 21->28, NOT the very
        //     last level — it eases back down to 6 battles/level for 28->29 and 29->30 so hitting
        //     the level cap reads as a small "victory lap," not the single hardest grind in the
        //     whole curve.
        //   - Every entry here is an exact multiple of that level's same-level battle-XP value
        //     (`20 + level*6`), so simulating same-level battles produces EXACTLY the intended
        //     battle count per level with zero leftover-XP drift into the next level.
        // Total across the table: 150 battles, 18,690 XP, L1->30. See XP_Per_Level.md.
        // Index 1 = XP needed to go from level 1 to 2, ... index 29 = level 29 to 30 (the cap).
        const LEVEL_XP_TABLE = [
            null,    // index 0 unused (there's no "level 0")
            26,      //  1 -> 2   (1 battle  @ 26 xp/battle)
            64,      //  2 -> 3   (2 battles @ 32 xp/battle)
            76,      //  3 -> 4   (2 battles @ 38 xp/battle)
            132,     //  4 -> 5   (3 battles @ 44 xp/battle)
            150,     //  5 -> 6   (3 battles @ 50 xp/battle)
            224,     //  6 -> 7   (4 battles @ 56 xp/battle)
            248,     //  7 -> 8   (4 battles @ 62 xp/battle)
            272,     //  8 -> 9   (4 battles @ 68 xp/battle)
            370,     //  9 -> 10  (5 battles @ 74 xp/battle)
            400,     // 10 -> 11  (5 battles @ 80 xp/battle)
            430,     // 11 -> 12  (5 battles @ 86 xp/battle)
            460,     // 12 -> 13  (5 battles @ 92 xp/battle)
            490,     // 13 -> 14  (5 battles @ 98 xp/battle)
            520,     // 14 -> 15  (5 battles @ 104 xp/battle)
            660,     // 15 -> 16  (6 battles @ 110 xp/battle)
            696,     // 16 -> 17  (6 battles @ 116 xp/battle)
            732,     // 17 -> 18  (6 battles @ 122 xp/battle)
            768,     // 18 -> 19  (6 battles @ 128 xp/battle)
            804,     // 19 -> 20  (6 battles @ 134 xp/battle)
            840,     // 20 -> 21  (6 battles @ 140 xp/battle)
            1022,    // 21 -> 22  (7 battles @ 146 xp/battle)
            1064,    // 22 -> 23  (7 battles @ 152 xp/battle)
            1106,    // 23 -> 24  (7 battles @ 158 xp/battle)
            1148,    // 24 -> 25  (7 battles @ 164 xp/battle)
            1190,    // 25 -> 26  (7 battles @ 170 xp/battle)
            1232,    // 26 -> 27  (7 battles @ 176 xp/battle)
            1274,    // 27 -> 28  (7 battles @ 182 xp/battle)
            1128,    // 28 -> 29  (6 battles @ 188 xp/battle) -- taper begins
            1164     // 29 -> 30  (6 battles @ 194 xp/battle) -- final level, eased pace
        ];

        // ===== TEAM SYNERGY =====
        // Bonuses derived from the whole team's element composition (not just the active creature).
        // Rewards intentional team-building. Computed once at battle setup -> stored on battle.synergy.
        //   elementDmgMult[el] : multiplier on OUTGOING damage while a creature of that element leads
        //   globalDmgMult      : multiplier on ALL outgoing damage (active creature any element)
        //   damageReduction    : fraction of INCOMING damage prevented (capped)
        //   list[]             : {icon,name,desc} for UI display
        const SYN = {
            // Twin Bond: 2 of one element → 1.15× that element's damage
            TWIN_DMG: 1.15,
            // Trinity: all 3 same element → 1.20× that element's damage + element bonus
            TRINITY_DMG: 1.20,
            // Balanced Force: all 3 different elements → 1.10× ATK and 1.10× DEF
            BALANCED_ATK: 1.10,
            BALANCED_DEF: 1.10,
            // Trinity element bonuses
            GRASS_REGEN_PCT:   0.05,   // 5% max HP regen per player turn
            FIRE_ABILITY_MULT: 1.20,   // 1.20× ability power
            WATER_DEF_MULT:    1.20,   // 1.20× DEF stat
            ELECTRIC_REFLECT:  0.10,   // reflect 10% of incoming damage back
            DARK_LIFESTEAL:    0.15,   // heal 15% of ability damage dealt
            DR_CAP: 0.50               // hard ceiling on total damage reduction
        };

        // ===== DAILY REWARD (7-day cycle) =====
        // A repeating 7-day login ladder. Day 7 is the celebration: a guaranteed epic creature.
        // After claiming day 7, the cycle loops back to day 1. Missing a day (gap > 1) resets to day 1.
        const DAILY_REWARDS = [
            { day: 1, coins: 200 },
            { day: 2, gems: 10 },
            { day: 3, energy: 5 },
            { day: 4, coins: 400 },
            { day: 5, gems: 20 },
            { day: 6, coins: 500, energy: 5 },
            { day: 7, epic: true, gems: 50 }
        ];

        // ===== ENERGY SYSTEM =====
        const ENERGY_MAX         = 20;

        const ENERGY_REGEN_MS    = 10 * 60 * 1000;  // 1 energy per 10 minutes

        const ENERGY_PER_BATTLE  = 1;

        const ENERGY_AD_GRANT    = 5;               // energy from watching an ad

        const ENERGY_AD_MAX_DAY  = 2;               // max ad refills per day

        // ===== MATCH-3 ENGINE (two-board turn-based duel) =====
        // Tile animation speeds reduced ~25% (longer durations) so matches read clearly.
        const SWAP_MS = 173, CLEAR_MS = 240, FALL_MS = 320, AI_DELAY = 650;

        const ABILITY_CAST_DELAY = 750; // wind-up between tapping an ability and it resolving

        const DEFEAT_SEQ_MS = 1500;  // "DEFEATED" overlay duration before the defeat popup

        // ----- Balance tunables (set by balance pass) -----
        const HP_MULT = 3.5;                       // scales all creature HP

        const SYN_MULT  = 1.20;  // creature element matches tile element (e.g. fire creature + fire tile)

                                  // (was 1.25 — lowered 2026-07-27 alongside SE_MULT so the two
                                  // stack to a clean 1.5x when both apply: own-element AND advantage)
        const SE_MULT   = 1.25;  // element advantage: attacker's element beats defender's element

                                  // (was 1.33 — lowered 2026-07-27; 1.20 × 1.25 = 1.5x exactly)
        const NVE_MULT  = 0.6;   // element resistance: attacker's element is beaten by defender's element

                                  // (was 0.75 — widened 2026-07-27 so a resisted matchup actually
                                  // costs something now that power-bar damage itself is smaller;
                                  // see POWER_TIERS below for the companion change)
        // Combined SYN + SE (creature element = tile element = beats defender): 1.5 × 1.5 = 2.25
        // The old DARK_MULT and ELEC_RES special cases are removed — all matchups use the web above.
        const COMBO_INC = 0.25, COMBO_CAP = 2.5;   // cascade combo growth + ceiling (kept for quest tracking)

        const POWER_CAP_BASE = 6; // minimum cap (common Lv1, no merges) — used as fallback only

        // Power-bar damage curve (2026-07-27 rebalance). Previously flat-linear: dmg = ATK × p/3,
        // so damage scaled purely with how much power you banked, with no diminishing returns —
        // at high level this compounded with ATK's own growth (both climb with level/merge/evo)
        // until a single big-cascade release could delete 25-60% of a maxed creature's max HP in
        // one hit, dwarfing every ability in the game and making which tiles you matched almost
        // irrelevant. This replaces it with a tiered curve: the baseline (power ≤ 3, i.e. a single
        // ordinary match-3) is UNCHANGED at 100% ATK, but each tier beyond that needs progressively
        // more power to unlock the next +100%, so big cascades keep paying off, just at a shrinking
        // rate instead of a flat one. Breakpoints: 3→100%, 7→200%, 12→300%, 18→400%. Not a
        // coincidence that 18 is also the highest a power bar can ever reach (16 rarity/level
        // ceiling + 2 from a maxed ++ merge) — the curve's top tier lines up with the game's actual
        // power-cap ceiling. Interpolated smoothly between breakpoints (no cliff-edge jump right at
        // a threshold); extends past 18 with the same slope as the last segment in case any future
        // effect ever pushes a cap higher.
        const POWER_TIERS = [
            { p: 0, mult: 0 },
            { p: 3, mult: 1.0 },
            { p: 7, mult: 2.0 },
            { p: 12, mult: 3.0 },
            { p: 18, mult: 4.0 },
        ];

        const BOSS_HP_MULT = 1.3;                  // bosses get extra HP on top

        const ELEMENT_POOL = ['fire', 'water', 'grass', 'electric', 'dark'];

        const elementColors = { fire: '#ff6b6b', water: '#4ecdc4', grass: '#7bed9f', electric: '#ffd93d', dark: '#9b8bd6' };

        const tileEmoji = { fire: '🔥', water: '💧', grass: '🌿', electric: '⚡', dark: '🌑' };

        // The actual battle setup, called once any pre-battle story beat has been shown.
        // ===================================================================
        // ENDLESS EXPEDITION — Phase 1 (core loop) + Phase 2 (reward draft + press-your-luck)
        //                    + Phase 3 (milestones + hub) + Phase 4 (catch system)
        //                    + Phase 5c (elemental aura)
        // Currency is five per-element essence wallets (gameState.endless.essence); the old single
        // Proofs currency was retired (legacy balances migrate to essence on load).
        // Elemental aura is a Bond 3 reward (not a standalone shop item).
        // Skins (Shiny, Crystal, Celestial) are stubbed in the creature profile — not yet built.
        //
        // FUTURE TASKS (flagged for next sessions):
        //   • Review current attack VFX
        //   • Review bonding attack VFX
        //   • Phase 5b: creature color variants (blocked on sprite-art pipeline decision)
        //   • Phase 5 skin system: Shiny / Crystal / Celestial (stubs in renderCreatureProfile)
        // ===================================================================
        const ENDLESS_REGEN = 0.15; // fraction of max HP recovered per cleared floor

        // Phase 5c — per-creature elemental particle aura (an essence cosmetic). Drawn on the canvas
        // over the sprite, so it works on procedural AND custom-PNG creatures (no art dependency).
        // Designed to grow: auraFx is an effect id, not a boolean, so more effects can be added.
        const ELEMENTAL_AURA_COST = 15; // one-time essence cost (of the creature's element); toggling is then free

        // ── Phase 8 — Element Essences ─────────────────────────────────────────
        // Five per-element currencies earned by KO'ing enemies of that element during an
        // Explore run. Banked on cash-out, lost on wipe (mirrors the pot). Account-wide
        // purchases (cosmetics) cost an equal amount of ALL five; creature-specific purchases
        // (auras/skins) cost that creature's single element 1:1.
        const ESS_ELEMENTS = ['fire', 'water', 'grass', 'electric', 'dark'];

        const ESSENCE_ICON = '◈'; // generic essence glyph; per-element uses tileEmoji

        // Essence granted for DEFEATING (not gathering) a wild creature — of that creature's
        // element, scaled by the creature's rarity.
        const DEFEAT_ESSENCE = { common: 2, rare: 4, epic: 6, legendary: 8 };

        // Depth → difficulty. Stats come from enemyLevel + evoTier (not species), so
        // species can be random; difficulty scales purely with depth.
        // Pick an enemy species weighted by rarity and depth. Early floors are common/rare only;
        // epics appear mid; legendaries only deep. Fixes the "floor 1 = legendary" spikes, since
        // legendary base stats are a large share of total stats when enemyLevel is tiny.
        // Fraction of Explore enemies whose element matches the node's biome (rest stay random
        // for variety). A seam node biases toward either of its two elements.
        const ENDLESS_BIOME_BIAS = 0.75;

        // ═══════════════════════════════════════════════════════════════════════
        // EXPLORE (gather mode) — fixed-length LINEAR runs. Pick a length + an
        // element "land", then fight N single-creature battles; catch or KO each,
        // and finish the run to bank that element's essence. Deeper battles and a
        // higher Ascension raise the rarity odds. Reuses the endless battle
        // machinery (mode:'endless', run.hp carry, beginEndlessNode, and the
        // win/lose hooks) so the fragile battle loop is untouched — every
        // explore-specific behavior branches off run.explore. The old branching
        // wheel (endlessHub / endlessMap) is left intact but no longer entered.
        // ═══════════════════════════════════════════════════════════════════════
        const EXPLORE_LENGTHS = {
            stroll:     { label: 'Stroll',     energy: 1,  battles: 1,  essence: 0  },
            trek:       { label: 'Trek',       energy: 3,  battles: 4,  essence: 5  },
            quest:      { label: 'Quest',      energy: 5,  battles: 7,  essence: 10 },
            expedition: { label: 'Voyage',     energy: 7,  battles: 10, essence: 15 },
        };

        const EXPLORE_LENGTH_ORDER = ['stroll', 'trek', 'quest', 'expedition'];

        // ═══════════════════════════════════════════════════════════════════════
        // TRAIN mode — a one-off "sparring" battle vs 3 auto-generated creatures of
        // any element (simulating a PvP team). A slider sets the enemy level, which
        // also drives rarity: ≤10 all common, then rares/epics/legendaries unlock as
        // the level climbs. The point of the mode is XP: it pays 1.5× a normal fight
        // and grants NO essence/catches. Reuses the shared battle machinery (the
        // generic multi-enemy lineup advance handles the 3-creature team).
        // ═══════════════════════════════════════════════════════════════════════
        const TRAIN_MAX_LEVEL = CREATURE_MAX_LEVEL;   // 30

        const TRAIN_XP_MULT = 1.5;

        // ═══════════════════════════════════════════════════════════════════════
        // TRAIN SQUAD CHALLENGES — a themed 6-tier gauntlet per element, layered on
        // Train's own battle machinery. The free-form level slider above stays exactly
        // as it is, purely for XP grinding — nothing there is reward-gated, so there's
        // nothing to game. Squad Challenges are the opposite: opponent level is FIXED
        // per tier (not player-chosen), tiers unlock strictly in order (tier N needs
        // tier N-1 already cleared), and each tier grants its reward exactly once ever.
        // That's what makes the reward safe to hand out — there's no "set it to level 1"
        // shortcut, because the level was never a dial to begin with.
        // ═══════════════════════════════════════════════════════════════════════
        const TRAIN_SQUADS = {
            fire:     { name: 'The Blaze Brigade', icon: '🔥' },
            water:    { name: 'Tide Force',        icon: '💧' },
            grass:    { name: 'The Leaf Legion',   icon: '🌿' },
            electric: { name: 'Shock Troop',       icon: '⚡' },
            dark:     { name: 'The Night Crew',    icon: '🌑' },
        };

        const TRAIN_SQUAD_ORDER = ['fire', 'water', 'grass', 'electric', 'dark'];

        // Same 5 ids as the story-clear legendary pool (LEGENDARY_IDS), just addressed by
        // element instead of randomly picked — clearing a squad's tier 6 always grants
        // THAT element's own legendary, never a random one.
        const TRAIN_SQUAD_LEGENDARY = { fire: 16, water: 17, grass: 18, electric: 19, dark: 20 };

        const TRAIN_CHALLENGE_LEVELS = [5, 10, 15, 20, 25, 30];

        // Every modifier is a fight-LONG standing effect, not a one-shot buff — applied when
        // a challenge battle starts AND re-applied every time the squad's lineup advances to
        // its next member (see the enemy-advance chokepoint in the battle loop), so it holds
        // for the whole fight regardless of which of the squad's 3 creatures is currently up.
        const TRAIN_MODIFIERS = {
            regen:     { name: 'Regenerating', icon: '💚', desc: 'Enemies heal 5% max HP at the end of every one of their turns.' },
            lockedIn:  { name: 'Locked In',    icon: '🔒', desc: "You can't switch your active creature during this fight." },
            chargedUp: { name: 'Charged Up',   icon: '⚡', desc: 'Enemies start — and stay — with A1 and A2 fully pre-charged.' },
            fortified: { name: 'Fortified',    icon: '🛡️', desc: 'Every enemy starts with a shield blocking 50% of the first hit it takes.' },
            enraged:   { name: 'Enraged',      icon: '😡', desc: 'Enemies deal +15% damage for the whole fight.' },
        };

        const TRAIN_MODIFIER_ORDER = ['regen', 'lockedIn', 'chargedUp', 'fortified', 'enraged'];

        const TRAIN_MODIFIER_REGEN_PCT = 0.05;

        const TRAIN_MODIFIER_FORTIFIED_FRAC = 0.5;

        const TRAIN_MODIFIER_ENRAGED_MULT = 1.15;

        // Minimum modifiers the PLAYER must have toggled on to even start each tier (any of
        // the 5 — their choice which). Scales 0..5 across the 6 tiers, so tier 6 (the
        // legendary-granting fight) demands every modifier stacked at once.
        const TRAIN_CHALLENGE_REQUIRED_MODS = [0, 1, 2, 3, 4, 5];

        // Reward per tier index (0-5). Tier 5 (level 30) additionally grants the squad's
        // legendary on top of its essence/gems.
        const TRAIN_CHALLENGE_REWARDS = [
            { essence: 5,  gems: 0 },
            { essence: 10, gems: 1 },
            { essence: 15, gems: 2 },
            { essence: 20, gems: 2 },
            { essence: 25, gems: 3 },
            { essence: 30, gems: 5, legendary: true },
        ];

        // ═══════════════════════════════════════════════════════════════════════
        // LADDER mode — ranked matchmaking sparring, layered on the same battle
        // machinery as Train. Rank is a SINGLE ACCOUNT-WIDE score (not per-team) —
        // matchmaking, tiers, and creature unlocks all read gameState.ladderRank.
        // A "ranked team" (exact set of creature INSTANCE ids) still gets tracked
        // in gameState.ladderHistory, but purely as a personal record: wins/losses
        // and the highest the ACCOUNT score ever reached while fielding that team.
        // Swapping any member starts a fresh history entry; it does not reset your
        // rank, which belongs to the account, not the team.
        //
        // Opponent level is NOT player-chosen — it's derived from the account's
        // current points via ladderMatchLevel(), so points can't be farmed by
        // repeatedly picking an easy fight (Free Spar / Train remains for that).
        // Points earned/lost per match scale with the matched level, so rank
        // naturally plateaus once fights get hard enough to start costing more
        // than they pay — that plateau IS your rank.
        //
        // Every 100 points is a new "Rank" (Bronze..Grand Master, then Grand Master
        // keeps climbing numerically once everything's unlocked). Every 25 points is
        // a claimed milestone reward — a repeating essence/gems/spirit/creature
        // cycle, similar to Clash Royale's arena road.
        // ═══════════════════════════════════════════════════════════════════════
        const LADDER_TIERS = [
            { name: 'Bronze',      floor: 0,   icon: '🥉', color: '#a9704f' },
            { name: 'Silver',      floor: 100, icon: '🥈', color: '#b9c2cc' },
            { name: 'Gold',        floor: 200, icon: '🥇', color: '#e6c04a' },
            { name: 'Platinum',    floor: 300, icon: '💠', color: '#6fd0d8' },
            { name: 'Diamond',     floor: 400, icon: '🔷', color: '#7fa8ff' },
            { name: 'Master',      floor: 500, icon: '👑', color: '#e85fd0' },
            { name: 'Grand Master',floor: 600, icon: '🌟', color: '#ffd24d' },  // open-ended: stays "Grand Master" forever past here
        ];

        // ── Milestone rewards: every 25 points, claimed once, repeating 4-step cycle ──
        const LADDER_MILESTONE_STEP = 25;

        // ── Ladder-gated creature unlocks (Clash-Royale-style progression) ─────
        // Each element has 7 species in a fixed rarity order (from the `code` field:
        // C1,C2,C3,R1,R2,E1,L1). LADDER_UNLOCK_SLOTS[tierIndex] = how many of those
        // 7 per-element slots are unlocked once the ACCOUNT has ever reached that
        // tier at its peak (permanent — falling back down doesn't re-lock anything).
        // A fresh account with zero ladder history is treated as Bronze, so it
        // always starts with 5 species (1 per element).
        const LADDER_UNLOCK_SLOTS = [1, 2, 3, 4, 5, 6, 7]; // Bronze..Grand Master, indices into LADDER_TIERS

        // If the rolled rarity has NOTHING unlocked yet anywhere (e.g. legendary before
        // Grand Master), step down toward common until we hit a rarity that does. This is what
        // keeps a high enemy level from ever forcing a locked species into an encounter —
        // it degrades the RARITY, it never bypasses the lock. Bronze always has 5 unlocked
        // commons, so this is guaranteed to resolve.
        const RARITY_DEGRADE_ORDER = ['legendary', 'epic', 'rare', 'common'];

        // Highest Ascension that has a defined rarity table. Unlocks stop here
        // until more tables are added below. Beating Quest (or longer) at your
        // current-max Ascension unlocks the next, capped at this.
        const EXPLORE_ASC_MAX_DEFINED = 4;

        // On a wipe the completion essence bonus is forfeited (you only earn it by
        // FINISHING), but creatures caught mid-run are secured on catch and kept.
        // Flip to false to make a wipe also delete this run's catches.
        const EXPLORE_WIPE_KEEPS_CATCHES = true;

        // Rarity odds by Ascension (1-based) and battle band (battles 1-5 / 6-10 / 11-15).
        const EXPLORE_RARITY = {
            1: [ { common: 100 },
                 { common: 95, rare: 5 },
                 { common: 90, rare: 10 } ],
            2: [ { common: 95, rare: 5 },
                 { common: 88, rare: 10, epic: 2 },
                 { common: 75, rare: 20, epic: 5 } ],
            3: [ { common: 80, rare: 18, epic: 2 },
                 { common: 60, rare: 30, epic: 10 },
                 { common: 40, rare: 35, epic: 20, legendary: 5 } ],
            4: [ { common: 60, rare: 28, epic: 12 },
                 { common: 35, rare: 35, epic: 25, legendary: 5 },
                 { common: 15, rare: 30, epic: 40, legendary: 15 } ],
        };

        // Ascension 4 enemies are always at the level cap (see exploreStartLevel/exploreMapNode),
        // so their extra bite comes from flat combat bonuses instead of more level headroom.
        const EXPLORE_ASC4_STAT_MULT = 1.10;       // +10% HP/ATK/DEF, applied in getCreatureStats via inst.ascBonusMult

        const EXPLORE_ASC4_POWER_CAP_BONUS = 2;    // +2 power-bar cap, on top of the normal rarity/level/merge cap

        const EXPLORE_ASC4_PRECHARGE = 1;          // enemy starts battle with this many A1 AND A2 charges banked

        // Explore post-battle HP helper.
        const STAT_PIP_MAX = 5;

        // New Game+ raises every story enemy's level by +20 per completed NG+ tier, so a
        // finished roster has a reason to re-run the 30 levels. Bosses/evo scaling stack on top.
        const NGPLUS_LEVEL_BONUS = 20;

        const LEGENDARY_IDS = [16, 17, 18, 19, 20];

        // Spend gems to re-roll a creature's individual stat variation (and therefore its rank).
        // Pure random each time — it can go down as well as up. Because a bad roll could wipe out
        // good stats, the result is PREVIEWED first: the player pays to roll, sees current vs. new,
        // then chooses to Apply or Keep Current.
        const RANK_REROLL_COST = 50; // gems

        const RANK_ORDER = ['F', 'E', 'D', 'C', 'B', 'A', 'S']; // low → high

        // ===== BONDING =====
        // A per-creature relationship track funded by Spirit. Cosmetic only — it upgrades that
        // creature's attack visuals, never its stats. Unlocks once the creature reaches Lv15.
        const BOND_MAX = 5;

        const BOND_UNLOCK_LV = 9;   // was 15 under the old 50-level cap (30% of cap) — rescaled to the same 30% of the new 30-level cap

        const BOND_COSTS = [2000, 4000, 7000, 11000, 16000]; // Spirit to raise to tier i+1

        const BOND_TIERS = [
            { name: 'Kindred',   blurb: 'Fuller, denser attack effects and a brighter presence.' },
            { name: 'Trusted',   blurb: 'Every signature attack now ends in a burst of energy.' },
            { name: 'Devoted',   blurb: 'A pulsing aura and longer-lasting strikes.' },
            { name: 'Soulbound', blurb: 'Wider, heavier strikes with more impact behind them.' },
            { name: 'Mastered',  blurb: 'A gold-touched flourish worthy of a true partner.' }
        ];

        const FIRST_CATCH_GEM_BONUS = 5;

        // Catch chance after defeating a creature, by rarity
        // Gather rates by rarity and enemy HP remaining (as fraction of max).
        // 0% at full HP — player must land at least one hit before gathering.
        // hpFrac thresholds: =1.0 (full) | >0.75 | >0.40 | >0.15 | ≤0.15
        const GATHER_RATES = {
            common:    [0.00, 0.15, 0.45, 0.80, 0.95],
            rare:      [0.00, 0.08, 0.25, 0.55, 0.80],
            epic:      [0.00, 0.03, 0.12, 0.30, 0.55],
            legendary: [0.00, 0.01, 0.05, 0.12, 0.25]
        };

        const MAX_MERGE = 2; // base -> + -> ++ (final form)

        // Merge is an accumulating "feed" bar. You feed same-series creatures (any form) into a
        // keeper; each fed creature is +1 progress. When progress reaches the rarity threshold for
        // the next tier, the keeper advances a merge level (keeping its level/XP) and leftover
        // progress carries over.
        //   requirement for the NEXT tier = MERGE_REQ[rarity] * (mergeLevel + 1)
        //   base→+  : MERGE_REQ × 1     +→++ : MERGE_REQ × 2
        const MERGE_REQ = { common: 10, rare: 7, epic: 5, legendary: 2 };

        const BOSS_FARM_MULT = [1.0, 0.5, 0.25]; // index = clears already done today (capped at last)

        // ===== QUEST SYSTEM =====
        const ELEMENTS = ['fire','water','grass','electric','dark'];

        const QUEST_POOL_DAILY = [
            { id:'win_streak',     label:'Win 3 battles in a row',               goal:3,  reward:{coins:300} },
            { id:'damage_500',     label:'Deal 500+ damage in one battle',        goal:1,  reward:{coins:200} },
            { id:'no_faint',       label:'Win without any creature fainting',     goal:1,  reward:{coins:250} },
            { id:'ability_x5',     label:'Use abilities 5 times',                 goal:5,  reward:{coins:150} },
            { id:'cascade_triple', label:'Trigger a triple cascade',              goal:1,  reward:{coins:200} },
            { id:'mono_team',      label:'Win with a same-element team',          goal:1,  reward:{coins:300} },
            { id:'catch_element',  label:'Catch 3 creatures',                     goal:3,  reward:{coins:250} },
            { id:'solo_creature',  label:'Win using only one creature',           goal:1,  reward:{coins:350} },
            { id:'win_5',          label:'Win 5 battles',                         goal:5,  reward:{coins:200} },
            { id:'boss_win',       label:'Defeat a boss',                         goal:1,  reward:{coins:400} },
            { id:'level_up',       label:'Level up a creature',                   goal:1,  reward:{coins:100} },
            { id:'all_hit',        label:'Have every party member attack and win',goal:1,  reward:{coins:350} },
            { id:'combo_2',        label:'Achieve a 2.0× combo multiplier',      goal:1,  reward:{coins:200} },
            { id:'under_3_turns',  label:'Defeat an enemy in 3 turns or fewer',  goal:1,  reward:{coins:300} },
        ];

        const QUEST_POOL_WEEKLY = [
            { id:'weekly_wins',        label:'Win 20 battles this week',               goal:20, reward:{gems:15} },
            { id:'catch_all_elements', label:'Catch one of every element this week',   goal:5,  reward:{gems:20} },
            { id:'all_bosses',         label:'Beat all 3 floor bosses this week',      goal:3,  reward:{gems:25} },
            { id:'evolve_one',         label:'Evolve a creature',                      goal:1,  reward:{gems:20} },
            { id:'synergy_wins',       label:'Win 5 battles with active team synergy', goal:5,  reward:{gems:15} },
        ];

        // Adds XP to each creature in ids, leveling them up. Returns names that leveled up.
        // Level-relative XP multiplier. diff = enemyLevel - creatureLevel.
        //   same level         → 1.00 (100%)
        //   enemy higher        → bonus, +20% per level, capped at 2.00 (200%)
        //   creature higher     → penalty, −20% per level, floored at 0.10 (10%)
        const XP_GAP_SLOPE = 0.20, XP_GAP_FLOOR = 0.10, XP_GAP_CAP = 2.00;

        // ===== Team formations (saved loadouts, like deck slots) =================
        const FORMATION_COUNT = 3;
