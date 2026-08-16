/**
 * PokeLayout - Script con configuración completa
 */

const REFRESH_INTERVAL = 2000;
const API_URL = '/api/team';

let currentTeam = null;
let customFonts = []; // { family, fileName }
let customSpritePacks = []; // { id, folders, hasFormsFile, hasCustomFolder }
/** Índice Custom/: packId → { "25": ["25","25a",...], "648_pirouette": [...] } */
const customDexIndexByPack = new Map();
/** Elección aleatoria de la sesión: `${pack}|${groupKey}` → basename */
const customDexChoiceCache = new Map();
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
    showHeldItem: false,
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
    showLives: false,
    maxLives: 20,
    livesDisplay: 'number',
    livesShowMax: true,
    livesFontFamily: 'Fredoka',
    livesFontSize: 28,
    livesColor: '#f8fafc',
    livesMaxColor: '#94a3b8',
    livesHeartSize: 22,
    livesHeartGap: 4,
    livesHeartColor: '#ef4444',
    livesHeartLostColor: '#475569',
    livesHeartStyle: 'classic',
    livesHeartLayout: 'row',
    livesHeartColumns: 5,
    livesHeartStroke: false,
    livesHeartStrokeColor: '#000000',
    livesHeartStrokeWidth: 1.5,
    livesHeartShadow: false,
    livesHeartShadowColor: '#000000',
    livesHeartShadowX: 1,
    livesHeartShadowY: 1,
    livesHeartShadowBlur: 2,
    splitSlots: false,
    nameOffsetY: 0,
    levelPosition: 'below',
    levelFontFamily: 'Inter',
    levelFontSize: 10,
    levelFormat: 'short',
    levelOffsetX: 0,
    levelOffsetY: 0,
    levelBackground: false,
    levelBackgroundColor: '#111827',
    levelBorderRadius: 6,
    levelPadding: 3,
    heldItemPosition: 'bottom-right',
    heldItemSize: 22,
    heldItemOffsetX: 0,
    heldItemOffsetY: 0,
    heldItemBackground: false,
    heldItemBackgroundColor: '#111827',
    heldItemBorderRadius: 8,
    heldItemPadding: 3,
    hpDisplay: 'bar',
    hpPosition: 'below',
    hpBarWidth: 64,
    hpBarHeight: 5,
    hpFontSize: 10,
    hpHighColor: '#22c55e',
    hpMediumColor: '#eab308',
    hpLowColor: '#ef4444',
    hpBackgroundColor: '#1f2937',
    hpTextColor: '#f8fafc',
    hpBorderRadius: 3,
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
    background: 'transparent',
    // Recorte Artwork TCG (píxeles sobre carta high 600×825)
    tcgArtCropTop: 100,
    tcgArtCropLeft: 112,
    tcgArtCropBottom: 435,
    tcgArtCropRight: 54
};

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const BADGE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges';
const ITEM_SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items';
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

    // Pokémon TCG (TCGdex assets)
    'tcg-card':           { source: 'tcgdex', quality: 'high', ext: 'webp', highRes: true },
    'tcg-artwork':        { source: 'tcgdex', quality: 'high', ext: 'webp', highRes: true, artworkCrop: true },

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

const TCGDEX_API = 'https://api.tcgdex.net/v2/en';
const tcgdexUrlCache = new Map();
const TCGDEX_CARD_W = 600;
const TCGDEX_CARD_H = 825;

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

function isLivesOnlyMode() {
    return isOBSMode() && getObsView() === 'lives';
}

function isSlotOnlyMode() {
    return isOBSMode() && getObsView() === 'slot';
}

