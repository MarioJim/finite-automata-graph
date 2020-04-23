import { FiniteAutomata } from './types';

const get_new_automata = (): FiniteAutomata =>
  ({ states: [], alphabet: [], transitions: [], initial_state: '', });

/**
 * Function to get the index from a state name in the original NFA
 * @param state_name the state name
 */
const find_state_index = (state_name: string) =>
  window.original_NFA.states.findIndex(s => s.name === state_name);

/**
 * Parses the file into an automata saved at window
 * @param file the file to be parsed
 */
export const parse_original_NFA = (file: String) => {
  window.original_NFA = get_new_automata();
  // Split the file into lines
  const lines = file.split('\n').map(line => line.trim()).filter(line => line !== '');
  // State names
  window.original_NFA.states = lines.shift().split(',').map(state_name => ({
    name: state_name,
    is_finishing_state: false,
  }));
  // Alphabet
  window.original_NFA.alphabet = lines.shift().split(',');
  // Starting state
  window.original_NFA.initial_state = lines.shift();
  // Finishing states
  lines.shift().split(',').forEach(state_name => {
    window.original_NFA.states[find_state_index(state_name)].is_finishing_state = true;
  });
  // Transitions
  lines.forEach(transition_string => {
    const split_transition = transition_string.split('=>');
    const [source_state, symbol] = split_transition[0].split(',');
    const source = find_state_index(source_state);
    window.original_NFA.transitions.push(
      ...split_transition[1].split(',').map(target_state => ({
        source,
        target: find_state_index(target_state),
        symbol
      }))
    );
  });
};

/**
 * Converts the NFA currently saved in window into an DFA saved also
 * in window.
 */
export const convert_NFA_to_DFA = () => {
  window.converted_DFA = get_new_automata();
  // Copy initial state and alphabet from original NFA
  window.converted_DFA.initial_state = window.original_NFA.initial_state;
  window.converted_DFA.alphabet = Array.from(window.original_NFA.alphabet);

  /* Build NFA table */
  const NFA: {
    [key: string]: {
      [key: string]: string[]
    }
  } = {};
  window.original_NFA.states.forEach(state => {
    NFA[state.name] = {};
    window.original_NFA.alphabet.forEach(symbol => {
      NFA[state.name][symbol] = [];
    });
  });
  // Function to get the name from a index in the original states
  const index_to_name = (index: any): string =>
    window.original_NFA.states[index].name;
  // For every transition registered, build the NFA table
  window.original_NFA.transitions.forEach(trans => {
    NFA[index_to_name(trans.source)][trans.symbol].push(index_to_name(trans.target));
  });

  /* Build DFA table */
  const DFA: {
    [key: string]: {
      [key: string]: string
    }
  } = {};
  DFA[window.converted_DFA.initial_state] = {};
  // For every symbol in the alphabet...
  window.original_NFA.alphabet.forEach(symbol => {
    // Generate the new state name
    const new_state = NFA[window.converted_DFA.initial_state][symbol].sort().join(',');
    // Set it as the resulting state from the initial state
    DFA[window.converted_DFA.initial_state][symbol] = new_state;
    // Add it to the states table it it isn't empty
    if (new_state !== '')
      DFA[new_state] = undefined;
  });
  // Get the states that haven't been calculated
  let array_of_undefined_states = Object.keys(DFA).filter(key => typeof DFA[key] === 'undefined');
  while (array_of_undefined_states.length !== 0) {
    // For every state that hasn't been initialized...
    array_of_undefined_states.forEach(undefined_state => {
      // Initialize it as a empty object
      DFA[undefined_state] = {};
      // Get the transitions from every state that composes the undefined state
      const state_transitions = undefined_state.split(',').map(state => NFA[state]);
      // For every symbol in the alphabet...
      window.original_NFA.alphabet.forEach(symbol => {
        // Calculate the ending set of states (no repeating elements)
        const set_of_ending_states = new Set(state_transitions.flatMap(trans => trans[symbol]));
        // Convert it into an array, sort it and put them together
        const new_state_name = Array.from(set_of_ending_states).sort().join(',');
        // Set it as the resulting state from the undefined state
        DFA[undefined_state][symbol] = new_state_name;
        // If it hasn't been calculated and it isn't empty, add it to the states table
        if (new_state_name !== '' && !Object.keys(DFA).includes(new_state_name))
          DFA[new_state_name] = undefined;
      });
    });
    // Get the states that haven't been calculated
    array_of_undefined_states = Object.keys(DFA).filter(key => typeof DFA[key] === 'undefined');
  }

  /* Convert the DFA table into a FiniteAutomata struct */
  // Setup states of the converted DFA
  window.converted_DFA.states = Object.keys(DFA).map(name => {
    // Check if any state that composes this one is a finishing state in the original NFA
    const is_finishing_state = name.split(',').some(state_name =>
      window.original_NFA.states[find_state_index(state_name)].is_finishing_state
    );
    return { name, is_finishing_state, };
  });
  // For every source_state: transitions relation in DFA
  Object.entries(DFA).forEach(([source_state, transitions]) => {
    // Get the index of the source state
    const source = window.converted_DFA.states.findIndex(s => s.name === source_state);
    // For every symbol: target_state relation in transitions
    Object.entries(transitions).forEach(([symbol, target_state]) => {
      // Get the index of the target state
      const target = window.converted_DFA.states.findIndex(s => s.name === target_state);
      // If the index was found (it wasn't the sink state) add it to the transitions array
      if (target !== -1)
        window.converted_DFA.transitions.push({ symbol, source, target, });
    });
  });
};

/**
 * Minimizes the DFA currently saved in window and saves also in the 
 * window
 */
export const minimize_DFA = () => {
  window.minimized_DFA = get_new_automata();
  // Copy initial state and alphabet from original NFA
  window.minimized_DFA.initial_state = window.converted_DFA.initial_state;
  window.minimized_DFA.alphabet = Array.from(window.converted_DFA.alphabet);

  // No tiene tipo, por eso no sugiere nada
  // Lo creo para crear un "id" para cada estado, que consiste de transiciones y si es estado final
  // La idea es que si un id es igual a otro, puedes juntar ambos estados
  const minDFA: any = {};
  // Empiezo con si es final
  window.converted_DFA.states.forEach(state => {
    minDFA[state.name] = [state.is_finishing_state];
  });
  // Le añado sus transiciones
  window.converted_DFA.transitions.forEach(transition => {
    minDFA[window.converted_DFA.states[(transition.source as number)].name]
      .push('' + transition.symbol + transition.target);
  });
  // Las ordeno y las junto
  Object.keys(minDFA).forEach(key => {
    const value = minDFA[key].sort().join(':');
    minDFA[key] = value;
  });
  // Las imprimo en la consola
  console.log(minDFA);

  // Seguiría buscar si hay ids iguales
  // Les sugiero ordenarlos y comparar entre pares
  // Está medio culero volverlo a poner en el formato necesario para que lo muestre el d3
  // Pero pueden checar el archivo de types para ver más o menos la estructura
  // El grafo se leería de una estructura FiniteAutomata en window.minimized_DFA
  // Ya tiene alphabet e initial state, falta volver a poner states y transitions
};
