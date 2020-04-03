export const process_file = (file: string) => {
  window.automata = {
    states: [],
    language: [],
    starting_state_index: -1,
  };
  const lines = file.split('\n').map(line => line.trim()).filter(line => line !== '');
  // State names
  window.automata.states = lines.shift().split(',')
    .map(name => ({ name, is_finishing_state: false, transitions: {}, }));
  // Language
  window.automata.language = lines.shift().split(',');
  // Starting state
  const starting_state = lines.shift();
  window.automata.starting_state_index =
    window.automata.states.findIndex(state => state.name === starting_state);
  // Finishing states
  lines.shift().split(',').forEach(state_name => {
    window.automata.states.find(state => state.name === state_name).is_finishing_state = true;
  });
  // Transitions
  const transition_string_regex = /q\d+,.=>q\d+(,q\d+)*/;
  lines.forEach(transition_string => {
    if (!transition_string_regex.test(transition_string))
      return console.log(`String "${transition_string}" couldn't be parsed as a transition`);

    const split_transition = transition_string.split('=>');
    const [state_name, symbol] = split_transition[0].split(',');
    const state_index = window.automata.states.findIndex(state => state.name === state_name);
    window.automata.states[state_index].transitions[symbol] = split_transition[1]
      .split(',')
      .map(state_name => window.automata.states.findIndex(state => state.name === state_name));
  });

  console.log(window.automata);
};
