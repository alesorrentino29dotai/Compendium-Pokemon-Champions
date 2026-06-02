import { useMemo } from 'react'

import { loadDex } from '../data/loadDex'
import {
  calcSetKey,
  EMPTY_MOVE_CRITS,
  getMoveCalcEntries,
  simulateMoveDamage,
  type CalcFieldOptions,
} from '../lib/smogonCalc'
import { useDamageCalcStore } from '../store/useDamageCalcStore'
import { useTeamStore } from '../store/useTeamStore'
import type { PokemonSet } from '../types/team'
import { CalcPokemonPanel } from './calc/CalcPokemonPanel'
import { DamageResults } from './calc/DamageResults'
import { CheckboxField } from './ui/CheckboxField'
import { useShallow } from 'zustand/react/shallow'

const WEATHER_OPTIONS: { value: CalcFieldOptions['weather']; label: string }[] =
  [
    { value: '', label: 'Nessuno' },
    { value: 'Sun', label: 'Sole' },
    { value: 'Rain', label: 'Pioggia' },
    { value: 'Sand', label: 'Sabbia' },
    { value: 'Snow', label: 'Neve' },
    { value: 'Hail', label: 'Grandine' },
  ]

const TERRAIN_OPTIONS: { value: CalcFieldOptions['terrain']; label: string }[] =
  [
    { value: '', label: 'Nessuno' },
    { value: 'Electric', label: 'Elettrico' },
    { value: 'Grassy', label: 'Erba' },
    { value: 'Misty', label: 'Nebbia' },
    { value: 'Psychic', label: 'Psico' },
  ]

function cloneSet(set: PokemonSet): PokemonSet {
  return structuredClone(set)
}

function pokemonLabel(set: PokemonSet): string {
  return set.nickname?.trim() || set.speciesName
}

