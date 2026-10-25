// Creature progression rules: stats, XP/leveling, evolution, merging, and bonding.
// Loaded after static data and save.js, before the main game script.
// No work runs on load. Functions resolve shared state and main-script hooks when called.
// Dialogs, animations, and HTML renderers remain in index.html; state-changing actions
// preserve their existing calls to save, quest, achievement, and UI notification hooks.

        function evoCostFor(rarity, toTier) {
            const base = EVO_ESSENCE_COST[rarity] || EVO_ESSENCE_COST.common;
            return toTier >= 2 ? base * 2 : base;
        }

        function evoElementOf(creature) { return (creatureDatabase[creature.baseId] || {}).element; }

        function evoTierOf(creature) { return creature.evoTier || 0; }

        function evoGatesFor(creature) {
            const rarity = (creatureDatabase[creature.baseId] || {}).rarity || 'common';
            return EVO_GATES[rarity] || EVO_GATES.common;
        }

        // No level cap — creatures level freely to CREATURE_MAX_LEVEL regardless of evo state.
        function levelCapOf(creature) { return CREATURE_MAX_LEVEL; }

        function canEvolve(creature) {
            const t = evoTierOf(creature);
            const gates = evoGatesFor(creature);
            return t < gates.length && creature.level >= gates[t];
        }

        // For level-based enemy generation (Train/Ladder) where there's no "story floor"
        // concept to bucket by — this reads the SAME EVO_GATES thresholds a player's own
        // creature would need to hit, keyed off the creature's actual rarity, so an enemy at
        // a given level is exactly as evolved as a player creature of that rarity would be at
        // that level (a flat, rarity-blind level/20 formula was previously leaving Commons and
        // Rares under-evolved for a long stretch, since their gates land much earlier than
        // Legendary's — e.g. a level-25 Common enemy should already be evo2 (gate at 20), not
        // evo1, and even a level-15 Common should be evo1 already (gate at 10), not evo0).
        function maxEvoTierForLevel(rarity, level) {
            const gates = EVO_GATES[rarity] || EVO_GATES.common;
            if (level >= gates[1]) return 2;
            if (level >= gates[0]) return 1;
            return 0;
        }

        function evolvedName(baseId, evoTier) {
            const base = creatureDatabase[baseId].name;
            if (!evoTier) return base;
            const names = EVO_NAMES[baseId];
            return (names && names[evoTier - 1]) || base;
        }


        function creatureXpNeeded(level) {
            const v = LEVEL_XP_TABLE[level];
            return v != null ? v : 0; // out-of-range (>= cap, or <1) — callers already guard this, 0 is a safe fallback
        }


        // ===== CREATURE SYSTEM =====
        function getCreatureStats(creature) {
            const base = creatureDatabase[creature.baseId];
            const merged = creature.mergeLevel > 0 ? 1 + (creature.mergeLevel * 0.10) : 1;
            const evo = 1 + evoTierOf(creature) * EVO_STAT_MULT;   // +10% per evolution tier (stacks with merge)
            const leveled = 1 + (creature.level - 1) * 0.1;       // HP & DEF: +10%/level
            const leveledAtk = 1 + (creature.level - 1) * 0.08;   // ATK: gentler +8%/level

            // Individual variation: -1/0/+1 added to each base stat (set at capture).
            const roll = creature.statRoll || { hp: 0, atk: 0, def: 0 };
            const bHP  = base.baseHP  + (roll.hp  || 0);
            const bATK = base.baseATK + (roll.atk || 0);
            const bDEF = base.baseDEF + (roll.def || 0);

            let hp  = Math.round(bHP  * merged * evo * leveled * HP_MULT * skillHpMult());
            let atk = Math.round(bATK * merged * evo * leveledAtk * skillAtkMult());
            let def = Math.round(bDEF * merged * evo * leveled);
            // Ascension-4 Explore enemies (only place this is ever set — see beginEndlessNode)
            // carry a flat combat-stat bump instead of extra level headroom, since they're
            // already pinned at CREATURE_MAX_LEVEL.
            if (creature.ascBonusMult && creature.ascBonusMult !== 1) {
                hp  = Math.round(hp  * creature.ascBonusMult);
                atk = Math.round(atk * creature.ascBonusMult);
                def = Math.round(def * creature.ascBonusMult);
            }
            return { hp, atk, def };
        }


        // ===== Individual stat variation & rank =====
        // On capture each creature rolls a variation on each base stat:
        //   HP: -5 / 0 / +5   (bigger swing — HP is a large pool, so small rolls were barely felt)
        //   ATK: -1 / 0 / +1
        //   DEF: -1 / 0 / +1
        // Rank counts the SIGN of each roll (good / neutral / bad), summed to -3..+3:
        //   +3=S, +2=A, +1=B, 0=C, -1=D, -2=E, -3=F. Starters/tutorial/story = C (all zeros).
        function rollStatVariation() {
            const r1 = () => Math.floor(Math.random() * 3) - 1;       // -1, 0, +1
            return { hp: r1() * 5, atk: r1(), def: r1() };            // HP scaled to -5/0/+5
        }

        function neutralStatRoll() {
            return { hp: 0, atk: 0, def: 0 };
        }

        // Compute stats as if the creature had a given roll, without mutating it.
        function statsForRoll(creature, roll) {
            return getCreatureStats(Object.assign({}, creature, { statRoll: roll }));
        }


        function bondLevelOf(c)  { return Math.max(0, Math.min(BOND_MAX, c.bondLevel || 0)); }

        function bondUnlocked(c) { return (c.level || 1) >= BOND_UNLOCK_LV; }

        function nextBondCost(c)  { const lv = bondLevelOf(c); return lv >= BOND_MAX ? null : BOND_COSTS[lv]; }

        function deepenBond(creatureId) {
            const c = gameState.creatures.find(x => x.id === creatureId);
            if (!c) return;
            if (!bondUnlocked(c)) { showToast(`Reach Lv ${BOND_UNLOCK_LV} to begin bonding`); return; }
            if (bondLevelOf(c) >= BOND_MAX) { showToast('Bond already at its deepest'); return; }
            const cost = nextBondCost(c);
            if ((gameState.spirit || 0) < cost) { showToast(`Need ${cost} 🔮 to deepen this bond`); return; }
            showBondConfirm(c);
        }


        function confirmDeepenBond(creatureId) {
            const c = gameState.creatures.find(x => x.id === creatureId);
            if (!c) { closeBondConfirm(); return; }
            const cost = nextBondCost(c);
            if (cost == null || (gameState.spirit || 0) < cost) { closeBondConfirm(); return; }
            gameState.spirit -= cost;
            c.bondLevel = bondLevelOf(c) + 1;
            saveGameData();
            closeBondConfirm();
            renderCreatureProfile();
            const reached = BOND_TIERS[c.bondLevel - 1];
            showToast(`💞 Bond ${c.bondLevel} — ${reached.name}!`);
        }


        function formName(baseId, mergeLevel, evoTier) {
            return evolvedName(baseId, evoTier || 0) + '+'.repeat(mergeLevel);
        }


        // Number of creatures needed to advance from the creature's current merge level to the next.
        // Returns null if already at MAX_MERGE (no further merging).
        function mergeReqFor(creature) {
            if (!creature || creature.mergeLevel >= MAX_MERGE) return null;
            const rarity = (creatureDatabase[creature.baseId] || {}).rarity || 'common';
            const per = MERGE_REQ[rarity] || MERGE_REQ.common;
            return per * (creature.mergeLevel + 1);
        }


        // Creatures eligible to be fed into `keeper`: same baseId, any form, excluding the keeper.
        function mergeFodderFor(keeper) {
            if (!keeper) return [];
            return gameState.creatures.filter(c => c.id !== keeper.id && c.baseId === keeper.baseId);
        }


        // Feed the given fodder creatures into the keeper. Consumes the fodder, adds progress,
        // and advances merge tiers as thresholds are crossed (carrying leftover progress).
        // Keeps the keeper's level/XP. Returns the number of tiers gained.
        function feedMerge(keeperId, fodderIds) {
            const keeper = gameState.creatures.find(c => c.id === keeperId);
            if (!keeper) return 0;
            // Only same-series fodder, never the keeper itself
            const ids = (fodderIds || []).filter(id => {
                if (id === keeperId) return false;
                const f = gameState.creatures.find(c => c.id === id);
                return f && f.baseId === keeper.baseId;
            });
            if (ids.length === 0) return 0;

            // Remove fodder from inventory and clear any team slots they occupied
            gameState.creatures = gameState.creatures.filter(c => !ids.includes(c.id));
            gameState.team = gameState.team.map(id => ids.includes(id) ? null : id);

            // Apply progress and advance tiers
            keeper.mergeProgress = (keeper.mergeProgress || 0) + ids.length;
            let tiersGained = 0;
            let req = mergeReqFor(keeper);
            while (req != null && keeper.mergeProgress >= req) {
                keeper.mergeProgress -= req;
                keeper.mergeLevel++;
                tiersGained++;
                req = mergeReqFor(keeper);
            }
            // At MAX_MERGE there's no further bar — drop any overflow progress.
            if (mergeReqFor(keeper) == null) keeper.mergeProgress = 0;

            if (tiersGained > 0) addAchievement('merge', 'Merged a creature!');
            saveGameData();
            return tiersGained;
        }


        // True if the player owns any creature that has reached its evolution gate
        // and hasn't evolved yet — used to badge the Team nav button.
        function anyCreatureCanEvolve() {
            return (gameState.creatures || []).some(c => canEvolve(c));
        }


        // Permanently evolve a creature that has reached its tier's level gate.
        // Plays a transition animation (old form → flash → new form), then applies the
        // evolution. Bumps evoTier (new name, sprite, +10% stats). Keeps merge bonus.
        function evolveCreature(creatureId, opts) {
            opts = opts || {};
            const c = gameState.creatures.find(x => x.id === creatureId);
            if (!c || !canEvolve(c)) return;
            const fromTier = evoTierOf(c);
            const toTier = fromTier + 1;
            const el = evoElementOf(c);
            const cost = evoCostFor((creatureDatabase[c.baseId] || {}).rarity || 'common', toTier);
            // Pay in the creature's own element essence (unless a free path — debug / gem Fast-Track).
            if (!opts.free && cost > 0) {
                if (!canAffordEssenceOne(el, cost)) {
                    const have = (essenceWallet()[el] || 0);
                    homeToast(`Need ${cost} ${elementGlyphText(el)} essence to evolve (have ${have}).`);
                    return;
                }
                spendEssenceOne(el, cost);
            }
            const fromName = formName(c.baseId, c.mergeLevel, fromTier);
            const toName = formName(c.baseId, c.mergeLevel, toTier);

            // Apply the evolution immediately in state; the animation is purely visual.
            c.evoTier = toTier;
            c.xp = 0;
            // Record the highest evolution tier reached for this species so the Creaturedex
            // can reveal that form (evolutions stay hidden until first reached).
            if (!gameState.dexEvoSeen) gameState.dexEvoSeen = {};
            gameState.dexEvoSeen[c.baseId] = Math.max(gameState.dexEvoSeen[c.baseId] || 0, toTier);
            trackQuestEvent('creature_evolved', {});
            addAchievement('evolve', 'Evolved a creature!');
            saveGameData();

            playEvolutionAnimation(c.baseId, fromTier, toTier, fromName, toName);
        }


        function xpGapMultiplier(creatureLevel, enemyLevel) {
            const diff = (enemyLevel || creatureLevel) - creatureLevel;
            const mult = 1 + diff * XP_GAP_SLOPE;
            return Math.max(XP_GAP_FLOOR, Math.min(XP_GAP_CAP, mult));
        }


        // Grants XP to each creature in `ids`. If `enemyLevel` is provided, each creature's award
        // is scaled by its own level gap to the enemy (see xpGapMultiplier); otherwise the flat
        // `amount` is applied to all (used by callers that don't have a meaningful enemy level).
        function grantCreatureXP(ids, amount, enemyLevel) {
            const leveled = [];
            let triggerAbilityOrient = false;
            ids.forEach(id => {
                const c = gameState.creatures.find(x => x.id === id);
                if (!c) return;
                const prevLevel = c.level;
                const gained = enemyLevel != null
                    ? Math.max(1, Math.round(amount * xpGapMultiplier(c.level, enemyLevel)))
                    : amount;
                c.xp = (c.xp || 0) + gained;
                let didLevel = false;
                // No level gate — creatures level freely up to CREATURE_MAX_LEVEL regardless of evo state.
                while (c.level < CREATURE_MAX_LEVEL && c.xp >= creatureXpNeeded(c.level)) {
                    c.xp -= creatureXpNeeded(c.level);
                    c.level++;
                    didLevel = true;
                }
                if (c.level >= CREATURE_MAX_LEVEL) c.xp = 0; // true max reached
                if (didLevel) {
                    trackQuestEvent('creature_leveled', {});
                    leveled.push(`${evolvedName(c.baseId, evoTierOf(c))}${'+'.repeat(c.mergeLevel)} → Lv${c.level}`);

                    // First time any creature crosses from below Lv2 to Lv2+: queue the ability tutorial.
                    // Only fires in battle (so the ability buttons are actually on screen) and only once ever.
                    const t = gameState.tutorial;
                    const alreadySeen = t && t.narrativeShown && t.narrativeShown.abilityOrient;
                    if (!alreadySeen && prevLevel < ABILITY_UNLOCK_LV[1] && c.level >= ABILITY_UNLOCK_LV[1]
                            && gameState.currentScreen === 'battleMode') {
                        triggerAbilityOrient = true;
                    }
                }
                if (canEvolve(c)) leveled.push(`${evolvedName(c.baseId, evoTierOf(c))} can evolve!`);
            });

            // Fire the overlay after XP is fully applied so the button state is up to date.
            if (triggerAbilityOrient) {
                const t = gameState.tutorial;
                if (t && t.narrativeShown) t.narrativeShown.abilityOrient = true;
                saveGameData();
                // Defer one frame so updateBattlePanel() has refreshed the ability buttons first.
                requestAnimationFrame(() => showAbilityOrientation());
            }

            return leveled;
        }

