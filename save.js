// Save validation, migrations, persistence, and portable backup encoding.
// Loaded before the game script; functions resolve gameState and database at call time.

        // Shared boundary for disk saves and pasted backups. Work on a detached copy:
        // rejection must not mutate either the live game or the player's saved progress.
        function validateSaveData(input) {
            const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
            const fail = path => { throw new Error('Invalid save field: ' + path); };
            const number = (v, path, min = 0, integer = false) => {
                if (typeof v !== 'number' || !Number.isFinite(v) || v < min ||
                    (integer && !Number.isSafeInteger(v))) fail(path);
            };
            try {
                if (!object(input)) fail('save');
                // Reject prototype setters even in nested extension data before Object.assign.
                const inspect = (v, path, depth = 0) => {
                    if (depth > 100) fail(path);
                    if (!v || typeof v !== 'object') return;
                    for (const key of Object.keys(v)) {
                        if (['__proto__', 'constructor', 'prototype'].includes(key)) fail(path + '.' + key);
                        inspect(v[key], path + '.' + key, depth + 1);
                    }
                };
                inspect(input, 'save');
                const data = JSON.parse(JSON.stringify(input));
                if (data.pokedex && !data.creaturedex) data.creaturedex = data.pokedex;
                if (data.coins != null && data.spirit == null) data.spirit = data.coins;
                delete data.pokedex;
                delete data.coins;
                if (!Array.isArray(data.creatures) || !Array.isArray(data.team)) fail('creatures/team');

                // Validate supplied default-backed fields and fill absent nested fields in
                // older saves. Null defaults have their own checks below where needed.
                const backfill = (value, defaults, path) => {
                    for (const [key, fallback] of Object.entries(defaults)) {
                        const field = path + '.' + key;
                        if (!Object.hasOwn(value, key)) {
                            value[key] = JSON.parse(JSON.stringify(fallback));
                        } else if (fallback !== null) {
                            const v = value[key];
                            if (Array.isArray(fallback)) {
                                if (!Array.isArray(v)) fail(field);
                            } else if (object(fallback)) {
                                if (!object(v)) fail(field);
                                backfill(v, fallback, field);
                            } else if (typeof v !== typeof fallback) fail(field);
                            else if (typeof v === 'number') number(v, field);
                        }
                    }
                };
                backfill(data, GAME_STATE_DEFAULTS, 'save');
                for (const key of ['currentLevel', 'currentFloor']) number(data[key], key, 1, true);
                for (const key of ['spirit', 'gems', 'energy', 'loginStreak']) number(data[key], key, 0, true);
                for (const key of ['skillLevels', 'dexEvoSeen']) {
                    for (const value of Object.values(data[key])) number(value, key, 0, true);
                }
                for (const key of ['narrativeShown', 'shopTabsSeen']) {
                    if (!object(data.tutorial[key])) fail('tutorial.' + key);
                }
                if (!data.achievements.every(v => typeof v === 'string')) fail('achievements');
                const ids = new Set();
                data.creatures.forEach((c, i) => {
                    const path = 'creatures[' + i + ']';
                    if (!object(c)) fail(path);
                    number(c.id, path + '.id'); // instance IDs intentionally have fractional parts
                    if (ids.has(c.id)) fail(path + '.id (duplicate)');
                    ids.add(c.id);
                    if (!['string', 'number'].includes(typeof c.baseId) || !Object.hasOwn(creatureDatabase, c.baseId)) fail(path + '.baseId');
                    number(c.level, path + '.level', 1, true);
                    for (const key of ['xp', 'mergeLevel', 'mergeProgress', 'evoTier', 'bondLevel']) {
                        if (!Object.hasOwn(c, key)) c[key] = 0;
                        number(c[key], path + '.' + key, 0, true);
                    }
                    if (c.evoTier > 2 || c.bondLevel > 5) fail(path + '.evolution/bond');
                    if (c.statRoll != null) {
                        if (!object(c.statRoll)) fail(path + '.statRoll');
                        for (const key of ['hp', 'atk', 'def']) number(c.statRoll[key], path + '.statRoll.' + key, -5);
                    }
                    if (c.nickname != null && typeof c.nickname !== 'string') fail(path + '.nickname');
                    for (const key of ['equippedA1', 'equippedA2']) {
                        if (c[key] != null && !['evo0', 'evo1', 'evo2'].includes(c[key])) fail(path + '.' + key);
                    }
                });
                const team = (slots, path) => {
                    if (!Array.isArray(slots) || slots.length > 3) fail(path);
                    const seen = new Set();
                    slots.forEach(id => {
                        if (id === null) return;
                        if (!ids.has(id) || seen.has(id)) fail(path + ' (unknown or duplicate creature)');
                        seen.add(id);
                    });
                    while (slots.length < 3) slots.push(null);
                };
                team(data.team, 'team');
                if (data.formations != null) {
                    if (!Array.isArray(data.formations)) fail('formations');
                    data.formations.forEach((slots, i) => {
                        if (!Array.isArray(slots)) fail('formations[' + i + ']');
                        const seen = new Set();
                        data.formations[i] = slots.slice(0, 3).map(id => {
                            if (!ids.has(id) || seen.has(id)) return null;
                            seen.add(id);
                            return id;
                        });
                        while (data.formations[i].length < 3) data.formations[i].push(null);
                    });
                }
                if (data.activeFormation != null) number(data.activeFormation, 'activeFormation', 0, true);
                if (data.selectedStarterElement !== null && !ELEMENTS.includes(data.selectedStarterElement)) fail('selectedStarterElement');
                for (const key of ['dailyLastClaimDate']) {
                    if (data[key] !== null && typeof data[key] !== 'string') fail(key);
                }
                if (data.selectedCreatureId !== null && !ids.has(data.selectedCreatureId)) data.selectedCreatureId = null;
                return { ok: true, data };
            } catch (e) {
                return { ok: false, reason: e.message || 'The save is damaged.' };
            }
        }

        function loadGameData() {
            let saved = null;
            try {
                saved = localStorage.getItem('creatureMatchGame');
            } catch (e) {
                // Storage entirely unavailable (Safari private mode, storage disabled by policy).
                // Nothing to load; the game still runs fine in-memory for this session.
                storageUnavailable = true;
                return;
            }
            if (!saved) return;
            let data;
            try {
                data = JSON.parse(saved);
                const validated = validateSaveData(data);
                if (!validated.ok) throw new Error(validated.reason);
                data = validated.data;
            } catch (e) {
                try {
                    localStorage.setItem('creatureMatchGame_corrupt_backup', saved);
                    localStorage.removeItem('creatureMatchGame');
                } catch (e2) { /* best effort — booting fresh matters more than the backup */ }
                saveLoadFailed = true;
                return;
            }
            // Migration: the caught-creature record was renamed pokedex -> creaturedex.
            // Carry old saves over so players don't lose their catch progress.
            if (data.pokedex && !data.creaturedex) {
                data.creaturedex = data.pokedex;
            }
            delete data.pokedex;
            // Migration: the soft currency was renamed coins -> spirit. Carry the balance over.
            if (data.coins != null && data.spirit == null) {
                data.spirit = data.coins;
            }
            delete data.coins;
            Object.assign(gameState, data);
            // Migration: backfill the Creaturedex evolution-seen record from any creatures
            // already owned at a higher tier (so pre-existing saves don't hide forms the
            // player has clearly already reached).
            if (!gameState.dexEvoSeen) gameState.dexEvoSeen = {};
            (gameState.creatures || []).forEach(c => {
                const t = c.evoTier || 0;
                if (t > 0) gameState.dexEvoSeen[c.baseId] = Math.max(gameState.dexEvoSeen[c.baseId] || 0, t);
                if (c.bondLevel == null) c.bondLevel = 0; // per-creature bonding (0-5)
            });
        }

        // Set when storage can't be read/written at all (iOS Safari Private Browsing throws on
        // every setItem — and this is a mobile-first add-to-home-screen game, so that's a real
        // audience), or when a save turned out to be corrupt. Surfaced once via warnIfSaveBroken()
        // so the player finds out BEFORE sinking an hour into progress that won't persist.
        let storageUnavailable = false;
        let saveLoadFailed = false;
        let storageWarningShown = false;

        // Never let a failed write throw into a caller — saveGameData() has ~74 call sites
        // threaded through battle flow, rewards, and screen transitions, and an unguarded
        // QuotaExceededError from any one of them would abort whatever the player was doing
        // mid-action (losing a battle result, a reward grant, a screen change).
        function saveGameData() {
            try {
                localStorage.setItem('creatureMatchGame', JSON.stringify(gameState));
            } catch (e) {
                storageUnavailable = true;
                warnIfSaveBroken();
            }
        }

        // One-time, non-blocking heads-up that progress isn't persisting. Deliberately uses the
        // existing toast rather than a modal so it can never interrupt a battle or trap input.
        function warnIfSaveBroken() {
            if (storageWarningShown) return;
            storageWarningShown = true;
            setTimeout(() => {
                try {
                    if (saveLoadFailed && !storageUnavailable) {
                        homeToast("Your previous save couldn't be read and has been reset.");
                    } else {
                        homeToast("Progress can't be saved on this device/browser.");
                    }
                } catch (e) { /* toast unavailable this early — nothing else to do */ }
            }, 1200);
        }


        // ===== SAVE EXPORT / IMPORT =====
        // Why this exists: localStorage is the ONLY copy of a player's progress — no accounts,
        // no server. Clearing browser data, switching devices, or the OS reclaiming storage
        // under pressure all wipe a maxed roster permanently with no recourse. Export gives the
        // player a portable backup they control; import restores it (and doubles as the support
        // path when someone writes in having lost progress).
        //
        // Format: `CMB1.<base64(JSON)>` — the version prefix lets a future format change be
        // detected and rejected cleanly instead of parsed into garbage. Base64 keeps it a single
        // line that survives copy/paste through chat apps and email without newline mangling.
        // This is emphatically NOT anti-cheat — anyone can decode and edit it. It's a backup.
        const SAVE_CODE_PREFIX = 'CMB1.';

        // btoa() throws on any character above U+00FF, and creature nicknames can contain
        // emoji/accents — so round-trip through UTF-8 bytes rather than calling btoa directly.
        function utf8ToB64(str) {
            const bytes = new TextEncoder().encode(str);
            let bin = '';
            bytes.forEach(b => { bin += String.fromCharCode(b); });
            return btoa(bin);
        }
        function b64ToUtf8(b64) {
            const bin = atob(b64);
            const bytes = Uint8Array.from(bin, ch => ch.charCodeAt(0));
            return new TextDecoder().decode(bytes);
        }

        function buildSaveCode() {
            return SAVE_CODE_PREFIX + utf8ToB64(JSON.stringify(gameState));
        }

        // Strict validation. An imported code is untrusted user input heading straight into
        // gameState — the same place a malformed blob previously bricked the boot (see
        // loadGameData). Returns { ok: true, data } or { ok: false, reason }.
        function parseSaveCode(raw) {
            const code = (raw || '').trim().replace(/\s+/g, '');
            if (!code) return { ok: false, reason: 'Nothing pasted.' };
            if (!code.startsWith(SAVE_CODE_PREFIX)) {
                return { ok: false, reason: "That doesn't look like a save code (should start with " + SAVE_CODE_PREFIX + ")." };
            }
            let json;
            try {
                json = b64ToUtf8(code.slice(SAVE_CODE_PREFIX.length));
            } catch (e) {
                return { ok: false, reason: 'The code looks incomplete or corrupted.' };
            }
            let data;
            try {
                data = JSON.parse(json);
            } catch (e) {
                return { ok: false, reason: 'The code is damaged and could not be read.' };
            }
            if (!data || typeof data !== 'object' || Array.isArray(data)) {
                return { ok: false, reason: 'That code does not contain a save.' };
            }
            return validateSaveData(data);
        }

