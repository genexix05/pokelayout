/**
 * PokeLayout - Script con configuración completa
 */

const REFRESH_INTERVAL = 2000;
const API_URL = '/api/team';

let currentTeam = null;
let config = {
    layout: 'horizontal',
    spriteType: 'default',
    showNickname: true,
    showLevel: true,
    showHP: false,
    showShiny: true,
    spacing: 8,
    spriteSize: 48,
    fontFamily: 'Inter',
    fontSize: 11,
    colorName: '#f8fafc',
    colorNickname: '#fbbf24',
    colorLevel: '#94a3b8',
    textStroke: false,
    strokeColor: '#000000',
    strokeWidth: 2,
    background: 'transparent'
};

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const FALLBACK_SPRITE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';

// Tipos con soporte shiny / female / alta resolución
const SPRITE_TYPES = {
    default:            { path: '', ext: 'png', shiny: true, female: true, highRes: false },
    back:               { path: 'back', ext: 'png', shiny: true, female: true, highRes: false },
    official:           { path: 'other/official-artwork', ext: 'png', shiny: true, female: false, highRes: true },
    home:               { path: 'other/home', ext: 'png', shiny: true, female: false, highRes: true },
    showdown:           { path: 'other/showdown', ext: 'gif', shiny: true, female: true, highRes: false },
    dream:              { path: 'other/dream-world', ext: 'svg', shiny: false, female: false, highRes: true },

    'gen1-rb':          { path: 'versions/generation-i/red-blue', ext: 'png', shiny: false, female: false, highRes: false },
    'gen1-rb-gray':     { path: 'versions/generation-i/red-blue/gray', ext: 'png', shiny: false, female: false, highRes: false },
    'gen1-yellow':      { path: 'versions/generation-i/yellow', ext: 'png', shiny: false, female: false, highRes: false },
    'gen1-yellow-gbc':  { path: 'versions/generation-i/yellow/gbc', ext: 'png', shiny: false, female: false, highRes: false },

    'gen2-crystal':     { path: 'versions/generation-ii/crystal', ext: 'png', shiny: true, female: false, highRes: false },
    'gen2-crystal-anim':{ path: 'versions/generation-ii/crystal/animated', ext: 'gif', shiny: true, female: false, highRes: false },
    'gen2-gold':        { path: 'versions/generation-ii/gold', ext: 'png', shiny: true, female: false, highRes: false },
    'gen2-silver':      { path: 'versions/generation-ii/silver', ext: 'png', shiny: true, female: false, highRes: false },

    'gen3-emerald':     { path: 'versions/generation-iii/emerald', ext: 'png', shiny: true, female: false, highRes: false },
    'gen3-frlg':        { path: 'versions/generation-iii/firered-leafgreen', ext: 'png', shiny: true, female: false, highRes: false },
    'gen3-rs':          { path: 'versions/generation-iii/ruby-sapphire', ext: 'png', shiny: true, female: false, highRes: false },

    'gen4-dp':          { path: 'versions/generation-iv/diamond-pearl', ext: 'png', shiny: true, female: true, highRes: false },
    'gen4-hgss':        { path: 'versions/generation-iv/heartgold-soulsilver', ext: 'png', shiny: true, female: true, highRes: false },
    'gen4-platinum':    { path: 'versions/generation-iv/platinum', ext: 'png', shiny: true, female: true, highRes: false },

    'gen5-bw':          { path: 'versions/generation-v/black-white', ext: 'png', shiny: true, female: true, highRes: false },
    'gen5-bw-anim':     { path: 'versions/generation-v/black-white/animated', ext: 'gif', shiny: true, female: true, highRes: false },
    'gen5-icons':       { path: 'versions/generation-v/icons', ext: 'png', shiny: false, female: false, highRes: false },

    'gen6-oras':        { path: 'versions/generation-vi/omegaruby-alphasapphire', ext: 'png', shiny: true, female: true, highRes: true },
    'gen6-xy':          { path: 'versions/generation-vi/x-y', ext: 'png', shiny: true, female: true, highRes: true },

    'gen7-usum':        { path: 'versions/generation-vii/ultra-sun-ultra-moon', ext: 'png', shiny: true, female: true, highRes: true },
    'gen7-icons':       { path: 'versions/generation-vii/icons', ext: 'png', shiny: false, female: false, highRes: false },

    'gen8-icons':       { path: 'versions/generation-viii/icons', ext: 'png', shiny: false, female: true, highRes: false },
    'gen8-bdsp':        { path: 'versions/generation-viii/brilliant-diamond-shining-pearl', ext: 'png', shiny: false, female: false, highRes: true },
    'gen9-sv':          { path: 'versions/generation-ix/scarlet-violet', ext: 'png', shiny: false, female: true, highRes: true },

    // Pokémon Mystery Dungeon (SpriteCollab / PMD Collab)
    'pmd-portrait':       { source: 'pmd', emotion: 'Normal', shiny: true, female: true, highRes: false },
    'pmd-portrait-happy': { source: 'pmd', emotion: 'Happy', shiny: true, female: true, highRes: false }
};

