import { Transition, AutomataTypes, FiniteAutomata } from "./types";

const get_new_automata = (): FiniteAutomata => ({
  states: [],
  alphabet: [],
  transitions: [],
  starting_state: '',
});

const find_state_index = (state_name: string, automataType: string) =>
  window[automataType].states.findIndex(s => s.name === state_name);

const parse_original_nfa = (file: String) => {
  window[AutomataTypes.originalNFA] = get_new_automata();
  const lines = file.split('\n').map(line => line.trim()).filter(line => line !== '');
  // State names
  window[AutomataTypes.originalNFA].states = lines.shift().split(',').map(state_name => ({
    name: state_name,
    is_finishing_state: false,
  }));
  // Alphabet
  window[AutomataTypes.originalNFA].alphabet = lines.shift().split(',');
  // Starting state
  window[AutomataTypes.originalNFA].starting_state = lines.shift();
  // Finishing states
  lines.shift().split(',').forEach(state_name => {
    window[AutomataTypes.originalNFA].states.find(s => s.name === state_name).is_finishing_state = true;
  });
  // Transitions
  lines.forEach(transition_string => {
    const split_transition = transition_string.split('=>');
    const [source_state, symbol] = split_transition[0].split(',');
    const source_index = find_state_index(source_state, AutomataTypes.originalNFA);
    window[AutomataTypes.originalNFA].transitions.push(
      ...split_transition[1].split(',').map(target_state => ({
        source: source_index,
        target: find_state_index(target_state, AutomataTypes.originalNFA),
        symbol
      }))
    );
  });
};

export const process_file = (file: string) => {
  parse_original_nfa(file);
};
