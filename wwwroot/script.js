/**
 * PokeLayout - Script con configuración completa
 */

const REFRESH_INTERVAL = 2000;
const API_URL = '/api/team';

let currentTeam = null;
let customFonts = []; // { family, fileName }
let customSpritePacks = []; // { id, folders, hasFormsFile }
let deathAnimTimer = null;
let deathAnimHideTimer = null;
const DEATH_ANIM_HOLD_MS = 4500;
const DEATH_ANIM_FADE_MS = 700;

let config = {
    layout: 'horizontal',
    spriteType: 'default',
    customSpritePack: 'geniv',
    showNickname: true,
    showLevel: true,
    showHP: false,
    showShiny: true,
    deathAnimation: false,
    showBadges: false,
    badgeSize: 22,
    badgeDimUnobtained: true,
    showBadgeLabels: true,
    showCemetery: false,
    cemeterySpriteType: 'default',
    cemeteryColumns: 5,
    cemeterySpriteSize: 40,
    cemeteryGrayscale: true,
    nameOffsetY: 0,
    levelPosition: 'below',
    spacing: 8,
    gridRowGap: 4,
    gridColGap: 4,
    spriteSize: 48,
    fontFamily: 'Inter',
    fontSize: 11,
    textUppercase: false,
    colorName: '#f8fafc',
    colorNickname: '#fbbf24',
    colorLevel: '#94a3b8',
    textStroke: false,
    strokeColor: '#000000',
    strokeWidth: 2,
    textShadow: false,
    textShadowColor: '#000000',
    textShadowX: 1,
    textShadowY: 1,
    textShadowBlur: 3,
    spriteShadow: false,
    spriteShadowColor: '#000000',
    spriteShadowX: 2,
    spriteShadowY: 2,
    spriteShadowBlur: 4,
    spriteStroke: false,
    spriteStrokeColor: '#000000',
    spriteStrokeWidth: 2,
    background: 'transparent'
};

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const BADGE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges';
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
    'pmd-portrait-happy': { source: 'pmd', emotion: 'Happy', shiny: true, female: true, highRes: false },

    // Carpeta custom-sprites/<pack>/Front (PNG en hoja de sprites)
    'custom':             { source: 'custom', ext: 'png', shiny: false, female: false, highRes: false }
};

const CUSTOM_SPRITE_PREFIX = 'custom-';

function isCustomSpriteType(typeKey) {
    return typeKey === 'custom' || (typeof typeKey === 'string' && typeKey.startsWith(CUSTOM_SPRITE_PREFIX));
}

function getCustomSpritePack(typeKey) {
    if (typeof typeKey === 'string' && typeKey.startsWith(CUSTOM_SPRITE_PREFIX)) {
        return typeKey.slice(CUSTOM_SPRITE_PREFIX.length);
    }
    return config.customSpritePack || customSpritePacks[0]?.id || 'geniv';
}

function getSpriteTypeEntry(typeKey) {
    if (isCustomSpriteType(typeKey)) return SPRITE_TYPES.custom;
    return SPRITE_TYPES[typeKey] || SPRITE_TYPES.default;
}

function normalizeCustomSpriteType(typeKey, pack) {
    if (typeof typeKey === 'string' && typeKey.startsWith(CUSTOM_SPRITE_PREFIX)) return typeKey;
    if (typeKey === 'custom' && pack) return `${CUSTOM_SPRITE_PREFIX}${pack}`;
    return typeKey;
}

const PMD_CDN = 'https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master';
const PMD_GRAPHQL = 'https://spriteserver.pmdcollab.org/graphql';
const pmdUrlCache = new Map();

function isOBSMode() {
    return new URLSearchParams(window.location.search).has('obs');
}

function getObsView() {
    return new URLSearchParams(window.location.search).get('view') || '';
}

function isBadgesOnlyMode() {
    return isOBSMode() && getObsView() === 'badges';
}

function isDeathOnlyMode() {
    return isOBSMode() && getObsView() === 'death';
}

function isCemeteryOnlyMode() {
    return isOBSMode() && getObsView() === 'cemetery';
}

function shouldShowBadges() {
    if (isBadgesOnlyMode()) return true;
    if (isOBSMode()) return false;
    return config.showBadges;
}

function shouldShowCemetery() {
    if (isCemeteryOnlyMode()) return true;
    if (isOBSMode()) return false;
    return config.showCemetery;
}

function shouldShowTeam() {
    return !isBadgesOnlyMode() && !isDeathOnlyMode() && !isCemeteryOnlyMode();
}

function shouldPlayDeathAnimation() {
    if (isBadgesOnlyMode() || isCemeteryOnlyMode()) return false;
    // Fuente OBS dedicada, o vista previa en el panel de configuración
    if (isDeathOnlyMode()) return true;
    return !isOBSMode() && config.deathAnimation;
}

function withSpriteType(typeKey, fn) {
    const prevType = config.spriteType;
    const prevPack = config.customSpritePack;
    config.spriteType = typeKey || 'default';
    if (isCustomSpriteType(config.spriteType)) {
        config.customSpritePack = getCustomSpritePack(config.spriteType);
    }
    try {
        return fn();
    } finally {
        config.spriteType = prevType;
        config.customSpritePack = prevPack;
    }
}

async function withSpriteTypeAsync(typeKey, fn) {
    const prevType = config.spriteType;
    const prevPack = config.customSpritePack;
    config.spriteType = typeKey || 'default';
    if (isCustomSpriteType(config.spriteType)) {
        config.customSpritePack = getCustomSpritePack(config.spriteType);
    }
    try {
        return await fn();
    } finally {
        config.spriteType = prevType;
        config.customSpritePack = prevPack;
    }
}

function generateOBSUrl() {
    const params = new URLSearchParams();
    params.set('layout', config.layout);
    params.set('sprite', normalizeCustomSpriteType(config.spriteType, config.customSpritePack));
    params.set('spacing', config.spacing);
    params.set('gridrowgap', config.gridRowGap);
    params.set('gridcolgap', config.gridColGap);
    params.set('size', config.spriteSize);
    params.set('font', config.fontFamily);
    params.set('fontsize', config.fontSize);
    params.set('uppercase', config.textUppercase ? '1' : '0');
    params.set('bg', config.background);
    params.set('cname', config.colorName.replace('#', ''));
    params.set('cnick', config.colorNickname.replace('#', ''));
    params.set('clevel', config.colorLevel.replace('#', ''));
    params.set('nickname', config.showNickname ? '1' : '0');
    params.set('level', config.showLevel ? '1' : '0');
    params.set('namey', config.nameOffsetY);
    params.set('levelpos', config.levelPosition);
    params.set('hp', config.showHP ? '1' : '0');
    params.set('shiny', config.showShiny ? '1' : '0');
    params.set('stroke', config.textStroke ? '1' : '0');
    params.set('strokec', config.strokeColor.replace('#', ''));
    params.set('strokew', config.strokeWidth);
    params.set('tshadow', config.textShadow ? '1' : '0');
    params.set('tsc', config.textShadowColor.replace('#', ''));
    params.set('tsx', config.textShadowX);
    params.set('tsy', config.textShadowY);
    params.set('tsb', config.textShadowBlur);
    params.set('sshadow', config.spriteShadow ? '1' : '0');
    params.set('ssc', config.spriteShadowColor.replace('#', ''));
    params.set('ssx', config.spriteShadowX);
    params.set('ssy', config.spriteShadowY);
    params.set('ssb', config.spriteShadowBlur);
    params.set('sstroke', config.spriteStroke ? '1' : '0');
    params.set('sstrokec', config.spriteStrokeColor.replace('#', ''));
    params.set('sstrokew', config.spriteStrokeWidth);
    return window.location.origin + '/?obs&' + params.toString();
}

function generateBadgesOBSUrl() {
    const params = new URLSearchParams();
    params.set('view', 'badges');
    params.set('bg', config.background);
    params.set('font', config.fontFamily);
    params.set('fontsize', config.fontSize);
    params.set('uppercase', config.textUppercase ? '1' : '0');
    params.set('badgesize', config.badgeSize);
    params.set('badgedim', config.badgeDimUnobtained ? '1' : '0');
    params.set('badgelabels', config.showBadgeLabels ? '1' : '0');
    params.set('clevel', config.colorLevel.replace('#', ''));
    return window.location.origin + '/?obs&' + params.toString();
}

