// Story encounters, floor themes, and tutorial narrative.
// Classic script: shared data only; no browser APIs or game-state mutations.

        // ===== TUTORIAL CONTENT (Floor 0) =====
        // Narrative + flavor text for the onboarding flow. Phase numbers map to gameState.tutorial.currentPhase.
        const TUTORIAL_DATA = {
            // The three starter creatures, reframed as "who you are" (uses real DB names)
            starters: [
                {
                    id: 1, element: 'fire', name: 'Cinder',
                    flavorText: 'You burned too bright. Too fast, too fierce, too much. Your trainer wanted something they could control. So they left you in the ash.'
                },
                {
                    id: 4, element: 'water', name: 'Droplet',
                    flavorText: 'You were gentle. Patient. You healed when others wanted you to hurt. They called that weakness — and then they walked away.'
                },
                {
                    id: 7, element: 'grass', name: 'Sprout',
                    flavorText: 'You grew at your own pace: slow, stubborn, sure. They had no patience for something that took its time. So they stopped waiting.'
                }
            ],

            narration: {
                // Opening — shown before starter selection (Phase 0 -> 1)
                opening: [
                    "You weren't always an outcast. You had a trainer once — someone who promised you'd be great together.",
                    "But one day they decided you weren't enough. Too weak. Too strange. Too inconvenient. So they left you here, alone.",
                    "But you're not the only one. Somewhere out there are others like you — strays, misfits, the ones nobody came back for. Finding them starts with a single choice: who are you going to be?"
                ],
                // After a starter is chosen (Phase 1)
                starterConfirm: "For the first time, the choice is yours. No trainer. No leash. Just you, and whatever you decide to become. You're alone now — but something tells you that won't last forever.",

                // Tutorial Battle 1 — matching + power bar
                battle1Intro: [
                    "A small, half-starved creature creeps out of the brush. It bares its teeth — but its legs are shaking.",
                    "It's terrified. Cornered. You know that feeling better than anyone. But it won't back down, so neither can you."
                ],
                battle1Victory: [
                    "The little creature sinks down, spent — but it doesn't run. It just looks up at you, waiting to see what you'll do.",
                    "You crouch and hold out a hand. A long, breathless pause... then it limps over and presses against your side. It chose you."
                ],

                // Tutorial Battle 2 — elements + switching
                battle2Intro: [
                    "The next creature doesn't creep — it strides. It sizes up your lead fighter and bares its teeth, certain it has the advantage.",
                    "And it does: its element is strong against yours. Charging in head-first would be a mistake — but you're not alone anymore. Let the right ally take the lead."
                ],
                battle2Victory: [
                    "Outmatched at its own game, the creature finally yields. It looks between you and the ally who bested it, and something in it settles.",
                    "It falls in step beside the others. Three of you now — different strengths, different weaknesses, all covering for each other."
                ],

                // Tutorial Battle 3 — abilities
                battle3Intro: [
                    "Your team has grown — and so have they. Battling together has made your creatures stronger, sharper, surer of themselves.",
                    "Strong enough that they've each learned a special move: an ability. This next fight is the place to try one out."
                ],
                battle3Victory: [
                    "The creature staggers back, awed by the force your team just brought to bear. It doesn't even try to flee.",
                    "Abilities, elements, teamwork — you're starting to understand how all the pieces fit. You're ready for what's next."
                ],

                // Phase 4 → 5: bridge from battles to shop tour
                postBattle3: [
                    "You've got the basics now: matching, switching, abilities. But raw skill only takes you so far.",
                    "You're going to need resources. Strategy. A real foundation.",
                    "There's a place for that — a shop, a summon well, a chance to grow. Head there and let's see what's on offer."
                ],

                tutorialComplete: [
                    "You came here with nothing. Now you have a team, a purpose, and the first floor of a world that doesn't know what you're capable of yet.",
                    "Whatever comes next — you face it together."
                ]
            },

            // In-battle coaching, per tutorial battle
            coach: {
                // Battle 1 — matching + power bar
                battle1: {
                    start:    "🎯 Drag a tile onto a neighbor to line up 3 or more of the same color.",
                    matched:  "⚡ Nice match! Every match charges the power bar beside your creature.",
                    charging: "🔋 The higher that bar climbs, the harder you'll hit. Keep matching!",
                    full:     "💥 Power maxed! It unleashes as one big attack when your turn ends.",
                    enemy:    "👀 Now the enemy takes its turn. Watch what it does — then control comes back to you."
                },
                // Battle 2 — elements + switching (most text is built dynamically; see coachTextBattle2)
                battle2: {
                    start:  "⚠️ This enemy's element is STRONG against your starter. Switch to the ally that beats it!",
                    enemy:  "👀 The enemy strikes. At an element disadvantage you take more and deal less — that's why matchups matter."
                },
                // Battle 3 — abilities
                battle3: {
                    start:    "✨ Your ability is unlocked! Match tiles of one element — every 4 of your most-matched color this turn adds a charge. Fire it quick for a small hit, or save up 3 charges for a devastating strike!",
                    matched:  "⚡ Nice! Charges come from the total tiles of your dominant color matched this turn (cascades count too) — every 4 adds an A1 charge, every 5 adds an A2 charge. 3 charges = max damage.",
                    charging: "🔋 Power bar's filling and your ability is charging. Mix big power releases with a fully-charged ability to deal serious damage!",
                    full:     "💥 Power maxed! Unleash your attack — and if your ability bar is full, now's the time to dump it all in one hit!",
                    enemy:    "👀 The enemy takes its turn. Then it's back to you — keep charging that ability!"
                }
            }
        };

        // ===== LEVEL DATA =====
        // Enemy level = story level number for regular fights; floor bosses sit at 10 × floor (10, 20, 30).
        // 10 levels per floor (Grass → Water → Fire). Each level now fields a LINEUP of enemies
        // (fought in fixed order, no switching). Count rises within & across floors; later floors
        // mix in off-element enemies so a single team can't counter everything. Boss enemy is last.
        const levelData = {
            1: [ // Floor 1: Grass Domain — pure grass, gentle 1→2 count ramp (counter with Fire)
                { level: 1,  enemies: [{id:7}],                 enemyLevel: 1,  catchableIds: [4, 1],  isBoss: false },
                { level: 2,  enemies: [{id:8}],                 enemyLevel: 2,  catchableIds: [4, 5],  isBoss: false },
                { level: 3,  enemies: [{id:7}],                 enemyLevel: 3,  catchableIds: [1, 10], isBoss: false },
                { level: 4,  enemies: [{id:8}, {id:7}],         enemyLevel: 4,  catchableIds: [5, 10], isBoss: false },
                { level: 5,  enemies: [{id:9}, {id:7}],         enemyLevel: 5,  catchableIds: [4, 11], isBoss: false },
                { level: 6,  enemies: [{id:7}, {id:8}],         enemyLevel: 6,  catchableIds: [1, 13], isBoss: false },
                { level: 7,  enemies: [{id:8}, {id:9}],         enemyLevel: 7,  catchableIds: [5, 11], isBoss: false },
                { level: 8,  enemies: [{id:9}, {id:8}],         enemyLevel: 8,  catchableIds: [10,13], isBoss: false },
                { level: 9,  enemies: [{id:8}, {id:9}],         enemyLevel: 9,  catchableIds: [11,14], isBoss: false },
                { level: 10, enemies: [{id:8}, {id:18}],        enemyLevel: 10, catchableIds: [],      isBoss: true  }  // boss: Sylvara (grass)
            ],
            2: [ // Floor 2: Water Domain — water-dominant, occasional off-element (electric/dark) wrinkle
                { level: 11, enemies: [{id:4}, {id:5}],         enemyLevel: 11, catchableIds: [7, 1],  isBoss: false },
                { level: 12, enemies: [{id:5}, {id:4}],         enemyLevel: 12, catchableIds: [7, 8],  isBoss: false },
                { level: 13, enemies: [{id:4}, {id:11}],        enemyLevel: 13, catchableIds: [10, 8], isBoss: false }, // + electric
                { level: 14, enemies: [{id:5}, {id:6}],         enemyLevel: 14, catchableIds: [11, 8], isBoss: false },
                { level: 15, enemies: [{id:6}, {id:14}],        enemyLevel: 15, catchableIds: [9, 11], isBoss: false }, // + dark
                { level: 16, enemies: [{id:4}, {id:5}],         enemyLevel: 16, catchableIds: [7, 13], isBoss: false },
                { level: 17, enemies: [{id:5}, {id:6}, {id:11}],enemyLevel: 17, catchableIds: [8, 14], isBoss: false }, // + electric
                { level: 18, enemies: [{id:6}, {id:5}, {id:14}],enemyLevel: 18, catchableIds: [9, 13], isBoss: false }, // + dark
                { level: 19, enemies: [{id:5}, {id:6}, {id:4}], enemyLevel: 19, catchableIds: [14,11], isBoss: false },
                { level: 20, enemies: [{id:5}, {id:6}, {id:17}],enemyLevel: 20, catchableIds: [],      isBoss: true  }  // boss: Kraken (water)
            ],
            3: [ // Floor 3: Fire Domain — fire-dominant but genuinely mixed; brutal 4-enemy boss
                { level: 21, enemies: [{id:1}, {id:2}],         enemyLevel: 21, catchableIds: [4, 7],  isBoss: false },
                { level: 22, enemies: [{id:2}, {id:13}],        enemyLevel: 22, catchableIds: [4, 5],  isBoss: false }, // + dark
                { level: 23, enemies: [{id:1}, {id:2}, {id:11}],enemyLevel: 23, catchableIds: [5, 10], isBoss: false }, // + electric
                { level: 24, enemies: [{id:2}, {id:3}, {id:15}],enemyLevel: 24, catchableIds: [6, 11], isBoss: false }, // + dark epic
                { level: 25, enemies: [{id:3}, {id:2}, {id:1}], enemyLevel: 25, catchableIds: [6, 12], isBoss: false },
                { level: 26, enemies: [{id:1}, {id:3}, {id:12}],enemyLevel: 26, catchableIds: [5, 13], isBoss: false }, // + electric epic
                { level: 27, enemies: [{id:2}, {id:3}, {id:14}],enemyLevel: 27, catchableIds: [6, 14], isBoss: false }, // + dark
                { level: 28, enemies: [{id:3}, {id:2}, {id:11}],enemyLevel: 28, catchableIds: [12,15], isBoss: false }, // + electric
                { level: 29, enemies: [{id:2}, {id:3}, {id:15}],enemyLevel: 29, catchableIds: [14,15], isBoss: false }, // + dark epic
                { level: 30, enemies: [{id:2}, {id:3}, {id:15}, {id:16}], enemyLevel: 30, catchableIds: [], isBoss: true } // floor-3 boss: 4 enemies, Pyroclasm (fire) last
            ],
            4: [ // Floor 4: Storm Domain — electric-dominant plateau; catch the epics you still lack (non-electric)
                { level: 31, enemies: [{id:10}, {id:11}],        enemyLevel: 31, catchableIds: [9, 3],   isBoss: false },
                { level: 32, enemies: [{id:11}, {id:10}],        enemyLevel: 32, catchableIds: [6, 15],  isBoss: false },
                { level: 33, enemies: [{id:10}, {id:11}, {id:2}],enemyLevel: 33, catchableIds: [3, 6],   isBoss: false }, // + fire rare
                { level: 34, enemies: [{id:11}, {id:12}],        enemyLevel: 34, catchableIds: [9, 15],  isBoss: false }, // electric epic appears
                { level: 35, enemies: [{id:12}, {id:11}, {id:14}],enemyLevel: 35,catchableIds: [6, 3],   isBoss: false }, // + dark rare
                { level: 36, enemies: [{id:10}, {id:11}, {id:12}],enemyLevel: 36,catchableIds: [15, 9],  isBoss: false }, // full electric trio
                { level: 37, enemies: [{id:11}, {id:12}, {id:3}],enemyLevel: 37, catchableIds: [3, 15],  isBoss: false }, // + fire epic
                { level: 38, enemies: [{id:12}, {id:11}, {id:15}],enemyLevel: 38,catchableIds: [9, 6],   isBoss: false }, // + dark epic
                { level: 39, enemies: [{id:12}, {id:11}, {id:10}],enemyLevel: 39,catchableIds: [15, 3],  isBoss: false },
                { level: 40, enemies: [{id:11}, {id:12}, {id:19}],enemyLevel: 40,catchableIds: [],       isBoss: true  }  // boss: Stormwing (electric)
            ],
            5: [ // Floor 5: Void Domain — dark-dominant finale region; catch the last epics (non-dark); brutal 4-enemy finale
                { level: 41, enemies: [{id:13}, {id:14}],        enemyLevel: 41, catchableIds: [12, 9],  isBoss: false },
                { level: 42, enemies: [{id:14}, {id:13}],        enemyLevel: 42, catchableIds: [3, 6],   isBoss: false },
                { level: 43, enemies: [{id:13}, {id:14}, {id:3}],enemyLevel: 43, catchableIds: [9, 12],  isBoss: false }, // + fire epic
                { level: 44, enemies: [{id:14}, {id:15}],        enemyLevel: 44, catchableIds: [6, 3],   isBoss: false }, // dark epic appears
                { level: 45, enemies: [{id:15}, {id:14}, {id:12}],enemyLevel: 45,catchableIds: [12, 9],  isBoss: false }, // + electric epic
                { level: 46, enemies: [{id:13}, {id:14}, {id:15}],enemyLevel: 46,catchableIds: [3, 6],   isBoss: false }, // full dark trio
                { level: 47, enemies: [{id:14}, {id:15}, {id:6}],enemyLevel: 47, catchableIds: [9, 12],  isBoss: false }, // + water epic
                { level: 48, enemies: [{id:15}, {id:14}, {id:9}],enemyLevel: 48, catchableIds: [6, 3],   isBoss: false }, // + grass epic
                { level: 49, enemies: [{id:15}, {id:14}, {id:12}],enemyLevel: 49,catchableIds: [12, 9],  isBoss: false }, // + electric epic
                { level: 50, enemies: [{id:14}, {id:15}, {id:15}, {id:20}], enemyLevel: 50, catchableIds: [], isBoss: true } // brutal finale: 4, boss Voidlord (dark) last
            ]
        };

        // ===== FLOOR / MAP HELPERS =====
        const floorThemes = {
            1: { name: 'Grass Domain', grad: 'linear-gradient(170deg,#143319 0%,#2b6b2f 100%)', accent: '#7bed9f', deco: '🌳' },
            2: { name: 'Water Domain', grad: 'linear-gradient(170deg,#0d2a3a 0%,#14506b 100%)', accent: '#4ecdc4', deco: '🌊' },
            3: { name: 'Fire Domain',  grad: 'linear-gradient(170deg,#3a1414 0%,#6b2b1a 100%)', accent: '#ff6b6b', deco: '🌋' },
            4: { name: 'Storm Domain', grad: 'linear-gradient(170deg,#241a48 0%,#4b3a8b 100%)', accent: '#ffd93d', deco: '⛈️' },
            5: { name: 'Void Domain',  grad: 'linear-gradient(170deg,#160c28 0%,#3a2352 100%)', accent: '#b388ff', deco: '🌌' }
        };

        const LEVELS_PER_FLOOR = 10;

        const MAX_LEVEL = 50; // 5 floors × 10 levels

        // ===== STORY ARC =====
        // Five floors map to the game's five acts. Each floor has an intro (shown before its
        // first battle), a boss beat (shown before the floor's boss, level 10/20/30/40/50), and a
        // clear beat (shown when the boss is beaten and the next floor unlocks). Floor 5's clear
        // is the story finale. NOTE: floors 3–5 story text is FIRST DRAFT — pending review.
        const FLOOR_STORY = {
            1: {
                act: 'Act I — Formation',
                intro: [
                    "You set out with a single name burning in your mind: the trainer who left you behind.",
                    "Word is they made a fortune off creatures like you — winning, discarding, winning again. The trail leads through the Grass Domain.",
                    "You're not strong enough to face them yet. But every stray who joins you, every battle you win, brings you one step closer."
                ],
                boss: [
                    "A handler blocks the path out of the Grass Domain — one of your old trainer's hired hands.",
                    "\"Those rejects? You're wasting your time. Strays don't win.\" Prove them wrong."
                ],
                clear: [
                    "The handler falls. For the first time, someone who works for your old trainer knows your name.",
                    "Beyond the treeline, water glints. The trail leads on."
                ]
            },
            2: {
                act: 'Act II — Revenge',
                intro: [
                    "The Water Domain is colder, and so are you. Your team is strong now — strong enough to take what you came for.",
                    "You win battle after battle. Somewhere along the way, you stop noticing when your own creatures get hurt.",
                    "One of them looks up at you between fights, uncertain. You tell yourself there's no time to stop."
                ],
                boss: [
                    "Your old trainer's lieutenant waits at the water's edge, flanked by exhausted, over-leveled creatures.",
                    "\"You fight just like them now,\" she says, nodding at your team. \"Are you any different?\" The question stings more than it should."
                ],
                clear: [
                    "You win — but the lieutenant's words follow you out of the Water Domain.",
                    "One of your oldest companions hangs back as you climb toward the Fire Domain, watching you like it's not sure who you've become."
                ]
            },
            3: {
                act: 'Act III — Reckoning',
                intro: [
                    "The Fire Domain is where your old trainer built their empire. The end of the trail.",
                    "But the creature that's been with you since the beginning finally stops walking. It won't take another step — not for revenge.",
                    "You realize you have a choice to make here, and it isn't about who you beat. It's about who you've become."
                ],
                boss: [
                    "Your old trainer stands before you at last — surrounded by a roster of discarded, broken creatures, just like you once were.",
                    "\"I built something from nothing,\" they say. \"So did you. We're the same.\" This fight will decide whether that's true."
                ],
                clear: [
                    "Your old trainer is beaten — but as they fall, they laugh. \"You think I threw you away? I only followed orders. Same as you follow that grudge.\"",
                    "They name a place beyond the Fire Domain: a storm-wracked plateau where the ones who really run the discard-pits keep their ledgers. The trail doesn't end here. It climbs."
                ]
            },
            4: {
                act: 'Act IV — The Ledger',
                intro: [
                    "The Storm Domain never stops flickering — a plateau of iron pylons and standing lightning, where discarded creatures were sorted, graded, and sold.",
                    "This is where the numbers were kept. Where a creature like you was a line in a ledger, crossed out the day you stopped winning.",
                    "The strays here don't run from you. They've been waiting a long time for someone to walk in the other direction."
                ],
                boss: [
                    "The Storm-Keeper guards the pylons — the one who signed the orders your old trainer only carried out.",
                    "\"Sentiment,\" they say, watching your team close ranks around you. \"That's the flaw we grade out. Let's see what yours is worth.\""
                ],
                clear: [
                    "The pylons go dark. The ledger burns. Every name that was crossed out is, for a moment, just a name again.",
                    "But the Storm-Keeper answered to something too — a silence beyond the plateau, where the whole machine was first dreamed up. One climb remains."
                ]
            },
            5: {
                act: 'Act V — The Architect',
                intro: [
                    "The Void Domain is quiet in a way that hurts — no crowds, no pylons, no trainers. Just the cold arithmetic that decided some creatures were worth keeping and the rest were not.",
                    "The creature that has walked with you since the very first battle presses close. Not a weapon. Not a tool. It chose this climb, same as you.",
                    "Whatever waits at the top made the rule that made you disposable. You're here to unmake it."
                ],
                boss: [
                    "The Architect waits amid a court of the discarded — creatures broken and rebuilt into something obedient and hollow.",
                    "\"I didn't invent the cruelty,\" it says. \"I only made it efficient. Beat me and something else takes my place. It always does.\" Prove that it doesn't have to."
                ],
                clear: [
                    "The Architect falls — and you don't cross it out, and you don't gloat. You open the pens, and the hollow court blinks awake, free to be more than a tally.",
                    "The machine that made you doesn't end with winning. It ends the moment someone refuses to run it. Your team gathers close — not assets, not rejects. Family.",
                    "The ledgers are ash and the domains are quiet. Somewhere out there, other strays are still waiting for someone to come back for them. Now you can."
                ]
            }
        };

        // ===== TUTORIAL BATTLES (Floor 0) =====
        const TUTORIAL_ENEMY_COMMON = { fire: 1, water: 4, grass: 7, electric: 10, dark: 13 }; // element -> a weak common creature
