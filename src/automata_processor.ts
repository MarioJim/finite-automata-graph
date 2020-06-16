import { FiniteAutomata, AutomataSelection } from './types';

const getNewAutomata = (): FiniteAutomata => ({
  states: [],
  alphabet: [],
  transitions: [],
  initialState: '',
});

/**
 * Searches the transitions for ones that have equal source and target,
 * and merges its symbols into one so they don't overlap in the graphic
 * @param automata the automata to apply it to
 */
const mergeTransitions = (automata: AutomataSelection) => {
  const transitionsIDs: {
    [key: string]: string[];
  } = {};
  // For each transition in the automata...
  window[automata].transitions.forEach((transition) => {
    // Generate an id joining its source and its target
    const id = `${transition.source}_${transition.target}`;
    // Create an array if it hasn't been created
    transitionsIDs[id] = transitionsIDs[id] || [];
    // Add the symbol to its array
    transitionsIDs[id].push(transition.symbol);
  });
  // For each key-value pair in transitionsID...
  Object.entries(transitionsIDs).forEach((transitionGroup) => {
    // If the transition is unique, do nothing
    if (transitionGroup[1].length === 1) return;
    // If it isn't, parse the source and target
    const source = +transitionGroup[0].split('_')[0];
    const target = +transitionGroup[0].split('_')[1];
    // Filter out every transition that has the same source and target
    window[automata].transitions = window[automata].transitions.filter(
      (transition) =>
        transition.source !== source || transition.target !== target,
    );
    // Make symbols unique (if there are repeated transitions) and merge them together
    const symbol = Array.from(new Set(transitionGroup[1])).join(',');
    // Add the new transition
    window[automata].transitions.push({ source, target, symbol });
  });
};

/**
 * Function to get the index from a state name in the original NFA
 * @param stateName the state name
 */
const findStateIndex = (stateName: string) =>
  window.originalNFA.states.findIndex((s) => s.name === stateName);

/**
 * Parses the file into an automata saved at window
 * @param file the file to be parsed
 */
export const parseOriginalNFA = (file: String) => {
  window.originalNFA = getNewAutomata();
  // Split the file into lines
  const lines = file
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
  // State names
  window.originalNFA.states = lines
    .shift()
    .split(',')
    .map((stateName) => ({
      name: stateName,
      isFinalState: false,
    }));
  // Alphabet
  window.originalNFA.alphabet = lines.shift().split(',');
  // Starting state
  window.originalNFA.initialState = lines.shift();
  // Finishing states
  lines
    .shift()
    .split(',')
    .forEach((stateName) => {
      window.originalNFA.states[findStateIndex(stateName)].isFinalState = true;
    });
  // Transitions
  lines.forEach((transitionString) => {
    const splitTransition = transitionString.split('=>');
    const [sourceState, symbol] = splitTransition[0].split(',');
    const source = findStateIndex(sourceState);
    window.originalNFA.transitions.push(
      ...splitTransition[1].split(',').map((targetState) => ({
        source,
        target: findStateIndex(targetState),
        symbol,
      })),
    );
  });
  mergeTransitions('originalNFA');
};

/**
 * Converts the NFA currently saved in window into an DFA saved also
 * in window.
 */
export const convertNFA2DFA = () => {
  window.convertedDFA = getNewAutomata();
  // Copy initial state and alphabet from original NFA
  window.convertedDFA.initialState = window.originalNFA.initialState;
  window.convertedDFA.alphabet = Array.from(window.originalNFA.alphabet);

  /* Build NFA table */
  const NFA: {
    [key: string]: {
      [key: string]: string[];
    };
  } = {};
  window.originalNFA.states.forEach((state) => {
    NFA[state.name] = {};
    window.originalNFA.alphabet.forEach((symbol) => {
      NFA[state.name][symbol] = [];
    });
  });
  // Function to get the name from a index in the original states
  const indexToName = (index: any): string =>
    window.originalNFA.states[index].name;
  // For every transition registered, build the NFA table
  window.originalNFA.transitions.forEach((trans) => {
    trans.symbol.split(',').forEach((symbol) => {
      NFA[indexToName(trans.source)][symbol].push(indexToName(trans.target));
    });
  });

  /* Build DFA table */
  const DFA: {
    [key: string]: {
      [key: string]: string;
    };
  } = {};
  DFA[window.convertedDFA.initialState] = {};
  // For every symbol in the alphabet...
  window.originalNFA.alphabet.forEach((symbol) => {
    // Generate the new state name
    const newState = NFA[window.convertedDFA.initialState][symbol]
      .sort()
      .join(',');
    // Set it as the resulting state from the initial state
    DFA[window.convertedDFA.initialState][symbol] = newState;
    // Add it to the states table it it isn't empty
    if (newState !== '') DFA[newState] = null;
  });
  // Get the states that haven't been calculated
  let arrayOfNullStates = Object.keys(DFA).filter((key) => DFA[key] === null);
  while (arrayOfNullStates.length !== 0) {
    // For every state that hasn't been initialized...
    arrayOfNullStates.forEach((nullState) => {
      // Initialize it as a empty object
      DFA[nullState] = {};
      // Get the transitions from every state that composes the null state
      const stateTransitions = nullState.split(',').map((state) => NFA[state]);
      // For every symbol in the alphabet...
      window.originalNFA.alphabet.forEach((symbol) => {
        // Calculate the ending set of states (no repeating elements)
        const setOfEndingStates = new Set(
          stateTransitions.flatMap((trans) => trans[symbol]),
        );
        // Convert it into an array, sort it and put them together
        const newStateName = Array.from(setOfEndingStates).sort().join(',');
        // Set it as the resulting state from the null state
        DFA[nullState][symbol] = newStateName;
        // If it hasn't been calculated and it isn't empty, add it to the states table
        if (newStateName !== '' && !Object.keys(DFA).includes(newStateName))
          DFA[newStateName] = null;
      });
    });
    // Get the states that haven't been calculated
    arrayOfNullStates = Object.keys(DFA).filter((key) => DFA[key] === null);
  }

  /* Convert the DFA table into a FiniteAutomata struct */
  // Setup states of the converted DFA
  window.convertedDFA.states = Object.keys(DFA).map((name) => {
    // Check if any state that composes this one is a finishing state in the original NFA
    const isFinalState = name
      .split(',')
      .some(
        (stateName) =>
          window.originalNFA.states[findStateIndex(stateName)].isFinalState,
      );
    return { name, isFinalState };
  });
  // For every sourceState: transitions relation in DFA
  Object.entries(DFA).forEach(([sourceState, transitions]) => {
    // Get the index of the source state
    const source = window.convertedDFA.states.findIndex(
      (s) => s.name === sourceState,
    );
    // For every symbol: targetState relation in transitions
    Object.entries(transitions).forEach(([symbol, targetState]) => {
      // Get the index of the target state
      const target = window.convertedDFA.states.findIndex(
        (s) => s.name === targetState,
      );
      // If the index was found (it wasn't the sink state) add it to the transitions array
      if (target !== -1)
        window.convertedDFA.transitions.push({ symbol, source, target });
    });
  });
  mergeTransitions('convertedDFA');
};