function generateDeathOBSUrl() {
    const params = new URLSearchParams();
    params.set('view', 'death');
    params.set('sprite', normalizeCustomSpriteType(config.spriteType, config.customSpritePack));
    params.set('size', config.spriteSize);
    params.set('font', config.fontFamily);
    params.set('fontsize', config.fontSize);
    params.set('uppercase', config.textUppercase ? '1' : '0');
    params.set('cname', config.colorName.replace('#', ''));
    params.set('cnick', config.colorNickname.replace('#', ''));
    params.set('shiny', config.showShiny ? '1' : '0');
    params.set('stroke', config.textStroke ? '1' : '0');
    params.set('strokec', config.strokeColor.replace('#', ''));
    params.set('strokew', config.strokeWidth);
    params.set('tshadow', config.textShadow ? '1' : '0');
    params.set('tsc', config.textShadowColor.replace('#', ''));
    params.set('tsx', config.textShadowX);
    params.set('tsy', config.textShadowY);
    params.set('tsb', config.textShadowBlur);
    params.set('sstroke', config.spriteStroke ? '1' : '0');
    params.set('sstrokec', config.spriteStrokeColor.replace('#', ''));
    params.set('sstrokew', config.spriteStrokeWidth);
    return window.location.origin + '/?obs&' + params.toString();
}

function generateCemeteryOBSUrl() {
    const params = new URLSearchParams();
    params.set('view', 'cemetery');
    params.set('sprite', normalizeCustomSpriteType(config.cemeterySpriteType, getCustomSpritePack(config.cemeterySpriteType)));
    params.set('size', config.cemeterySpriteSize);
    params.set('cols', config.cemeteryColumns);
    params.set('gray', config.cemeteryGrayscale ? '1' : '0');
    params.set('bg', config.background);
    return window.location.origin + '/?obs&' + params.toString();
}

function updateOBSUrlField() {
    const teamUrl = document.getElementById('obsUrl');
    const badgesUrl = document.getElementById('obsBadgesUrl');
    const deathUrl = document.getElementById('obsDeathUrl');
    const deathGroup = document.getElementById('obsDeathUrlGroup');
    const cemeteryUrl = document.getElementById('obsCemeteryUrl');
    if (teamUrl) teamUrl.value = generateOBSUrl();
    if (badgesUrl) badgesUrl.value = generateBadgesOBSUrl();
    if (deathUrl) deathUrl.value = generateDeathOBSUrl();
    if (deathGroup) deathGroup.hidden = !config.deathAnimation;
    if (cemeteryUrl) cemeteryUrl.value = generateCemeteryOBSUrl();
}

function loadConfigFromURL() {
    const p = new URLSearchParams(window.location.search);
    if (p.get('view') === 'badges') config.showBadges = true;
    if (p.get('view') === 'death') config.deathAnimation = true;
    if (p.get('view') === 'cemetery') config.showCemetery = true;
    if (p.has('layout')) config.layout = p.get('layout');
    if (p.has('sprite')) {
        const sprite = p.get('sprite');
        if (isCemeteryOnlyMode()) {
            config.cemeterySpriteType = sprite;
            if (isCustomSpriteType(sprite)) {
                config.cemeterySpriteType = normalizeCustomSpriteType(sprite, config.customSpritePack);
            }
        } else {
            config.spriteType = sprite;
        }
    }
    if (p.has('cspritepack')) config.customSpritePack = p.get('cspritepack');
    if (isCustomSpriteType(config.spriteType)) {
        config.spriteType = normalizeCustomSpriteType(config.spriteType, config.customSpritePack);
        config.customSpritePack = getCustomSpritePack(config.spriteType);
    }
    if (isCustomSpriteType(config.cemeterySpriteType)) {
        config.cemeterySpriteType = normalizeCustomSpriteType(config.cemeterySpriteType, getCustomSpritePack(config.cemeterySpriteType));
    }
    if (p.has('spacing')) config.spacing = parseInt(p.get('spacing')) || 8;
    if (p.has('gridrowgap')) config.gridRowGap = parseInt(p.get('gridrowgap')) || 4;
    if (p.has('gridcolgap')) config.gridColGap = parseInt(p.get('gridcolgap')) || 4;
    if (p.has('size')) {
        const size = parseInt(p.get('size')) || (isCemeteryOnlyMode() ? 40 : 48);
        if (isCemeteryOnlyMode()) config.cemeterySpriteSize = size;
        else config.spriteSize = size;
    }
    if (p.has('cols')) {
        const cols = parseInt(p.get('cols'), 10);
        if ([5, 7, 9].includes(cols)) config.cemeteryColumns = cols;
    }
    if (p.has('gray')) config.cemeteryGrayscale = p.get('gray') === '1';
    if (p.has('font')) config.fontFamily = p.get('font');
    if (p.has('fontsize')) config.fontSize = parseInt(p.get('fontsize')) || 11;
    if (p.has('uppercase')) config.textUppercase = p.get('uppercase') === '1';
    if (p.has('bg')) config.background = p.get('bg');
    if (p.has('cname')) config.colorName = '#' + p.get('cname');
    if (p.has('cnick')) config.colorNickname = '#' + p.get('cnick');
    if (p.has('clevel')) config.colorLevel = '#' + p.get('clevel');
    if (p.has('nickname')) config.showNickname = p.get('nickname') === '1';
    if (p.has('level')) config.showLevel = p.get('level') === '1';
    if (p.has('namey')) config.nameOffsetY = parseInt(p.get('namey'), 10) || 0;
    if (p.has('levelpos')) {
        const pos = p.get('levelpos');
        const allowed = ['below', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];
        if (allowed.includes(pos)) config.levelPosition = pos;
    }
    if (p.has('hp')) config.showHP = p.get('hp') === '1';
    if (p.has('shiny')) config.showShiny = p.get('shiny') === '1';
    if (p.has('badgesize')) config.badgeSize = parseInt(p.get('badgesize')) || 22;
    if (p.has('badgedim')) config.badgeDimUnobtained = p.get('badgedim') === '1';
    if (p.has('badgelabels')) config.showBadgeLabels = p.get('badgelabels') === '1';
    if (p.has('stroke')) config.textStroke = p.get('stroke') === '1';
    if (p.has('strokec')) config.strokeColor = '#' + p.get('strokec');
    if (p.has('strokew')) config.strokeWidth = parseFloat(p.get('strokew')) || 2;
    if (p.has('tshadow')) config.textShadow = p.get('tshadow') === '1';
    if (p.has('tsc')) config.textShadowColor = '#' + p.get('tsc');
    if (p.has('tsx')) config.textShadowX = parseInt(p.get('tsx')) || 0;
    if (p.has('tsy')) config.textShadowY = parseInt(p.get('tsy')) || 0;
    if (p.has('tsb')) config.textShadowBlur = parseInt(p.get('tsb')) || 0;
    if (p.has('sshadow')) config.spriteShadow = p.get('sshadow') === '1';
    if (p.has('ssc')) config.spriteShadowColor = '#' + p.get('ssc');
    if (p.has('ssx')) config.spriteShadowX = parseInt(p.get('ssx')) || 0;
    if (p.has('ssy')) config.spriteShadowY = parseInt(p.get('ssy')) || 0;
    if (p.has('ssb')) config.spriteShadowBlur = parseInt(p.get('ssb')) || 0;
    if (p.has('sstroke')) config.spriteStroke = p.get('sstroke') === '1';
    if (p.has('sstrokec')) config.spriteStrokeColor = '#' + p.get('sstrokec');
    if (p.has('sstrokew')) config.spriteStrokeWidth = parseFloat(p.get('sstrokew')) || 2;
}

function loadConfig() {
    if (window.location.search) {
        loadConfigFromURL();
        return;
    }
    const saved = localStorage.getItem('pokelayout-config');
    if (saved) {
        try {
            config = { ...config, ...JSON.parse(saved) };
            if (isCustomSpriteType(config.spriteType)) {
                config.spriteType = normalizeCustomSpriteType(config.spriteType, config.customSpritePack);
                config.customSpritePack = getCustomSpritePack(config.spriteType);
            }
            if (!config.cemeterySpriteType) config.cemeterySpriteType = 'default';
            if (isCustomSpriteType(config.cemeterySpriteType)) {
                config.cemeterySpriteType = normalizeCustomSpriteType(
                    config.cemeterySpriteType,
                    getCustomSpritePack(config.cemeterySpriteType)
                );
            }
            if (![5, 7, 9].includes(config.cemeteryColumns)) config.cemeteryColumns = 5;
            if (!config.cemeterySpriteSize) config.cemeterySpriteSize = 40;
            if (typeof config.cemeteryGrayscale !== 'boolean') config.cemeteryGrayscale = true;
        } catch (e) {}
    }
}

function saveConfig() {
    localStorage.setItem('pokelayout-config', JSON.stringify(config));
    updateOBSUrlField();
}

function buildTextFxShadow() {
    const parts = [];
    if (config.textStroke) {
        const w = config.strokeWidth;
        const c = config.strokeColor;
        // Contorno fino: 8 direcciones (texto no anima, drop-shadow va bien)
        for (const [x, y] of [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]]) {
            parts.push(`${x * w}px ${y * w}px 0 ${c}`);
        }
    }
    if (config.textShadow) {
        parts.push(`${config.textShadowX}px ${config.textShadowY}px ${config.textShadowBlur}px ${config.textShadowColor}`);
    }
    return parts.length ? parts.join(', ') : 'none';
}

