import { CLASS_CONFIG } from '../logic/balance.ts';
import { advanceDay } from '../logic/advanceDay.ts';
import { resolveCrossing, type CrossingChoice } from '../logic/crossing.ts';
import { dismissEvent } from '../logic/events.ts';
import { canStartFarming, startFarming } from '../logic/farming.ts';
import { REGIONS } from '../logic/regions.ts';
import { startRapids, takeTollRoad } from '../logic/rapids.ts';
import { computeScore, summaryLine, titleTier, classLabel } from '../logic/score.ts';
import { defaultPartyNames, freshMetaState, newGame, partyHealthLabel } from '../logic/state.ts';
import { buyItem, leaveStore, type StoreItem } from '../logic/store.ts';
import { acceptTrade, declineTrade, rollTradeOffer } from '../logic/trade.ts';
import type { GameState, JoinDate, Pace, PlayerClass, ScreenTime } from '../logic/types.ts';
import { seed } from '../logic/types.ts';
import { GAME_TITLE } from '../config.ts';
import { addHighScore, loadHighScores } from '../persistence/highScores.ts';
import { playSfx, toggleMute, isMuted } from '../audio/sfx.ts';

export interface UiHandlers {
  setState: (s: GameState) => void;
  getState: () => GameState;
  loadSave: () => GameState | null;
}

let draftPartyNames = defaultPartyNames();

function btn(label: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.addEventListener('click', () => {
    playSfx('menu_blip');
    onClick();
  });
  return b;
}

function h(tag: string, text: string): HTMLElement {
  const el = document.createElement(tag);
  el.textContent = text;
  return el;
}

export function renderScene(root: HTMLElement, state: GameState, handlers: UiHandlers): void {
  root.replaceChildren();
  root.appendChild(h('h1', GAME_TITLE));
  root.appendChild(h('p', summaryLine(state)));

  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';
  toolbar.appendChild(
    btn(isMuted() ? 'Unmute' : 'Mute', () => {
      toggleMute();
      renderScene(root, handlers.getState(), handlers);
    }),
  );
  root.appendChild(toolbar);

  switch (state.scene) {
    case 'title':
      renderTitle(root, handlers);
      break;
    case 'class_select':
      renderClass(root, handlers);
      break;
    case 'party':
      renderParty(root, handlers);
      break;
    case 'join_date':
      renderJoinDate(root, handlers);
      break;
    case 'store':
      renderStore(root, state, handlers);
      break;
    case 'travel':
      renderTravel(root, state, handlers);
      break;
    case 'event':
      renderEvent(root, state, handlers);
      break;
    case 'landmark':
      renderLandmark(root, state, handlers);
      break;
    case 'crossing':
      renderCrossing(root, state, handlers);
      break;
    case 'farming':
      renderFarmingHud(root, state);
      break;
    case 'finale_choice':
      renderFinaleChoice(root, handlers);
      break;
    case 'rapids':
      renderRapidsHud(root);
      break;
    case 'score':
      renderScore(root, state, handlers);
      break;
    case 'suspended':
      renderSuspended(root, state, handlers);
      break;
    default:
      root.appendChild(h('p', `Unknown scene: ${state.scene}`));
  }

  if (state.messages.length > 0) {
    const log = document.createElement('div');
    log.className = 'log';
    for (const line of state.messages.slice(-6)) {
      log.appendChild(h('p', line));
    }
    root.appendChild(log);
  }
}

function renderTitle(root: HTMLElement, handlers: UiHandlers): void {
  root.appendChild(h('p', 'Lead five friends across the internet. Nobody dies of dysentery.'));
  const loaded = handlers.getState();
  root.appendChild(
    btn('New run', () => {
      handlers.setState({ ...freshMetaState(Number(seed(Date.now()))), scene: 'class_select' });
    }),
  );
  root.appendChild(
    btn('Continue', () => {
      const saved = handlers.loadSave();
      if (saved) {
        handlers.setState(saved);
      }
    }),
  );
}

function renderClass(root: HTMLElement, handlers: UiHandlers): void {
  root.appendChild(h('h2', 'Pick your class'));
  (Object.keys(CLASS_CONFIG) as PlayerClass[]).forEach((id) => {
    const cfg = CLASS_CONFIG[id];
    root.appendChild(
      btn(`${cfg.label} — $${cfg.startCrypto} · skill ${cfg.contentSkill} · ×${cfg.scoreMultiplier}`, () => {
        const s = handlers.getState();
        handlers.setState({ ...s, playerClass: id, scene: 'party' });
      }),
    );
  });
}

