import { parse_original_NFA, convert_NFA_to_DFA, minimize_DFA } from './automata_processor';
import { display_graphs } from './graph';
import { FiniteAutomata } from './types';

declare global {
  interface Window {
    original_NFA: FiniteAutomata
    converted_DFA: FiniteAutomata
    minimized_DFA: FiniteAutomata
  }
}

// When document is ready, call add_drop_listener
document.addEventListener('readystatechange', () => {
  if (document.readyState === 'interactive') {
    add_drop_listener();
  }
});

const ignore_event = (event: DragEvent) => {
  event.stopPropagation();
  event.preventDefault();
};

/**
 * Adds the drop listener to the element #page.
 * 
 * When an plain text file is dropped into the area, recieved_file
 * is called with the string of the file as a parameter.
 */
const add_drop_listener = () => {
  const page = document.getElementsByTagName('body')[0];
  page.ondragenter = ignore_event;
  page.ondragover = ignore_event;
  page.ondrop = event => {
    ignore_event(event);
    if (event.dataTransfer.files.length !== 1) return;
    const file = event.dataTransfer.files[0];
    if (file.type !== 'text/plain') return;
    const reader = new FileReader();
    reader.onload = event => {
      if (typeof event.target.result === 'string')
        recieved_file(event.target.result);
    };
    reader.readAsText(file);
  };
};

/**
 * Processes the recieved file
 * @param file 
 */
const recieved_file = (file: string) => {
  parse_original_NFA(file);
  console.log('original_NFA', window.original_NFA);
  convert_NFA_to_DFA();
  console.log('converted_DFA', window.converted_DFA);
  minimize_DFA();
  console.log('minimized_DFA', window.minimized_DFA);
  display_graphs();
};
