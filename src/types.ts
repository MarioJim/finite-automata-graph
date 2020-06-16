import { SimulationNodeDatum, SimulationLinkDatum } from 'd3';

export interface FiniteAutomata {
  states: State[];
  alphabet: string[];
  transitions: Transition[];
  initialState: string;
}

export interface State extends SimulationNodeDatum {
  name: string;
  isFinalState: boolean;
}

export interface Transition extends SimulationLinkDatum<State> {
  symbol: string;
}

export type AutomataSelection = 'originalNFA' | 'convertedDFA' | 'minimizedDFA';