function renderParty(root: HTMLElement, handlers: UiHandlers): void {
  root.appendChild(h('h2', 'Name your party'));
  const names = defaultPartyNames();
  const form = document.createElement('div');
  form.className = 'party-form';
  const inputs: HTMLInputElement[] = [];
  names.forEach((name, i) => {
    const input = document.createElement('input');
    input.value = name;
    input.placeholder = `Member ${i + 1}`;
    inputs.push(input);
    form.appendChild(input);
  });
  root.appendChild(form);
  root.appendChild(
    btn('Continue', () => {
      const s = handlers.getState();
      if (!s.playerClass) {
        return;
      }
      draftPartyNames = inputs.map((inp) => inp.value.trim() || 'Traveler');
      handlers.setState({ ...s, scene: 'join_date', messages: [`Party: ${draftPartyNames.join(', ')}`] });
    }),
  );
}

function renderJoinDate(root: HTMLElement, handlers: UiHandlers): void {
  root.appendChild(h('h2', 'Join date'));
  const options: { id: JoinDate; label: string }[] = [
    { id: 'slow_news', label: 'Slow News Week (calm)' },
    { id: 'meme_season', label: 'Meme Season (chaotic)' },
    { id: 'discourse_season', label: 'Discourse Season (toxic)' },
  ];
  for (const opt of options) {
    root.appendChild(
      btn(opt.label, () => {
        const s = handlers.getState();
        if (!s.playerClass) {
          return;
        }
        const game = newGame(s.playerClass, draftPartyNames, opt.id, Date.now());
        handlers.setState(game);
      }),
    );
  }
}

function renderStore(root: HTMLElement, state: GameState, handlers: UiHandlers): void {
  const region = state.currentStoreRegion ?? 0;
  const storeName = REGIONS[region]?.storeName ?? 'Starter Pack';
  root.appendChild(h('h2', storeName));
  root.appendChild(h('p', `Crypto: $${state.supplies.crypto.toFixed(0)}`));
  const items: { id: StoreItem; label: string }[] = [
    { id: 'bandwidth_10', label: '+10 Mbps bandwidth' },
    { id: 'attention_100', label: '+100 Attention Span' },
    { id: 'thick_skin', label: 'Thick Skin layer (all)' },
    { id: 'hot_takes', label: '+20 Hot Takes' },
    { id: 'ethernet', label: 'Ethernet cable' },
    { id: 'router', label: 'Router' },
    { id: 'vpn', label: 'VPN key' },
  ];
  for (const item of items) {
    root.appendChild(btn(`Buy ${item.label}`, () => handlers.setState(buyItem(handlers.getState(), item.id))));
  }
  root.appendChild(
    btn('Hit the trail', () => {
      handlers.setState(leaveStore(handlers.getState()));
    }),
  );
}

function renderTravel(root: HTMLElement, state: GameState, handlers: UiHandlers): void {
  const region = REGIONS[state.regionIndex];
  root.appendChild(h('h2', `Travel — ${region?.name ?? 'Unknown'}`));
  root.appendChild(h('p', `Party health: ${partyHealthLabel(state)} · Day ${state.day}`));
  root.appendChild(
    btn('Continue (next day)', () => {
      playSfx('travel_tick');
      const { state: next } = advanceDay(handlers.getState());
      handlers.setState(next);
    }),
  );
  root.appendChild(btn('Check supplies', () => {
    const s = handlers.getState();
    handlers.setState({
      ...s,
      messages: [
        ...s.messages,
        `BW ${s.supplies.bandwidthMbps} Mbps · Attention ${s.supplies.attentionSpan} · Hot Takes ${s.supplies.hotTakePacks}`,
      ],
    });
  }));
  renderPaceScreen(root, state, handlers);
  if (canStartFarming(state)) {
    root.appendChild(btn('Engagement Farming (half day)', () => handlers.setState(startFarming(handlers.getState()))));
  }
  root.appendChild(
    btn('Trade with passerby', () => {
      handlers.setState(rollTradeOffer(handlers.getState()));
    }),
  );
  if (state.tradeOffer) {
    root.appendChild(h('p', `Offer: ${state.tradeOffer.give} → ${state.tradeOffer.receive}`));
    root.appendChild(btn('Accept trade', () => handlers.setState(acceptTrade(handlers.getState()))));
    root.appendChild(btn('Decline', () => handlers.setState(declineTrade(handlers.getState()))));
  }
  for (let d = 1; d <= 3; d++) {
    root.appendChild(
      btn(`Log off ${d} day(s)`, () => {
        const s = handlers.getState();
        handlers.setState({ ...s, restDaysRemaining: d, screenTime: 'touch_grass' });
      }),
    );
  }
}

function renderPaceScreen(root: HTMLElement, state: GameState, handlers: UiHandlers): void {
  const paceGroup = document.createElement('div');
  paceGroup.className = 'btn-row';
  (['lurking', 'posting', 'terminally_online'] as Pace[]).forEach((pace) => {
    paceGroup.appendChild(
      btn(`Pace: ${pace}${state.pace === pace ? ' ✓' : ''}`, () => {
        handlers.setState({ ...handlers.getState(), pace });
      }),
    );
  });
  root.appendChild(paceGroup);
  const screenGroup = document.createElement('div');
  screenGroup.className = 'btn-row';
  (['touch_grass', 'moderate', 'doomscrolling'] as ScreenTime[]).forEach((st) => {
    screenGroup.appendChild(
      btn(`Screen: ${st}${state.screenTime === st ? ' ✓' : ''}`, () => {
        handlers.setState({ ...handlers.getState(), screenTime: st });
      }),
    );
  });
  root.appendChild(screenGroup);
}

