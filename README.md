# Compendium — Pokémon Champions VGC

Progressive Web App offline per costruire team, calcolare danni e consultare le soglie di velocità nel metagame **Pokémon Champions** (Regulation M-A, VGC livello 50).

## Funzionalità

### Teambuilder

- Team multipli salvati in `localStorage` (Zustand persist).
- Griglia 6 slot con sprite (Showdown + fallback PokeAPI).
- Roster **Reg M-A** (~185 specie base, da `@pkmn/mods/champions`).
- Editor per abilità, natura (con etichetta ±stat), strumento, 4 mosse e **Stat Points (SP)**.
- Formula statistiche **Pokémon Champions**: 66 SP totali, max 32 per stat, IV fissi a 31; +1 per SP a livello 50.

### Damage Calculator

- Integrazione **@smogon/calc** (Gen 9) con statistiche Champions applicate al calcolo.
- Colonne **Attaccante** e **Difensore**; caricamento dal team attivo.
- Simulazione di **tutte le mosse** configurate, in entrambe le direzioni.
- Campo: meteo, terreno, **Gravity**, Helping Hand e schermi per direzione, critico per singola mossa, boost stat.
- Risultati in tempo reale; mosse a 0× mostrano **Not effected**.

### Speed Tiers

- Velocità del **team attivo** con SP reali dal Teambuilder.
- Database **Reg M-A**: per ogni specie, Spe con **32 SP** e tre nature (+Spe, neutro, −Spe).
- Modificatori: Choice Scarf, Tailwind, paralisi, stadio Velocità.
- Ricerca, filtro natura e ordinamento.

## Stack

| Area | Tecnologia |
|------|------------|
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Build | Vite 8 |
| Offline | `vite-plugin-pwa` (service worker + manifest) |
| Stato | Zustand + persist |
| Danni | `@smogon/calc` |
| Dati | JSON Showdown + `@pkmn/dex` + roster Champions |

## Requisiti

- **Node.js 20+** (consigliato LTS, es. [fnm](https://github.com/Schniz/fnm))

## Comandi

```bash
npm install

# Database offline (obbligatorio prima del primo avvio)
npm run data:all
# oppure:
npm run data:fetch              # pokedex, moves, learnsets, items, …
npm run data:champions-species  # roster Reg M-A → src/data/champions-species.json

npm run dev       # sviluppo
npm run build     # produzione + PWA
npm run preview   # anteprima build
npm run lint      # ESLint
```

## Struttura progetto

```
src/
  App.tsx                 # Routing tab (teambuilder | calc | speed)
  components/
    AppLayout.tsx         # Header e navigazione
    Teambuilder.tsx
    DamageCalc.tsx
    SpeedTiers.tsx
    teambuilder/          # Editor, griglia, modale specie
    calc/                 # Pannelli damage calc e risultati
    speed/                # Griglia soglie riferimento
    ui/                   # Componenti UI condivisi
  data/
    loadDex.ts            # Caricamento bundle JSON
    championsSpecies.ts   # Roster Reg M-A
    raw/                  # JSON generati da scripts
  lib/
    stats.ts              # Formula Champions + modificatori velocità
    teamStats.ts
    smogonCalc.ts         # Bridge @smogon/calc
    speedTiers.ts
    learnset.ts, natureLabel.ts, sprites.ts, …
  store/
    useTeamStore.ts       # Team CRUD + localStorage
  types/
    team.ts               # PokemonSet, Team, costanti SP
scripts/
  fetch-showdown-data.mjs
  export-champions-species.mjs
  generate-pwa-icons.mjs
```

## Dati

| File | Fonte |
|------|--------|
| `pokedex.json`, `moves.json`, `learnsets.json` | [play.pokemonshowdown.com/data](https://play.pokemonshowdown.com/data/) |
| `items.json`, `abilities.json`, `natures.json`, `typechart.json` | `@pkmn/dex` |
| `champions-species.json` | `@pkmn/mods/champions` (specie legali Reg M-A, forme base) |

Learnset filtrati su sorgenti Gen 9 (`9…`) per allineamento a Champions.

## Formula statistiche (Champions)

A livello 50, con IV = 31 (non usati nel calcolo):

- **HP** = base + SP + 75  
- **Altre stat** = base + SP + 20, poi ×1.1 / ×0.9 natura (troncamento 16-bit stile cartridge)

Gli SP sono memorizzati nel campo `evs` di `PokemonSet` per compatibilità con export Showdown.

## Licenza e crediti

- Dati e meccaniche: [Pokémon Showdown](https://github.com/smogon/pokemon-showdown), [@pkmn](https://github.com/pkmn), [@smogon/calc](https://github.com/smogon/damage-calc).
- Progetto dimostrativo / uso personale; Pokémon © Nintendo / Game Freak / The Pokémon Company.