/** SVG: solo contorno (sobre el sprite principal). La sombra va en capa aparte. */
function updateSpriteSvgFilter() {
    const ns = 'http://www.w3.org/2000/svg';
    const el = (name, attrs = {}) => {
        const node = document.createElementNS(ns, name);
        for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
        return node;
    };
    const fill = (filterEl, build) => {
        if (!filterEl) return;
        while (filterEl.firstChild) filterEl.removeChild(filterEl.firstChild);
        build(filterEl);
    };

    // Contorno dilatado (sigue el alfa frame a frame en GIFs)
    fill(document.getElementById('spriteStrokeFilter'), filter => {
        if (!config.spriteStroke) {
            const merge = el('feMerge');
            merge.appendChild(el('feMergeNode', { in: 'SourceGraphic' }));
            filter.appendChild(merge);
            return;
        }
        const radius = Math.max(0.25, Number(config.spriteStrokeWidth) || 0.25);
        filter.appendChild(el('feMorphology', {
            in: 'SourceAlpha', operator: 'dilate', radius, result: 'dilated'
        }));
        filter.appendChild(el('feFlood', {
            'flood-color': config.spriteStrokeColor || '#000000', result: 'flood'
        }));
        filter.appendChild(el('feComposite', {
            in: 'flood', in2: 'dilated', operator: 'in', result: 'outline'
        }));
        const merge = el('feMerge');
        merge.appendChild(el('feMergeNode', { in: 'outline' }));
        merge.appendChild(el('feMergeNode', { in: 'SourceGraphic' }));
        filter.appendChild(merge);
    });

    // Sombra desde SourceAlpha (se aplica a una capa-img duplicada)
    fill(document.getElementById('spriteShadowFilter'), filter => {
        const blur = Math.max(0, Number(config.spriteShadowBlur) || 0) / 2;
        const dx = Number(config.spriteShadowX) || 0;
        const dy = Number(config.spriteShadowY) || 0;
        filter.appendChild(el('feOffset', {
            in: 'SourceAlpha', dx, dy, result: 'off'
        }));
        filter.appendChild(el('feGaussianBlur', {
            in: 'off', stdDeviation: blur > 0 ? blur : 0, result: 'blur'
        }));
        filter.appendChild(el('feFlood', {
            'flood-color': config.spriteShadowColor || '#000000',
            'flood-opacity': '0.85',
            result: 'flood'
        }));
        filter.appendChild(el('feComposite', {
            in: 'flood', in2: 'blur', operator: 'in'
        }));
    });

    // CSS vars por si se usa capa con translate (fallback)
    const root = document.documentElement;
    root.style.setProperty('--sprite-shadow-x', (config.spriteShadowX || 0) + 'px');
    root.style.setProperty('--sprite-shadow-y', (config.spriteShadowY || 0) + 'px');
    root.style.setProperty('--sprite-shadow-blur', (config.spriteShadowBlur || 0) + 'px');
    root.style.setProperty('--sprite-shadow-color', config.spriteShadowColor || '#000000');
}

function buildSpriteFilter(isShiny, isFainted) {
    const parts = [];

    // Solo contorno en el sprite principal (la sombra es otra <img>)
    if (config.spriteStroke) {
        parts.push('url(#spriteStrokeFilter)');
    }

    if (isFainted) parts.push('grayscale(100%)');

    if (isShiny && config.showShiny) {
        parts.push(isFainted ? 'drop-shadow(0 0 4px #888)' : 'drop-shadow(0 0 4px #fbbf24)');
    }

    return parts.length ? parts.join(' ') : 'none';
}

function buildImgErrorHandler(fallbackUrl, fallback2) {
    return `if(this.dataset.fb!=='1'){this.dataset.fb='1';this.src='${fallbackUrl}';}else if(this.dataset.fb!=='2'){this.dataset.fb='2';this.src='${fallback2}';}else{this.onerror=null;this.src='${FALLBACK_SPRITE}';}`;
}

