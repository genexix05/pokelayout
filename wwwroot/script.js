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

// Tipos de sprites
const SPRITE_URLS = {
    default: (id, shiny) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${shiny ? 'shiny/' : ''}${id}.png`,
    official: (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
    home: (id, shiny) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${shiny ? 'shiny/' : ''}${id}.png`,
    showdown: (id, shiny) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${shiny ? 'shiny/' : ''}${id}.gif`,
    dream: (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${id}.svg`,
    back: (id, shiny) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${shiny ? 'shiny/' : ''}${id}.png`
};

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
    if (spriteType) spriteType.addEventListener('change', e => { config.spriteType = e.target.value; saveConfig(); applyConfig(); });
    
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

function getSpriteUrl(pokemon) {
    const id = pokemon.species;
    const shiny = pokemon.isShiny;
    const getter = SPRITE_URLS[config.spriteType] || SPRITE_URLS.default;
    if (config.spriteType === 'official' || config.spriteType === 'dream') return getter(id);
    return getter(id, shiny);
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
    const isHighRes = ['official', 'home', 'dream'].includes(config.spriteType);
    let spriteClass = 'pokemon-sprite' + (isHighRes ? ' high-res' : '') + (isShiny && config.showShiny ? ' shiny' : '') + (isFainted ? ' fainted' : '');
    
    // Classes for text with stroke
    let nameClass = 'pokemon-name' + (hasNickname ? ' nickname' : '') + (config.textStroke ? ' has-stroke' : '');
    let levelClass = 'pokemon-level' + (config.textStroke ? ' has-stroke' : '');
    
    let html = `<div class="pokemon-card">`;
    if (config.showShiny && isShiny) html += `<span class="shiny-icon">✨</span>`;
    html += `<img src="${getSpriteUrl(pokemon)}" alt="${pokemon.speciesName}" class="${spriteClass}" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png'">`;
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
    if (!teamsEqual(currentTeam, t)) { currentTeam = t; renderTeam(t); }
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