const PMD_CDN = 'https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master';
const PMD_GRAPHQL = 'https://spriteserver.pmdcollab.org/graphql';
const pmdUrlCache = new Map();

function isOBSMode() {
    return new URLSearchParams(window.location.search).has('obs');
}

function generateOBSUrl() {
    const params = new URLSearchParams();
    params.set('layout', config.layout);
    params.set('sprite', config.spriteType);
    params.set('spacing', config.spacing);
    params.set('size', config.spriteSize);
    params.set('font', config.fontFamily);
    params.set('fontsize', config.fontSize);
    params.set('bg', config.background);
    params.set('cname', config.colorName.replace('#', ''));
    params.set('cnick', config.colorNickname.replace('#', ''));
    params.set('clevel', config.colorLevel.replace('#', ''));
    params.set('nickname', config.showNickname ? '1' : '0');
    params.set('level', config.showLevel ? '1' : '0');
    params.set('hp', config.showHP ? '1' : '0');
    params.set('shiny', config.showShiny ? '1' : '0');
    params.set('stroke', config.textStroke ? '1' : '0');
    params.set('strokec', config.strokeColor.replace('#', ''));
    params.set('strokew', config.strokeWidth);
    return window.location.origin + '/?obs&' + params.toString();
}

function updateOBSUrlField() {
    const el = document.getElementById('obsUrl');
    if (el) el.value = generateOBSUrl();
}

function loadConfigFromURL() {
    const p = new URLSearchParams(window.location.search);
    if (p.has('layout')) config.layout = p.get('layout');
    if (p.has('sprite')) config.spriteType = p.get('sprite');
    if (p.has('spacing')) config.spacing = parseInt(p.get('spacing')) || 8;
    if (p.has('size')) config.spriteSize = parseInt(p.get('size')) || 48;
    if (p.has('font')) config.fontFamily = p.get('font');
    if (p.has('fontsize')) config.fontSize = parseInt(p.get('fontsize')) || 11;
    if (p.has('bg')) config.background = p.get('bg');
    if (p.has('cname')) config.colorName = '#' + p.get('cname');
    if (p.has('cnick')) config.colorNickname = '#' + p.get('cnick');
    if (p.has('clevel')) config.colorLevel = '#' + p.get('clevel');
    if (p.has('nickname')) config.showNickname = p.get('nickname') === '1';
    if (p.has('level')) config.showLevel = p.get('level') === '1';
    if (p.has('hp')) config.showHP = p.get('hp') === '1';
    if (p.has('shiny')) config.showShiny = p.get('shiny') === '1';
    if (p.has('stroke')) config.textStroke = p.get('stroke') === '1';
    if (p.has('strokec')) config.strokeColor = '#' + p.get('strokec');
    if (p.has('strokew')) config.strokeWidth = parseInt(p.get('strokew')) || 2;
}