function getObsSlot() {
    const n = parseInt(new URLSearchParams(window.location.search).get('slot'), 10);
    return Number.isFinite(n) && n >= 1 && n <= 6 ? n : 1;
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

function shouldShowLives() {
    if (isLivesOnlyMode()) return true;
    if (isOBSMode()) return false;
    return config.showLives;
}

function shouldShowTeam() {
    return !isBadgesOnlyMode() && !isDeathOnlyMode() && !isCemeteryOnlyMode() && !isLivesOnlyMode();
}

function shouldPlayDeathAnimation() {
    if (isBadgesOnlyMode() || isCemeteryOnlyMode() || isLivesOnlyMode()) return false;
    // Fuente OBS dedicada, o vista previa en el panel de configuración
    if (isDeathOnlyMode()) return true;
    return !isOBSMode() && config.deathAnimation;
}

function countDeaths(data) {
    const partyFainted = (data?.team || []).filter(p => p.currentHP === 0).length;
    const cemetery = (data?.cemetery || []).length;
    return partyFainted + cemetery;
}

function getLivesRemaining(data) {
    const max = Math.max(0, Number(config.maxLives) || 0);
    return Math.max(0, max - countDeaths(data));
}

function heldItemToSlug(name) {
    return String(name || '')
        .trim()
        .replace(/^:/, '')
        .toLowerCase()
        .replace(/[''`]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function getHeldItemSpriteUrl(name) {
    const slug = heldItemToSlug(name);
    if (!slug) return '';
    return `${ITEM_SPRITE_BASE}/${slug}.png`;
}

function formatHeldItemLabel(name) {
    const raw = String(name || '').trim().replace(/^:/, '').replace(/_/g, ' ');
    if (!raw) return '';
    return raw.replace(/\b\w/g, c => c.toUpperCase());
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
    params.set('levelfont', config.levelFontFamily);
    params.set('levelsize', config.levelFontSize);
    params.set('levelfmt', config.levelFormat);
    params.set('levelx', config.levelOffsetX);
    params.set('levely', config.levelOffsetY);
    params.set('levelbg', config.levelBackground ? '1' : '0');
    params.set('levelbgc', config.levelBackgroundColor.replace('#', ''));
    params.set('levelradius', config.levelBorderRadius);
    params.set('levelpad', config.levelPadding);
    params.set('hp', config.showHP ? '1' : '0');
    params.set('hpdisplay', config.hpDisplay);
    params.set('hppos', config.hpPosition);
    params.set('hpw', config.hpBarWidth);
    params.set('hph', config.hpBarHeight);
    params.set('hpfs', config.hpFontSize);
    params.set('hphigh', config.hpHighColor.replace('#', ''));
    params.set('hpmed', config.hpMediumColor.replace('#', ''));
    params.set('hplow', config.hpLowColor.replace('#', ''));
    params.set('hpbg', config.hpBackgroundColor.replace('#', ''));
    params.set('hptxt', config.hpTextColor.replace('#', ''));
    params.set('hpr', config.hpBorderRadius);
    params.set('shiny', config.showShiny ? '1' : '0');
    params.set('item', config.showHeldItem ? '1' : '0');
    params.set('itempos', config.heldItemPosition);
    params.set('itemsize', config.heldItemSize);
    params.set('itemx', config.heldItemOffsetX);
    params.set('itemy', config.heldItemOffsetY);
    params.set('itembg', config.heldItemBackground ? '1' : '0');
    params.set('itembgc', config.heldItemBackgroundColor.replace('#', ''));
    params.set('itemradius', config.heldItemBorderRadius);
    params.set('itempad', config.heldItemPadding);
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
    appendTcgArtCropParams(params);
    return window.location.origin + '/?obs&' + params.toString();
}

function generateSlotOBSUrl(slot) {
    const params = new URLSearchParams(new URL(generateOBSUrl()).search);
    params.set('view', 'slot');
    params.set('slot', String(slot));
    return window.location.origin + '/?' + params.toString();
}

function generateLivesOBSUrl() {
    const params = new URLSearchParams();
    params.set('view', 'lives');
    params.set('maxlives', config.maxLives);
    params.set('bg', config.background);
    params.set('ldisplay', config.livesDisplay === 'hearts' ? 'hearts' : 'number');
    params.set('lshowmax', config.livesShowMax ? '1' : '0');
    params.set('lfont', config.livesFontFamily);
    params.set('lfontsize', config.livesFontSize);
    params.set('lcolor', config.livesColor.replace('#', ''));
    params.set('lmaxcolor', config.livesMaxColor.replace('#', ''));
    params.set('lheartsize', config.livesHeartSize);
    params.set('lheartgap', config.livesHeartGap);
    params.set('lheartc', config.livesHeartColor.replace('#', ''));
    params.set('lheartlost', config.livesHeartLostColor.replace('#', ''));
    params.set('lheartstyle', config.livesHeartStyle || 'classic');
    params.set('lheartlayout', config.livesHeartLayout || 'row');
    params.set('lheartcols', config.livesHeartColumns || 5);
    params.set('lheartstroke', config.livesHeartStroke ? '1' : '0');
    params.set('lheartstrokec', (config.livesHeartStrokeColor || '#000000').replace('#', ''));
    params.set('lheartstrokew', config.livesHeartStrokeWidth);
    params.set('lheartshadow', config.livesHeartShadow ? '1' : '0');
    params.set('lheartsc', (config.livesHeartShadowColor || '#000000').replace('#', ''));
    params.set('lheartsx', config.livesHeartShadowX);
    params.set('lheartsy', config.livesHeartShadowY);
    params.set('lheartsb', config.livesHeartShadowBlur);
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
    appendTcgArtCropParams(params);
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
    appendTcgArtCropParams(params);
    return window.location.origin + '/?obs&' + params.toString();
}

function updateOBSUrlField() {
    const teamUrl = document.getElementById('obsUrl');
    const badgesUrl = document.getElementById('obsBadgesUrl');
    const deathUrl = document.getElementById('obsDeathUrl');
    const deathGroup = document.getElementById('obsDeathUrlGroup');
    const cemeteryUrl = document.getElementById('obsCemeteryUrl');
    const livesUrl = document.getElementById('obsLivesUrl');
    const slotGroup = document.getElementById('obsSlotUrlsGroup');
    const slotUrls = document.getElementById('obsSlotUrls');
    if (teamUrl) teamUrl.value = generateOBSUrl();
    if (badgesUrl) badgesUrl.value = generateBadgesOBSUrl();
    if (deathUrl) deathUrl.value = generateDeathOBSUrl();
    if (deathGroup) deathGroup.hidden = !config.deathAnimation;
    if (cemeteryUrl) cemeteryUrl.value = generateCemeteryOBSUrl();
    if (livesUrl) livesUrl.value = generateLivesOBSUrl();
    if (slotGroup) slotGroup.hidden = !config.splitSlots;
    if (slotUrls && config.splitSlots) {
        slotUrls.innerHTML = [1, 2, 3, 4, 5, 6].map(slot => {
            const url = generateSlotOBSUrl(slot);
            return `<div class="obs-slot-row">`
                + `<label for="obsSlotUrl${slot}">Slot ${slot}</label>`
                + `<div class="obs-url-container">`
                + `<input type="text" id="obsSlotUrl${slot}" readonly value="${escapeHtml(url)}">`
                + `<button type="button" class="copy-url-btn" data-copy-slot="${slot}">📋 Copiar</button>`
                + `</div></div>`;
        }).join('');
    }
}

function loadConfigFromURL() {
    const p = new URLSearchParams(window.location.search);
    if (p.get('view') === 'badges') config.showBadges = true;
    if (p.get('view') === 'death') config.deathAnimation = true;
    if (p.get('view') === 'cemetery') config.showCemetery = true;
    if (p.get('view') === 'lives') config.showLives = true;
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
        const allowed = ['below', 'top-left', 'top-right', 'left', 'right', 'bottom-left', 'bottom-right'];
        if (allowed.includes(pos)) config.levelPosition = pos;
    }
    if (p.has('levelfont')) config.levelFontFamily = p.get('levelfont');
    if (p.has('levelsize')) config.levelFontSize = parseInt(p.get('levelsize'), 10) || 10;
    if (p.has('levelfmt') && ['short', 'long', 'number'].includes(p.get('levelfmt'))) config.levelFormat = p.get('levelfmt');
    if (p.has('levelx')) config.levelOffsetX = parseInt(p.get('levelx'), 10) || 0;
    if (p.has('levely')) config.levelOffsetY = parseInt(p.get('levely'), 10) || 0;
    if (p.has('levelbg')) config.levelBackground = p.get('levelbg') === '1';
    if (p.has('levelbgc')) config.levelBackgroundColor = '#' + p.get('levelbgc');
    if (p.has('levelradius')) config.levelBorderRadius = parseInt(p.get('levelradius'), 10) || 0;
    if (p.has('levelpad')) config.levelPadding = parseInt(p.get('levelpad'), 10) || 0;
    if (p.has('hp')) config.showHP = p.get('hp') === '1';
    if (p.has('hpdisplay') && ['bar', 'current', 'fraction', 'bar-current', 'bar-fraction'].includes(p.get('hpdisplay'))) config.hpDisplay = p.get('hpdisplay');
    if (p.has('hppos') && ['above', 'below'].includes(p.get('hppos'))) config.hpPosition = p.get('hppos');
    if (p.has('hpw')) config.hpBarWidth = parseInt(p.get('hpw'), 10) || 64;
    if (p.has('hph')) config.hpBarHeight = parseInt(p.get('hph'), 10) || 5;
    if (p.has('hpfs')) config.hpFontSize = parseInt(p.get('hpfs'), 10) || 10;
    if (p.has('hphigh')) config.hpHighColor = '#' + p.get('hphigh');
    if (p.has('hpmed')) config.hpMediumColor = '#' + p.get('hpmed');
    if (p.has('hplow')) config.hpLowColor = '#' + p.get('hplow');
    if (p.has('hpbg')) config.hpBackgroundColor = '#' + p.get('hpbg');
    if (p.has('hptxt')) config.hpTextColor = '#' + p.get('hptxt');
    if (p.has('hpr')) config.hpBorderRadius = parseInt(p.get('hpr'), 10) || 0;
    if (p.has('shiny')) config.showShiny = p.get('shiny') === '1';
    if (p.has('item')) config.showHeldItem = p.get('item') === '1';
    if (p.has('itempos')) {
        const pos = p.get('itempos');
        if (['top-left', 'top-right', 'left', 'right', 'bottom-left', 'bottom-right'].includes(pos)) config.heldItemPosition = pos;
    }
    if (p.has('itemsize')) config.heldItemSize = parseInt(p.get('itemsize'), 10) || 22;
    if (p.has('itemx')) config.heldItemOffsetX = parseInt(p.get('itemx'), 10) || 0;
    if (p.has('itemy')) config.heldItemOffsetY = parseInt(p.get('itemy'), 10) || 0;
    if (p.has('itembg')) config.heldItemBackground = p.get('itembg') === '1';
    if (p.has('itembgc')) config.heldItemBackgroundColor = '#' + p.get('itembgc');
    if (p.has('itemradius')) config.heldItemBorderRadius = parseInt(p.get('itemradius'), 10) || 0;
    if (p.has('itempad')) config.heldItemPadding = parseInt(p.get('itempad'), 10) || 0;
    if (p.has('maxlives')) {
        const max = parseInt(p.get('maxlives'), 10);
        if (Number.isFinite(max) && max > 0) config.maxLives = max;
    }
    if (p.has('ldisplay')) {
        const d = p.get('ldisplay');
        if (d === 'hearts' || d === 'number') config.livesDisplay = d;
    }
    if (p.has('lshowmax')) config.livesShowMax = p.get('lshowmax') === '1';
    if (p.has('lfont')) config.livesFontFamily = p.get('lfont');
    if (p.has('lfontsize')) {
        const n = parseInt(p.get('lfontsize'), 10);
        if (Number.isFinite(n) && n > 0) config.livesFontSize = n;
    }
    if (p.has('lcolor')) config.livesColor = '#' + p.get('lcolor');
    if (p.has('lmaxcolor')) config.livesMaxColor = '#' + p.get('lmaxcolor');
    if (p.has('lheartsize')) {
        const n = parseInt(p.get('lheartsize'), 10);
        if (Number.isFinite(n) && n > 0) config.livesHeartSize = n;
    }
    if (p.has('lheartgap')) {
        const n = parseInt(p.get('lheartgap'), 10);
        if (Number.isFinite(n) && n >= 0) config.livesHeartGap = n;
    }
    if (p.has('lheartc')) config.livesHeartColor = '#' + p.get('lheartc');
    if (p.has('lheartlost')) config.livesHeartLostColor = '#' + p.get('lheartlost');
    if (p.has('lheartstyle')) {
        const style = p.get('lheartstyle');
        const allowed = ['classic', 'soft', 'slim', 'wide', 'pixel', 'bubble', 'outline'];
        if (allowed.includes(style)) config.livesHeartStyle = style;
    }
    if (p.has('lheartlayout')) {
        const layout = p.get('lheartlayout');
        if (['row', 'column', 'grid'].includes(layout)) config.livesHeartLayout = layout;
    }
    if (p.has('lheartcols')) {
        const cols = parseInt(p.get('lheartcols'), 10);
        if ([5, 7, 10].includes(cols)) config.livesHeartColumns = cols;
    }
    if (p.has('lheartstroke')) config.livesHeartStroke = p.get('lheartstroke') === '1';
    if (p.has('lheartstrokec')) config.livesHeartStrokeColor = '#' + p.get('lheartstrokec');
    if (p.has('lheartstrokew')) {
        const n = parseFloat(p.get('lheartstrokew'));
        if (Number.isFinite(n) && n > 0) config.livesHeartStrokeWidth = n;
    }
    if (p.has('lheartshadow')) config.livesHeartShadow = p.get('lheartshadow') === '1';
    if (p.has('lheartsc')) config.livesHeartShadowColor = '#' + p.get('lheartsc');
    if (p.has('lheartsx')) config.livesHeartShadowX = parseInt(p.get('lheartsx'), 10) || 0;
    if (p.has('lheartsy')) config.livesHeartShadowY = parseInt(p.get('lheartsy'), 10) || 0;
    if (p.has('lheartsb')) {
        const n = parseInt(p.get('lheartsb'), 10);
        if (Number.isFinite(n) && n >= 0) config.livesHeartShadowBlur = n;
    }
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
    if (p.has('tcgartt')) {
        const n = parseInt(p.get('tcgartt'), 10);
        if (Number.isFinite(n) && n >= 0) config.tcgArtCropTop = n;
    }
    if (p.has('tcgartl')) {
        const n = parseInt(p.get('tcgartl'), 10);
        if (Number.isFinite(n) && n >= 0) config.tcgArtCropLeft = n;
    }
    if (p.has('tcgartb')) {
        const n = parseInt(p.get('tcgartb'), 10);
        if (Number.isFinite(n) && n >= 0) config.tcgArtCropBottom = n;
    }
    if (p.has('tcgartr')) {
        const n = parseInt(p.get('tcgartr'), 10);
        if (Number.isFinite(n) && n >= 0) config.tcgArtCropRight = n;
    }
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
            if (typeof config.showHeldItem !== 'boolean') config.showHeldItem = false;
            if (!['short', 'long', 'number'].includes(config.levelFormat)) config.levelFormat = 'short';
            if (!['top-left', 'top-right', 'left', 'right', 'bottom-left', 'bottom-right'].includes(config.heldItemPosition)) config.heldItemPosition = 'bottom-right';
            if (!['bar', 'current', 'fraction', 'bar-current', 'bar-fraction'].includes(config.hpDisplay)) config.hpDisplay = 'bar';
            if (!['above', 'below'].includes(config.hpPosition)) config.hpPosition = 'below';
            if (typeof config.showLives !== 'boolean') config.showLives = false;
            if (typeof config.splitSlots !== 'boolean') config.splitSlots = false;
            if (!Number.isFinite(config.maxLives) || config.maxLives < 1) config.maxLives = 20;
            if (config.livesDisplay !== 'hearts' && config.livesDisplay !== 'number') config.livesDisplay = 'number';
            if (typeof config.livesShowMax !== 'boolean') config.livesShowMax = true;
            if (!config.livesFontFamily) config.livesFontFamily = 'Fredoka';
            if (!Number.isFinite(config.livesFontSize) || config.livesFontSize < 1) config.livesFontSize = 28;
            if (!config.livesColor) config.livesColor = '#f8fafc';
            if (!config.livesMaxColor) config.livesMaxColor = '#94a3b8';
            if (!Number.isFinite(config.livesHeartSize) || config.livesHeartSize < 1) config.livesHeartSize = 22;
            if (!Number.isFinite(config.livesHeartGap) || config.livesHeartGap < 0) config.livesHeartGap = 4;
            if (!config.livesHeartColor) config.livesHeartColor = '#ef4444';
            if (!config.livesHeartLostColor) config.livesHeartLostColor = '#475569';
            const heartStyles = ['classic', 'soft', 'slim', 'wide', 'pixel', 'bubble', 'outline'];
            if (!heartStyles.includes(config.livesHeartStyle)) config.livesHeartStyle = 'classic';
            if (!['row', 'column', 'grid'].includes(config.livesHeartLayout)) config.livesHeartLayout = 'row';
            if (![5, 7, 10].includes(config.livesHeartColumns)) config.livesHeartColumns = 5;
            if (typeof config.livesHeartStroke !== 'boolean') config.livesHeartStroke = false;
            if (!config.livesHeartStrokeColor) config.livesHeartStrokeColor = '#000000';
            if (!Number.isFinite(config.livesHeartStrokeWidth) || config.livesHeartStrokeWidth <= 0) config.livesHeartStrokeWidth = 1.5;
            if (typeof config.livesHeartShadow !== 'boolean') config.livesHeartShadow = false;
            if (!config.livesHeartShadowColor) config.livesHeartShadowColor = '#000000';
            if (!Number.isFinite(config.livesHeartShadowX)) config.livesHeartShadowX = 1;
            if (!Number.isFinite(config.livesHeartShadowY)) config.livesHeartShadowY = 1;
            if (!Number.isFinite(config.livesHeartShadowBlur) || config.livesHeartShadowBlur < 0) config.livesHeartShadowBlur = 2;
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
    // Solo reserva aire visual para que contorno/sombra no se recorten.
    // El CSS usa margen negativo igual a este pad, así el layout
    // (distancia entre sprites / nombre) sigue siendo --sprite-size.
    let pad = 4;
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

/** Recorte Artwork TCG en píxeles sobre carta 600×825. */
function getTcgArtCrop() {
    let t = Math.max(0, Math.round(Number(config.tcgArtCropTop) || 0));
    let l = Math.max(0, Math.round(Number(config.tcgArtCropLeft) || 0));
    let b = Math.max(0, Math.round(Number(config.tcgArtCropBottom) || 0));
    let r = Math.max(0, Math.round(Number(config.tcgArtCropRight) || 0));
    if (l >= TCGDEX_CARD_W - 1) l = TCGDEX_CARD_W - 2;
    if (r >= TCGDEX_CARD_W - l) r = Math.max(0, TCGDEX_CARD_W - l - 1);
    if (t >= TCGDEX_CARD_H - 1) t = TCGDEX_CARD_H - 2;
    if (b >= TCGDEX_CARD_H - t) b = Math.max(0, TCGDEX_CARD_H - t - 1);
    const w = TCGDEX_CARD_W - l - r;
    const h = TCGDEX_CARD_H - t - b;
    return { t, l, b, r, w, h, cx: l + w / 2 };
}

function appendTcgArtCropParams(params) {
    const crop = getTcgArtCrop();
    params.set('tcgartt', crop.t);
    params.set('tcgartl', crop.l);
    params.set('tcgartb', crop.b);
    params.set('tcgartr', crop.r);
}

function applyTcgArtCropVars(root = document.documentElement) {
    const crop = getTcgArtCrop();
    root.style.setProperty('--tcg-card-w', String(TCGDEX_CARD_W));
    root.style.setProperty('--tcg-card-h', String(TCGDEX_CARD_H));
    root.style.setProperty('--tcg-crop-t', String(crop.t));
    root.style.setProperty('--tcg-crop-l', String(crop.l));
    root.style.setProperty('--tcg-crop-b', String(crop.b));
    root.style.setProperty('--tcg-crop-r', String(crop.r));
    root.style.setProperty('--tcg-art-w', String(crop.w));
    root.style.setProperty('--tcg-art-h', String(crop.h));
    root.style.setProperty('--tcg-art-cx', String(crop.cx));
}

function updateTcgArtCropVisibility() {
    const panel = document.getElementById('tcgArtCropOptions');
    if (!panel) return;
    panel.hidden = !(config.spriteType === 'tcg-artwork' || config.cemeterySpriteType === 'tcg-artwork');
}

function applyConfig() {
    const root = document.documentElement;
    const container = document.getElementById('team');
    const teamWrapper = document.getElementById('teamWrapper');
    const badgesWrapper = document.getElementById('badgesWrapper');
    const cemeteryWrapper = document.getElementById('cemeteryWrapper');
    const livesWrapper = document.getElementById('livesWrapper');
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
    root.style.setProperty('--level-font-family', `'${config.levelFontFamily}', sans-serif`);
    root.style.setProperty('--level-font-size', (config.levelFontSize || 10) + 'px');
    root.style.setProperty('--level-offset-x', (config.levelOffsetX || 0) + 'px');
    root.style.setProperty('--level-offset-y', (config.levelOffsetY || 0) + 'px');
    root.style.setProperty('--level-background', config.levelBackgroundColor || '#111827');
    root.style.setProperty('--level-radius', (config.levelBorderRadius || 0) + 'px');
    root.style.setProperty('--level-padding', (config.levelPadding || 0) + 'px');
    root.style.setProperty('--name-offset-y', (config.nameOffsetY || 0) + 'px');
    root.style.setProperty('--held-item-size', (config.heldItemSize || 22) + 'px');
    root.style.setProperty('--held-item-offset-x', (config.heldItemOffsetX || 0) + 'px');
    root.style.setProperty('--held-item-offset-y', (config.heldItemOffsetY || 0) + 'px');
    root.style.setProperty('--held-item-background', config.heldItemBackgroundColor || '#111827');
    root.style.setProperty('--held-item-radius', (config.heldItemBorderRadius || 0) + 'px');
    root.style.setProperty('--held-item-padding', (config.heldItemPadding || 0) + 'px');
    root.style.setProperty('--hp-width', (config.hpBarWidth || 64) + 'px');
    root.style.setProperty('--hp-height', (config.hpBarHeight || 5) + 'px');
    root.style.setProperty('--hp-font-size', (config.hpFontSize || 10) + 'px');
    root.style.setProperty('--hp-high-color', config.hpHighColor || '#22c55e');
    root.style.setProperty('--hp-medium-color', config.hpMediumColor || '#eab308');
    root.style.setProperty('--hp-low-color', config.hpLowColor || '#ef4444');
    root.style.setProperty('--hp-background-color', config.hpBackgroundColor || '#1f2937');
    root.style.setProperty('--hp-text-color', config.hpTextColor || '#f8fafc');
    root.style.setProperty('--hp-radius', (config.hpBorderRadius || 0) + 'px');
    root.style.setProperty('--stroke-color', config.strokeColor);
    root.style.setProperty('--stroke-width', config.strokeWidth + 'px');
    root.style.setProperty('--text-fx-shadow', buildTextFxShadow());
    root.style.setProperty('--lives-font-family', `'${config.livesFontFamily}', sans-serif`);
    root.style.setProperty('--lives-font-size', (config.livesFontSize || 28) + 'px');
    root.style.setProperty('--lives-color', config.livesColor || '#f8fafc');
    root.style.setProperty('--lives-max-color', config.livesMaxColor || '#94a3b8');
    root.style.setProperty('--lives-heart-size', (config.livesHeartSize || 22) + 'px');
    root.style.setProperty('--lives-heart-gap', (config.livesHeartGap || 0) + 'px');
    root.style.setProperty('--lives-heart-color', config.livesHeartColor || '#ef4444');
    root.style.setProperty('--lives-heart-lost-color', config.livesHeartLostColor || '#475569');
    root.style.setProperty('--lives-heart-cols', String(config.livesHeartColumns || 5));
    root.style.setProperty('--lives-heart-stroke-color', config.livesHeartStrokeColor || '#000000');
    root.style.setProperty('--lives-heart-stroke-width', (config.livesHeartStrokeWidth || 1.5) + 'px');
    root.style.setProperty('--lives-heart-shadow', buildLivesHeartShadow());
    applyTcgArtCropVars(root);
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
    if (livesWrapper) {
        livesWrapper.className = 'lives-wrapper';
        if (config.background !== 'transparent') livesWrapper.classList.add('bg-' + config.background);
        if (isLivesOnlyMode()) livesWrapper.hidden = false;
    }
    
    document.body.classList.toggle('obs-badges-only', isBadgesOnlyMode());
    document.body.classList.toggle('obs-death-only', isDeathOnlyMode());
    document.body.classList.toggle('obs-cemetery-only', isCemeteryOnlyMode());
    document.body.classList.toggle('obs-lives-only', isLivesOnlyMode());
    document.body.classList.toggle('obs-slot-only', isSlotOnlyMode());
    
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
        if (el('showHeldItem')) el('showHeldItem').checked = config.showHeldItem;
        if (el('deathAnimation')) el('deathAnimation').checked = config.deathAnimation;
        if (el('showBadgesPreview')) el('showBadgesPreview').checked = config.showBadges;
        if (el('showCemeteryPreview')) el('showCemeteryPreview').checked = config.showCemetery;
        if (el('showLivesPreview')) el('showLivesPreview').checked = config.showLives;
        if (el('splitSlots')) el('splitSlots').checked = config.splitSlots;
        if (el('maxLives')) el('maxLives').value = config.maxLives;
        if (el('maxLivesInput')) el('maxLivesInput').value = config.maxLives;
        document.querySelectorAll('input[name="livesDisplay"]').forEach(r => {
            r.checked = r.value === config.livesDisplay;
        });
        if (el('livesShowMax')) el('livesShowMax').checked = config.livesShowMax;
        if (el('livesFontFamily')) el('livesFontFamily').value = config.livesFontFamily;
        if (el('livesFontSize')) el('livesFontSize').value = config.livesFontSize;
        if (el('livesFontSizeInput')) el('livesFontSizeInput').value = config.livesFontSize;
        if (el('livesColor')) el('livesColor').value = config.livesColor;
        if (el('livesMaxColor')) el('livesMaxColor').value = config.livesMaxColor;
        if (el('livesHeartSize')) el('livesHeartSize').value = config.livesHeartSize;
        if (el('livesHeartSizeInput')) el('livesHeartSizeInput').value = config.livesHeartSize;
        if (el('livesHeartGap')) el('livesHeartGap').value = config.livesHeartGap;
        if (el('livesHeartGapInput')) el('livesHeartGapInput').value = config.livesHeartGap;
        if (el('livesHeartColor')) el('livesHeartColor').value = config.livesHeartColor;
        if (el('livesHeartLostColor')) el('livesHeartLostColor').value = config.livesHeartLostColor;
        if (el('livesHeartStyle')) el('livesHeartStyle').value = config.livesHeartStyle;
        document.querySelectorAll('input[name="livesHeartLayout"]').forEach(r => {
            r.checked = r.value === config.livesHeartLayout;
        });
        document.querySelectorAll('input[name="livesHeartColumns"]').forEach(r => {
            r.checked = String(config.livesHeartColumns) === r.value;
        });
        if (el('livesHeartStroke')) el('livesHeartStroke').checked = config.livesHeartStroke;
        if (el('livesHeartStrokeColor')) el('livesHeartStrokeColor').value = config.livesHeartStrokeColor;
        if (el('livesHeartStrokeWidth')) el('livesHeartStrokeWidth').value = config.livesHeartStrokeWidth;
        if (el('livesHeartStrokeWidthInput')) el('livesHeartStrokeWidthInput').value = config.livesHeartStrokeWidth;
        if (el('livesHeartShadow')) el('livesHeartShadow').checked = config.livesHeartShadow;
        if (el('livesHeartShadowColor')) el('livesHeartShadowColor').value = config.livesHeartShadowColor;
        if (el('livesHeartShadowX')) el('livesHeartShadowX').value = config.livesHeartShadowX;
        if (el('livesHeartShadowXInput')) el('livesHeartShadowXInput').value = config.livesHeartShadowX;
        if (el('livesHeartShadowY')) el('livesHeartShadowY').value = config.livesHeartShadowY;
        if (el('livesHeartShadowYInput')) el('livesHeartShadowYInput').value = config.livesHeartShadowY;
        if (el('livesHeartShadowBlur')) el('livesHeartShadowBlur').value = config.livesHeartShadowBlur;
        if (el('livesHeartShadowBlurInput')) el('livesHeartShadowBlurInput').value = config.livesHeartShadowBlur;
        toggleOptions('livesHeartStrokeOptions', config.livesHeartStroke || config.livesHeartStyle === 'outline');
        toggleOptions('livesHeartShadowOptions', config.livesHeartShadow);
        updateLivesOptionsVisibility();
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
        for (const key of ['tcgArtCropTop', 'tcgArtCropLeft', 'tcgArtCropBottom', 'tcgArtCropRight']) {
            if (el(key)) el(key).value = config[key];
            if (el(key + 'Input')) el(key + 'Input').value = config[key];
        }
        updateTcgArtCropVisibility();
        if (el('fontFamily')) el('fontFamily').value = config.fontFamily;
        if (el('fontSize')) el('fontSize').value = config.fontSize;
        if (el('fontSizeInput')) el('fontSizeInput').value = config.fontSize;
        if (el('textUppercase')) el('textUppercase').checked = config.textUppercase;
        if (el('colorName')) el('colorName').value = config.colorName;
        if (el('colorNickname')) el('colorNickname').value = config.colorNickname;
        if (el('colorLevel')) el('colorLevel').value = config.colorLevel;
        if (el('levelFontFamily')) el('levelFontFamily').value = config.levelFontFamily;
        if (el('levelFontSize')) el('levelFontSize').value = config.levelFontSize;
        if (el('levelFontSizeInput')) el('levelFontSizeInput').value = config.levelFontSize;
        if (el('levelFormat')) el('levelFormat').value = config.levelFormat;
        if (el('levelOffsetX')) el('levelOffsetX').value = config.levelOffsetX;
        if (el('levelOffsetXInput')) el('levelOffsetXInput').value = config.levelOffsetX;
        if (el('levelOffsetY')) el('levelOffsetY').value = config.levelOffsetY;
        if (el('levelOffsetYInput')) el('levelOffsetYInput').value = config.levelOffsetY;
        if (el('levelBackground')) el('levelBackground').checked = config.levelBackground;
        if (el('levelBackgroundColor')) el('levelBackgroundColor').value = config.levelBackgroundColor;
        if (el('levelBorderRadius')) el('levelBorderRadius').value = config.levelBorderRadius;
        if (el('levelBorderRadiusInput')) el('levelBorderRadiusInput').value = config.levelBorderRadius;
        if (el('levelPadding')) el('levelPadding').value = config.levelPadding;
        if (el('levelPaddingInput')) el('levelPaddingInput').value = config.levelPadding;
        if (el('heldItemPosition')) el('heldItemPosition').value = config.heldItemPosition;
        if (el('heldItemSize')) el('heldItemSize').value = config.heldItemSize;
        if (el('heldItemSizeInput')) el('heldItemSizeInput').value = config.heldItemSize;
        if (el('heldItemOffsetX')) el('heldItemOffsetX').value = config.heldItemOffsetX;
        if (el('heldItemOffsetXInput')) el('heldItemOffsetXInput').value = config.heldItemOffsetX;
        if (el('heldItemOffsetY')) el('heldItemOffsetY').value = config.heldItemOffsetY;
        if (el('heldItemOffsetYInput')) el('heldItemOffsetYInput').value = config.heldItemOffsetY;
        if (el('heldItemBackground')) el('heldItemBackground').checked = config.heldItemBackground;
        if (el('heldItemBackgroundColor')) el('heldItemBackgroundColor').value = config.heldItemBackgroundColor;
        if (el('heldItemBorderRadius')) el('heldItemBorderRadius').value = config.heldItemBorderRadius;
        if (el('heldItemBorderRadiusInput')) el('heldItemBorderRadiusInput').value = config.heldItemBorderRadius;
        if (el('heldItemPadding')) el('heldItemPadding').value = config.heldItemPadding;
        if (el('heldItemPaddingInput')) el('heldItemPaddingInput').value = config.heldItemPadding;
        if (el('hpDisplay')) el('hpDisplay').value = config.hpDisplay;
        if (el('hpPosition')) el('hpPosition').value = config.hpPosition;
        for (const key of ['hpBarWidth', 'hpBarHeight', 'hpFontSize', 'hpBorderRadius']) {
            if (el(key)) el(key).value = config[key];
            if (el(key + 'Input')) el(key + 'Input').value = config[key];
        }
        for (const key of ['hpHighColor', 'hpMediumColor', 'hpLowColor', 'hpBackgroundColor', 'hpTextColor']) {
            if (el(key)) el(key).value = config[key];
        }
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
        toggleOptions('levelBackgroundOptions', config.levelBackground);
        toggleOptions('heldItemBackgroundOptions', config.heldItemBackground);
        updateDeleteFontButton();
        updateOBSUrlField();
    }
    
    if (currentTeam) {
        if (shouldShowTeam()) renderTeam(currentTeam);
        renderBadges(currentTeam);
        renderCemetery(currentTeam);
        renderLives(currentTeam);
    }
}

function toggleOptions(id, visible) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('visible', !!visible);
}

function updateLivesOptionsVisibility() {
    const isHearts = config.livesDisplay === 'hearts';
    const numberOpts = document.getElementById('livesNumberOptions');
    const heartOpts = document.getElementById('livesHeartOptions');
    const gridOpts = document.getElementById('livesHeartGridOptions');
    const hint = document.getElementById('livesShowMaxHint');
    if (numberOpts) numberOpts.hidden = isHearts;
    if (heartOpts) heartOpts.hidden = !isHearts;
    if (gridOpts) gridOpts.hidden = !(isHearts && config.livesHeartLayout === 'grid');
    if (hint) {
        hint.textContent = isHearts
            ? 'Corazones vacíos = vidas perdidas'
            : 'Muestra 10/20 en lugar de solo 10';
    }
}

function buildLivesHeartShadow() {
    if (!config.livesHeartShadow) return 'none';
    return `${config.livesHeartShadowX || 0}px ${config.livesHeartShadowY || 0}px ${config.livesHeartShadowBlur || 0}px ${config.livesHeartShadowColor || '#000'}`;
}

const CONFIG_TAB_STORAGE_KEY = 'pokelayout-active-config-tab';
const CONFIG_TABS = ['general', 'appearance', 'nuzlocke', 'obs'];

function activateConfigTab(tabName, { focus = false, persist = true } = {}) {
    const activeTab = CONFIG_TABS.includes(tabName) ? tabName : CONFIG_TABS[0];
    const tabs = [...document.querySelectorAll('[data-config-tab]')];
    const sections = document.querySelectorAll('[data-config-group]');
    const description = document.getElementById('configTabDescription');
    const panel = document.getElementById('configBody');

    tabs.forEach(tab => {
        const isActive = tab.dataset.configTab === activeTab;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', String(isActive));
        tab.tabIndex = isActive ? 0 : -1;
        if (isActive) {
            if (description) description.textContent = tab.dataset.description || '';
            if (panel) panel.setAttribute('aria-labelledby', tab.id);
            if (focus) tab.focus();
        }
    });

    sections.forEach(section => {
        section.hidden = section.dataset.configGroup !== activeTab;
    });

    if (persist) {
        try {
            localStorage.setItem(CONFIG_TAB_STORAGE_KEY, activeTab);
        } catch {
            // La navegación sigue funcionando aunque el almacenamiento esté bloqueado.
        }
    }
}

function setupConfigTabs() {
    const tabs = [...document.querySelectorAll('[data-config-tab]')];
    if (!tabs.length) return;

    let savedTab = CONFIG_TABS[0];
    try {
        savedTab = localStorage.getItem(CONFIG_TAB_STORAGE_KEY) || savedTab;
    } catch {
        // Mantener la pestaña inicial si localStorage no está disponible.
    }
    activateConfigTab(savedTab, { persist: false });

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => activateConfigTab(tab.dataset.configTab));
        tab.addEventListener('keydown', event => {
            let nextIndex = null;
            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % tabs.length;
            if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + tabs.length) % tabs.length;
            if (event.key === 'Home') nextIndex = 0;
            if (event.key === 'End') nextIndex = tabs.length - 1;
            if (nextIndex === null) return;
            event.preventDefault();
            activateConfigTab(tabs[nextIndex].dataset.configTab, { focus: true });
        });
    });
}

function setupConfigListeners() {
    setupConfigTabs();

    [
        ['levelFontFamily', 'levelFontFamily'],
        ['levelFormat', 'levelFormat'],
        ['heldItemPosition', 'heldItemPosition'],
        ['hpDisplay', 'hpDisplay'],
        ['hpPosition', 'hpPosition']
    ].forEach(([id, key]) => {
        const control = document.getElementById(id);
        if (control) control.addEventListener('change', e => {
            config[key] = e.target.value;
            saveConfig();
            applyConfig();
        });
    });

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
    
    ['showNickname', 'showLevel', 'showHP', 'showShiny', 'showHeldItem'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', e => {
            config[id] = e.target.checked;
            saveConfig();
            applyConfig();
        });
    });

    bindCheckbox('deathAnimation', 'deathAnimation');
    bindCheckbox('splitSlots', 'splitSlots');
    bindCheckbox('levelBackground', 'levelBackground');
    bindCheckbox('heldItemBackground', 'heldItemBackground');
    bindCheckbox('livesShowMax', 'livesShowMax');
    setupRangeInput('maxLives', 'maxLivesInput', 'maxLives');
    setupRangeInput('livesFontSize', 'livesFontSizeInput', 'livesFontSize');
    setupRangeInput('livesHeartSize', 'livesHeartSizeInput', 'livesHeartSize');
    setupRangeInput('livesHeartGap', 'livesHeartGapInput', 'livesHeartGap');
    setupRangeInput('livesHeartStrokeWidth', 'livesHeartStrokeWidthInput', 'livesHeartStrokeWidth');
    setupRangeInput('livesHeartShadowX', 'livesHeartShadowXInput', 'livesHeartShadowX');
    setupRangeInput('livesHeartShadowY', 'livesHeartShadowYInput', 'livesHeartShadowY');
    setupRangeInput('livesHeartShadowBlur', 'livesHeartShadowBlurInput', 'livesHeartShadowBlur');
    bindColor('livesColor', 'livesColor');
    bindColor('livesMaxColor', 'livesMaxColor');
    bindColor('livesHeartColor', 'livesHeartColor');
    bindColor('livesHeartLostColor', 'livesHeartLostColor');
    bindColor('livesHeartStrokeColor', 'livesHeartStrokeColor');
    bindColor('livesHeartShadowColor', 'livesHeartShadowColor');

    const livesHeartStyle = document.getElementById('livesHeartStyle');
    if (livesHeartStyle) {
        livesHeartStyle.addEventListener('change', e => {
            config.livesHeartStyle = e.target.value;
            saveConfig();
            applyConfig();
        });
    }

    document.querySelectorAll('input[name="livesHeartLayout"]').forEach(r => {
        r.addEventListener('change', e => {
            if (!e.target.checked) return;
            const layout = e.target.value;
            if (['row', 'column', 'grid'].includes(layout)) {
                config.livesHeartLayout = layout;
                saveConfig();
                applyConfig();
            }
        });
    });

    document.querySelectorAll('input[name="livesHeartColumns"]').forEach(r => {
        r.addEventListener('change', e => {
            if (!e.target.checked) return;
            const cols = parseInt(e.target.value, 10);
            if ([5, 7, 10].includes(cols)) {
                config.livesHeartColumns = cols;
                saveConfig();
                applyConfig();
            }
        });
    });

    const livesHeartStroke = document.getElementById('livesHeartStroke');
    if (livesHeartStroke) {
        livesHeartStroke.addEventListener('change', e => {
            config.livesHeartStroke = e.target.checked;
            saveConfig();
            applyConfig();
        });
    }

    const livesHeartShadow = document.getElementById('livesHeartShadow');
    if (livesHeartShadow) {
        livesHeartShadow.addEventListener('change', e => {
            config.livesHeartShadow = e.target.checked;
            saveConfig();
            applyConfig();
        });
    }

    document.querySelectorAll('input[name="livesDisplay"]').forEach(r => {
        r.addEventListener('change', e => {
            if (!e.target.checked) return;
            config.livesDisplay = e.target.value === 'hearts' ? 'hearts' : 'number';
            saveConfig();
            applyConfig();
        });
    });

    const livesFontFamily = document.getElementById('livesFontFamily');
    if (livesFontFamily) {
        livesFontFamily.addEventListener('change', e => {
            config.livesFontFamily = e.target.value;
            saveConfig();
            applyConfig();
        });
    }

    const showLivesPreview = document.getElementById('showLivesPreview');
    if (showLivesPreview) {
        showLivesPreview.addEventListener('change', e => {
            config.showLives = e.target.checked;
            saveConfig();
            applyConfig();
        });
    }

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
            updateTcgArtCropVisibility();
            const cemeteryType = getSpriteTypeEntry(config.cemeterySpriteType);
            if (cemeteryType.source === 'pmd' && currentTeam?.cemetery?.length) {
                await withSpriteTypeAsync(config.cemeterySpriteType, async () => {
                    await resolvePmdPortraits(currentTeam.cemetery);
                });
                renderCemetery(currentTeam);
            } else if (cemeteryType.source === 'tcgdex' && currentTeam?.cemetery?.length) {
                await withSpriteTypeAsync(config.cemeterySpriteType, async () => {
                    await resolveTcgdexCards(currentTeam.cemetery);
                });
                renderCemetery(currentTeam);
            } else if (isCustomDexSpritePack(config.cemeterySpriteType) && currentTeam?.cemetery?.length) {
                await ensureCustomDexIndexForType(config.cemeterySpriteType);
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
    setupRangeInput('levelFontSize', 'levelFontSizeInput', 'levelFontSize');
    setupRangeInput('levelOffsetX', 'levelOffsetXInput', 'levelOffsetX');
    setupRangeInput('levelOffsetY', 'levelOffsetYInput', 'levelOffsetY');
    setupRangeInput('levelBorderRadius', 'levelBorderRadiusInput', 'levelBorderRadius');
    setupRangeInput('levelPadding', 'levelPaddingInput', 'levelPadding');
    setupRangeInput('heldItemSize', 'heldItemSizeInput', 'heldItemSize');
    setupRangeInput('heldItemOffsetX', 'heldItemOffsetXInput', 'heldItemOffsetX');
    setupRangeInput('heldItemOffsetY', 'heldItemOffsetYInput', 'heldItemOffsetY');
    setupRangeInput('heldItemBorderRadius', 'heldItemBorderRadiusInput', 'heldItemBorderRadius');
    setupRangeInput('heldItemPadding', 'heldItemPaddingInput', 'heldItemPadding');
    setupRangeInput('hpBarWidth', 'hpBarWidthInput', 'hpBarWidth');
    setupRangeInput('hpBarHeight', 'hpBarHeightInput', 'hpBarHeight');
    setupRangeInput('hpFontSize', 'hpFontSizeInput', 'hpFontSize');
    setupRangeInput('hpBorderRadius', 'hpBorderRadiusInput', 'hpBorderRadius');
    bindColor('heldItemBackgroundColor', 'heldItemBackgroundColor');
    bindColor('levelBackgroundColor', 'levelBackgroundColor');
    bindColor('hpHighColor', 'hpHighColor');
    bindColor('hpMediumColor', 'hpMediumColor');
    bindColor('hpLowColor', 'hpLowColor');
    bindColor('hpBackgroundColor', 'hpBackgroundColor');
    bindColor('hpTextColor', 'hpTextColor');
    
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
        updateTcgArtCropVisibility();
        const selectedType = getSpriteTypeEntry(config.spriteType);
        if (selectedType.source === 'pmd' && currentTeam?.team?.length) {
            await resolvePmdPortraits(currentTeam.team);
            renderTeam(currentTeam);
        } else if (selectedType.source === 'tcgdex' && currentTeam?.team?.length) {
            await resolveTcgdexCards(currentTeam.team);
            renderTeam(currentTeam);
        } else if (isCustomSpriteType(config.spriteType) && currentTeam?.team?.length) {
            await ensureCustomDexIndexForType(config.spriteType);
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
    setupRangeInput('tcgArtCropTop', 'tcgArtCropTopInput', 'tcgArtCropTop');
    setupRangeInput('tcgArtCropLeft', 'tcgArtCropLeftInput', 'tcgArtCropLeft');
    setupRangeInput('tcgArtCropBottom', 'tcgArtCropBottomInput', 'tcgArtCropBottom');
    setupRangeInput('tcgArtCropRight', 'tcgArtCropRightInput', 'tcgArtCropRight');
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
            const panel = document.getElementById('configPanel');
            body.classList.toggle('collapsed');
            const collapsed = body.classList.contains('collapsed');
            panel?.classList.toggle('is-collapsed', collapsed);
            toggleConfig.textContent = collapsed ? '+' : '−';
            toggleConfig.title = collapsed ? 'Expandir panel' : 'Contraer panel';
            toggleConfig.setAttribute('aria-label', toggleConfig.title);
            toggleConfig.setAttribute('aria-expanded', String(!collapsed));
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

    const copyLivesUrlBtn = document.getElementById('copyLivesUrlBtn');
    if (copyLivesUrlBtn) {
        copyLivesUrlBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(document.getElementById('obsLivesUrl').value).then(() => {
                copyLivesUrlBtn.textContent = '✓ Copiado';
                copyLivesUrlBtn.classList.add('copied');
                setTimeout(() => { copyLivesUrlBtn.textContent = '📋 Copiar'; copyLivesUrlBtn.classList.remove('copied'); }, 2000);
            });
        });
    }

    const slotUrls = document.getElementById('obsSlotUrls');
    if (slotUrls) {
        slotUrls.addEventListener('click', e => {
            const btn = e.target.closest('[data-copy-slot]');
            if (!btn) return;
            const slot = btn.getAttribute('data-copy-slot');
            const input = document.getElementById('obsSlotUrl' + slot);
            if (!input) return;
            navigator.clipboard.writeText(input.value).then(() => {
                btn.textContent = '✓ Copiado';
                btn.classList.add('copied');
                setTimeout(() => { btn.textContent = '📋 Copiar'; btn.classList.remove('copied'); }, 2000);
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
    const groups = [
        { groupId: 'customFontsGroup', selectId: 'fontFamily', configKey: 'fontFamily' },
        { groupId: 'customFontsGroupLevel', selectId: 'levelFontFamily', configKey: 'levelFontFamily' },
        { groupId: 'customFontsGroupLives', selectId: 'livesFontFamily', configKey: 'livesFontFamily' }
    ];

    for (const { groupId, selectId, configKey } of groups) {
        const group = document.getElementById(groupId);
        const select = document.getElementById(selectId);
        if (!group || !select) continue;

        group.innerHTML = '';
        if (!customFonts.length) {
            group.hidden = true;
        } else {
            group.hidden = false;
            for (const font of customFonts) {
                const opt = document.createElement('option');
                opt.value = font.family;
                opt.textContent = font.family;
                group.appendChild(opt);
            }
        }

        const exists = [...select.options].some(o => o.value === config[configKey]);
        if (exists) select.value = config[configKey];
    }
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

/** Variantes de nombre: ZORUA, ZORUA_1 (forma del save); luego clave dex oficial si el custom falla */
function buildCustomSpriteVariants(pokemon) {
    const form = pokemon.form || 0;
    const bases = [];
    const primary = getCustomSpeciesKey(pokemon);
    if (primary) bases.push(primary);

    // Essentials fangame: SpeciesKey = HALCOMBATE; DexSpeciesKey = KORAIDON (fallback Front/)
    const dexKey = (pokemon.dexSpeciesKey || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
    if (dexKey && dexKey !== primary) bases.push(dexKey);

    const variants = [];
    for (const base of bases) {
        if (form > 0) variants.push(`${base}_${form}`);
        variants.push(base);
    }
    return [...new Set(variants)];
}

function buildCustomSpritePath(variantName, folder, packId = null) {
    const pack = packId || getCustomSpritePack(config.spriteType);
    return '/sprites/' + [pack, folder, `${variantName}.png`].map(encodeURIComponent).join('/');
}

/** Packs con carpeta Custom/ (dex + sufijos a/b/c…), p.ej. Gen V (Custom Estatico). */
function packHasCustomDexFolder(packId) {
    const pack = customSpritePacks.find(p => p.id === packId);
    if (!pack) return false;
    if (pack.hasCustomFolder) return true;
    return (pack.folders || []).some(f => String(f).toLowerCase() === 'custom');
}

function isCustomDexSpritePack(typeKey = config.spriteType) {
    return isCustomSpriteType(typeKey) && packHasCustomDexFolder(getCustomSpritePack(typeKey));
}

/**
 * Sufijos de forma en Custom/ para especies que no usan solo el nº de dex.
 * Clave = form id del save → sufijo de archivo (351_sunny, 648_pirouette…).
 */
const CUSTOM_DEX_FORM_SUFFIX = {
    351: { 1: 'sunny', 2: 'rainy', 3: 'snowy' },
    648: { 1: 'pirouette' },
    741: { 1: 'pompom', 2: 'pau', 3: 'sensu' },
    745: { 1: 'midnight' },
    800: { 1: 'ultra', 2: 'ultra', 3: 'ultra' }
};

function getCustomDexGroupKey(pokemon) {
    const dex = pokemon.species;
    if (!dex && dex !== 0) return null;
    const form = pokemon.form || 0;

    // Minior: formas core suelen ser form >= 7
    if (dex === 774 && form >= 7) return '774_core';

    const mapped = CUSTOM_DEX_FORM_SUFFIX[dex]?.[form];
    if (mapped) return `${dex}_${mapped}`;

    return String(dex);
}

function getCustomDexVariants(pokemon, packId = null) {
    const pack = packId || getCustomSpritePack(config.spriteType);
    const index = customDexIndexByPack.get(pack);
    if (!index) return [];

    const groupKey = getCustomDexGroupKey(pokemon);
    if (groupKey == null) return [];

    let variants = index[groupKey] || index[String(groupKey).toLowerCase()] || [];
    // Si la forma mapeada no tiene archivos, usar el grupo base del dex
    if (!variants.length && String(groupKey).includes('_')) {
        const baseDex = String(pokemon.species);
        variants = index[baseDex] || [];
    }
    return variants;
}

function customDexChoiceCacheKey(pokemon, packId = null) {
    const pack = packId || getCustomSpritePack(config.spriteType);
    const group = getCustomDexGroupKey(pokemon);
    const slot = pokemon.slot != null ? pokemon.slot : 'x';
    return `${pack}|${slot}|${group}`;
}

/** Elige (y cachea) un basename aleatorio de Custom/ para este Pokémon. */
function pickCustomDexVariant(pokemon, { reroll = false } = {}) {
    const pack = getCustomSpritePack(config.spriteType);
    const variants = getCustomDexVariants(pokemon, pack);
    if (!variants.length) return null;

    const key = customDexChoiceCacheKey(pokemon, pack);
    if (!reroll && customDexChoiceCache.has(key)) {
        const cached = customDexChoiceCache.get(key);
        if (variants.includes(cached)) return cached;
    }

    let choice;
    if (variants.length === 1) {
        choice = variants[0];
    } else if (reroll && customDexChoiceCache.has(key)) {
        const prev = customDexChoiceCache.get(key);
        const others = variants.filter(v => v !== prev);
        choice = others.length
            ? others[Math.floor(Math.random() * others.length)]
            : variants[Math.floor(Math.random() * variants.length)];
    } else {
        choice = variants[Math.floor(Math.random() * variants.length)];
    }

    customDexChoiceCache.set(key, choice);
    return choice;
}

async function loadCustomDexIndex(packId) {
    if (!packId || customDexIndexByPack.has(packId)) return customDexIndexByPack.get(packId) || null;
    try {
        const res = await fetch(`/api/custom-sprites/custom-index?pack=${encodeURIComponent(packId)}`);
        if (!res.ok) {
            customDexIndexByPack.set(packId, {});
            return {};
        }
        const data = await res.json() || {};
        customDexIndexByPack.set(packId, data);
        return data;
    } catch (e) {
        console.warn('[Sprites] No se pudo cargar índice Custom/', packId, e);
        customDexIndexByPack.set(packId, {});
        return {};
    }
}

async function ensureCustomDexIndexForType(typeKey = config.spriteType) {
    if (!isCustomDexSpritePack(typeKey)) return;
    await loadCustomDexIndex(getCustomSpritePack(typeKey));
}

/** Prioridad: Custom/ (aleatorio) → Front shiny/Front; forma → base */
function buildCustomSpriteUrls(pokemon) {
    const shiny = !!pokemon.isShiny;
    const pack = getCustomSpritePack(config.spriteType);
    const urls = [];

    if (packHasCustomDexFolder(pack)) {
        const chosen = pickCustomDexVariant(pokemon);
        if (chosen) urls.push(buildCustomSpritePath(chosen, 'Custom', pack));
    }

    const variants = buildCustomSpriteVariants(pokemon);
    const folders = shiny ? ['Front shiny', 'Front'] : ['Front'];
    for (const folder of folders) {
        for (const variant of variants) {
            urls.push(buildCustomSpritePath(variant, folder, pack));
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

    if (type.source === 'tcgdex') {
        const name = pokemon.speciesName || '';
        if (name && tcgdexUrlCache.has(name)) {
            const cached = tcgdexUrlCache.get(name);
            if (cached) return cached;
        }
        return buildSpriteUrl('default', id, shiny, false);
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

function buildTcgdexAssetUrl(imageBase, quality = 'high', ext = 'webp') {
    if (!imageBase) return '';
    const base = String(imageBase).replace(/\/$/, '');
    return `${base}/${quality}.${ext}`;
}

function isTcgArtworkCrop(type) {
    return !!(type && type.source === 'tcgdex' && type.artworkCrop);
}

/** Busca cartas TCG por nombre de especie y rellena caché de URLs de assets. */
async function resolveTcgdexCards(team) {
    const type = getSpriteTypeEntry(config.spriteType);
    if (!type || type.source !== 'tcgdex' || !team?.length) return;

    const quality = type.quality || 'high';
    const ext = type.ext || 'webp';
    const names = [...new Set(team.map(p => p.speciesName).filter(Boolean))];
    const pending = names.filter(name => !tcgdexUrlCache.has(name));
    if (!pending.length) return;

    await Promise.all(pending.map(async name => {
        try {
            const url = `${TCGDEX_API}/cards?name=${encodeURIComponent(`eq:${name}`)}&category=${encodeURIComponent('eq:Pokemon')}`;
            const res = await fetch(url);
            if (!res.ok) {
                tcgdexUrlCache.set(name, '');
                return;
            }
            const cards = await res.json();
            const withImage = Array.isArray(cards) ? cards.filter(c => c.image) : [];
            const card = withImage.length
                ? withImage[Math.floor(Math.random() * withImage.length)]
                : null;
            tcgdexUrlCache.set(name, card ? buildTcgdexAssetUrl(card.image, quality, ext) : '');
        } catch (e) {
            console.warn('[TCGdex] búsqueda falló', name, e);
            tcgdexUrlCache.set(name, '');
        }
    }));
}

async function fetchTeamData() {
    try {
        const r = await fetch(API_URL);
        return r.ok ? await r.json() : null;
    } catch { return null; }
}

function getHPInfo(cur, max) {
    const pct = max > 0 ? Math.max(0, Math.min(100, (cur / max) * 100)) : 100;
    return { pct, cls: pct <= 20 ? 'hp-low' : pct <= 50 ? 'hp-medium' : 'hp-high' };
}

function formatPokemonLevel(level) {
    if (config.levelFormat === 'long') return `Nivel ${level}`;
    if (config.levelFormat === 'number') return String(level);
    return `Nv.${level}`;
}

function buildPokemonHPHtml(pokemon, hp) {
    const display = config.hpDisplay || 'bar';
    const showBar = display === 'bar' || display.startsWith('bar-');
    const showText = display !== 'bar';
    const text = display.endsWith('current')
        ? `${pokemon.currentHP} HP`
        : `${pokemon.currentHP}/${pokemon.maxHP}`;

    return `<div class="pokemon-hp hp-position-${config.hpPosition || 'below'}">`
        + (showBar
            ? `<div class="hp-bar-container"><div class="hp-bar ${hp.cls}" style="width:${hp.pct}%"></div></div>`
            : '')
        + (showText ? `<span class="hp-text">${escapeHtml(text)}</span>` : '')
        + `</div>`;
}

function createPokemonCard(pokemon) {
    const hp = getHPInfo(pokemon.currentHP, pokemon.maxHP);
    const isShiny = pokemon.isShiny;
    const isFainted = pokemon.currentHP === 0;
    const displayName = (config.showNickname && pokemon.hasNickname && pokemon.nickname) ? pokemon.nickname : pokemon.speciesName;
    const hasNickname = pokemon.hasNickname && pokemon.nickname;
    const spriteType = getSpriteTypeEntry(config.spriteType);
    const isHighRes = !!spriteType.highRes;
    const artCrop = isTcgArtworkCrop(spriteType);
    let spriteClass = 'pokemon-sprite'
        + (isHighRes ? ' high-res' : '')
        + (artCrop ? ' tcg-artwork' : '')
        + (isShiny && config.showShiny ? ' shiny' : '')
        + (isFainted ? ' fainted' : '');
    const spriteFilter = buildSpriteFilter(isShiny, isFainted);
    
    let nameClass = 'pokemon-name' + (hasNickname ? ' nickname' : '') + (config.textStroke ? ' has-stroke' : '');
    const levelPos = config.levelPosition || 'below';
    const levelInCorner = config.showLevel && levelPos !== 'below';
    let levelClass = 'pokemon-level'
        + (levelInCorner ? ` corner corner-${levelPos}` : '')
        + (config.levelBackground ? ' has-background' : '');

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
    } else if (type.source === 'tcgdex') {
        fallbackUrl = buildSpriteUrl('default', pokemon.species, shiny, false);
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
    
    const hpHtml = config.showHP ? buildPokemonHPHtml(pokemon, hp) : '';
    const levelText = formatPokemonLevel(pokemon.level);
    let html = `<div class="pokemon-card">`;
    if (hpHtml && config.hpPosition === 'above') html += hpHtml;
    if (config.showShiny && isShiny) html += `<span class="shiny-icon">✨</span>`;

    const onErr = isCustom
        ? buildChainedImgErrorHandler([...buildCustomSpriteUrls(pokemon).slice(1), fallback2, FALLBACK_SPRITE])
        : buildImgErrorHandler(fallbackUrl, fallback2);
    html += `<div class="pokemon-sprite-stack${artCrop ? ' tcg-artwork-stack' : ''}">`;
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
            html += `<img src="${primaryUrl}" alt="" class="pokemon-sprite sprite-shadow-layer${isHighRes ? ' high-res' : ''}${artCrop ? ' tcg-artwork' : ''}${isFainted ? ' fainted' : ''}" style="filter:url(#spriteShadowFilter)" aria-hidden="true" draggable="false" onerror="${onErr}">`;
        }
        html += `<img src="${primaryUrl}" alt="${escapeHtml(pokemon.speciesName)}" class="${spriteClass}" style="filter:${spriteFilter}" data-fb2="${fallback2}" onerror="${onErr}">`;
    }
    if (levelInCorner) html += `<span class="${levelClass}">${escapeHtml(levelText)}</span>`;
    if (config.showHeldItem && pokemon.heldItem) {
        const itemLabel = formatHeldItemLabel(pokemon.heldItem);
        const itemUrl = getHeldItemSpriteUrl(pokemon.heldItem);
        if (itemUrl) {
            const itemClass = `held-item-icon held-item-${config.heldItemPosition || 'bottom-right'}`
                + (config.heldItemBackground ? ' has-background' : '');
            html += `<img src="${itemUrl}" alt="${escapeHtml(itemLabel)}" title="${escapeHtml(itemLabel)}" class="${itemClass}" loading="lazy" onerror="this.style.display='none'">`;
        }
    }
    const showCustomReroll = !isOBSMode()
        && isCustomDexSpritePack(config.spriteType)
        && getCustomDexVariants(pokemon).length > 1;
    if (showCustomReroll) {
        html += `<button type="button" class="custom-sprite-reroll" title="Otro sprite aleatorio"`
            + ` aria-label="Otro sprite aleatorio"`
            + ` data-slot="${pokemon.slot ?? ''}"`
            + ` data-species="${pokemon.species ?? ''}"`
            + ` data-form="${pokemon.form || 0}">↻</button>`;
    }
    html += `</div>`;

    if (config.showNickname) html += `<span class="${nameClass}">${escapeHtml(displayName)}</span>`;
    if (config.showLevel && !levelInCorner) html += `<span class="${levelClass}">${escapeHtml(levelText)}</span>`;
    if (hpHtml && config.hpPosition !== 'above') html += hpHtml;
    html += `</div>`;
    return html;
}

function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

function renderTeam(data) {
    const c = document.getElementById('team');
    let team = data?.team || [];
    if (isSlotOnlyMode()) {
        const slot = getObsSlot();
        team = team.filter(p => p.slot === slot);
        if (!team.length) {
            c.innerHTML = `<div class="empty-state">Slot ${slot} vacío</div>`;
            return;
        }
    } else if (!team.length) {
        c.innerHTML = `<div class="empty-state">Sin Pokémon</div>`;
        return;
    }
    c.innerHTML = team.map(p => createPokemonCard(p)).join('');
    setupAllSpriteSheets();
}

function findTeamPokemonForReroll(btn) {
    const slot = parseInt(btn.dataset.slot, 10);
    const species = parseInt(btn.dataset.species, 10);
    const form = parseInt(btn.dataset.form, 10) || 0;
    const team = currentTeam?.team || [];
    return team.find(p =>
        (Number.isFinite(slot) ? p.slot === slot : true)
        && p.species === species
        && (p.form || 0) === form
    ) || null;
}

function rerollCustomDexSprite(pokemon) {
    if (!pokemon || !isCustomDexSpritePack(config.spriteType)) return;
    pickCustomDexVariant(pokemon, { reroll: true });
    if (currentTeam && shouldShowTeam()) renderTeam(currentTeam);
}

function setupCustomDexRerollListener() {
    const team = document.getElementById('team');
    if (!team || team.dataset.customRerollBound) return;
    team.dataset.customRerollBound = '1';
    team.addEventListener('click', e => {
        const btn = e.target.closest('.custom-sprite-reroll');
        if (!btn) return;
        e.preventDefault();
        const pokemon = findTeamPokemonForReroll(btn);
        if (pokemon) rerollCustomDexSprite(pokemon);
    });
}

const HEART_ICONS = {
    classic: {
        viewBox: '0 0 24 24',
        path: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
    },
    soft: {
        viewBox: '0 0 24 24',
        path: 'M12 22C9.8 19.2 3 15.7 3 9.2A6.2 6.2 0 0 1 9.2 3c1.2 0 2.3.35 3.2 1.05A6.2 6.2 0 0 1 21 9.2C21 15.7 14.2 19.2 12 22z'
    },
    slim: {
        viewBox: '0 0 24 24',
        path: 'M12 22 2 11 3.6 5.5 8.2 2.5 12 6.6 15.8 2.5 20.4 5.5 22 11 12 22z'
    },
    wide: {
        viewBox: '0 0 32 24',
        path: 'M16 22l-1.2-1.1C10.2 16.8 8 14.4 8 10.8A4.8 4.8 0 0 1 16 7.2a4.8 4.8 0 0 1 8 3.6c0 3.6-2.2 6-6.8 10.1L16 22zM8.9 8.1C6.1 5.2 3.1 3.9.5 4.3 1.9 5.6 2.8 6.8 3.4 8L0 8.7c1.6 1.4 3.8 2.2 7.2 2.4.1-1.1.7-2.2 1.7-3zM23.1 8.1c2.8-2.9 5.8-4.2 8.4-3.8-1.4 1.3-2.3 2.5-2.9 3.7l3.4.7c-1.6 1.4-3.8 2.2-7.2 2.4-.1-1.1-.7-2.2-1.7-3z'
    },
    pixel: {
        viewBox: '0 0 24 24',
        path: 'M8 3h4v3h1V3h4v2h3v3h2v6h-2v3h-3v2h-2v2H9v-2H7v-2H4v-3H2V8h2V5h4V3z'
    },
    bubble: {
        viewBox: '0 0 28 24',
        path: 'M14 22c-5.1-4.2-8.5-7-8.5-11.2A5.3 5.3 0 0 1 14 6.6a5.3 5.3 0 0 1 8.5 4.2C22.5 15 19.1 17.8 14 22zM3 1l.8 2.2L6 4l-2.2.8L3 7l-.8-2.2L0 4l2.2-.8L3 1zm22 2 .6 1.7 1.7.6-1.7.6L25 7.6l-.6-1.7-1.7-.6 1.7-.6L25 3z'
    },
    outline: {
        viewBox: '0 0 24 24',
        path: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
    }
};

function getHeartIcon() {
    return HEART_ICONS[config.livesHeartStyle] || HEART_ICONS.classic;
}

function buildLifeHeartSvg(lost) {
    const style = config.livesHeartStyle || 'classic';
    const icon = getHeartIcon();
    const outlineOnly = style === 'outline';
    const cls = 'life-heart'
        + (lost ? ' lost' : ' filled')
        + (outlineOnly ? ' outline-style' : '')
        + (style === 'pixel' ? ' pixel-style' : '')
        + ` heart-style-${style}`;

    return `<span class="${cls}" aria-hidden="true">`
        + `<svg viewBox="${icon.viewBox}" focusable="false">`
        + `<path d="${icon.path}"/>`
        + `</svg></span>`;
}

function renderLives(data) {
    const wrapper = document.getElementById('livesWrapper');
    const counter = document.getElementById('livesCounter');
    if (!wrapper || !counter) return;

    if (!shouldShowLives()) {
        wrapper.hidden = true;
        counter.innerHTML = '';
        return;
    }

    const max = Math.max(0, Number(config.maxLives) || 0);
    const remaining = getLivesRemaining(data);
    const lost = Math.max(0, max - remaining);
    const showMax = !!config.livesShowMax;

    if (config.livesDisplay === 'hearts') {
        const layout = ['row', 'column', 'grid'].includes(config.livesHeartLayout)
            ? config.livesHeartLayout
            : 'row';
        const filled = Array.from({ length: remaining }, () => buildLifeHeartSvg(false)).join('');
        const empty = showMax
            ? Array.from({ length: lost }, () => buildLifeHeartSvg(true)).join('')
            : '';
        counter.className = `lives-counter lives-hearts layout-${layout}`;
        counter.innerHTML = filled + empty || `<span class="lives-remaining">0</span>`;
    } else {
        counter.className = 'lives-counter lives-number';
        let html = `<span class="lives-remaining">${remaining}</span>`;
        if (showMax) html += `<span class="lives-max">/ ${max}</span>`;
        counter.innerHTML = html;
    }

    wrapper.hidden = false;
    wrapper.classList.toggle('lives-empty', remaining === 0);
    wrapper.classList.toggle('lives-mode-hearts', config.livesDisplay === 'hearts');
    wrapper.classList.toggle('lives-mode-number', config.livesDisplay !== 'hearts');
    wrapper.classList.toggle('lives-heart-stroke', !!config.livesHeartStroke || config.livesHeartStyle === 'outline');
    wrapper.classList.toggle('lives-heart-shadow', !!config.livesHeartShadow);
}

function createCemeterySprite(pokemon) {
    const spriteType = getSpriteTypeEntry(config.spriteType);
    const isHighRes = !!spriteType.highRes;
    const artCrop = isTcgArtworkCrop(spriteType);
    const gray = !!config.cemeteryGrayscale;
    let spriteClass = 'pokemon-sprite cemetery-sprite'
        + (isHighRes ? ' high-res' : '')
        + (artCrop ? ' tcg-artwork' : '')
        + (gray ? ' fainted' : '');
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
    } else if (type.source === 'tcgdex') {
        fallbackUrl = buildSpriteUrl('default', pokemon.species, shiny, false);
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

    const slotClass = 'cemetery-slot' + (artCrop ? ' tcg-artwork-slot' : '');

    if (isCustom) {
        return `<div class="${slotClass}">${buildCustomSpriteImgHtml(
            primaryUrl,
            spriteClass,
            spriteFilter,
            onErr,
            pokemon.speciesName
        )}</div>`;
    }

    return `<div class="${slotClass}">`
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
    const artCrop = isTcgArtworkCrop(spriteType);
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
    } else if (type.source === 'tcgdex') {
        fallbackUrl = buildSpriteUrl('default', pokemon.species, shiny, false);
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
        const cls = 'pokemon-sprite fainted'
            + (isHighRes ? ' high-res' : '')
            + (artCrop ? ' tcg-artwork' : '');
        const wrapClass = artCrop ? ' death-sprite-wrap tcg-artwork-frame' : 'death-sprite-wrap';
        spriteHtml = `<div class="${wrapClass}">`
            + `<img src="${primaryUrl}" alt="${escapeHtml(pokemon.speciesName)}" class="${cls}" style="filter:${grayFilter}" data-fb2="${fallback2}" onerror="${onErr}">`
            + `</div>`;
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
        } else if (type.source === 'tcgdex' && t?.team?.length) {
            await resolveTcgdexCards(t.team);
        } else if (isCustomDexSpritePack(config.spriteType) && t?.team?.length) {
            await ensureCustomDexIndexForType(config.spriteType);
        }
        renderTeam(t);
    }
    renderBadges(t);

    if (shouldShowCemetery() && t?.cemetery?.length) {
        const cemeteryType = getSpriteTypeEntry(config.cemeterySpriteType);
        if (cemeteryType.source === 'pmd') {
            await withSpriteTypeAsync(config.cemeterySpriteType, async () => {
                await resolvePmdPortraits(t.cemetery);
            });
        } else if (cemeteryType.source === 'tcgdex') {
            await withSpriteTypeAsync(config.cemeterySpriteType, async () => {
                await resolveTcgdexCards(t.cemetery);
            });
        } else if (isCustomDexSpritePack(config.cemeterySpriteType)) {
            await ensureCustomDexIndexForType(config.cemeterySpriteType);
        }
    }
    renderCemetery(t);
    renderLives(t);

    if (newlyFainted.length) playDeathAnimation(newlyFainted);
}

async function init() {
    if (isOBSMode()) document.body.classList.add('obs-mode');
    loadConfig();
    await loadCustomFonts();
    await loadCustomSpritePacks();
    await ensureCustomDexIndexForType(config.spriteType);
    await ensureCustomDexIndexForType(config.cemeterySpriteType);
    if (!isOBSMode()) {
        setupConfigListeners();
        setupCustomDexRerollListener();
    }
    applyConfig();
    await updateOverlay();
    setInterval(updateOverlay, REFRESH_INTERVAL);
}

document.addEventListener('DOMContentLoaded', init);
window.setupSpriteSheet = setupSpriteSheet;