function buildChainedImgErrorHandler(urls) {
    const safe = (urls || []).filter(Boolean).map(u => u.replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
    if (!safe.length) return `this.onerror=null;this.src='${FALLBACK_SPRITE}';`;
    const json = JSON.stringify(safe);
    return `var u=${json};var i=+(this.dataset.ci||0);if(i<u.length){this.dataset.ci=i+1;this.src=u[i];}else{this.onerror=null;}`;
}

function setupSpriteSheet(img) {
    const wrap = img.closest('.sprite-sheet-wrap');
    if (!wrap || wrap.dataset.sheetReady) return;

    const apply = () => {
        if (wrap.dataset.sheetReady) return;
        const nw = img.naturalWidth;
        const nh = img.naturalHeight;
        if (!nw || !nh) return;

        const size = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sprite-size'), 10) || 48;
        const frames = Math.max(1, Math.floor(nw / nh));

        stopSpriteSheetAnim(wrap);
        wrap.querySelector('.sprite-sheet-canvas')?.remove();

        const canvas = document.createElement('canvas');
        canvas.className = 'sprite-sheet-canvas';
        canvas.width = size;
        canvas.height = size;
        wrap.appendChild(canvas);
        img.style.display = 'none';

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.imageSmoothingEnabled = false;

        const drawFrame = (index) => {
            ctx.clearRect(0, 0, size, size);
            ctx.drawImage(img, index * nh, 0, nh, nh, 0, 0, size, size);
        };

        drawFrame(0);

        if (frames > 1) {
            let frame = 0;
            let lastTime = 0;
            const msPerFrame = 70;
            const tick = (time) => {
                if (!wrap.isConnected) return;
                if (time - lastTime >= msPerFrame) {
                    lastTime = time;
                    frame = (frame + 1) % frames;
                    drawFrame(frame);
                }
                wrap._spriteAnimId = requestAnimationFrame(tick);
            };
            wrap._spriteAnimId = requestAnimationFrame(tick);
        }

        wrap.dataset.sheetReady = '1';
    };

    if (img.complete && img.naturalWidth) apply();
    else img.addEventListener('load', apply, { once: true });
}

function stopSpriteSheetAnim(wrap) {
    if (wrap._spriteAnimId) {
        cancelAnimationFrame(wrap._spriteAnimId);
        wrap._spriteAnimId = null;
    }
}

function resetSpriteSheets() {
    document.querySelectorAll('.sprite-sheet-wrap').forEach(wrap => {
        stopSpriteSheetAnim(wrap);
        delete wrap.dataset.sheetReady;
        wrap.querySelector('.sprite-sheet-canvas')?.remove();
        const img = wrap.querySelector('.sprite-sheet-frame');
        if (img) {
            img.style.display = '';
            img.style.animation = 'none';
            img.style.transform = '';
            img.style.width = '';
            img.style.height = '';
        }
    });
}

function setupAllSpriteSheets() {
    document.querySelectorAll('.sprite-sheet-frame').forEach(setupSpriteSheet);
}

function buildCustomSpriteImgHtml(url, className, filterStyle, onErr, alt = '') {
    const altAttr = alt ? ` alt="${escapeHtml(alt)}"` : ' alt="" aria-hidden="true"';
    const draggable = alt ? '' : ' draggable="false"';
    return `<div class="sprite-sheet-wrap ${className}" style="filter:${filterStyle}">`
        + `<img src="${url}" class="sprite-sheet-frame"${altAttr}${draggable} onload="setupSpriteSheet(this)" onerror="${onErr}">`
        + `</div>`;
}

function getSpriteFxPadding() {
    let pad = 4; // margen mínimo para que el sprite no toque el borde del box
    if (config.spriteStroke) {
        pad = Math.max(pad, (Number(config.spriteStrokeWidth) || 0) + 2);
    }
    if (config.spriteShadow) {
        const sx = Math.abs(Number(config.spriteShadowX) || 0);
        const sy = Math.abs(Number(config.spriteShadowY) || 0);
        const blur = Number(config.spriteShadowBlur) || 0;
        pad = Math.max(pad, sx + blur + 2, sy + blur + 2);
    }
    return Math.ceil(pad);
}

function applyConfig() {
    const root = document.documentElement;
    const container = document.getElementById('team');
    const teamWrapper = document.getElementById('teamWrapper');
    const badgesWrapper = document.getElementById('badgesWrapper');
    const cemeteryWrapper = document.getElementById('cemeteryWrapper');
    const fxPad = getSpriteFxPadding();
    
    root.style.setProperty('--spacing', config.spacing + 'px');
    root.style.setProperty('--grid-row-gap', config.gridRowGap + 'px');
    root.style.setProperty('--grid-col-gap', config.gridColGap + 'px');
    root.style.setProperty('--sprite-size', config.spriteSize + 'px');
    root.style.setProperty('--badge-size', config.badgeSize + 'px');
    root.style.setProperty('--cemetery-cols', String(config.cemeteryColumns || 5));
    root.style.setProperty('--cemetery-sprite-size', (config.cemeterySpriteSize || 40) + 'px');
    root.style.setProperty('--sprite-fx-pad', fxPad + 'px');
    root.style.setProperty('--font-family', `'${config.fontFamily}', sans-serif`);
    root.style.setProperty('--font-size', config.fontSize + 'px');
    root.style.setProperty('--text-transform', config.textUppercase ? 'uppercase' : 'none');
    root.style.setProperty('--color-name', config.colorName);
    root.style.setProperty('--color-nickname', config.colorNickname);
    root.style.setProperty('--color-level', config.colorLevel);
    root.style.setProperty('--name-offset-y', (config.nameOffsetY || 0) + 'px');
    root.style.setProperty('--stroke-color', config.strokeColor);
    root.style.setProperty('--stroke-width', config.strokeWidth + 'px');
    root.style.setProperty('--text-fx-shadow', buildTextFxShadow());
    updateSpriteSvgFilter();
    
    if (isCustomSpriteType(config.spriteType) && currentTeam?.team?.length) {
        resetSpriteSheets();
        setupAllSpriteSheets();
    }
    
    if (container) container.className = 'team-container ' + config.layout;
    
    if (teamWrapper) {
        teamWrapper.className = 'team-wrapper';
        if (config.background !== 'transparent') teamWrapper.classList.add('bg-' + config.background);
    }
    if (badgesWrapper) {
        badgesWrapper.className = 'badges-wrapper';
        if (config.background !== 'transparent') badgesWrapper.classList.add('bg-' + config.background);
        if (isBadgesOnlyMode()) badgesWrapper.hidden = false;
    }
    if (cemeteryWrapper) {
        cemeteryWrapper.className = 'cemetery-wrapper';
        if (config.background !== 'transparent') cemeteryWrapper.classList.add('bg-' + config.background);
        if (isCemeteryOnlyMode()) cemeteryWrapper.hidden = false;
    }
    
    document.body.classList.toggle('obs-badges-only', isBadgesOnlyMode());
    document.body.classList.toggle('obs-death-only', isDeathOnlyMode());
    document.body.classList.toggle('obs-cemetery-only', isCemeteryOnlyMode());
    
    if (!isOBSMode()) {
        document.querySelectorAll('[data-layout]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.layout === config.layout);
        });
        document.querySelectorAll('[data-level-pos]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.levelPos === config.levelPosition);
        });
        document.querySelectorAll('.bg-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.bg === config.background);
        });
        
        const el = id => document.getElementById(id);
        
        if (el('showNickname')) el('showNickname').checked = config.showNickname;
        if (el('showLevel')) el('showLevel').checked = config.showLevel;
        if (el('showHP')) el('showHP').checked = config.showHP;
        if (el('showShiny')) el('showShiny').checked = config.showShiny;
        if (el('deathAnimation')) el('deathAnimation').checked = config.deathAnimation;
        if (el('showBadgesPreview')) el('showBadgesPreview').checked = config.showBadges;
        if (el('showCemeteryPreview')) el('showCemeteryPreview').checked = config.showCemetery;
        if (el('badgeSize')) el('badgeSize').value = config.badgeSize;
        if (el('badgeSizeInput')) el('badgeSizeInput').value = config.badgeSize;
        if (el('badgeDimUnobtained')) el('badgeDimUnobtained').checked = config.badgeDimUnobtained;
        if (el('showBadgeLabels')) el('showBadgeLabels').checked = config.showBadgeLabels;
        toggleOptions('badgeOptions', true);
        if (el('cemeterySpriteType')) el('cemeterySpriteType').value = config.cemeterySpriteType;
        if (el('cemeterySpriteSize')) el('cemeterySpriteSize').value = config.cemeterySpriteSize;
        if (el('cemeterySpriteSizeInput')) el('cemeterySpriteSizeInput').value = config.cemeterySpriteSize;
        if (el('cemeteryGrayscale')) el('cemeteryGrayscale').checked = config.cemeteryGrayscale;
        document.querySelectorAll('input[name="cemeteryColumns"]').forEach(r => {
            r.checked = String(config.cemeteryColumns) === r.value;
        });
        if (el('nameOffsetY')) el('nameOffsetY').value = config.nameOffsetY;
        if (el('nameOffsetYInput')) el('nameOffsetYInput').value = config.nameOffsetY;
        const isGridLayout = config.layout === 'grid-h' || config.layout === 'grid-v';
        const spacingGroup = el('spacingGroup');
        const gridSpacingGroup = el('gridSpacingGroup');
        if (spacingGroup) spacingGroup.hidden = isGridLayout;
        if (gridSpacingGroup) gridSpacingGroup.hidden = !isGridLayout;

        if (el('spacing')) el('spacing').value = config.spacing;
        if (el('spacingInput')) el('spacingInput').value = config.spacing;
        if (el('gridRowGap')) el('gridRowGap').value = config.gridRowGap;
        if (el('gridRowGapInput')) el('gridRowGapInput').value = config.gridRowGap;
        if (el('gridColGap')) el('gridColGap').value = config.gridColGap;
        if (el('gridColGapInput')) el('gridColGapInput').value = config.gridColGap;
        if (el('spriteSize')) el('spriteSize').value = config.spriteSize;
        if (el('spriteSizeInput')) el('spriteSizeInput').value = config.spriteSize;
        if (el('spriteType')) el('spriteType').value = config.spriteType;
        if (el('fontFamily')) el('fontFamily').value = config.fontFamily;
        if (el('fontSize')) el('fontSize').value = config.fontSize;
        if (el('fontSizeInput')) el('fontSizeInput').value = config.fontSize;
        if (el('textUppercase')) el('textUppercase').checked = config.textUppercase;
        if (el('colorName')) el('colorName').value = config.colorName;
        if (el('colorNickname')) el('colorNickname').value = config.colorNickname;
        if (el('colorLevel')) el('colorLevel').value = config.colorLevel;
        if (el('textStroke')) el('textStroke').checked = config.textStroke;
        if (el('strokeColor')) el('strokeColor').value = config.strokeColor;
        if (el('strokeWidth')) el('strokeWidth').value = config.strokeWidth;
        if (el('strokeWidthInput')) el('strokeWidthInput').value = config.strokeWidth;
        if (el('textShadow')) el('textShadow').checked = config.textShadow;
        if (el('textShadowColor')) el('textShadowColor').value = config.textShadowColor;
        if (el('textShadowX')) el('textShadowX').value = config.textShadowX;
        if (el('textShadowXInput')) el('textShadowXInput').value = config.textShadowX;
        if (el('textShadowY')) el('textShadowY').value = config.textShadowY;
        if (el('textShadowYInput')) el('textShadowYInput').value = config.textShadowY;
        if (el('textShadowBlur')) el('textShadowBlur').value = config.textShadowBlur;
        if (el('textShadowBlurInput')) el('textShadowBlurInput').value = config.textShadowBlur;
        if (el('spriteShadow')) el('spriteShadow').checked = config.spriteShadow;
        if (el('spriteShadowColor')) el('spriteShadowColor').value = config.spriteShadowColor;
        if (el('spriteShadowX')) el('spriteShadowX').value = config.spriteShadowX;
        if (el('spriteShadowXInput')) el('spriteShadowXInput').value = config.spriteShadowX;
        if (el('spriteShadowY')) el('spriteShadowY').value = config.spriteShadowY;
        if (el('spriteShadowYInput')) el('spriteShadowYInput').value = config.spriteShadowY;
        if (el('spriteShadowBlur')) el('spriteShadowBlur').value = config.spriteShadowBlur;
        if (el('spriteShadowBlurInput')) el('spriteShadowBlurInput').value = config.spriteShadowBlur;
        if (el('spriteStroke')) el('spriteStroke').checked = config.spriteStroke;
        if (el('spriteStrokeColor')) el('spriteStrokeColor').value = config.spriteStrokeColor;
        if (el('spriteStrokeWidth')) el('spriteStrokeWidth').value = config.spriteStrokeWidth;
        if (el('spriteStrokeWidthInput')) el('spriteStrokeWidthInput').value = config.spriteStrokeWidth;

        toggleOptions('strokeOptions', config.textStroke);
        toggleOptions('textShadowOptions', config.textShadow);
        toggleOptions('spriteShadowOptions', config.spriteShadow);
        toggleOptions('spriteStrokeOptions', config.spriteStroke);
        updateDeleteFontButton();
        updateOBSUrlField();
    }
    
    if (currentTeam) {
        if (shouldShowTeam()) renderTeam(currentTeam);
        renderBadges(currentTeam);
        renderCemetery(currentTeam);
    }
}

function toggleOptions(id, visible) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('visible', !!visible);
}