function loadConfig() {
    if (window.location.search) {
        loadConfigFromURL();
        return;
    }
    const saved = localStorage.getItem('pokelayout-config');
    if (saved) {
        try { config = { ...config, ...JSON.parse(saved) }; } catch (e) {}
    }
}

function saveConfig() {
    localStorage.setItem('pokelayout-config', JSON.stringify(config));
    updateOBSUrlField();
}

function applyConfig() {
    const root = document.documentElement;
    const container = document.getElementById('team');
    const wrapper = document.getElementById('teamWrapper');
    
    root.style.setProperty('--spacing', config.spacing + 'px');
    root.style.setProperty('--sprite-size', config.spriteSize + 'px');
    root.style.setProperty('--font-family', `'${config.fontFamily}', sans-serif`);
    root.style.setProperty('--font-size', config.fontSize + 'px');
    root.style.setProperty('--color-name', config.colorName);
    root.style.setProperty('--color-nickname', config.colorNickname);
    root.style.setProperty('--color-level', config.colorLevel);
    root.style.setProperty('--stroke-color', config.strokeColor);
    root.style.setProperty('--stroke-width', config.strokeWidth + 'px');
    
    container.className = 'team-container ' + config.layout;
    
    wrapper.className = 'team-wrapper';
    if (config.background !== 'transparent') {
        wrapper.classList.add('bg-' + config.background);
    }
    
    if (!isOBSMode()) {
        document.querySelectorAll('[data-layout]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.layout === config.layout);
        });
        document.querySelectorAll('.bg-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.bg === config.background);
        });
        
        const el = id => document.getElementById(id);
        
        if (el('showNickname')) el('showNickname').checked = config.showNickname;
        if (el('showLevel')) el('showLevel').checked = config.showLevel;
        if (el('showHP')) el('showHP').checked = config.showHP;
        if (el('showShiny')) el('showShiny').checked = config.showShiny;
        if (el('spacing')) el('spacing').value = config.spacing;
        if (el('spacingInput')) el('spacingInput').value = config.spacing;
        if (el('spriteSize')) el('spriteSize').value = config.spriteSize;
        if (el('spriteSizeInput')) el('spriteSizeInput').value = config.spriteSize;
        if (el('spriteType')) el('spriteType').value = config.spriteType;
        if (el('fontFamily')) el('fontFamily').value = config.fontFamily;
        if (el('fontSize')) el('fontSize').value = config.fontSize;
        if (el('fontSizeInput')) el('fontSizeInput').value = config.fontSize;
        if (el('colorName')) el('colorName').value = config.colorName;
        if (el('colorNickname')) el('colorNickname').value = config.colorNickname;
        if (el('colorLevel')) el('colorLevel').value = config.colorLevel;
        if (el('textStroke')) el('textStroke').checked = config.textStroke;
        if (el('strokeColor')) el('strokeColor').value = config.strokeColor;
        if (el('strokeWidth')) el('strokeWidth').value = config.strokeWidth;
        if (el('strokeWidthInput')) el('strokeWidthInput').value = config.strokeWidth;
        
        // Toggle stroke options visibility
        const strokeOptions = el('strokeOptions');
        if (strokeOptions) {
            strokeOptions.classList.toggle('visible', config.textStroke);
        }
        
        updateOBSUrlField();
    }
    
    if (currentTeam) renderTeam(currentTeam);
}

