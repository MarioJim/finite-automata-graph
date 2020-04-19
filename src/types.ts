import { SimulationNodeDatum, SimulationLinkDatum } from "d3";

export interface FiniteAutomata {
  states: State[]
  alphabet: string[]
  transitions: Transition[]
  starting_state: string
}

export interface State extends SimulationNodeDatum {
  name: string
  is_finishing_state: boolean
}

export interface Transition extends SimulationLinkDatum<State> {
  symbol: string
}

export const AutomataTypes = {
  originalNFA: 'originalNFA',
  convertedDFA: 'convertedDFA',
  minimizedDFA: 'minimizedDFA',
};

export type AutomatasInWindow = {
  [key in keyof typeof AutomataTypes]: FiniteAutomata
};
