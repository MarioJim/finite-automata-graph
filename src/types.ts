export interface FiniteAutomata {
  states: State[]
  language: string[]
  starting_state_index: number
}

interface State {
  name: string
  is_finishing_state: boolean
  transitions: Transitions
}

interface Transitions {
  [key: string]: number[]
}
