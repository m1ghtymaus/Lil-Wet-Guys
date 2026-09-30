// Plant Tracker dashboard card: every tracked plant as a cartoon in its pot,
// most urgent first. Tap the watering can to mark a plant watered (with Undo),
// or tap the plant for its photo and care details.

import { ART_CSS, SPECIES, drawPlant } from './art/index.js';

const DAY = 86400000;
const GHOST_AT = 3;
const WILTING_AT = 1.5;
const LIGHT = {
  direct: 'direct sun',
  bright_indirect: 'bright, indirect light',
  medium: 'medium light',
  low: 'low light',
};
const STATUS_LABEL = { happy: 'Happy', thirsty: 'Thirsty', wilting: 'Wilting', ghost: 'Ghost' };

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function statusOf(overdue) {
  if (overdue < 0) return 'happy';
  if (overdue < WILTING_AT) return 'thirsty';
  if (overdue < GHOST_AT) return 'wilting';
  return 'ghost';
}

function span(days) {
  const d = Math.abs(days);
  if (d < 1) return `${Math.max(1, Math.round(d * 24))} h`;
  if (d < 2) {
    const h = Math.round((d - 1) * 24);
    return h ? `1 day ${h} h` : '1 day';
  }
  return `${Math.floor(d)} days`;
}

function countdown(overdue) {
  if (overdue < 0) return `Water in ${span(overdue)}`;
  if (overdue < 1 / 24) return 'Water now';
  return `${span(overdue)} late`;
}

const CSS = `
:host { display: block; }
ha-card { padding: 12px; }
.header { font-size: var(--ha-card-header-font-size, 22px); color: var(--ha-card-header-color, var(--primary-text-color)); padding: 2px 4px 12px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(124px, 1fr)); gap: 10px; }
.tile { position: relative; display: grid; grid-template-rows: auto 1fr; background: var(--secondary-background-color, rgba(127,127,127,.08)); border-radius: 14px; padding: 4px 6px 10px; cursor: pointer; outline: none; transition: transform .15s ease; }
.tile:hover { transform: translateY(-1px); }
.tile:focus-visible { box-shadow: 0 0 0 2px var(--primary-color); }
.art { aspect-ratio: 200 / 248; position: relative; }
.art svg { width: 100%; height: 100%; }
.info { display: grid; gap: 2px; padding: 0 4px; min-width: 0; }
.name { font-weight: 600; font-size: 14px; line-height: 1.25; color: var(--primary-text-color); overflow-wrap: anywhere; }
.when { font-size: 12.5px; color: var(--secondary-text-color); font-variant-numeric: tabular-nums; }
.when.thirsty { color: var(--warning-color, #c98a1b); }
.when.wilting { color: var(--error-color, #c0392b); }
.when.ghost { color: var(--state-inactive-color, #7c80b3); }
.badges { display: flex; flex-wrap: wrap; gap: 4px 8px; font-size: 12px; color: var(--secondary-text-color); --mdc-icon-size: 15px; }
.badges .warn { color: var(--error-color, #c0392b); }
.water { position: absolute; top: 6px; right: 6px; width: 34px; height: 34px; border-radius: 50%; border: 0; display: grid; place-items: center; cursor: pointer; background: var(--card-background-color, #fff); color: var(--primary-color); box-shadow: 0 1px 3px rgba(0,0,0,.18); --mdc-icon-size: 19px; }
.water:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
.splash { position: absolute; inset: 0; pointer-events: none; }
.splash i { position: absolute; top: -4%; width: 7px; height: 10px; border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%; background: #6ec3ff; opacity: 0; animation: drop .9s ease-in forwards; }
@keyframes drop { 0% { transform: translateY(0); opacity: 0; } 15% { opacity: 1; } 100% { transform: translateY(150px); opacity: 0; } }
.empty { padding: 12px 4px 8px; color: var(--secondary-text-color); line-height: 1.5; }
dialog { border: 0; padding: 0; border-radius: 18px; width: min(440px, calc(100vw - 32px)); max-height: calc(100vh - 32px); background: var(--card-background-color, #fff); color: var(--primary-text-color); box-shadow: 0 12px 40px rgba(0,0,0,.35); }
dialog::backdrop { background: rgba(0,0,0,.45); }
.sheet { display: grid; gap: 12px; padding: 18px; }
.top { display: flex; align-items: start; justify-content: space-between; gap: 12px; }
.top h2 { margin: 0; font-size: 20px; line-height: 1.25; }
.top .sub { color: var(--secondary-text-color); font-size: 13px; margin-top: 2px; }
.top .sub i { font-style: italic; }
.close { border: 0; background: none; color: var(--secondary-text-color); cursor: pointer; font-size: 22px; line-height: 1; padding: 4px; --mdc-icon-size: 22px; }
.hero { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: center; }
.hero.solo { grid-template-columns: minmax(0, 220px); justify-content: center; }
.hero img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 12px; }
.chip { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12.5px; font-weight: 600; color: #fff; background: var(--success-color, #3f8f4a); }
.chip.thirsty { background: var(--warning-color, #c98a1b); }
.chip.wilting { background: var(--error-color, #c0392b); }
.chip.ghost { background: #7c80b3; }
.state { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-variant-numeric: tabular-nums; }
dl { display: grid; grid-template-columns: auto 1fr; gap: 6px 14px; margin: 0; font-size: 14px; }
dt { color: var(--secondary-text-color); }
dd { margin: 0; }
.note { margin: 0; padding: 10px 12px; border-radius: 10px; background: var(--secondary-background-color, rgba(127,127,127,.08)); font-size: 14px; }
.actions { display: flex; justify-content: flex-end; gap: 8px; }
.actions button { font: inherit; font-weight: 600; border-radius: 999px; padding: 9px 16px; cursor: pointer; border: 1px solid var(--divider-color, rgba(127,127,127,.3)); background: none; color: var(--primary-text-color); }
.actions button.primary { background: var(--primary-color); border-color: var(--primary-color); color: var(--text-primary-color, #fff); }
`;

