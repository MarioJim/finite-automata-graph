import { setup_graph } from './graph';

const find_state_index = (state_name: string) =>
  window.automata.states.findIndex(s => s.name === state_name);

export const process_file = (file: string) => {
  window.automata = {
    states: [],
    alphabet: [],
    transitions: [],
    starting_state: '',
  };
  const lines = file.split('\n').map(line => line.trim()).filter(line => line !== '');

  // State names
  window.automata.states = lines.shift().split(',').map(state_name => ({
    name: state_name,
    is_finishing_state: false,
  }));

  // Alphabet
  window.automata.alphabet = lines.shift().split(',');

  // Starting state
  window.automata.starting_state = lines.shift();

  // Finishing states
  lines.shift().split(',').forEach(state_name => {
    window.automata.states.find(s => s.name === state_name).is_finishing_state = true;
  });

  // Transitions
  const transition_string_regex = /q\d+,.=>q\d+(,q\d+)*/;
  lines.forEach(transition_string => {
    if (!transition_string_regex.test(transition_string))
      return console.log(`String "${transition_string}" couldn't be parsed as a transition`);

    const split_transition = transition_string.split('=>');
    const [source_state, symbol] = split_transition[0].split(',');
    const source_index = find_state_index(source_state);
    window.automata.transitions.push(
      ...split_transition[1].split(',').map(target_state => ({
        source: source_index,
        target: find_state_index(target_state),
        symbol
      }))
    );
  });
};