function renderEvent(root: HTMLElement, state: GameState, handlers: UiHandlers): void {
  const ev = state.pendingEvent;
  root.appendChild(h('h2', ev?.title ?? 'Event'));
  root.appendChild(h('p', ev?.body ?? ''));
  root.appendChild(
    btn('Continue', () => {
      handlers.setState(dismissEvent(handlers.getState()));
    }),
  );
}

function renderLandmark(root: HTMLElement, state: GameState, handlers: UiHandlers): void {
  const lm = state.pendingLandmark;
  root.appendChild(h('h2', lm?.name ?? 'Landmark'));
  root.appendChild(h('p', lm?.body ?? 'Rest stop.'));
  root.appendChild(
    btn('Continue', () => {
      handlers.setState({
        ...handlers.getState(),
        scene: 'travel',
        pendingLandmark: null,
      });
    }),
  );
}

function renderCrossing(root: HTMLElement, state: GameState, handlers: UiHandlers): void {
  playSfx('crossing_splash');
  const c = state.pendingCrossing;
  root.appendChild(h('h2', c?.name ?? 'Crossing'));
  root.appendChild(h('p', `Discourse depth: ${c?.depth ?? '?'}`));
  const choices: { id: CrossingChoice; label: string }[] = [
    { id: 'migrate', label: 'Just migrate (free, risky)' },
    { id: 'vpn', label: 'VPN tunnel (1 VPN key)' },
    { id: 'verified', label: 'Get verified ($5–15 + queue)' },
    { id: 'wait', label: 'Wait 1 day (depth -1)' },
  ];
  for (const ch of choices) {
    root.appendChild(
      btn(ch.label, () => {
        handlers.setState(resolveCrossing(handlers.getState(), ch.id));
      }),
    );
  }
}

function renderFarmingHud(root: HTMLElement, state: GameState): void {
  root.appendChild(h('h2', 'Engagement Farming'));
  root.appendChild(h('p', 'Tap posts / Space to reply. Watch the Sus meter.'));
  if (state.farming && state.farming.sus >= 70) {
    root.appendChild(h('p', 'ratio incoming'));
  }
}

function renderFinaleChoice(root: HTMLElement, handlers: UiHandlers): void {
  root.appendChild(h('h2', 'Last Post Bluff'));
  root.appendChild(btn('Ride the Feed Rapids (free minigame)', () => handlers.setState(startRapids(handlers.getState()))));
  root.appendChild(btn('Premium Toll Road ($50 + Attention)', () => handlers.setState(takeTollRoad(handlers.getState()))));
}

function renderRapidsHud(root: HTMLElement): void {
  root.appendChild(h('h2', 'Feed Rapids'));
  root.appendChild(h('p', 'Hold left/right half of screen or use arrow keys.'));
}

let lastRecordedScoreKey = '';

function renderScore(root: HTMLElement, state: GameState, handlers: UiHandlers): void {
  const score = computeScore(state);
  const tier = titleTier(score);
  root.appendChild(h('h2', 'Logged Off Valley'));
  root.appendChild(h('p', `Score: ${score} — ${tier}`));
  const scoreKey = `${state.seed}-${state.day}-${score}`;
  if (state.playerClass && scoreKey !== lastRecordedScoreKey) {
    lastRecordedScoreKey = scoreKey;
    playSfx('victory_jingle');
    addHighScore({
      score,
      classLabel: classLabel(state.playerClass),
      day: state.day,
      date: new Date().toISOString(),
    });
  }
  root.appendChild(h('h3', 'High scores'));
  const list = document.createElement('ul');
  for (const entry of loadHighScores()) {
    const li = document.createElement('li');
    li.textContent = `${entry.score} — ${entry.classLabel} (day ${entry.day})`;
    list.appendChild(li);
  }
  root.appendChild(list);
  root.appendChild(
    btn('Play again', () => {
      handlers.setState({ ...freshMetaState(Number(seed(Date.now()))), scene: 'class_select' });
    }),
  );
}

function renderSuspended(root: HTMLElement, state: GameState, handlers: UiHandlers): void {
  playSfx('death_dirge');
  root.appendChild(h('h2', 'Permanently suspended'));
  root.appendChild(h('p', `Day ${state.day} · ${state.distance} scrolls`));
  root.appendChild(
    btn('Try again', () => {
      handlers.setState({ ...freshMetaState(Number(seed(Date.now()))), scene: 'class_select' });
    }),
  );
}