function setupConfigListeners() {
    document.querySelectorAll('[data-layout]').forEach(btn => {
        btn.addEventListener('click', () => {
            config.layout = btn.dataset.layout;
            saveConfig();
            applyConfig();
        });
    });
    
    document.querySelectorAll('.bg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            config.background = btn.dataset.bg;
            saveConfig();
            applyConfig();
        });
    });
    
    ['showNickname', 'showLevel', 'showHP', 'showShiny'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', e => { config[id] = e.target.checked; saveConfig(); applyConfig(); });
    });
    
    // Text stroke checkbox
    const textStroke = document.getElementById('textStroke');
    if (textStroke) {
        textStroke.addEventListener('change', e => {
            config.textStroke = e.target.checked;
            saveConfig();
            applyConfig();
        });
    }
    
    // Stroke color
    const strokeColor = document.getElementById('strokeColor');
    if (strokeColor) {
        strokeColor.addEventListener('input', e => {
            config.strokeColor = e.target.value;
            saveConfig();
            applyConfig();
        });
    }
    
    // Stroke width
    setupRangeInput('strokeWidth', 'strokeWidthInput', 'strokeWidth');
    
    const spriteType = document.getElementById('spriteType');
    if (spriteType) spriteType.addEventListener('change', async e => {
        config.spriteType = e.target.value;
        saveConfig();
        applyConfig();
        if (SPRITE_TYPES[config.spriteType]?.source === 'pmd' && currentTeam?.team?.length) {
            await resolvePmdPortraits(currentTeam.team);
            renderTeam(currentTeam);
        }
    });
    
    const fontFamily = document.getElementById('fontFamily');
    if (fontFamily) fontFamily.addEventListener('change', e => { config.fontFamily = e.target.value; saveConfig(); applyConfig(); });
    
    setupRangeInput('spacing', 'spacingInput', 'spacing');
    setupRangeInput('spriteSize', 'spriteSizeInput', 'spriteSize');
    setupRangeInput('fontSize', 'fontSizeInput', 'fontSize');
    
    ['colorName', 'colorNickname', 'colorLevel'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', e => { config[id] = e.target.value; saveConfig(); applyConfig(); });
    });
    
    const toggleConfig = document.getElementById('toggleConfig');
    if (toggleConfig) {
        toggleConfig.addEventListener('click', () => {
            const body = document.getElementById('configBody');
            body.classList.toggle('collapsed');
            toggleConfig.textContent = body.classList.contains('collapsed') ? '+' : '−';
        });
    }
    
    const copyUrlBtn = document.getElementById('copyUrlBtn');
    if (copyUrlBtn) {
        copyUrlBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(document.getElementById('obsUrl').value).then(() => {
                copyUrlBtn.textContent = '✓ Copiado';
                copyUrlBtn.classList.add('copied');
                setTimeout(() => { copyUrlBtn.textContent = '📋 Copiar'; copyUrlBtn.classList.remove('copied'); }, 2000);
            });
        });
    }
}

function setupRangeInput(rangeId, inputId, configKey) {
    const range = document.getElementById(rangeId);
    const input = document.getElementById(inputId);
    
    if (range) range.addEventListener('input', e => {
        config[configKey] = parseInt(e.target.value);
        if (input) input.value = config[configKey];
        saveConfig();
        applyConfig();
    });
    
    if (input) input.addEventListener('change', e => {
        config[configKey] = parseInt(e.target.value) || 0;
        if (range) range.value = Math.min(range.max, Math.max(range.min, config[configKey]));
        saveConfig();
        applyConfig();
    });
}

function buildSpriteUrl(typeKey, id, shiny, female) {
    const type = SPRITE_TYPES[typeKey] || SPRITE_TYPES.default;
    if (type.source === 'pmd') {
        return buildPmdPortraitUrl(id, 0, shiny, female, type.emotion || 'Normal');
    }
    const parts = [];
    if (type.path) parts.push(type.path);
    if (shiny && type.shiny) parts.push('shiny');
    if (female && type.female) parts.push('female');
    const dir = parts.length ? parts.join('/') + '/' : '';
    return `${SPRITE_BASE}/${dir}${id}.${type.ext}`;
}

