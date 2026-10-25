// Creature species and evolution names.
// Classic script: shared data only; no browser APIs or game-state mutations.

        // ===== CREATURE DATABASE =====
        const creatureDatabase = {
            // Fire creatures
            1: { id: 1, code: 'FC1', name: 'Cinder', element: 'fire', emoji: '🔥', rarity: 'common', baseHP: 50, baseATK: 12, baseDEF: 6,
                 ability: { name: 'Flame Burst', effect: 'Deal +50% damage this turn' } },
            2: { id: 2, code: 'FR1', name: 'Wildfire', element: 'fire', emoji: '🌪️', rarity: 'rare', baseHP: 64, baseATK: 12.5, baseDEF: 7.7,
                 ability: { name: 'Inferno', effect: 'Deal 50 fixed damage' } },
            3: { id: 3, code: 'FE1', name: 'Infernal', element: 'fire', emoji: '💥', rarity: 'epic', baseHP: 85.1, baseATK: 13.1, baseDEF: 9.5,
                 ability: { name: 'Cataclysm', effect: 'Deal 100 fixed damage' } },

            // Water creatures
            4: { id: 4, code: 'WC1', name: 'Droplet', element: 'water', emoji: '💧', rarity: 'common', baseHP: 48, baseATK: 12, baseDEF: 7,
                 ability: { name: 'Flood', effect: 'Deal +40% water damage for 3 turns' } },
            5: { id: 5, code: 'WR1', name: 'Tidecaller', element: 'water', emoji: '🌊', rarity: 'rare', baseHP: 60.7, baseATK: 13.4, baseDEF: 8.8,
                 ability: { name: 'Tidal Wave', effect: 'Clear bottom row of board' } },
            6: { id: 6, code: 'WE1', name: 'Leviathan', element: 'water', emoji: '🐉', rarity: 'epic', baseHP: 80.4, baseATK: 13.1, baseDEF: 10.6,
                 ability: { name: 'Abyss', effect: 'Deal 80 fixed damage' } },

            // Grass creatures
            7: { id: 7, code: 'GC1', name: 'Sprout', element: 'grass', emoji: '🌿', rarity: 'common', baseHP: 48, baseATK: 12, baseDEF: 6,
                 ability: { name: 'Entangle', effect: 'Enemy attacks every 2 turns instead' } },
            8: { id: 8, code: 'GR1', name: 'Thornvine', element: 'grass', emoji: '🌱', rarity: 'rare', baseHP: 64, baseATK: 12.5, baseDEF: 7.7,
                 ability: { name: 'Growth', effect: 'Gain +10% stats per turn' } },
            9: { id: 9, code: 'GE1', name: 'Wildwood', element: 'grass', emoji: '🦁', rarity: 'epic', baseHP: 82.7, baseATK: 13.1, baseDEF: 9.5,
                 ability: { name: "Nature's Wrath", effect: 'Deal 90 fixed damage' } },

            // Electric creatures (unlock Floor 2)
            10: { id: 10, code: 'EC1', name: 'Zap', element: 'electric', emoji: '⚡', rarity: 'common', baseHP: 46, baseATK: 13, baseDEF: 6,
                  ability: { name: 'Shock', effect: 'Deal +45% damage to water types' } },
            11: { id: 11, code: 'ER1', name: 'Stormchild', element: 'electric', emoji: '🌩️', rarity: 'rare', baseHP: 61.8, baseATK: 12.5, baseDEF: 7.7,
                  ability: { name: 'Thunder', effect: 'Stun enemy for 1 turn' } },
            12: { id: 12, code: 'EE1', name: 'Sparkhorn', element: 'electric', emoji: '⚙️', rarity: 'epic', baseHP: 78, baseATK: 13.9, baseDEF: 9.5,
                  ability: { name: 'Overdrive', effect: 'Deal 110 fixed damage' } },

            // Dark creatures (unlock Floor 3)
            13: { id: 13, code: 'DC1', name: 'Shade',    element: 'dark',     emoji: '👻', rarity: 'common',    baseHP: 48, baseATK: 12, baseDEF: 6,
                  ability: { name: 'Night Veil', effect: 'Reduce enemy damage by 30%' } },
            14: { id: 14, code: 'DR1', name: 'Nightbane',   element: 'dark',     emoji: '🌑', rarity: 'rare',      baseHP: 59.6, baseATK: 12.5, baseDEF: 7.7,
                  ability: { name: 'Curse', effect: 'Reduce enemy attack by 25%' } },
            15: { id: 15, code: 'DE1', name: 'Void',  element: 'dark',     emoji: '🕷️', rarity: 'epic',      baseHP: 78, baseATK: 13.9, baseDEF: 10.6,
                  ability: { name: 'Void', effect: 'Deal 120 fixed damage' } },

            // ── Legendary creatures (summon-only, one per element) ──────────────
            16: { id: 16, code: 'FL1', name: 'Pyroclasm', element: 'fire',     emoji: '🌋', rarity: 'legendary', baseHP: 118.3, baseATK: 13.6, baseDEF: 11.2,
                  ability: { name: 'Eruption',     effect: 'Massive fire damage + empower self' } },
            17: { id: 17, code: 'WL1', name: 'Kraken',    element: 'water',    emoji: '🦑', rarity: 'legendary', baseHP: 130.8, baseATK: 13.6, baseDEF: 12.5,
                  ability: { name: 'Tidal Crush',  effect: 'Massive water damage + heal self' } },
            18: { id: 18, code: 'GL1', name: 'Sylvara',   element: 'grass',    emoji: '🌳', rarity: 'legendary', baseHP: 124.6, baseATK: 14.3, baseDEF: 12.5,
                  ability: { name: 'Life Bloom',   effect: 'Massive grass damage + restore HP' } },
            19: { id: 19, code: 'EL1', name: 'Stormwing', element: 'electric', emoji: '🦅', rarity: 'legendary', baseHP: 109.6, baseATK: 14.3, baseDEF: 11.2,
                  ability: { name: 'Thunderstrike',effect: 'Massive electric damage + stun' } },
            20: { id: 20, code: 'DL1', name: 'Voidlord',  element: 'dark',     emoji: '🌌', rarity: 'legendary', baseHP: 112.1, baseATK: 14.3, baseDEF: 11.2,
                  ability: { name: 'Void Collapse', effect: 'Highest damage of all + empower self' } },

            // ── New roster expansion (Fire/Water/Grass/Electric/Dark commons + rares) ──
            21: { id: 21, code: 'FC2', name: 'Emberling', element: 'fire',     emoji: '🕯️', rarity: 'common', baseHP: 45, baseATK: 14, baseDEF: 5 },
            22: { id: 22, code: 'FC3', name: 'Ashcoil',   element: 'fire',     emoji: '🌋', rarity: 'common', baseHP: 52, baseATK: 11, baseDEF: 8 },
            23: { id: 23, code: 'FR2', name: 'Coronark',  element: 'fire',     emoji: '☀️', rarity: 'rare',   baseHP: 61.8, baseATK: 13.4, baseDEF: 7.7 },
            24: { id: 24, code: 'WC2', name: 'Shellkin',  element: 'water',    emoji: '🐚', rarity: 'common', baseHP: 49, baseATK: 10, baseDEF: 8 },
            25: { id: 25, code: 'WC3', name: 'Calfling',  element: 'water',    emoji: '🐋', rarity: 'common', baseHP: 44, baseATK: 13, baseDEF: 6 },
            26: { id: 26, code: 'WR2', name: 'Wavecaller',element: 'water',    emoji: '🌊', rarity: 'rare',   baseHP: 64, baseATK: 11.6, baseDEF: 8.8 },
            27: { id: 27, code: 'GC2', name: 'Moleburrow',element: 'grass',    emoji: '🦔', rarity: 'common', baseHP: 51, baseATK: 11, baseDEF: 7 },
            28: { id: 28, code: 'GC3', name: 'Meadowkid', element: 'grass',    emoji: '🐐', rarity: 'common', baseHP: 47, baseATK: 12, baseDEF: 7 },
            29: { id: 29, code: 'GR2', name: 'Sporeling', element: 'grass',    emoji: '🍄', rarity: 'rare',   baseHP: 62.9, baseATK: 12.5, baseDEF: 8.8 },
            30: { id: 30, code: 'EC2', name: 'Boltling',  element: 'electric', emoji: '🐿️', rarity: 'common', baseHP: 44, baseATK: 14, baseDEF: 6 },
            31: { id: 31, code: 'EC3', name: 'Coilspark', element: 'electric', emoji: '🌀', rarity: 'common', baseHP: 48, baseATK: 13, baseDEF: 6 },
            32: { id: 32, code: 'ER2', name: 'Voltbeak',  element: 'electric', emoji: '🦜', rarity: 'rare',   baseHP: 59.6, baseATK: 13.4, baseDEF: 7.7 },
            33: { id: 33, code: 'DC2', name: 'Duskwing',  element: 'dark',     emoji: '🦇', rarity: 'common', baseHP: 46, baseATK: 13, baseDEF: 7 },
            34: { id: 34, code: 'DC3', name: 'Shadowspin',element: 'dark',     emoji: '🕸️', rarity: 'common', baseHP: 50, baseATK: 11, baseDEF: 7 },
            35: { id: 35, code: 'DR2', name: 'Sicklegrim',element: 'dark',     emoji: '⚰️', rarity: 'rare',   baseHP: 58.5, baseATK: 13.4, baseDEF: 8.8 }
        };

        // Evolved form names, indexed [tier1, tier2] per baseId. Tier 0 uses the base name.
        const EVO_NAMES = {
            1:  ['Pyrelet',   'Cinderwing'],
            2:  ['Flarejet',  'Infernath'],
            3:  ['Magmaw',    'Volcanor'],
            4:  ['Ripplet',   'Tideflow'],
            5:  ['Surger',    'Maelstrom'],
            6:  ['Drakewave', 'Abyssal'],
            7:  ['Saplet',    'Verdania'],
            8:  ['Bramble',   'Thornlord'],
            9:  ['Maneox',    'Gaiakin'],
            10: ['Voltling',  'Stormbit'],
            11: ['Arcjolt',   'Thundroar'],
            12: ['Voltcharger', 'Thunderhide'],
            13: ['Umbril',    'Nightmaw'],
            14: ['Wraithe',   'Phantomos'],
            15: ['Voidling',  'Eclipsor'],
            16: ['Volcrath',   'Emberlord'],
            17: ['Tidewraith', 'Deepking'],
            18: ['Sylvanor',   'Forestborn'],
            19: ['Thunderclad','Stormknight'],
            20: ['Darkwhisper','Voidknight'],
            21: ['Solkit',     'Coronis'],
            22: ['Cindermaw',  'Vulcarion'],
            23: ['Solmirus',   'Solmonarch'],
            24: ['Shellguard', 'Shellsovereign'],
            25: ['Finbrook',   'Tidebreacher'],
            26: ['Ripcurrent', 'Thalassor'],
            27: ['Rootpaw',    'Loamhide'],
            28: ['Pasturehoof','Verdantaur'],
            29: ['Mycelet',    'Fungara'],
            30: ['Sparkleap',  'Voltstride'],
            31: ['Voltcoil',   'Dynamek'],
            32: ['Sparkcrane', 'Thunderplume'],
            33: ['Hollowmoth', 'Voidlure'],
            34: ['Duskweave',  'Voidrix'],
            35: ['Scytheclaw', 'Grimreaper']
        };
