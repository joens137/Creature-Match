// Ability definitions, passives, and charge settings.
// Classic script: shared data only; no browser APIs or game-state mutations.

        // Two abilities per creature. Damage is scaled by the creature's element vs the enemy.
        //   a1 = straight damage  (armed by clearing a run of 4+)
        //   a2 = damage + buff/debuff (armed by clearing a run of 5+)
        // buff kinds: empower, heal, shield, stun,
        //             burn (fire DoT), poison (grass DoT), reflect (mirror damage),
        //             double_strike (hold power, release x2), leech (dmg+heal),
        //             siphon (raise own max power, lower enemy's max next turn), board_corrupt (flip enemy tiles),
        //             lock_tiles (freeze enemy tile types for N turns)
        const ABILITIES = {
            // ── Fire ──────────────────────────────────────────────────────────────
            // Cinder (common): burn — leaves smoldering after every strike
            1:  { a1: { name: 'Ember Strike',   power: 2.0, chargePower: [0.75, 1.8, 3.0] },
                  a1evo1: { name: 'Burn', dot: [0.25, 0.54, 0.83], ticks: 4 },
                  a1evo2: { name: 'Inferno', dot: [0.1, 0.22, 0.34], hit: [1.0, 2.2, 3.4], ticks: 5 },
                  a2: { name: "Hotblood", buff: 'enrage', atkBuff: [0.15, 0.3], turns: 2 },
                  a2evo1: { name: "Backdraft", buff: 'recoil', recoilFrac: 0.05, powerC: [1.5, 3.8] },
                  a2evo2: { name: "Cremate", buff: 'execute', threshold: [0.1, 0.2] } },
            // Wildfire (rare): double_strike — volatile burst, charges one turn
            2:  { a1: { name: 'Fire Fang',       power: 2.2, chargePower: [0.8, 1.9, 3.1] },
                  a1evo1: { name: 'Scorch', dot: [0.26, 0.56, 0.86], ticks: 4 },
                  a1evo2: { name: 'Wildfire', dot: [0.1, 0.23, 0.36], hit: [1.0, 2.3, 3.6], ticks: 5 },
                  a2: { name: "Searing Fang", buff: 'armor_pierce', powerC: [1.5, 3], ignoreDR: [0.05, 0.1] },
                  a2evo1: { name: "Flame Volley", buff: 'multi_hit', hits: [2, 3], powerC: [1.1, 1.2] },
                  a2evo2: { name: "Firestorm", buff: 'recoil', recoilFrac: 0.05, powerC: [1.6, 4] } },
            // Infernal (epic): burn + damage — scorched earth
            3:  { a1: { name: 'Magma Blast',     power: 2.4, chargePower: [0.9, 2.1, 3.2] },
                  a1evo1: { name: 'Sear', dot: [0.27, 0.58, 0.89], ticks: 4 },
                  a1evo2: { name: 'Eruption', dot: [0.1, 0.24, 0.38], hit: [1.0, 2.4, 3.8], ticks: 5 },
                  a2: { name: "Full Burn", buff: 'scale_high_hp', highMult: [1.5, 4], lowMult: [0.5, 1], hpThresh: 0.5 },
                  a2evo1: { name: "Molten Lance", buff: 'armor_pierce', powerC: [1.6, 3.3], ignoreDR: [0.05, 0.1] },
                  a2evo2: { name: "Overheat", buff: 'empower', mult: [2.0, 2.0], minCharge: 2 } },

            // ── Water ─────────────────────────────────────────────────────────────
            // Droplet (common): shield — defensive water bubble
            4:  { a1: { name: 'Bubble Shot',     power: 2.0, chargePower: [0.75, 1.8, 3.0] },
                  a1evo1: { name: 'Erode', dot: [0.25, 0.54, 0.83], ticks: 4 },
                  a1evo2: { name: 'Maelstrom', dot: [0.1, 0.22, 0.34], hit: [1.0, 2.2, 3.4], ticks: 5 },
                  a2: { name: "Aqua Veil", buff: 'shield', frac: [0.5, 0.75] },
                  a2evo1: { name: "Tide Mend", buff: 'regen', pct: [0.05, 0.07], turns: [2, 3] },
                  a2evo2: { name: "Wellspring", buff: 'heal', pct: [0.09, 0.2], clearDot: true } },
            // Tidecaller (rare): siphon — redirects enemy power flow
            5:  { a1: { name: 'Water Pulse',     power: 2.2, chargePower: [0.8, 1.9, 3.1] },
                  a1evo1: { name: 'Corrode', dot: [0.26, 0.56, 0.86], ticks: 4 },
                  a1evo2: { name: 'Undertow', dot: [0.1, 0.23, 0.36], hit: [1.0, 2.3, 3.6], ticks: 5 },
                  a2: { name: "Riptide Snap", buff: 'counter', frac: [0.08, 0.2], turns: 2 },
                  a2evo1: { name: "Wave Wall", buff: 'shield', frac: [0.5, 0.75] },
                  a2evo2: { name: "Aegis Tide", buff: 'reflect', frac: [0.25, 0.6] } },
            // Leviathan (epic): reflect — absorbs hit, sends half back
            6:  { a1: { name: 'Abyssal Crush',   power: 2.4, chargePower: [0.9, 2.1, 3.2] },
                  a1evo1: { name: 'Pressure', dot: [0.27, 0.58, 0.89], ticks: 4 },
                  a1evo2: { name: 'Leviathan Wake', dot: [0.1, 0.24, 0.38], hit: [1.0, 2.4, 3.8], ticks: 5 },
                  a2: { name: "Frostbind", buff: 'lock_tiles', count: [2, 5] },
                  a2evo1: { name: "Mirror Pool", buff: 'reflect', frac: [0.25, 0.6] },
                  a2evo2: { name: "Deep Current", buff: 'absorb', amt: [3, 7] } },

            // ── Grass ─────────────────────────────────────────────────────────────
            // Sprout (common): poison — nature's toxin, ticks each enemy turn
            7:  { a1: { name: 'Vine Whip',        power: 2.0, chargePower: [0.75, 1.8, 3.0] },
                  a1evo1: { name: 'Poison', dot: [0.25, 0.54, 0.83], ticks: 4 },
                  a1evo2: { name: 'Blight', dot: [0.1, 0.22, 0.34], hit: [1.0, 2.2, 3.4], ticks: 5 },
                  a2: { name: "Vine Snare", buff: 'lock_tiles', count: [2, 5] },
                  a2evo1: { name: "Sap Bind", buff: 'leech', turns: [2, 3], powerC: [0.25, 0.3] },
                  a2evo2: { name: "Bloomheart", buff: 'regen', pct: [0.05, 0.07], turns: [2, 3] } },
            // Thornvine (rare): leech — drains nutrients from the enemy
            8:  { a1: { name: 'Thorn Jab',        power: 2.2, chargePower: [0.8, 1.9, 3.1] },
                  a1evo1: { name: 'Toxin', dot: [0.26, 0.56, 0.86], ticks: 4 },
                  a1evo2: { name: 'Wilt', dot: [0.1, 0.23, 0.36], hit: [1.0, 2.3, 3.6], ticks: 5 },
                  a2: { name: "Root Drain", buff: 'siphon', amt: [3, 7] },
                  a2evo1: { name: "Root Rend", buff: 'def_shred', frac: [0.3, 0.6], turns: 2 },
                  a2evo2: { name: "Thornward", buff: 'rally', pct: [0.15, 0.35], turns: 3 } },
            // Wildwood (epic): lock_tiles — roots enemy tiles in place
            9:  { a1: { name: 'Maul',             power: 2.4, chargePower: [0.9, 2.1, 3.2] },
                  a1evo1: { name: 'Venom', dot: [0.27, 0.58, 0.89], ticks: 4 },
                  a1evo2: { name: 'Ravage', dot: [0.1, 0.24, 0.38], hit: [1.0, 2.4, 3.8], ticks: 5 },
                  a2: { name: "Thorn Counter", buff: 'counter', frac: [0.08, 0.2], turns: 2 },
                  a2evo1: { name: "Verdant Renewal", buff: 'regen', pct: [0.05, 0.07], turns: [2, 3] },
                  a2evo2: { name: "Gaia’s Grip", buff: 'def_shred', frac: [0.3, 0.6], turns: 2 } },

            // ── Electric ──────────────────────────────────────────────────────────
            // Zap (common): lock_tiles (1 type) — shorts out one circuit
            10: { a1: { name: 'Spark Shot',        power: 2.0, chargePower: [0.75, 1.8, 3.0] },
                  a1evo1: { name: 'Overload', dot: [0.25, 0.54, 0.83], ticks: 4 },
                  a1evo2: { name: 'Surge', dot: [0.1, 0.22, 0.34], hit: [1.0, 2.2, 3.4], ticks: 5 },
                  a2: { name: "Static Snare", buff: 'tile_steal', count: [3, 7] },
                  a2evo1: { name: "Short Circuit", buff: 'energy_denial', amt: [2, 5] },
                  a2evo2: { name: "Voltage Spike", buff: 'overcharge', amt: [3, 7] } },
            // Stormchild (rare): siphon — taps enemy power current
            11: { a1: { name: 'Thunderbolt',       power: 2.2, chargePower: [0.8, 1.9, 3.1] },
                  a1evo1: { name: 'Charge', dot: [0.26, 0.56, 0.86], ticks: 4 },
                  a1evo2: { name: 'Thunderclap', dot: [0.1, 0.23, 0.36], hit: [1.0, 2.3, 3.6], ticks: 5 },
                  a2: { name: "Discharge", buff: 'siphon', amt: [3, 7] },
                  a2evo1: { name: "Lightning Reposition", buff: 'ally_swap_free', preChargeA1: [false, true] },
                  a2evo2: { name: "Hypercharge", buff: 'extra_turn', minCharge: 2 } },
            // Voltaic (epic): double_strike — builds to explosive double release
            12: { a1: { name: 'Overload',          power: 2.4, chargePower: [0.9, 2.1, 3.2] },
                  a1evo1: { name: 'Static', dot: [0.27, 0.58, 0.89], ticks: 4 },
                  a1evo2: { name: 'Chainstorm', dot: [0.1, 0.24, 0.38], hit: [1.0, 2.4, 3.8], ticks: 5 },
                  a2: { name: "Jolt Lockdown", buff: 'speed_down', frac: [0.5, 0.75] },
                  a2evo1: { name: "Grounding Bolt", buff: 'interrupt', clearA2: [false, true] },
                  a2evo2: { name: "System Crash", buff: 'energy_denial', amt: [2, 5] } },

            // ── Dark ──────────────────────────────────────────────────────────────
            // Shade (common): leech — feeds on life force
            13: { a1: { name: 'Shadow Claw',       power: 2.0, chargePower: [0.75, 1.8, 3.0] },
                  a1evo1: { name: 'Torment', dot: [0.25, 0.54, 0.83], ticks: 4 },
                  a1evo2: { name: 'Nightmare', dot: [0.1, 0.22, 0.34], hit: [1.0, 2.2, 3.4], ticks: 5 },
                  a2: { name: "Shadow Retreat", buff: 'ally_swap_shield', frac: [0.4, 0.7] },
                  a2evo1: { name: "Wither", buff: 'atk_down', frac: [0.2, 0.5], turns: 2 },
                  a2evo2: { name: "Vengeful Spirit", buff: 'on_death', powerC: [4, 6], window: 2 } },
            // Nightbane (rare): reflect — dark mirror returns force
            14: { a1: { name: 'Spirit Lance',      power: 2.2, chargePower: [0.8, 1.9, 3.1] },
                  a1evo1: { name: 'Hex', dot: [0.26, 0.56, 0.86], ticks: 4 },
                  a1evo2: { name: 'Doom Lance', dot: [0.1, 0.23, 0.36], hit: [1.0, 2.3, 3.6], ticks: 5 },
                  a2: { name: "Nightbite", buff: 'counter', frac: [0.08, 0.2], turns: 2 },
                  a2evo1: { name: "Gloom", buff: 'weaken', frac: [0.5, 1], nullify: [false, true] },
                  a2evo2: { name: "Eclipse", buff: 'enrage', atkBuff: [0.17, 0.4], turns: 2 } },
            // Void (epic): board_corrupt — warps enemy board tiles to dark
            15: { a1: { name: 'Void Rend',         power: 2.4, chargePower: [0.9, 2.1, 3.2] },
                  a1evo1: { name: 'Curse', dot: [0.27, 0.58, 0.89], ticks: 4 },
                  a1evo2: { name: 'Oblivion', dot: [0.1, 0.24, 0.38], hit: [1.0, 2.4, 3.8], ticks: 5 },
                  a2: { name: "Hexcloud", buff: 'weaken', frac: [0.75, 1], nullify: [false, true] },
                  a2evo1: { name: "Shadowmeld", buff: 'tile_steal', count: [3, 7] },
                  a2evo2: { name: "Oblivion Veil", buff: 'board_corrupt', count: [5, 10], dr: [0.33, 0.5] } },

            // ── Legendary — A2 unchanged; A3 slot planned for future ──────────────
            16: { a1: { name: 'Magma Surge',    power: 2.8, chargePower: [1.0, 2.2, 3.3] },
                  a1evo1: { name: 'Kindle', dot: [0.28, 0.60, 0.92], ticks: 4 },
                  a1evo2: { name: 'Cataclysm', dot: [0.1, 0.25, 0.4], hit: [1.0, 2.5, 4.0], ticks: 5 }, a2: { name: "Magma Core", buff: 'scale_high_hp', highMult: [1.5, 4], lowMult: [0.5, 1], hpThresh: 0.5 },
                  a2evo1: { name: "Immolate", buff: 'execute', threshold: [0.1, 0.2] },
                  a2evo2: { name: "Supernova", buff: 'recoil', recoilFrac: 0.05, powerC: [1.5, 3.8] } },
            17: { a1: { name: 'Tentacle Slam',  power: 2.8, chargePower: [1.0, 2.2, 3.3] },
                  a1evo1: { name: 'Abrade', dot: [0.28, 0.60, 0.92], ticks: 4 },
                  a1evo2: { name: 'Krakenfall', dot: [0.1, 0.25, 0.4], hit: [1.0, 2.5, 4.0], ticks: 5 }, a2: { name: "Abyssal Undertow", buff: 'force_swap', bonusHitPower: [0, 1.3], fallbackPower: [1.4, 2.4] },
                  a2evo1: { name: "Riptide Guard", buff: 'absorb', amt: [3, 7] },
                  a2evo2: { name: "Leviathan’s Return", buff: 'revive', minCharge: 2, pct: 0.5, window: 2 } },
            18: { a1: { name: 'Ancient Bough',  power: 2.8, chargePower: [1.0, 2.2, 3.3] },
                  a1evo1: { name: 'Spores', dot: [0.28, 0.60, 0.92], ticks: 4 },
                  a1evo2: { name: 'Verdant Wrath', dot: [0.1, 0.25, 0.4], hit: [1.0, 2.5, 4.0], ticks: 5 }, a2: { name: "Wild Growth", buff: 'tile_steal', count: [3, 7] },
                  a2evo1: { name: "Grove Blessing", buff: 'rally', pct: [0.15, 0.35], turns: 3 },
                  a2evo2: { name: "World Tree", buff: 'heal', pct: [0.09, 0.2], clearDot: true } },
            19: { a1: { name: 'Storm Dive',     power: 2.8, chargePower: [1.0, 2.2, 3.3] },
                  a1evo1: { name: 'Ionize', dot: [0.28, 0.60, 0.92], ticks: 4 },
                  a1evo2: { name: 'Tempest Break', dot: [0.1, 0.25, 0.4], hit: [1.0, 2.5, 4.0], ticks: 5 }, a2: { name: "Static Surge", buff: 'overcharge', amt: [3, 7] },
                  a2evo1: { name: "Overclock", buff: 'extra_turn', minCharge: 2 },
                  a2evo2: { name: "Stormrelay", buff: 'tag_bonus', amt: [4, 10] } },
            20: { a1: { name: 'Oblivion Rend',  power: 2.8, chargePower: [1.0, 2.2, 3.3] },
                  a1evo1: { name: 'Haunt', dot: [0.28, 0.60, 0.92], ticks: 4 },
                  a1evo2: { name: 'Soul Reaver', dot: [0.1, 0.25, 0.4], hit: [1.0, 2.5, 4.0], ticks: 5 }, a2: { name: "Void Maw", buff: 'board_corrupt', count: [5, 10], dr: [0.33, 0.5] },
                  a2evo1: { name: "Dying Curse", buff: 'on_death', powerC: [4, 6], window: 2 },
                  a2evo2: { name: "Dread Command", buff: 'inspire', a2: [false, true] } },

            // ── New roster expansion ─────────────────────────────────────────────
            // Emberling (common): multi_hit — quick spark barrage
            21: { a1: { name: 'Spark Bite',   power: 2.0, chargePower: [0.75, 1.8, 3.0] },
                  a1evo1: { name: 'Smolder', dot: [0.25, 0.54, 0.83], ticks: 4 },
                  a1evo2: { name: 'Flareburst', dot: [0.1, 0.22, 0.34], hit: [1.0, 2.2, 3.4], ticks: 5 },
                  a2: { name: "Flash Ignite", buff: 'recoil', recoilFrac: 0.05, powerC: [1.5, 3.8] },
                  a2evo1: { name: "Scaleburn", buff: 'def_shred', frac: [0.3, 0.6], turns: 2 },
                  a2evo2: { name: "Firecracker Barrage", buff: 'multi_hit', hits: [2, 3], powerC: [1.1, 1.2] } },
            // Ashcoil (common): atk_down — choking ash cloud
            22: { a1: { name: 'Coil Strike',  power: 2.0, chargePower: [0.75, 1.8, 3.0] },
                  a1evo1: { name: 'Char', dot: [0.25, 0.54, 0.83], ticks: 4 },
                  a1evo2: { name: 'Ashfall', dot: [0.1, 0.22, 0.34], hit: [1.0, 2.2, 3.4], ticks: 5 },
                  a2: { name: "Ashen Ward", buff: 'shield', frac: [0.5, 0.75] },
                  a2evo1: { name: "Ash Effigy", buff: 'decoy', hits: [1, 2], turns: 3 },
                  a2evo2: { name: "Choking Ash", buff: 'atk_down', frac: [0.2, 0.5], turns: 2 } },
            // Coronark (rare): empower — solar self-buff
            23: { a1: { name: 'Solar Lance',  power: 2.2, chargePower: [0.8, 1.9, 3.1] },
                  a1evo1: { name: 'Radiant Burn', dot: [0.26, 0.56, 0.86], ticks: 4 },
                  a1evo2: { name: 'Corona Flare', dot: [0.1, 0.23, 0.36], hit: [1.0, 2.3, 3.6], ticks: 5 },
                  a2: { name: "Solar Flare", buff: 'overcharge', amt: [3, 7] },
                  a2evo1: { name: "Radiant Aura", buff: 'rally', pct: [0.15, 0.35], turns: 3 },
                  a2evo2: { name: "Corona Burst", buff: 'empower', mult: [2.0, 2.0], minCharge: 2 } },
            // Shellkin (common): shield — turtle-shell tank
            24: { a1: { name: 'Shell Ram',    power: 2.0, chargePower: [0.75, 1.8, 3.0] },
                  a1evo1: { name: 'Erosion', dot: [0.25, 0.54, 0.83], ticks: 4 },
                  a1evo2: { name: 'Shellstorm', dot: [0.1, 0.22, 0.34], hit: [1.0, 2.2, 3.4], ticks: 5 },
                  a2: { name: "Shell Bash", buff: 'counter', frac: [0.08, 0.2], turns: 2 },
                  a2evo1: { name: "Barnacle Ward", buff: 'reflect', frac: [0.25, 0.6] },
                  a2evo2: { name: "Fortress Shell", buff: 'shield', frac: [0.5, 0.75] } },
            // Calfling (common): leech — drains on hit
            25: { a1: { name: 'Splash Tackle',power: 2.0, chargePower: [0.75, 1.8, 3.0] },
                  a1evo1: { name: 'Chill', dot: [0.25, 0.54, 0.83], ticks: 4 },
                  a1evo2: { name: 'Wave Snap', dot: [0.1, 0.22, 0.34], hit: [1.0, 2.2, 3.4], ticks: 5 },
                  a2: { name: "Nibble", buff: 'siphon', amt: [3, 7] },
                  a2evo1: { name: "Grazing Recovery", buff: 'regen', pct: [0.05, 0.07], turns: [2, 3] },
                  a2evo2: { name: "Feral Bite", buff: 'leech', turns: [2, 3], powerC: [0.25, 0.3] } },
            // Wavecaller (rare): weaken — crashing wave saps the next hit
            26: { a1: { name: 'Wave Lash',    power: 2.2, chargePower: [0.8, 1.9, 3.1] },
                  a1evo1: { name: 'Corrosion', dot: [0.26, 0.56, 0.86], ticks: 4 },
                  a1evo2: { name: 'Tsunami Break', dot: [0.1, 0.23, 0.36], hit: [1.0, 2.3, 3.6], ticks: 5 },
                  a2: { name: "Undertow Pull", buff: 'tile_steal', count: [3, 7] },
                  a2evo1: { name: "Riptide Drag", buff: 'speed_down', frac: [0.5, 0.75] },
                  a2evo2: { name: "Crashing Wave", buff: 'weaken', frac: [0.5, 1], nullify: [false, true] } },
            // Moleburrow (common): interrupt — burrow disrupts the charge
            27: { a1: { name: 'Claw Dig',     power: 2.0, chargePower: [0.75, 1.8, 3.0] },
                  a1evo1: { name: 'Rot', dot: [0.25, 0.54, 0.83], ticks: 4 },
                  a1evo2: { name: 'Landslide', dot: [0.1, 0.22, 0.34], hit: [1.0, 2.2, 3.4], ticks: 5 },
                  a2: { name: "Burrow Trap", buff: 'lock_tiles', count: [2, 5] },
                  a2evo1: { name: "Root Snap", buff: 'def_shred', frac: [0.3, 0.6], turns: 2 },
                  a2evo2: { name: "Tunnel Ambush", buff: 'interrupt', clearA2: [false, true] } },
            // Meadowkid (common): inspire — pastoral support
            28: { a1: { name: 'Hoof Kick',    power: 2.0, chargePower: [0.75, 1.8, 3.0] },
                  a1evo1: { name: 'Wilting', dot: [0.25, 0.54, 0.83], ticks: 4 },
                  a1evo2: { name: 'Overgrowth', dot: [0.1, 0.22, 0.34], hit: [1.0, 2.2, 3.4], ticks: 5 },
                  a2: { name: "Meadow Breeze", buff: 'heal', pct: [0.09, 0.2], clearDot: true },
                  a2evo1: { name: "Pasture Cheer", buff: 'rally', pct: [0.15, 0.35], turns: 3 },
                  a2evo2: { name: "Blooming Support", buff: 'inspire', a2: [false, true] } },
            // Sporeling (rare): board_corrupt — spreads spores across the board
            29: { a1: { name: 'Spore Burst',  power: 2.2, chargePower: [0.8, 1.9, 3.1] },
                  a1evo1: { name: 'Mildew', dot: [0.26, 0.56, 0.86], ticks: 4 },
                  a1evo2: { name: 'Fungal Surge', dot: [0.1, 0.23, 0.36], hit: [1.0, 2.3, 3.6], ticks: 5 },
                  a2: { name: "Paralytic Spores", buff: 'paralyze', turns: [1, 2] },
                  a2evo1: { name: "Toxic Spores", buff: 'atk_down', frac: [0.2, 0.5], turns: 2 },
                  a2evo2: { name: "Fungal Bloom", buff: 'board_corrupt', count: [5, 10], dr: [0.33, 0.5] } },
            // Boltling (common): energy_denial — drains opponent charge
            30: { a1: { name: 'Volt Peck',    power: 2.0, chargePower: [0.75, 1.8, 3.0] },
                  a1evo1: { name: 'Fritz', dot: [0.25, 0.54, 0.83], ticks: 4 },
                  a1evo2: { name: 'Overvolt', dot: [0.1, 0.22, 0.34], hit: [1.0, 2.2, 3.4], ticks: 5 },
                  a2: { name: "Static Nip", buff: 'siphon', amt: [3, 7] },
                  a2evo1: { name: "Jolt", buff: 'speed_down', frac: [0.5, 0.75] },
                  a2evo2: { name: "Short Fuse", buff: 'energy_denial', amt: [2, 5] } },
            // Coilspark (common): tag_bonus — coiled charge passed on swap
            31: { a1: { name: 'Coil Snap',    power: 2.0, chargePower: [0.75, 1.8, 3.0] },
                  a1evo1: { name: 'Frizzle', dot: [0.25, 0.54, 0.83], ticks: 4 },
                  a1evo2: { name: 'Arc Discharge', dot: [0.1, 0.22, 0.34], hit: [1.0, 2.2, 3.4], ticks: 5 },
                  a2: { name: "Coil Charge", buff: 'overcharge', amt: [3, 7] },
                  a2evo1: { name: "Induction Coil", buff: 'absorb', amt: [3, 7] },
                  a2evo2: { name: "Charge Relay", buff: 'tag_bonus', amt: [4, 10] } },
            // Voltbeak (rare): revive — phoenix-shock resurrection
            32: { a1: { name: 'Talon Bolt',   power: 2.2, chargePower: [0.8, 1.9, 3.1] },
                  a1evo1: { name: 'Static Peck', dot: [0.26, 0.56, 0.86], ticks: 4 },
                  a1evo2: { name: 'Raptor Surge', dot: [0.1, 0.23, 0.36], hit: [1.0, 2.3, 3.6], ticks: 5 },
                  a2: { name: "Beak Strike", buff: 'armor_pierce', powerC: [1.5, 3], ignoreDR: [0.05, 0.1] },
                  a2evo1: { name: "Adrenal Spark", buff: 'extra_turn', minCharge: 2 },
                  a2evo2: { name: "Phoenix Circuit", buff: 'revive', minCharge: 2, pct: 0.5, window: 2 } },
            // Duskwing (common): speed_down — dusk slows the target
            33: { a1: { name: 'Wing Slash',   power: 2.0, chargePower: [0.75, 1.8, 3.0] },
                  a1evo1: { name: 'Fade', dot: [0.25, 0.54, 0.83], ticks: 4 },
                  a1evo2: { name: 'Twilight Rend', dot: [0.1, 0.22, 0.34], hit: [1.0, 2.2, 3.4], ticks: 5 },
                  a2: { name: "Dusk Veil", buff: 'reflect', frac: [0.25, 0.6] },
                  a2evo1: { name: "Wing Rend", buff: 'def_shred', frac: [0.3, 0.6], turns: 2 },
                  a2evo2: { name: "Twilight Snare", buff: 'speed_down', frac: [0.5, 0.75] } },
            // Shadowspin (common): on_death — curse fires as it falls
            34: { a1: { name: 'Web Strike',   power: 2.0, chargePower: [0.75, 1.8, 3.0] },
                  a1evo1: { name: 'Unravel', dot: [0.25, 0.54, 0.83], ticks: 4 },
                  a1evo2: { name: 'Shadow Weave', dot: [0.1, 0.22, 0.34], hit: [1.0, 2.2, 3.4], ticks: 5 },
                  a2: { name: "Web Trap", buff: 'lock_tiles', count: [2, 5] },
                  a2evo1: { name: "Shadow Thread", buff: 'siphon', amt: [3, 7] },
                  a2evo2: { name: "Final Curse", buff: 'on_death', powerC: [4, 6], window: 2 } },
            // Sicklegrim (rare): execute — reaper finishes the weak
            35: { a1: { name: 'Sickle Cut',   power: 2.2, chargePower: [0.8, 1.9, 3.1] },
                  a1evo1: { name: 'Blight Edge', dot: [0.26, 0.56, 0.86], ticks: 4 },
                  a1evo2: { name: 'Grim Harvest', dot: [0.1, 0.23, 0.36], hit: [1.0, 2.3, 3.6], ticks: 5 },
                  a2: { name: "Sickle Slash", buff: 'armor_pierce', powerC: [1.6, 3.3], ignoreDR: [0.05, 0.1] },
                  a2evo1: { name: "Grim Omen", buff: 'weaken', frac: [0.75, 1], nullify: [false, true] },
                  a2evo2: { name: "Reaper's Toll", buff: 'execute', threshold: [0.1, 0.2] } }
        };

        // ===================================================================
        // PASSIVE ABILITY SYSTEM
        // One always-on passive per species (not player-equipped — no loadout-editor
        // involvement). Keyed by the same numeric creature id as ABILITIES/creatureDatabase.
        //
        // Each entry's `buff` + numeric fields are real, wired gameplay data — 34 of the 35
        // passives below have a working chokepoint hook somewhere in the file (see the
        // per-hook comments near each phase below, and PASSIVE_ABILITY_SYSTEM.md for the full
        // roster + which function handles which buff). The one exception, Voltbeak's Chain
        // Reaction (`power_on_cascade`), is honestly self-flagged `deferred: true` in its own
        // table entry below because cascade detection isn't exposed to the ability system yet.
        //
        // UNLOCK MODEL: essence-gated per creature INSTANCE (not species-wide, not level-
        // gated) — a one-time purchase from that creature's own element wallet, same pattern
        // as the existing Bond-3 elemental aura (`buyCreatureAura`). Cost scales by rarity so
        // it's a second, independent balance lever from the ability's own numbers.
        //
        // ARCHITECTURE RULE: `getPassive(creature)` is the ONLY function that should ever
        // return a usable passive entry — it returns null whenever the instance hasn't
        // unlocked it, regardless of what's in PASSIVE_TABLE. Every hook must call
        // getPassive(), never read PASSIVE_TABLE[id] directly, so "is it unlocked" is only
        // solved once instead of re-checked in every hook.
        // ===================================================================
        const PASSIVE_UNLOCK_COST = { common: 10, rare: 15, epic: 20, legendary: 30 };

        const PASSIVE_TABLE = {
            // ── Fire ──────────────────────────────────────────────────────────────
            1:  { name: 'Ember Cache', category: 'Power Economy',
                  desc: 'Gains a power bar whenever it lands a match involving Fire tiles.',
                  buff: 'power_on_match', el: 'fire', amt: 1 },
            2:  { name: 'Element Adept', category: 'Elemental Identity',
                  desc: 'Increase element advantage to 1.4x against Grass and Dark.',
                  buff: 'element_matchup_offense', targets: ['grass', 'dark'], mult: 1.4 },
            3:  { name: 'Blaze Command', category: 'Team/Leader',
                  desc: 'While leading the team (team slot 0), the whole team gets a flat ATK bonus.',
                  buff: 'team_leader_stat_buff', stat: 'atk', frac: 0.08 },
            16: { name: 'Molten Core', category: 'Power Economy',
                  desc: 'Gains a power bar whenever it deals damage of any kind, from a match or an ability.',
                  buff: 'power_on_damage_dealt', amt: 1 },
            21: { name: 'Flash Point', category: 'Damage/Mitigation',
                  desc: 'Deals bonus damage specifically on the very first hit it lands each battle.',
                  buff: 'first_hit_bonus', frac: 0.25 },   // was 0.5 (1.5x) — lowered 2026-07-27 to 1.25x
            22: { name: 'Smoldering Touch', category: 'Status/DoT',
                  desc: 'Its own DoT effects deal more damage.',
                  buff: 'dot_output_mult', frac: 0.15 },
            23: { name: 'Corona Pulse', category: 'Board Interaction',
                  desc: 'Whenever Coronark lands a match-5 (any element), converts nearby tiles to Fire.',
                  buff: 'tile_convert_on_match', minSize: 5, tiles: 2, chance: 1.0, convertTo: 'fire' },

            // ── Water ─────────────────────────────────────────────────────────────
            4:  { name: 'Tidal Reserve', category: 'Power Economy',
                  desc: 'Enters battle with free power bars already banked.',
                  buff: 'power_on_battle_start', amt: 3 },
            5:  { name: 'Thick Hide', category: 'Elemental Identity',
                  desc: 'Decrease element disadvantage to 1.2x from Electric and Grass.',
                  buff: 'element_matchup_defense', sources: ['electric', 'grass'], mult: 1.2 },
            6:  { name: 'Deep Anchor', category: 'Swap/Tempo',
                  desc: 'Leviathan does not lose ability charges when swapping in or out.',
                  buff: 'no_charge_loss_on_swap' },
            17: { name: 'Abyssal Splash', category: 'Damage/Mitigation',
                  desc: "On landing a hit, also deals chip damage to all other living enemies.",
                  buff: 'splash_damage', frac: 0.10 },
            24: { name: 'Hard Shell', category: 'Damage/Mitigation',
                  desc: 'Takes a flat % less damage from all direct attacks, applied AFTER DEF and after any DR-ignoring effects.',
                  buff: 'flat_mitigation', frac: 0.08 },
            25: { name: 'Soothing Aura', category: 'Status/DoT',
                  desc: 'Immune to enemy-inflicted DoT effects (poison, burn, A1 DoT) while active.',
                  buff: 'dot_immunity' },
            26: { name: 'Current Pull', category: 'Board Interaction',
                  desc: 'Gains a power bar whenever it lands a match of 4 or more tiles involving Water tiles.',
                  buff: 'power_on_match', el: 'water', amt: 1, minSize: 4 },

            // ── Grass ─────────────────────────────────────────────────────────────
            7:  { name: 'Photosynthesis', category: 'Power Economy',
                  desc: 'Gains a bonus power bar automatically every 2 turns, even without matching.',
                  buff: 'power_on_interval', turns: 2, amt: 1 },
            8:  { name: 'Element Adept', category: 'Elemental Identity',
                  desc: 'Increase element advantage to 1.4x against Water and Electric.',
                  buff: 'element_matchup_offense', targets: ['water', 'electric'], mult: 1.4 },
            9:  { name: 'Overgrowth Fury', category: 'Conditional/Threshold',
                  desc: 'Deals bonus damage while below 30% HP.',
                  buff: 'threshold_damage_bonus', hpFrac: 0.3, direction: 'below', bonusFrac: 0.25 },
            18: { name: 'World Bloom', category: 'Status/DoT',
                  desc: 'Heals a flat % of max HP after each round.',
                  buff: 'heal_per_round', frac: 0.03 },
            27: { name: 'Dig In', category: 'Damage/Mitigation',
                  desc: 'The first hit Moleburrow takes each battle is fully negated.',
                  buff: 'block_first_hit', frac: 1.0 },
            28: { name: 'Hardy Constitution', category: 'Status/DoT',
                  desc: 'Any negative status effect applied to Meadowkid is capped at a 1-turn duration.',
                  buff: 'debuff_duration_cap', turns: 1 },
            29: { name: 'Spore Drift', category: 'Board Interaction',
                  desc: 'Matching Grass tiles has a chance to passively convert 1 random enemy-weak tile.',
                  buff: 'tile_convert_on_match', minSize: 1, tiles: 1, chance: 0.25, el: 'grass', convertTo: 'weakest' },

            // ── Electric ──────────────────────────────────────────────────────────
            10: { name: 'Static Cling', category: 'Power Economy',
                  desc: 'Gains a power bar whenever it lands a match involving Electric tiles.',
                  buff: 'power_on_match', el: 'electric', amt: 1 },
            11: { name: 'Thick Hide', category: 'Elemental Identity',
                  desc: 'Decrease element disadvantage to 1.2x from Grass and Dark.',
                  buff: 'element_matchup_defense', sources: ['grass', 'dark'], mult: 1.2 },
            12: { name: 'Overflow', category: 'Power Economy',
                  desc: "Sparkhorn's power bar cap is higher than normal.",
                  buff: 'power_cap_bonus', amt: 2 },
            19: { name: 'Storm Vanguard', category: 'Team/Leader',
                  desc: 'While leading the team, the whole team gets a flat DEF bonus.',
                  buff: 'team_leader_stat_buff', stat: 'def', frac: 0.08 },
            30: { name: 'Static Shock', category: 'Damage/Mitigation',
                  desc: 'Deals chip damage back to the attacker whenever hit by a direct attack.',
                  buff: 'reflect_on_hit', frac: 0.10 },
            31: { name: 'Charged Barbs', category: 'Status/DoT',
                  desc: 'Its attacks apply a small stacking DoT on top of normal damage, weaker than standard DoT ticks.',
                  buff: 'minor_dot_on_hit', pctMaxHp: 0.03, turns: 2 },
            32: { name: 'Chain Reaction', category: 'Board Interaction',
                  desc: 'Whenever a cascade (chain match from one swap) occurs, gains a power bar once.',
                  buff: 'power_on_cascade', amt: 1,
                  deferred: true /* cascade detection not yet exposed to the ability system — see Phase 7 */ },

            // ── Dark ──────────────────────────────────────────────────────────────
            13: { name: 'Shadow Toll', category: 'Power Economy',
                  desc: 'Gains a power bar whenever it takes a single hit dealing 10%+ of its max HP.',
                  buff: 'power_on_damage_taken', thresholdFrac: 0.10, amt: 1 },
            14: { name: 'Element Adept', category: 'Elemental Identity',
                  desc: 'Increase element advantage to 1.4x against Grass and Electric.',
                  buff: 'element_matchup_offense', targets: ['grass', 'electric'], mult: 1.4 },
            15: { name: 'Umbral Static', category: 'Board Interaction',
                  desc: 'Whenever Void lands a match of 4 or more, converts an enemy tile to Dark.',
                  buff: 'tile_convert_on_match', minSize: 4, tiles: 1, chance: 1.0, el: 'dark', convertTo: 'dark', board: 'enemy' },
            20: { name: 'Soul Anchor', category: 'Swap/Tempo',
                  desc: "Whenever a teammate faints, stuns the enemy for 1 turn (they can't act on their next turn).",
                  buff: 'stun_enemy_on_ally_faint', turns: 1 },
            33: { name: 'Wing Guard', category: 'Damage/Mitigation',
                  desc: 'Gains a DEF bonus while below 50% HP.',
                  buff: 'def_bonus_below_hp', hpFrac: 0.5, defBonusFrac: 0.15 },
            34: { name: 'Creeping Dread', category: 'Status/DoT',
                  desc: 'Status effects AND DoT effects that Shadowspin inflicts last 1 extra turn.',
                  buff: 'own_debuff_duration_bonus', turns: 1 },
            35: { name: 'Harvest Pattern', category: 'Board Interaction',
                  desc: 'Match-4s involving Dark tiles have a chance to also grant a bonus A2 charge tick.',
                  buff: 'power_on_match', el: 'dark', amt: 1, minSize: 4, chance: 0.25 },
        };

        const ARM_A1_LEN = 4; // dominant-element tiles matched this turn (across cascades) to arm A1

        const ARM_A2_LEN = 5; // dominant-element tiles matched this turn (across cascades) to arm A2

        // Ability charge system: each ability builds charges from matches and can be
        // fired once it holds at least 1 charge. A match-4 adds 1 charge to A1; a
        // match-5 adds 1 charge to BOTH A1 and A2. Charges cap per ability below.
        const A1_MAX_CHARGES = 3; // ability 1 holds up to 3 charges

        const A2_MAX_CHARGES = 2; // ability 2 holds up to 2 charges

        // Abilities also unlock with the creature's level: A1 at Lv2, A2 at Lv5.
        const ABILITY_UNLOCK_LV = { 1: 2, 2: 5 };

        // ── Ability loadout model ───────────────────────────────────────────
        // Each creature has up to 3 A1 and 3 A2 abilities, unlocked by evolution tier:
        //   row/tier 0 → 'evo0'   row/tier 1 → 'evo1'   row/tier 2 → 'evo2'
        // The player equips exactly ONE A1 and ONE A2 from whatever's unlocked.
        // creature.equippedA1 / creature.equippedA2 store the chosen slot key ('evo0'..).
        // Defaults to 'evo0' (the starting abilities) when unset.
        const SLOT_TIER = { evo0: 0, evo1: 1, evo2: 2 };