/**
 * Minimizes the DFA currently saved in window and saves also in the
 * window
 */
export const minimizeDFA = () => {
  window.minimizedDFA = getNewAutomata();
  // Copy the alphabet from converted DFA
  window.minimizedDFA.alphabet = Array.from(window.convertedDFA.alphabet);

  // To minimize a DFA, we have to find states that have the same transitions
  // and are either final or not final, so the main idea is concatenating
  // this parameters into a string 'id'. This object saves relations between
  // the state names and their ids
  const minDFA: {
    [key: string]: string[];
  } = {};
  // Add the first part, if the state is final
  window.convertedDFA.states.forEach((state) => {
    minDFA[state.name] = ['' + +state.isFinalState];
  });
  // Add the transitions also
  window.convertedDFA.transitions.forEach((transition) => {
    minDFA[window.convertedDFA.states[transition.source as number].name].push(
      '' + transition.symbol + transition.target,
    );
  });
  // Sort the id parts and merge them into the final id
  Object.keys(minDFA).forEach((key) => {
    const value = minDFA[key].sort().join(':');
    minDFA[key] = [value];
  });
  // Reverse the relations, into an object formed by id: stateName[]
  const reversedObj: {
    [key: string]: string[];
  } = {};
  Object.entries(minDFA).forEach(([stateName, [id]]) => {
    reversedObj[id] = reversedObj[id] || [stateName];
    reversedObj[id].push(stateName);
  });
  // Map the old names to their new names
  const stateMappingsNames = Object.fromEntries(
    Object.values(reversedObj).flatMap((equalStates) =>
      equalStates.map((state) => [state, equalStates[0]]),
    ),
  );
  // Select the state names that should be deleted
  const statesToBeDeleted = Object.entries(stateMappingsNames)
    .map((entry) => (entry[0] !== entry[1] ? entry[0] : undefined))
    .filter((stateName) => !!stateName);
  // Filter from the old states the new states
  const newStates = window.convertedDFA.states.filter(
    (state) => !statesToBeDeleted.includes(state.name),
  );
  // Create the mapping between the old names/indexes to the new indexes
  const stateMappingsIndexes = Object.fromEntries(
    Object.entries(stateMappingsNames).map(([oldStateName, newStateName]) => {
      const oldStateIndex = window.convertedDFA.states.findIndex(
        (s) => s.name === oldStateName,
      );
      const newStateIndex = newStates.findIndex((s) => s.name === newStateName);
      return [oldStateIndex, newStateIndex];
    }),
  );
  // Rename the states from the new states array
  window.minimizedDFA.states = newStates.map(({ name, isFinalState }, i) => {
    const newName = `q${String.fromCharCode(i + 65)}`;
    // Set the initial state
    if (name === window.convertedDFA.initialState)
      window.minimizedDFA.initialState = newName;
    return { name: newName, isFinalState };
  });
  // Change the indexes from the transitions to the new indexes mapping
  window.minimizedDFA.transitions = window.convertedDFA.transitions.map(
    ({ source, target, symbol }) => ({
      source: stateMappingsIndexes[source as number],
      target: stateMappingsIndexes[target as number],
      symbol,
    }),
  );
  mergeTransitions('minimizedDFA');
};