function setupConfigListeners() {
    document.querySelectorAll('[data-layout]').forEach(btn => {
        btn.addEventListener('click', () => {
            config.layout = btn.dataset.layout;
            saveConfig();
            applyConfig();
        });
    });

    document.querySelectorAll('[data-level-pos]').forEach(btn => {
        btn.addEventListener('click', () => {
            config.levelPosition = btn.dataset.levelPos;
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
        if (el) el.addEventListener('change', e => {
            config[id] = e.target.checked;
            saveConfig();
            applyConfig();
        });
    });

    bindCheckbox('deathAnimation', 'deathAnimation');

    const previewDeathAnimBtn = document.getElementById('previewDeathAnimBtn');
    if (previewDeathAnimBtn) {
        previewDeathAnimBtn.addEventListener('click', () => {
            const fainted = (currentTeam?.team || []).filter(p => p.currentHP === 0);
            const sample = fainted.length ? fainted : (currentTeam?.team || []).slice(0, 3);
            if (!sample.length) {
                previewDeathAnimBtn.textContent = 'Sin equipo cargado';
                setTimeout(() => { previewDeathAnimBtn.textContent = 'Probar animación'; }, 1800);
                return;
            }
            playDeathAnimation(sample, true);
        });
    }

    const showBadgesPreview = document.getElementById('showBadgesPreview');
    if (showBadgesPreview) {
        showBadgesPreview.addEventListener('change', e => {
            config.showBadges = e.target.checked;
            saveConfig();
            applyConfig();
        });
    }

    bindCheckbox('badgeDimUnobtained', 'badgeDimUnobtained');
    bindCheckbox('showBadgeLabels', 'showBadgeLabels');
    setupRangeInput('badgeSize', 'badgeSizeInput', 'badgeSize');

    const showCemeteryPreview = document.getElementById('showCemeteryPreview');
    if (showCemeteryPreview) {
        showCemeteryPreview.addEventListener('change', e => {
            config.showCemetery = e.target.checked;
            saveConfig();
            applyConfig();
        });
    }

    const cemeterySpriteType = document.getElementById('cemeterySpriteType');
    if (cemeterySpriteType) {
        cemeterySpriteType.addEventListener('change', async e => {
            config.cemeterySpriteType = e.target.value;
            saveConfig();
            applyConfig();
            if (getSpriteTypeEntry(config.cemeterySpriteType).source === 'pmd' && currentTeam?.cemetery?.length) {
                await withSpriteTypeAsync(config.cemeterySpriteType, async () => {
                    await resolvePmdPortraits(currentTeam.cemetery);
                });
                renderCemetery(currentTeam);
            }
        });
    }

    document.querySelectorAll('input[name="cemeteryColumns"]').forEach(r => {
        r.addEventListener('change', e => {
            if (!e.target.checked) return;
            const cols = parseInt(e.target.value, 10);
            if ([5, 7, 9].includes(cols)) {
                config.cemeteryColumns = cols;
                saveConfig();
                applyConfig();
            }
        });
    });

    setupRangeInput('cemeterySpriteSize', 'cemeterySpriteSizeInput', 'cemeterySpriteSize');
    bindCheckbox('cemeteryGrayscale', 'cemeteryGrayscale');

    setupRangeInput('nameOffsetY', 'nameOffsetYInput', 'nameOffsetY');
    
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

    bindCheckbox('textShadow', 'textShadow');
    bindColor('textShadowColor', 'textShadowColor');
    setupRangeInput('textShadowX', 'textShadowXInput', 'textShadowX');
    setupRangeInput('textShadowY', 'textShadowYInput', 'textShadowY');
    setupRangeInput('textShadowBlur', 'textShadowBlurInput', 'textShadowBlur');

    bindCheckbox('spriteShadow', 'spriteShadow');
    bindColor('spriteShadowColor', 'spriteShadowColor');
    setupRangeInput('spriteShadowX', 'spriteShadowXInput', 'spriteShadowX');
    setupRangeInput('spriteShadowY', 'spriteShadowYInput', 'spriteShadowY');
    setupRangeInput('spriteShadowBlur', 'spriteShadowBlurInput', 'spriteShadowBlur');

    bindCheckbox('spriteStroke', 'spriteStroke');
    bindColor('spriteStrokeColor', 'spriteStrokeColor');
    setupRangeInput('spriteStrokeWidth', 'spriteStrokeWidthInput', 'spriteStrokeWidth');
    
    const spriteType = document.getElementById('spriteType');
    if (spriteType) spriteType.addEventListener('change', async e => {
        config.spriteType = e.target.value;
        if (isCustomSpriteType(config.spriteType)) {
            config.customSpritePack = getCustomSpritePack(config.spriteType);
        }
        saveConfig();
        applyConfig();
        if (getSpriteTypeEntry(config.spriteType).source === 'pmd' && currentTeam?.team?.length) {
            await resolvePmdPortraits(currentTeam.team);
            renderTeam(currentTeam);
        } else if (isCustomSpriteType(config.spriteType) && currentTeam?.team?.length) {
            renderTeam(currentTeam);
        }
    });
    
    const fontFamily = document.getElementById('fontFamily');
    if (fontFamily) fontFamily.addEventListener('change', e => {
        config.fontFamily = e.target.value;
        saveConfig();
        applyConfig();
        updateDeleteFontButton();
    });

    const fontFileInput = document.getElementById('fontFileInput');
    if (fontFileInput) {
        fontFileInput.addEventListener('change', async e => {
            const file = e.target.files?.[0];
            if (file) await importCustomFont(file);
            e.target.value = '';
        });
    }

    const deleteFontBtn = document.getElementById('deleteFontBtn');
    if (deleteFontBtn) {
        deleteFontBtn.addEventListener('click', async () => {
            await deleteSelectedCustomFont();
        });
    }
    
    setupRangeInput('spacing', 'spacingInput', 'spacing');
    setupRangeInput('gridRowGap', 'gridRowGapInput', 'gridRowGap');
    setupRangeInput('gridColGap', 'gridColGapInput', 'gridColGap');
    setupRangeInput('spriteSize', 'spriteSizeInput', 'spriteSize');
    setupRangeInput('fontSize', 'fontSizeInput', 'fontSize');

    bindCheckbox('textUppercase', 'textUppercase');
    
    ['colorName', 'colorNickname', 'colorLevel'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', e => { config[id] = e.target.value; saveConfig(); applyConfig(); });
    });
    
    const toggleConfig = document.getElementById('toggleConfig');
    if (toggleConfig) {
        toggleConfig.addEventListener('click', () => {
            const body = document.getElementById('configBody');
            body.classList.toggle('collapsed');
            const collapsed = body.classList.contains('collapsed');
            toggleConfig.textContent = collapsed ? '+' : '−';
            toggleConfig.title = collapsed ? 'Expandir panel' : 'Contraer panel';
            toggleConfig.setAttribute('aria-label', toggleConfig.title);
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

    const copyBadgesUrlBtn = document.getElementById('copyBadgesUrlBtn');
    if (copyBadgesUrlBtn) {
        copyBadgesUrlBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(document.getElementById('obsBadgesUrl').value).then(() => {
                copyBadgesUrlBtn.textContent = '✓ Copiado';
                copyBadgesUrlBtn.classList.add('copied');
                setTimeout(() => { copyBadgesUrlBtn.textContent = '📋 Copiar'; copyBadgesUrlBtn.classList.remove('copied'); }, 2000);
            });
        });
    }

    const copyDeathUrlBtn = document.getElementById('copyDeathUrlBtn');
    if (copyDeathUrlBtn) {
        copyDeathUrlBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(document.getElementById('obsDeathUrl').value).then(() => {
                copyDeathUrlBtn.textContent = '✓ Copiado';
                copyDeathUrlBtn.classList.add('copied');
                setTimeout(() => { copyDeathUrlBtn.textContent = '📋 Copiar'; copyDeathUrlBtn.classList.remove('copied'); }, 2000);
            });
        });
    }

    const copyCemeteryUrlBtn = document.getElementById('copyCemeteryUrlBtn');
    if (copyCemeteryUrlBtn) {
        copyCemeteryUrlBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(document.getElementById('obsCemeteryUrl').value).then(() => {
                copyCemeteryUrlBtn.textContent = '✓ Copiado';
                copyCemeteryUrlBtn.classList.add('copied');
                setTimeout(() => { copyCemeteryUrlBtn.textContent = '📋 Copiar'; copyCemeteryUrlBtn.classList.remove('copied'); }, 2000);
            });
        });
    }
}