/** Ruta SpriteCollab: 0025 | 0025/0001 | 0025/0000/0001 | 0025/0000/0000/0002 */
function buildPmdAssetPath(id, form = 0, shiny = false, female = false) {
    const raw = String(id).padStart(4, '0');
    if (form === 0 && !shiny && !female) return raw;

    const parts = [raw, String(form || 0).padStart(4, '0')];
    if (shiny) parts.push('0001');
    else if (female) parts.push('0000');
    if (female) parts.push('0002');
    return parts.join('/');
}

function buildPmdPortraitUrl(id, form = 0, shiny = false, female = false, emotion = 'Normal') {
    const path = buildPmdAssetPath(id, form, shiny, female);
    return `${PMD_CDN}/portrait/${path}/${emotion}.png`;
}

function getSpriteUrl(pokemon) {
    const id = pokemon.species;
    if (!id) return FALLBACK_SPRITE;

    const shiny = !!pokemon.isShiny;
    const female = pokemon.gender === 1;
    const form = pokemon.form || 0;
    const typeKey = SPRITE_TYPES[config.spriteType] ? config.spriteType : 'default';
    const type = SPRITE_TYPES[typeKey];

    if (type.source === 'pmd') {
        const cacheKey = `${id}-${form}-${shiny}-${female}-${type.emotion}`;
        if (pmdUrlCache.has(cacheKey)) return pmdUrlCache.get(cacheKey);
        return buildPmdPortraitUrl(id, form, shiny, female, type.emotion || 'Normal');
    }

    return buildSpriteUrl(typeKey, id, shiny, female);
}

/** Resuelve portraits vía GraphQL (más fiable con formas) y rellena caché. */
async function resolvePmdPortraits(team) {
    const type = SPRITE_TYPES[config.spriteType];
    if (!type || type.source !== 'pmd' || !team?.length) return;

    const emotion = type.emotion || 'Normal';
    const ids = [...new Set(team.map(p => p.species).filter(Boolean))];
    if (!ids.length) return;

    const query = `
      query ($ids: [Int!]!, $emotion: String!) {
        monster(filter: $ids) {
          id
          forms {
            fullPath
            isShiny
            isFemale
            portraits {
              emotion(emotion: $emotion) { url }
              previewEmotion { url }
            }
          }
        }
      }`;

    try {
        const res = await fetch(PMD_GRAPHQL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables: { ids, emotion } })
        });
        if (!res.ok) return;
        const json = await res.json();
        const monsters = json?.data?.monster || [];

        for (const mon of monsters) {
            for (const form of mon.forms || []) {
                const url = form.portraits?.emotion?.url || form.portraits?.previewEmotion?.url;
                if (!url) continue;
                const fp = (form.fullPath || '').split('/').filter(Boolean);
                const formId = fp.length >= 2 ? (parseInt(fp[1], 10) || 0) : 0;
                const key = `${mon.id}-${formId}-${!!form.isShiny}-${!!form.isFemale}-${emotion}`;
                pmdUrlCache.set(key, url);
            }
        }
    } catch (e) {
        console.warn('[PMD] GraphQL falló, usando URLs construidas', e);
    }
}

async function fetchTeamData() {
    try {
        const r = await fetch(API_URL);
        return r.ok ? await r.json() : null;
    } catch { return null; }
}

function getHPInfo(cur, max) {
    const pct = max > 0 ? (cur / max) * 100 : 100;
    return { pct, cls: pct <= 20 ? 'hp-low' : pct <= 50 ? 'hp-medium' : 'hp-high' };
}