class PlantTrackerCard extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  static getConfigForm() {
    return {
      schema: [
        { name: 'title', selector: { text: {} } },
        { name: 'limbs', selector: { boolean: {} } },
      ],
      computeLabel: (s) => ({ title: 'Title', limbs: 'Arms and feet' })[s.name],
    };
  }

  setConfig(config) {
    this._config = { limbs: true, ...config };
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>${ART_CSS}${CSS}</style><ha-card><div class="header" hidden></div><div class="grid"></div>`
        + '<div class="empty" hidden>No plants yet. Add one from <b>Settings → Devices &amp; services → Plant Tracker → Add plant</b>.</div></ha-card>'
        + '<dialog></dialog>';
      root.querySelector('.grid').addEventListener('click', (e) => this._onClick(e));
      root.querySelector('.grid').addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('tile')) {
          e.preventDefault();
          this._openDetails(e.target.dataset.id);
        }
      });
      root.querySelector('dialog').addEventListener('click', (e) => this._onDialogClick(e));
      root.querySelector('dialog').addEventListener('close', () => { this._openId = null; });
      this._tiles = new Map();
    }
    const header = this.shadowRoot.querySelector('.header');
    header.hidden = !this._config.title;
    header.textContent = this._config.title || '';
    this._keys = new Map(); // force a redraw with the new options
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 6;
  }

  getGridOptions() {
    return { columns: 'full', min_columns: 6 };
  }

  connectedCallback() {
    // Dryness and countdowns move with the clock, not just with state changes.
    this._timer = setInterval(() => this._render(), 60000);
  }

  disconnectedCallback() {
    clearInterval(this._timer);
  }

  _plants() {
    const states = this._hass?.states ?? {};
    const only = this._config.entities;
    const now = Date.now();
    const out = [];
    for (const [id, st] of Object.entries(states)) {
      if (!id.startsWith('sensor.') || !st.attributes.plant_tracker) continue;
      if (Array.isArray(only) && !only.includes(id)) continue;
      const a = st.attributes;
      const next = new Date(a.next_watering).getTime();
      const overdue = (now - next) / DAY;
      out.push({ id, st, a, next, overdue, name: this._name(id, st) });
    }
    return out.sort((p, q) => p.next - q.next || p.name.localeCompare(q.name));
  }

  _name(id, st) {
    const entity = this._hass.entities?.[id];
    const device = entity?.device_id ? this._hass.devices?.[entity.device_id] : null;
    return device?.name_by_user || device?.name || String(st.attributes.friendly_name || id).replace(/ Status$/, '');
  }

  _render() {
    if (!this._hass || !this.shadowRoot) return;
    const grid = this.shadowRoot.querySelector('.grid');
    const plants = this._plants();
    this.shadowRoot.querySelector('.empty').hidden = plants.length > 0;
    const seen = new Set();
    for (const p of plants) {
      seen.add(p.id);
      let tile = this._tiles.get(p.id);
      if (!tile) {
        tile = document.createElement('div');
        tile.className = 'tile';
        tile.dataset.id = p.id;
        tile.tabIndex = 0;
        tile.setAttribute('role', 'button');
        tile.innerHTML = '<div class="art"></div><div class="info"><div class="name"></div><div class="when"></div><div class="badges"></div></div>'
          + '<button class="water" type="button"><ha-icon icon="mdi:watering-can"></ha-icon></button>';
        this._tiles.set(p.id, tile);
      }
      this._updateTile(tile, p);
      grid.appendChild(tile); // keeps tiles in sorted order
    }
    for (const [id, tile] of this._tiles) {
      if (!seen.has(id)) {
        tile.remove();
        this._tiles.delete(id);
      }
    }
    if (this._openId) this._fillDetails(this._openId);
  }

  _updateTile(tile, p) {
    const dryness = clamp(p.overdue / GHOST_AT, 0, 1);
    const ghost = p.overdue >= GHOST_AT;
    const status = statusOf(p.overdue);
    const key = [p.st.last_updated, p.name, ghost, Math.round(dryness * 100), this._config.limbs].join('|');
    if (this._keys.get(p.id) !== key) {
      this._keys.set(p.id, key);
      tile.querySelector('.art').innerHTML = drawPlant({
        species: p.a.shape, potColor: p.a.pot_color, dryness, ghost, seed: p.id,
        limbs: this._config.limbs !== false, label: p.name,
      });
    }
    tile.querySelector('.name').textContent = p.name;
    const when = tile.querySelector('.when');
    when.textContent = countdown(p.overdue);
    when.className = `when ${status}`;
    tile.setAttribute('aria-label', `${p.name}: ${STATUS_LABEL[status]}, ${countdown(p.overdue).toLowerCase()}. Open details.`);
    tile.querySelector('.water').setAttribute('aria-label', `Mark ${p.name} as watered`);
    tile.querySelector('.badges').innerHTML = this._badges(p.a);
  }

  _badges(a) {
    const out = [];
    if (a.temperature_problem) {
      const icon = a.temperature_problem === 'cold' ? 'mdi:snowflake-thermometer' : 'mdi:sun-thermometer';
      out.push(`<span class="warn"><ha-icon icon="${icon}"></ha-icon> ${esc(a.temperature)}°</span>`);
    }
    if (a.moisture != null) out.push(`<span><ha-icon icon="mdi:water-percent"></ha-icon> ${esc(Math.round(a.moisture))}%</span>`);
    return out.join('');
  }

  _onClick(e) {
    const tile = e.target.closest('.tile');
    if (!tile) return;
    if (e.target.closest('.water')) {
      e.stopPropagation();
      this._water(tile.dataset.id);
    } else {
      this._openDetails(tile.dataset.id);
    }
  }

  async _water(id) {
    const st = this._hass.states[id];
    if (!st) return;
    const a = st.attributes;
    const name = this._name(id, st);
    const previous = this._hass.states[a.last_watered_entity]?.state;
    this._splash(id);
    await this._hass.callService('button', 'press', { entity_id: a.button_entity });
    const detail = { message: `Watered ${name}`, duration: 6000 };
    if (previous && a.last_watered_entity) {
      detail.action = {
        text: 'Undo',
        action: () => this._hass.callService('datetime', 'set_value', { entity_id: a.last_watered_entity, datetime: previous }),
      };
    }
    this.dispatchEvent(new CustomEvent('hass-notification', { detail, bubbles: true, composed: true }));
  }

  _splash(id) {
    const art = this._tiles.get(id)?.querySelector('.art');
    if (!art || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const splash = document.createElement('div');
    splash.className = 'splash';
    splash.innerHTML = [18, 32, 46, 60, 74, 88].map((x, i) => `<i style="left:${x}%;animation-delay:${(i % 3) * 0.12}s"></i>`).join('');
    art.appendChild(splash);
    setTimeout(() => splash.remove(), 1400);
  }

  _openDetails(id) {
    this._openId = id;
    this._fillDetails(id, true);
    const dialog = this.shadowRoot.querySelector('dialog');
    if (!dialog.open) dialog.showModal();
  }

  _fillDetails(id, force = false) {
    const dialog = this.shadowRoot.querySelector('dialog');
    const st = this._hass.states[id];
    if (!st) {
      dialog.close();
      return;
    }
    // Redraw only when the plant changes or a minute passes, so the photo doesn't flicker.
    const key = `${id}|${st.last_updated}|${Math.floor(Date.now() / 60000)}`;
    if (!force && key === this._dialogKey) return;
    this._dialogKey = key;
    const a = st.attributes;
    const name = this._name(id, st);
    const overdue = (Date.now() - new Date(a.next_watering).getTime()) / DAY;
    const status = statusOf(overdue);
    const art = SPECIES[a.shape];
    const photo = a.photo_entity ? this._hass.states[a.photo_entity]?.attributes.entity_picture : null;
    const lang = this._hass.locale?.language || navigator.language;
    const last = new Date(a.last_watered);
    const rel = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
    const ago = (Date.now() - last.getTime()) / DAY;
    const lastText = ago < 1 / 24 ? rel.format(-Math.max(1, Math.round(ago * 1440)), 'minute')
      : ago < 1 ? rel.format(-Math.round(ago * 24), 'hour') : rel.format(-Math.round(ago), 'day');
    const lastDate = last.toLocaleString(lang, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    const unit = a.temperature_unit || '°C';
    const drawing = drawPlant({
      species: a.shape, potColor: a.pot_color, dryness: clamp(overdue / GHOST_AT, 0, 1), ghost: overdue >= GHOST_AT,
      seed: id, limbs: this._config.limbs !== false, label: name,
    });
    const sub = a.species === 'other' ? '' : `${esc(a.species_name || art?.name || '')}${art?.latin ? ` · <i>${esc(art.latin)}</i>` : ''}`;
    const rows = [
      ['Watering', `Every ${esc(a.interval_days)} days in ${esc(LIGHT[a.light] || a.light)}`
        + (a.interval_days !== a.base_days ? ` (${esc(a.base_days)} in bright, indirect light)` : '')],
      ['Last watered', `${esc(lastText)} · ${esc(lastDate)}`],
      ['Comfortable', `${esc(a.temperature_min)}–${esc(a.temperature_max)} ${esc(unit)}`],
    ];
    if (a.temperature_entity) {
      const verdict = a.temperature_problem ? ` · too ${esc(a.temperature_problem)}` : '';
      rows.push(['Room', a.temperature == null ? 'No reading' : `${esc(a.temperature)} ${esc(unit)}${verdict}`]);
    }
    if (a.moisture != null) rows.push(['Soil moisture', `${esc(Math.round(a.moisture))}%`]);

    dialog.innerHTML = `<div class="sheet">
      <div class="top"><div><h2>${esc(name)}</h2>${sub ? `<div class="sub">${sub}</div>` : ''}</div>
        <button class="close" type="button" data-act="close" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button></div>
      <div class="hero${photo ? '' : ' solo'}"><div class="art">${drawing}</div>${photo ? `<img src="${esc(photo)}" alt="Photo of ${esc(name)}">` : ''}</div>
      <div class="state"><span class="chip ${status}">${STATUS_LABEL[status]}</span><span>${esc(countdown(overdue))}</span></div>
      <dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>
      ${a.care_note ? `<p class="note">${esc(a.care_note)}</p>` : ''}
      <div class="actions"><button type="button" data-act="settings">Settings</button>
        <button type="button" class="primary" data-act="water">Watered</button></div>
    </div>`;
  }

  _onDialogClick(e) {
    const dialog = this.shadowRoot.querySelector('dialog');
    if (e.target === dialog) {
      dialog.close(); // clicked the backdrop
      return;
    }
    const act = e.target.closest('[data-act]')?.dataset.act;
    const id = this._openId;
    if (act === 'close') dialog.close();
    if (act === 'water' && id) {
      this._water(id);
      dialog.close();
    }
    if (act === 'settings' && id) {
      dialog.close();
      this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: id }, bubbles: true, composed: true }));
    }
  }
}

if (!customElements.get('plant-tracker-card')) {
  customElements.define('plant-tracker-card', PlantTrackerCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'plant-tracker-card',
    name: 'Plant Tracker',
    description: 'Your plants as cartoons, most thirsty first, with one-tap watering.',
    preview: false,
  });
}
