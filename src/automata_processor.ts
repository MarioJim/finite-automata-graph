import { FiniteAutomata, AutomataSelection } from './types';

const get_new_automata = (): FiniteAutomata =>
  ({ states: [], alphabet: [], transitions: [], initial_state: '', });

/**
 * Searches the transitions for ones that have equal source and target,
 * and merges its symbols into one so they don't overlap in the graphic
 * @param automata the automata to apply it to
 */
const merge_transitions = (automata: AutomataSelection) => {
  const transitions_ids: {
    [key: string]: string[]
  } = {};
  // For each transition in the automata...
  window[automata].transitions.forEach(transition => {
    // Generate an id joining its source and its target
    const id = `${transition.source}_${transition.target}`;
    // Create an array if it hasn't been created
    transitions_ids[id] = transitions_ids[id] || [];
    // Add the symbol to its array
    transitions_ids[id].push(transition.symbol);
  });
  // For each key-value pair in transitions_id...
  Object.entries(transitions_ids).forEach(transition_group => {
    // If the transition is unique, do nothing
    if (transition_group[1].length === 1) return;
    // If it isn't, parse the source and target
    const source = +transition_group[0].split('_')[0];
    const target = +transition_group[0].split('_')[1];
    // Filter out every transition that has the same source and target
    window[automata].transitions = window[automata].transitions
      .filter(transition => transition.source !== source || transition.target !== target);
    // Make symbols unique (if there are repeated transitions) and merge them together
    const symbol = Array.from(new Set(transition_group[1])).join(',');
    // Add the new transition
    window[automata].transitions.push({ source, target, symbol, });
  });
};

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
    is_final_state: false,
  }));
  // Alphabet
  window.original_NFA.alphabet = lines.shift().split(',');
  // Starting state
  window.original_NFA.initial_state = lines.shift();
  // Finishing states
  lines.shift().split(',').forEach(state_name => {
    window.original_NFA.states[find_state_index(state_name)].is_final_state = true;
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
  merge_transitions('original_NFA');
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
    trans.symbol.split(',').forEach(symbol => {
      NFA[index_to_name(trans.source)][symbol].push(index_to_name(trans.target));
    })
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
      DFA[new_state] = null;
  });
  // Get the states that haven't been calculated
  let array_of_null_states = Object.keys(DFA).filter(key => DFA[key] === null);
  while (array_of_null_states.length !== 0) {
    // For every state that hasn't been initialized...
    array_of_null_states.forEach(null_state => {
      // Initialize it as a empty object
      DFA[null_state] = {};
      // Get the transitions from every state that composes the null state
      const state_transitions = null_state.split(',').map(state => NFA[state]);
      // For every symbol in the alphabet...
      window.original_NFA.alphabet.forEach(symbol => {
        // Calculate the ending set of states (no repeating elements)
        const set_of_ending_states = new Set(state_transitions.flatMap(trans => trans[symbol]));
        // Convert it into an array, sort it and put them together
        const new_state_name = Array.from(set_of_ending_states).sort().join(',');
        // Set it as the resulting state from the null state
        DFA[null_state][symbol] = new_state_name;
        // If it hasn't been calculated and it isn't empty, add it to the states table
        if (new_state_name !== '' && !Object.keys(DFA).includes(new_state_name))
          DFA[new_state_name] = null;
      });
    });
    // Get the states that haven't been calculated
    array_of_null_states = Object.keys(DFA).filter(key => DFA[key] === null);
  }

  /* Convert the DFA table into a FiniteAutomata struct */
  // Setup states of the converted DFA
  window.converted_DFA.states = Object.keys(DFA).map(name => {
    // Check if any state that composes this one is a finishing state in the original NFA
    const is_final_state = name.split(',').some(state_name =>
      window.original_NFA.states[find_state_index(state_name)].is_final_state
    );
    return { name, is_final_state, };
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
  merge_transitions('converted_DFA');
};

/**
 * Minimizes the DFA currently saved in window and saves also in the 
 * window
 */
export const minimize_DFA = () => {
  window.minimized_DFA = get_new_automata();
  // Copy the alphabet from converted DFA
  window.minimized_DFA.alphabet = Array.from(window.converted_DFA.alphabet);

  // To minimize a DFA, we have to find states that have the same transitions
  // and are either final or not final, so the main idea is concatenating
  // this parameters into a string 'id'. This object saves relations between
  // the state names and their ids
  const minDFA: {
    [key: string]: string[]
  } = {};
  // Add the first part, if the state is final
  window.converted_DFA.states.forEach(state => {
    minDFA[state.name] = ['' + +state.is_final_state];
  });
  // Add the transitions also
  window.converted_DFA.transitions.forEach(transition => {
    minDFA[window.converted_DFA.states[(transition.source as number)].name]
      .push('' + transition.symbol + transition.target);
  });
  // Sort the id parts and merge them into the final id
  Object.keys(minDFA).forEach(key => {
    const value = minDFA[key].sort().join(':');
    minDFA[key] = [value];
  });
  // Reverse the relations, into an object formed by id: state_name[]
  const reversed_obj: {
    [key: string]: string[]
  } = {};
  Object.entries(minDFA).forEach(([state_name, [id]]) => {
    reversed_obj[id] = reversed_obj[id] || [state_name];
    reversed_obj[id].push(state_name);
  });
  // Map the old names to their new names
  const state_mappings_names = Object.fromEntries(
    Object.values(reversed_obj)
      .flatMap(equal_states => equal_states.map(state => [state, equal_states[0]]))
  );
  // Select the state names that should be deleted
  const states_to_be_deleted = Object.entries(state_mappings_names)
    .map(entry => entry[0] !== entry[1] ? entry[0] : undefined)
    .filter(state_name => !!state_name);
  // Filter from the old states the new states
  const new_states = window.converted_DFA.states
    .filter(state => !states_to_be_deleted.includes(state.name));
  // Create the mapping between the old names/indexes to the new indexes
  const state_mappings_indexes = Object.fromEntries(
    Object.entries(state_mappings_names).map(([old_state_name, new_state_name]) => {
      const old_state_index = window.converted_DFA.states.findIndex(s => s.name === old_state_name);
      const new_state_index = new_states.findIndex(s => s.name === new_state_name);
      return [old_state_index, new_state_index];
    })
  );
  // Rename the states from the new states array
  window.minimized_DFA.states = new_states.map(({ name, is_final_state }, i) => {
    const new_name = `q${String.fromCharCode(i + 65)}`;
    // Set the initial state
    if (name === window.converted_DFA.initial_state)
      window.minimized_DFA.initial_state = new_name;
    return ({ name: new_name, is_final_state });
  });
  // Change the indexes from the transitions to the new indexes mapping
  window.minimized_DFA.transitions = window.converted_DFA.transitions
    .map(({ source, target, symbol }) => ({
      source: state_mappings_indexes[(source as number)],
      target: state_mappings_indexes[(target as number)],
      symbol,
    }));
  merge_transitions('minimized_DFA');
};