function setupRangeInput(rangeId, inputId, configKey) {
    const range = document.getElementById(rangeId);
    const input = document.getElementById(inputId);
    const step = parseFloat(range?.step || input?.step || '1');
    const useFloat = step > 0 && step < 1;

    const readValue = raw => {
        const n = useFloat ? parseFloat(raw) : parseInt(raw, 10);
        if (Number.isNaN(n)) return useFloat ? 0 : 0;
        return useFloat ? Math.round(n * 100) / 100 : n;
    };
    
    if (range) range.addEventListener('input', e => {
        config[configKey] = readValue(e.target.value);
        if (input) input.value = config[configKey];
        saveConfig();
        applyConfig();
    });
    
    if (input) input.addEventListener('change', e => {
        config[configKey] = readValue(e.target.value);
        if (range) {
            const min = parseFloat(range.min);
            const max = parseFloat(range.max);
            range.value = Math.min(max, Math.max(min, config[configKey]));
            config[configKey] = readValue(range.value);
            input.value = config[configKey];
        }
        saveConfig();
        applyConfig();
    });
}

function bindCheckbox(id, key) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', e => {
        config[key] = e.target.checked;
        saveConfig();
        applyConfig();
    });
}

function bindColor(id, key) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', e => {
        config[key] = e.target.value;
        saveConfig();
        applyConfig();
    });
}

async function loadCustomFonts() {
    try {
        const res = await fetch('/api/fonts');
        if (!res.ok) return;
        customFonts = await res.json() || [];
        refreshCustomFontOptions();
        for (const font of customFonts) {
            await registerFontFace(font.family, font.fileName);
        }
    } catch (e) {
        console.warn('[Fonts] No se pudieron cargar fuentes custom', e);
    }
}

async function loadCustomSpritePacks() {
    try {
        const res = await fetch('/api/custom-sprites/packs');
        if (!res.ok) return;
        customSpritePacks = await res.json() || [];
        refreshCustomSpriteOptions();
    } catch (e) {
        console.warn('[Sprites] No se pudieron cargar packs custom', e);
    }
}

function refreshCustomSpriteOptions() {
    const groups = [
        document.getElementById('customSpritesGroup'),
        document.getElementById('customSpritesGroupCemetery')
    ].filter(Boolean);
    const select = document.getElementById('spriteType');
    const cemeterySelect = document.getElementById('cemeterySpriteType');
    if (!groups.length) return;

    const packs = customSpritePacks.length
        ? customSpritePacks
        : [{ id: config.customSpritePack || 'geniv' }];

    for (const group of groups) {
        group.innerHTML = '';
        for (const pack of packs) {
            const opt = document.createElement('option');
            opt.value = `${CUSTOM_SPRITE_PREFIX}${pack.id}`;
            opt.textContent = pack.id;
            group.appendChild(opt);
        }
    }

    if (config.spriteType === 'custom') {
        config.spriteType = `${CUSTOM_SPRITE_PREFIX}${getCustomSpritePack('custom')}`;
        config.customSpritePack = getCustomSpritePack(config.spriteType);
        saveConfig();
    }
    if (config.cemeterySpriteType === 'custom') {
        config.cemeterySpriteType = `${CUSTOM_SPRITE_PREFIX}${getCustomSpritePack('custom')}`;
        saveConfig();
    }

    const values = packs.map(p => `${CUSTOM_SPRITE_PREFIX}${p.id}`);
    if (isCustomSpriteType(config.spriteType) && !values.includes(config.spriteType)) {
        config.spriteType = values[0] || 'default';
        config.customSpritePack = getCustomSpritePack(config.spriteType);
        saveConfig();
    }
    if (isCustomSpriteType(config.cemeterySpriteType) && !values.includes(config.cemeterySpriteType)) {
        config.cemeterySpriteType = values[0] || 'default';
        saveConfig();
    }

    if (select && [...select.options].some(o => o.value === config.spriteType)) {
        select.value = config.spriteType;
    }
    if (cemeterySelect && [...cemeterySelect.options].some(o => o.value === config.cemeterySpriteType)) {
        cemeterySelect.value = config.cemeterySpriteType;
    }
}

function refreshCustomFontOptions() {
    const group = document.getElementById('customFontsGroup');
    const select = document.getElementById('fontFamily');
    if (!group || !select) return;

    group.innerHTML = '';
    if (!customFonts.length) {
        group.hidden = true;
        return;
    }

    group.hidden = false;
    for (const font of customFonts) {
        const opt = document.createElement('option');
        opt.value = font.family;
        opt.textContent = font.family;
        group.appendChild(opt);
    }

    // Restaurar selección si sigue existiendo
    const exists = [...select.options].some(o => o.value === config.fontFamily);
    if (exists) select.value = config.fontFamily;
}

async function registerFontFace(family, fileName) {
    const url = `/fonts/${encodeURIComponent(fileName)}`;
    try {
        const face = new FontFace(family, `url(${url})`);
        await face.load();
        document.fonts.add(face);
    } catch (e) {
        // Fallback CSS @font-face
        const styleId = `font-${family.replace(/\s+/g, '-')}`;
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `@font-face{font-family:'${family}';src:url('${url}');font-display:swap;}`;
            document.head.appendChild(style);
        }
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result || '');
            const base64 = result.includes(',') ? result.split(',')[1] : result;
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function sanitizeFontFamily(name) {
    return name.replace(/\.[^.]+$/, '').replace(/[^\w\s\-]/g, '').trim() || 'CustomFont';
}

async function importCustomFont(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!['ttf', 'otf', 'woff', 'woff2'].includes(ext)) {
        alert('Formato no soportado. Usa .ttf, .otf, .woff o .woff2');
        return;
    }
    if (file.size > 8 * 1024 * 1024) {
        alert('La fuente es demasiado grande (máx. 8 MB)');
        return;
    }

    const family = sanitizeFontFamily(file.name);
    const data = await fileToBase64(file);

    try {
        const res = await fetch('/api/fonts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ family, fileName: file.name, data })
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(err || 'Error al subir fuente');
        }
        const saved = await res.json();
        await registerFontFace(saved.family, saved.fileName);
        await loadCustomFonts();
        config.fontFamily = saved.family;
        saveConfig();
        applyConfig();
    } catch (e) {
        console.error(e);
        alert('No se pudo importar la fuente. ¿Está PokeLayout en ejecución?');
    }
}

function updateDeleteFontButton() {
    const btn = document.getElementById('deleteFontBtn');
    if (!btn) return;
    const isCustom = customFonts.some(f => f.family === config.fontFamily);
    btn.hidden = !isCustom;
}

