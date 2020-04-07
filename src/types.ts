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

interface Transition extends SimulationLinkDatum<State> {
  symbol: string
}