export function DamageCalc() {
  const dex = loadDex()
  const teams = useTeamStore((s) => s.teams)
  const activeTeamId = useTeamStore((s) => s.activeTeamId)

  const {
    attacker,
    defender,
    attackerBoosts,
    defenderBoosts,
    field,
    attackerCrits,
    defenderCrits,
    setAttacker,
    setDefender,
    patchAttacker,
    patchDefender,
    patchAttackerEvs,
    patchDefenderEvs,
    setAttackerBoosts,
    setDefenderBoosts,
    patchField,
    setAttackerCrits,
    setDefenderCrits,
    setAttackerMoveCrit,
    setDefenderMoveCrit,
  } = useDamageCalcStore(
    useShallow((s) => ({
      attacker: s.attacker,
      defender: s.defender,
      attackerBoosts: s.attackerBoosts,
      defenderBoosts: s.defenderBoosts,
      field: s.field,
      attackerCrits: s.attackerCrits,
      defenderCrits: s.defenderCrits,
      setAttacker: s.setAttacker,
      setDefender: s.setDefender,
      patchAttacker: s.patchAttacker,
      patchDefender: s.patchDefender,
      patchAttackerEvs: s.patchAttackerEvs,
      patchDefenderEvs: s.patchDefenderEvs,
      setAttackerBoosts: s.setAttackerBoosts,
      setDefenderBoosts: s.setDefenderBoosts,
      patchField: s.patchField,
      setAttackerCrits: s.setAttackerCrits,
      setDefenderCrits: s.setDefenderCrits,
      setAttackerMoveCrit: s.setAttackerMoveCrit,
      setDefenderMoveCrit: s.setDefenderMoveCrit,
    })),
  )

  const team =
    teams.find((t) => t.id === activeTeamId) ?? teams[0] ?? null

  const teamLoadOptions = useMemo(() => {
    if (!team) return []
    return team.pokemon
      .map((p, i) => {
        if (!p) return null
        const label = p.nickname?.trim() || p.speciesName || `Slot ${i + 1}`
        return { label, set: p }
      })
      .filter((x): x is { label: string; set: PokemonSet } => x !== null)
  }, [team])

  const attackerKey = calcSetKey(attacker, attackerBoosts)
  const defenderKey = calcSetKey(defender, defenderBoosts)
  const fieldKey = JSON.stringify(field)
  const critKey = JSON.stringify([attackerCrits, defenderCrits])

  // Recomputed every render so SP slider changes always refresh damage.
  const attackerToDefender =
    attacker && defender
      ? simulateMoveDamage(
          attacker,
          defender,
          getMoveCalcEntries(attacker, attackerCrits),
          dex,
          field,
          {
            attackerBoosts,
            defenderBoosts,
            direction: 'attackerToDefender',
          },
        )
      : []

  const defenderToAttacker =
    attacker && defender
      ? simulateMoveDamage(
          defender,
          attacker,
          getMoveCalcEntries(defender, defenderCrits),
          dex,
          field,
          {
            attackerBoosts: defenderBoosts,
            defenderBoosts: attackerBoosts,
            direction: 'defenderToAttacker',
          },
        )
      : []

  const attackerLabel = attacker ? pokemonLabel(attacker) : 'Attaccante'
  const defenderLabel = defender ? pokemonLabel(defender) : 'Difensore'

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-medium">Damage Calculator</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Calcolo danni Gen 9 con statistiche Pokémon Champions (SP). Tutte le
          mosse configurate vengono simulate in tempo reale per entrambi i
          Pokémon.
        </p>
      </header>

      <section className="rounded-lg border border-showdown-border bg-showdown-panel p-3 shadow-sm sm:p-4 dark:border-showdown-dark-border dark:bg-showdown-dark-panel">
        <h3 className="mb-3 text-sm font-semibold text-gray-600 dark:text-gray-300">
          Campo di battaglia
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs text-gray-500">
            Formato
            <select
              value={field.gameType}
              onChange={(e) =>
                patchField({
                  gameType: e.target.value as CalcFieldOptions['gameType'],
                })
              }
              className="mt-0.5 w-full rounded border border-showdown-border bg-white px-2 py-1.5 text-sm dark:border-showdown-dark-border dark:bg-showdown-dark-bg"
            >
              <option value="Doubles">Doppio (VGC)</option>
              <option value="Singles">Singolo</option>
            </select>
          </label>

          <label className="text-xs text-gray-500">
            Meteo
            <select
              value={field.weather}
              onChange={(e) =>
                patchField({
                  weather: e.target.value as CalcFieldOptions['weather'],
                })
              }
              className="mt-0.5 w-full rounded border border-showdown-border bg-white px-2 py-1.5 text-sm dark:border-showdown-dark-border dark:bg-showdown-dark-bg"
            >
              {WEATHER_OPTIONS.map((o) => (
                <option key={o.value || 'none'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-gray-500">
            Terreno
            <select
              value={field.terrain}
              onChange={(e) =>
                patchField({
                  terrain: e.target.value as CalcFieldOptions['terrain'],
                })
              }
              className="mt-0.5 w-full rounded border border-showdown-border bg-white px-2 py-1.5 text-sm dark:border-showdown-dark-border dark:bg-showdown-dark-bg"
            >
              {TERRAIN_OPTIONS.map((o) => (
                <option key={o.value || 'none'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-showdown-border/60 pt-3 dark:border-showdown-dark-border/60">
          <CheckboxField
            label="Gravity"
            checked={field.isGravity}
            onChange={(v) => patchField({ isGravity: v })}
          />
        </div>

        <div className="mt-4 space-y-4">
          <div className="rounded border border-showdown-border/80 p-3 dark:border-showdown-dark-border/80">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-showdown-accent">
              {attackerLabel} → {defenderLabel}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <CheckboxField
                label="Helping Hand (attaccante)"
                checked={field.helpingHandOnAttacker}
                onChange={(v) => patchField({ helpingHandOnAttacker: v })}
              />
              <CheckboxField
                label="Riflesso (difensore)"
                checked={field.reflectOnDefender}
                onChange={(v) => patchField({ reflectOnDefender: v })}
              />
              <CheckboxField
                label="Schermoluce (difensore)"
                checked={field.lightScreenOnDefender}
                onChange={(v) => patchField({ lightScreenOnDefender: v })}
              />
              <CheckboxField
                label="Velaurora (difensore)"
                checked={field.auroraVeilOnDefender}
                onChange={(v) => patchField({ auroraVeilOnDefender: v })}
              />
              <CheckboxField
                label="Friend Guard (difensore)"
                checked={field.friendGuardOnDefender}
                onChange={(v) => patchField({ friendGuardOnDefender: v })}
              />
              <CheckboxField
                label="Protezione (difensore)"
                checked={field.protectOnDefender}
                onChange={(v) => patchField({ protectOnDefender: v })}
              />
            </div>
          </div>

          <div className="rounded border border-showdown-border/80 p-3 dark:border-showdown-dark-border/80">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-showdown-accent">
              {defenderLabel} → {attackerLabel}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <CheckboxField
                label="Helping Hand (difensore)"
                checked={field.helpingHandOnDefender}
                onChange={(v) => patchField({ helpingHandOnDefender: v })}
              />
              <CheckboxField
                label="Riflesso (attaccante)"
                checked={field.reflectOnAttacker}
                onChange={(v) => patchField({ reflectOnAttacker: v })}
              />
              <CheckboxField
                label="Schermoluce (attaccante)"
                checked={field.lightScreenOnAttacker}
                onChange={(v) => patchField({ lightScreenOnAttacker: v })}
              />
              <CheckboxField
                label="Velaurora (attaccante)"
                checked={field.auroraVeilOnAttacker}
                onChange={(v) => patchField({ auroraVeilOnAttacker: v })}
              />
              <CheckboxField
                label="Friend Guard (attaccante)"
                checked={field.friendGuardOnAttacker}
                onChange={(v) => patchField({ friendGuardOnAttacker: v })}
              />
              <CheckboxField
                label="Protezione (attaccante)"
                checked={field.protectOnAttacker}
                onChange={(v) => patchField({ protectOnAttacker: v })}
              />
            </div>
          </div>

        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <CalcPokemonPanel
          title="Attaccante"
          set={attacker}
          onChange={setAttacker}
          onPatch={patchAttacker}
          boosts={attackerBoosts}
          onBoostsChange={setAttackerBoosts}
          moveCrits={attackerCrits}
          onMoveCritChange={setAttackerMoveCrit}
          onEvsPatch={patchAttackerEvs}
          onResetMoveCrits={() => setAttackerCrits(EMPTY_MOVE_CRITS)}
          teamLoadOptions={teamLoadOptions.map((o) => ({
            label: o.label,
            set: cloneSet(o.set),
          }))}
        />
        <CalcPokemonPanel
          title="Difensore"
          set={defender}
          onChange={setDefender}
          onPatch={patchDefender}
          boosts={defenderBoosts}
          onBoostsChange={setDefenderBoosts}
          moveCrits={defenderCrits}
          onMoveCritChange={setDefenderMoveCrit}
          onEvsPatch={patchDefenderEvs}
          onResetMoveCrits={() => setDefenderCrits(EMPTY_MOVE_CRITS)}
          teamLoadOptions={teamLoadOptions.map((o) => ({
            label: o.label,
            set: cloneSet(o.set),
          }))}
        />
      </div>

      <section
        className="rounded-lg border border-showdown-border bg-showdown-hover/50 p-3 sm:p-4 dark:border-showdown-dark-border dark:bg-showdown-dark-panel/80"
        aria-live="polite"
      >
        <h3 className="mb-4 text-sm font-semibold text-showdown-accent">
          Risultati
        </h3>
        {!attacker || !defender ? (
          <p className="text-sm text-gray-500">
            Configura attaccante e difensore per vedere la simulazione di tutte
            le mosse.
          </p>
        ) : (
          <DamageResults
            key={`${attackerKey}|${defenderKey}|${fieldKey}|${critKey}`}
            attackerLabel={attackerLabel}
            defenderLabel={defenderLabel}
            attackerToDefender={attackerToDefender}
            defenderToAttacker={defenderToAttacker}
          />
        )}
      </section>
    </div>
  )
}