async function deleteSelectedCustomFont() {
    const font = customFonts.find(f => f.family === config.fontFamily);
    if (!font) return;
    if (!confirm(`¿Eliminar la fuente "${font.family}"?`)) return;

    try {
        const res = await fetch(`/api/fonts/${encodeURIComponent(font.fileName)}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('No se pudo eliminar');
        config.fontFamily = 'Inter';
        saveConfig();
        await loadCustomFonts();
        applyConfig();
    } catch (e) {
        alert('Error al eliminar la fuente');
    }
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

/** Nombre de archivo: ABOMASNOW, ABOMASNOW_1 (forma/mega), etc. */
function normalizeSpeciesFileName(speciesName) {
    return (speciesName || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase();
}

/** Clave Essentials / nombre de archivo: ZORUA, ABOMASNOW, etc. */
function getCustomSpeciesKey(pokemon) {
    if (pokemon.speciesKey) {
        return pokemon.speciesKey.toUpperCase().replace(/[^A-Z0-9]/g, '');
    }
    return normalizeSpeciesFileName(pokemon.speciesName);
}

/** Variantes de nombre: ZORUA, ZORUA_1 (forma del save) */
function buildCustomSpriteVariants(pokemon) {
    const base = getCustomSpeciesKey(pokemon);
    const form = pokemon.form || 0;
    if (form > 0) return [`${base}_${form}`, base];
    return [base];
}

function buildCustomSpritePath(variantName, folder) {
    const pack = getCustomSpritePack(config.spriteType);
    return '/sprites/' + [pack, folder, `${variantName}.png`].map(encodeURIComponent).join('/');
}

/** Prioridad: shiny → normal; forma+fembra → forma → hembra → base */
function buildCustomSpriteUrls(pokemon) {
    const shiny = !!pokemon.isShiny;
    const variants = buildCustomSpriteVariants(pokemon);
    const folders = shiny ? ['Front shiny', 'Front'] : ['Front'];
    const urls = [];
    for (const folder of folders) {
        for (const variant of variants) {
            urls.push(buildCustomSpritePath(variant, folder));
        }
    }
    return [...new Set(urls)];
}

function buildCustomSpriteFileName(pokemon) {
    return buildCustomSpriteVariants(pokemon)[0];
}

function buildCustomSpriteUrl(pokemon) {
    const urls = buildCustomSpriteUrls(pokemon);
    return urls[0] || FALLBACK_SPRITE;
}

function buildCustomSpriteFallbackUrl(pokemon) {
    const urls = buildCustomSpriteUrls(pokemon);
    return urls[1] || null;
}

function getSpriteUrl(pokemon) {
    const id = pokemon.species;
    if (!id) return FALLBACK_SPRITE;

    const shiny = !!pokemon.isShiny;
    const female = pokemon.gender === 1;
    const form = pokemon.form || 0;
    const type = getSpriteTypeEntry(config.spriteType);

    if (type.source === 'custom') {
        return buildCustomSpriteUrl(pokemon);
    }

    if (type.source === 'pmd') {
        const cacheKey = `${id}-${form}-${shiny}-${female}-${type.emotion}`;
        if (pmdUrlCache.has(cacheKey)) return pmdUrlCache.get(cacheKey);
        return buildPmdPortraitUrl(id, form, shiny, female, type.emotion || 'Normal');
    }

    return buildSpriteUrl(config.spriteType, id, shiny, female);
}

/** Resuelve portraits vía GraphQL (más fiable con formas) y rellena caché. */
async function resolvePmdPortraits(team) {
    const type = getSpriteTypeEntry(config.spriteType);
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
    const spriteType = getSpriteTypeEntry(config.spriteType);
    const isHighRes = !!spriteType.highRes;
    let spriteClass = 'pokemon-sprite' + (isHighRes ? ' high-res' : '') + (isShiny && config.showShiny ? ' shiny' : '') + (isFainted ? ' fainted' : '');
    const spriteFilter = buildSpriteFilter(isShiny, isFainted);
    
    let nameClass = 'pokemon-name' + (hasNickname ? ' nickname' : '') + (config.textStroke ? ' has-stroke' : '');
    const levelPos = config.levelPosition || 'below';
    const levelInCorner = config.showLevel && levelPos !== 'below';
    let levelClass = 'pokemon-level' + (config.textStroke ? ' has-stroke' : '')
        + (levelInCorner ? ` corner corner-${levelPos}` : '');

    const primaryUrl = getSpriteUrl(pokemon);
    const typeKey = isCustomSpriteType(config.spriteType) ? 'default' : config.spriteType;
    const type = spriteType;
    const shiny = !!pokemon.isShiny;
    const form = pokemon.form || 0;
    const isCustom = type.source === 'custom';

    // Cadena de fallbacks: female → no-female → no-shiny → pokéball
    let fallbackUrl = FALLBACK_SPRITE;
    if (isCustom) {
        const customUrls = buildCustomSpriteUrls(pokemon);
        fallbackUrl = customUrls[1] || buildSpriteUrl('default', pokemon.species, shiny, false);
    } else if (type.source === 'pmd') {
        if (pokemon.gender === 1) {
            fallbackUrl = buildPmdPortraitUrl(pokemon.species, form, shiny, false, type.emotion || 'Normal');
        } else if (shiny) {
            fallbackUrl = buildPmdPortraitUrl(pokemon.species, form, false, false, type.emotion || 'Normal');
        }
    } else if (pokemon.gender === 1) {
        fallbackUrl = buildSpriteUrl(typeKey, pokemon.species, shiny, false);
    }

    const fallback2 = isCustom
        ? buildSpriteUrl('default', pokemon.species, shiny, false)
        : ((type.source === 'pmd' && shiny)
            ? buildPmdPortraitUrl(pokemon.species, form, false, false, type.emotion || 'Normal')
            : FALLBACK_SPRITE);
    
    let html = `<div class="pokemon-card">`;
    if (config.showShiny && isShiny) html += `<span class="shiny-icon">✨</span>`;

    const onErr = isCustom
        ? buildChainedImgErrorHandler([...buildCustomSpriteUrls(pokemon).slice(1), fallback2, FALLBACK_SPRITE])
        : buildImgErrorHandler(fallbackUrl, fallback2);
    html += `<div class="pokemon-sprite-stack">`;
    if (isCustom) {
        if (config.spriteShadow) {
            html += buildCustomSpriteImgHtml(
                primaryUrl,
                `pokemon-sprite sprite-shadow-layer${isFainted ? ' fainted' : ''}`,
                'url(#spriteShadowFilter)',
                onErr
            );
        }
        html += buildCustomSpriteImgHtml(
            primaryUrl,
            spriteClass,
            spriteFilter,
            onErr,
            pokemon.speciesName
        );
    } else {
        // Capa de sombra: mismo GIF/PNG duplicado → la sombra sigue la silueta (no el rectángulo del <img>)
        if (config.spriteShadow) {
            html += `<img src="${primaryUrl}" alt="" class="pokemon-sprite sprite-shadow-layer${isHighRes ? ' high-res' : ''}${isFainted ? ' fainted' : ''}" style="filter:url(#spriteShadowFilter)" aria-hidden="true" draggable="false" onerror="${onErr}">`;
        }
        html += `<img src="${primaryUrl}" alt="${escapeHtml(pokemon.speciesName)}" class="${spriteClass}" style="filter:${spriteFilter}" data-fb2="${fallback2}" onerror="${onErr}">`;
    }
    if (levelInCorner) html += `<span class="${levelClass}">Nv.${pokemon.level}</span>`;
    html += `</div>`;

    if (config.showNickname) html += `<span class="${nameClass}">${escapeHtml(displayName)}</span>`;
    if (config.showLevel && !levelInCorner) html += `<span class="${levelClass}">Nv.${pokemon.level}</span>`;
    if (config.showHP) html += `<div class="hp-bar-container"><div class="hp-bar ${hp.cls}" style="width:${hp.pct}%"></div></div>`;
    html += `</div>`;
    return html;
}

function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

function renderTeam(data) {
    const c = document.getElementById('team');
    if (!data?.team?.length) { c.innerHTML = `<div class="empty-state">Sin Pokémon</div>`; return; }
    c.innerHTML = data.team.map(p => createPokemonCard(p)).join('');
    setupAllSpriteSheets();
}

function createCemeterySprite(pokemon) {
    const spriteType = getSpriteTypeEntry(config.spriteType);
    const isHighRes = !!spriteType.highRes;
    const gray = !!config.cemeteryGrayscale;
    let spriteClass = 'pokemon-sprite cemetery-sprite' + (isHighRes ? ' high-res' : '') + (gray ? ' fainted' : '');
    const spriteFilter = gray ? 'grayscale(100%)' : 'none';

    const primaryUrl = getSpriteUrl(pokemon);
    const typeKey = isCustomSpriteType(config.spriteType) ? 'default' : config.spriteType;
    const type = spriteType;
    const shiny = !!pokemon.isShiny;
    const form = pokemon.form || 0;
    const isCustom = type.source === 'custom';

    let fallbackUrl = FALLBACK_SPRITE;
    if (isCustom) {
        const customUrls = buildCustomSpriteUrls(pokemon);
        fallbackUrl = customUrls[1] || buildSpriteUrl('default', pokemon.species, shiny, false);
    } else if (type.source === 'pmd') {
        if (pokemon.gender === 1) {
            fallbackUrl = buildPmdPortraitUrl(pokemon.species, form, shiny, false, type.emotion || 'Normal');
        } else if (shiny) {
            fallbackUrl = buildPmdPortraitUrl(pokemon.species, form, false, false, type.emotion || 'Normal');
        }
    } else if (pokemon.gender === 1) {
        fallbackUrl = buildSpriteUrl(typeKey, pokemon.species, shiny, false);
    }

    const fallback2 = isCustom
        ? buildSpriteUrl('default', pokemon.species, shiny, false)
        : ((type.source === 'pmd' && shiny)
            ? buildPmdPortraitUrl(pokemon.species, form, false, false, type.emotion || 'Normal')
            : FALLBACK_SPRITE);

    const onErr = isCustom
        ? buildChainedImgErrorHandler([...buildCustomSpriteUrls(pokemon).slice(1), fallback2, FALLBACK_SPRITE])
        : buildImgErrorHandler(fallbackUrl, fallback2);

    if (isCustom) {
        return `<div class="cemetery-slot">${buildCustomSpriteImgHtml(
            primaryUrl,
            spriteClass,
            spriteFilter,
            onErr,
            pokemon.speciesName
        )}</div>`;
    }

    return `<div class="cemetery-slot">`
        + `<img src="${primaryUrl}" alt="${escapeHtml(pokemon.speciesName)}" class="${spriteClass}" style="filter:${spriteFilter}" data-fb2="${fallback2}" onerror="${onErr}">`
        + `</div>`;
}

function renderCemetery(data) {
    const wrapper = document.getElementById('cemeteryWrapper');
    const grid = document.getElementById('cemeteryGrid');
    if (!wrapper || !grid) return;

    if (!shouldShowCemetery()) {
        wrapper.hidden = true;
        grid.innerHTML = '';
        return;
    }

    const list = data?.cemetery || [];
    wrapper.hidden = false;
    grid.className = 'cemetery-grid' + (config.cemeteryGrayscale ? ' bw' : '');

    if (!list.length) {
        grid.innerHTML = `<div class="empty-state">Cementerio vacío</div>`;
        return;
    }

    withSpriteType(config.cemeterySpriteType, () => {
        grid.innerHTML = list.map(p => createCemeterySprite(p)).join('');
        setupAllSpriteSheets();
    });
}

function buildBadgeUrl(spriteId) {
    return `${BADGE_BASE}/${spriteId}.png`;
}

function renderBadges(data) {
    const panel = document.getElementById('badgesPanel');
    if (!panel) return;

    if (!shouldShowBadges() || !data?.badgeSets?.length) {
        panel.hidden = true;
        panel.innerHTML = '';
        const wrapper = document.getElementById('badgesWrapper');
        if (wrapper && !isOBSMode()) wrapper.hidden = true;
        return;
    }

    const sets = data.badgeSets
        .map(set => {
            const badges = (set.badges || []).filter(b => {
                if (b.obtained) return true;
                return config.badgeDimUnobtained;
            });
            if (!badges.length) return '';
            const label = config.showBadgeLabels && set.region
                ? `<span class="badge-set-label">${escapeHtml(set.region)}</span>`
                : '';
            const items = badges.map(b => {
                const cls = b.obtained ? 'badge-item' : 'badge-item unobtained';
                const url = buildBadgeUrl(b.spriteId);
                const title = escapeHtml(b.name || '');
                return `<span class="${cls}" title="${title}"><img src="${url}" alt="${title}" loading="lazy" onerror="this.style.opacity='0.15'"></span>`;
            }).join('');
            return `<div class="badge-set">${label}<div class="badge-row">${items}</div></div>`;
        })
        .filter(Boolean)
        .join('');

    if (!sets) {
        panel.hidden = true;
        panel.innerHTML = '';
        const wrapper = document.getElementById('badgesWrapper');
        if (wrapper && !isOBSMode()) wrapper.hidden = true;
        return;
    }

    panel.hidden = false;
    panel.innerHTML = sets;

    const wrapper = document.getElementById('badgesWrapper');
    if (wrapper && !isOBSMode()) wrapper.hidden = false;
}

function teamsEqual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

function pokemonIdentityKey(p) {
    return `${p.slot}|${p.species}|${p.form || 0}|${p.nickname || ''}`;
}

function findPreviousMatch(prevTeam, pokemon) {
    if (!prevTeam?.length) return null;
    const bySlot = prevTeam.find(x => x.slot === pokemon.slot && x.species === pokemon.species);
    if (bySlot) return bySlot;
    return prevTeam.find(x =>
        x.species === pokemon.species &&
        (x.nickname || '') === (pokemon.nickname || '') &&
        (x.form || 0) === (pokemon.form || 0)
    ) || null;
}

/** Pokémon que pasan a 0 HP respecto al equipo anterior (no anima en la primera carga). */
function getNewlyFainted(prevData, nextData) {
    if (!prevData?.team || !nextData?.team) return [];
    const newly = [];
    for (const p of nextData.team) {
        if (p.currentHP !== 0) continue;
        const prev = findPreviousMatch(prevData.team, p);
        if (!prev || prev.currentHP > 0) newly.push(p);
    }
    return newly;
}

function getDeathDisplayName(pokemon) {
    if (pokemon.hasNickname && pokemon.nickname) return pokemon.nickname;
    return pokemon.speciesName || 'Pokémon';
}

function buildDeathCardHtml(pokemon) {
    const displayName = getDeathDisplayName(pokemon);
    const spriteType = getSpriteTypeEntry(config.spriteType);
    const isHighRes = !!spriteType.highRes;
    const primaryUrl = getSpriteUrl(pokemon);
    const typeKey = isCustomSpriteType(config.spriteType) ? 'default' : config.spriteType;
    const type = spriteType;
    const shiny = !!pokemon.isShiny;
    const form = pokemon.form || 0;
    const isCustom = type.source === 'custom';

    let fallbackUrl = FALLBACK_SPRITE;
    if (isCustom) {
        const customUrls = buildCustomSpriteUrls(pokemon);
        fallbackUrl = customUrls[1] || buildSpriteUrl('default', pokemon.species, shiny, false);
    } else if (type.source === 'pmd') {
        if (pokemon.gender === 1) {
            fallbackUrl = buildPmdPortraitUrl(pokemon.species, form, shiny, false, type.emotion || 'Normal');
        } else if (shiny) {
            fallbackUrl = buildPmdPortraitUrl(pokemon.species, form, false, false, type.emotion || 'Normal');
        }
    } else if (pokemon.gender === 1) {
        fallbackUrl = buildSpriteUrl(typeKey, pokemon.species, shiny, false);
    }

    const fallback2 = isCustom
        ? buildSpriteUrl('default', pokemon.species, shiny, false)
        : ((type.source === 'pmd' && shiny)
            ? buildPmdPortraitUrl(pokemon.species, form, false, false, type.emotion || 'Normal')
            : FALLBACK_SPRITE);

    const onErr = isCustom
        ? buildChainedImgErrorHandler([...buildCustomSpriteUrls(pokemon).slice(1), fallback2, FALLBACK_SPRITE])
        : buildImgErrorHandler(fallbackUrl, fallback2);

    const grayFilter = 'grayscale(100%)';
    let spriteHtml;
    if (isCustom) {
        spriteHtml = buildCustomSpriteImgHtml(primaryUrl, 'pokemon-sprite fainted', grayFilter, onErr, pokemon.speciesName);
    } else {
        const cls = 'pokemon-sprite fainted' + (isHighRes ? ' high-res' : '');
        spriteHtml = `<img src="${primaryUrl}" alt="${escapeHtml(pokemon.speciesName)}" class="${cls}" style="filter:${grayFilter}" data-fb2="${fallback2}" onerror="${onErr}">`;
    }

    return `<div class="death-card" data-key="${escapeHtml(pokemonIdentityKey(pokemon))}">`
        + spriteHtml
        + `<span class="death-card-name">${escapeHtml(displayName)}</span>`
        + `</div>`;
}

function hideDeathOverlay() {
    const overlay = document.getElementById('deathOverlay');
    if (!overlay || overlay.hidden) return;
    overlay.classList.remove('visible');
    overlay.classList.add('hiding');
    clearTimeout(deathAnimHideTimer);
    deathAnimHideTimer = setTimeout(() => {
        overlay.hidden = true;
        overlay.classList.remove('hiding');
        const party = document.getElementById('deathParty');
        if (party) party.innerHTML = '';
    }, DEATH_ANIM_FADE_MS);
}

function playDeathAnimation(fallen, force = false) {
    if (!fallen?.length) return;
    if (!force && !shouldPlayDeathAnimation()) return;

    const overlay = document.getElementById('deathOverlay');
    const title = document.getElementById('deathTitle');
    const party = document.getElementById('deathParty');
    if (!overlay || !title || !party) return;

    clearTimeout(deathAnimTimer);
    clearTimeout(deathAnimHideTimer);

    const n = fallen.length;
    title.textContent = n === 1
        ? 'HA CAÍDO 1 POKÉMON'
        : `HAN CAÍDO ${n} POKÉMON`;

    party.innerHTML = fallen.map(buildDeathCardHtml).join('');
    overlay.hidden = false;
    overlay.classList.remove('hiding');
    // Force reflow so the fade-in transition runs even if replayed quickly
    void overlay.offsetWidth;
    overlay.classList.add('visible');

    setupAllSpriteSheets();

    deathAnimTimer = setTimeout(hideDeathOverlay, DEATH_ANIM_HOLD_MS);
}

async function updateOverlay() {
    const t = await fetchTeamData();
    if (teamsEqual(currentTeam, t)) return;

    const newlyFainted = shouldPlayDeathAnimation() ? getNewlyFainted(currentTeam, t) : [];

    currentTeam = t;
    if (shouldShowTeam()) {
        const type = getSpriteTypeEntry(config.spriteType);
        if (type.source === 'pmd' && t?.team?.length) {
            await resolvePmdPortraits(t.team);
        }
        renderTeam(t);
    }
    renderBadges(t);

    if (shouldShowCemetery() && getSpriteTypeEntry(config.cemeterySpriteType).source === 'pmd' && t?.cemetery?.length) {
        await withSpriteTypeAsync(config.cemeterySpriteType, async () => {
            await resolvePmdPortraits(t.cemetery);
        });
    }
    renderCemetery(t);

    if (newlyFainted.length) playDeathAnimation(newlyFainted);
}

async function init() {
    if (isOBSMode()) document.body.classList.add('obs-mode');
    loadConfig();
    await loadCustomFonts();
    await loadCustomSpritePacks();
    if (!isOBSMode()) setupConfigListeners();
    applyConfig();
    await updateOverlay();
    setInterval(updateOverlay, REFRESH_INTERVAL);
}

document.addEventListener('DOMContentLoaded', init);
window.setupSpriteSheet = setupSpriteSheet;
