import { SimulationNodeDatum, SimulationLinkDatum } from 'd3';

export interface FiniteAutomata {
  states: State[]
  alphabet: string[]
  transitions: Transition[]
  initial_state: string
}

export interface State extends SimulationNodeDatum {
  name: string
  is_finishing_state: boolean
}

export interface Transition extends SimulationLinkDatum<State> {
  symbol: string
}

export type AutomataSelection = 'original_NFA' | 'converted_DFA' | 'minimized_DFA';