function createPokemonCard(pokemon) {
    const hp = getHPInfo(pokemon.currentHP, pokemon.maxHP);
    const isShiny = pokemon.isShiny;
    const isFainted = pokemon.currentHP === 0;
    const displayName = (config.showNickname && pokemon.hasNickname && pokemon.nickname) ? pokemon.nickname : pokemon.speciesName;
    const hasNickname = pokemon.hasNickname && pokemon.nickname;
    const spriteType = SPRITE_TYPES[config.spriteType] || SPRITE_TYPES.default;
    const isHighRes = !!spriteType.highRes;
    let spriteClass = 'pokemon-sprite' + (isHighRes ? ' high-res' : '') + (isShiny && config.showShiny ? ' shiny' : '') + (isFainted ? ' fainted' : '');
    
    // Classes for text with stroke
    let nameClass = 'pokemon-name' + (hasNickname ? ' nickname' : '') + (config.textStroke ? ' has-stroke' : '');
    let levelClass = 'pokemon-level' + (config.textStroke ? ' has-stroke' : '');

    const primaryUrl = getSpriteUrl(pokemon);
    const typeKey = config.spriteType;
    const type = SPRITE_TYPES[typeKey] || SPRITE_TYPES.default;
    const shiny = !!pokemon.isShiny;
    const form = pokemon.form || 0;

    // Cadena de fallbacks: female → no-female → no-shiny → pokéball
    let fallbackUrl = FALLBACK_SPRITE;
    if (type.source === 'pmd') {
        if (pokemon.gender === 1) {
            fallbackUrl = buildPmdPortraitUrl(pokemon.species, form, shiny, false, type.emotion || 'Normal');
        } else if (shiny) {
            fallbackUrl = buildPmdPortraitUrl(pokemon.species, form, false, false, type.emotion || 'Normal');
        }
    } else if (pokemon.gender === 1) {
        fallbackUrl = buildSpriteUrl(typeKey, pokemon.species, shiny, false);
    }

    const fallback2 = (type.source === 'pmd' && shiny)
        ? buildPmdPortraitUrl(pokemon.species, form, false, false, type.emotion || 'Normal')
        : FALLBACK_SPRITE;
    
    let html = `<div class="pokemon-card">`;
    if (config.showShiny && isShiny) html += `<span class="shiny-icon">✨</span>`;
    html += `<img src="${primaryUrl}" alt="${escapeHtml(pokemon.speciesName)}" class="${spriteClass}" data-fb2="${fallback2}" onerror="if(this.dataset.fb!=='1'){this.dataset.fb='1';this.src='${fallbackUrl}';}else if(this.dataset.fb!=='2'){this.dataset.fb='2';this.src=this.dataset.fb2;}else{this.onerror=null;this.src='${FALLBACK_SPRITE}';}">`;
    if (config.showNickname) html += `<span class="${nameClass}">${escapeHtml(displayName)}</span>`;
    if (config.showLevel) html += `<span class="${levelClass}">Nv.${pokemon.level}</span>`;
    if (config.showHP) html += `<div class="hp-bar-container"><div class="hp-bar ${hp.cls}" style="width:${hp.pct}%"></div></div>`;
    html += `</div>`;
    return html;
}

function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

function renderTeam(data) {
    const c = document.getElementById('team');
    if (!data?.team?.length) { c.innerHTML = `<div class="empty-state">Sin Pokémon</div>`; return; }
    c.innerHTML = data.team.map(p => createPokemonCard(p)).join('');
}

function teamsEqual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

async function updateOverlay() {
    const t = await fetchTeamData();
    if (teamsEqual(currentTeam, t)) return;

    currentTeam = t;
    const type = SPRITE_TYPES[config.spriteType];
    if (type?.source === 'pmd' && t?.team?.length) {
        await resolvePmdPortraits(t.team);
    }
    renderTeam(t);
}

async function init() {
    if (isOBSMode()) document.body.classList.add('obs-mode');
    loadConfig();
    if (!isOBSMode()) setupConfigListeners();
    applyConfig();
    await updateOverlay();
    setInterval(updateOverlay, REFRESH_INTERVAL);
}

document.addEventListener('DOMContentLoaded', init);
