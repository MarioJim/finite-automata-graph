import { parse_original_NFA, convert_NFA_to_DFA, minimize_DFA } from './automata_processor';
import { setup_graph } from './graph';
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
    add_button_listeners();
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
  const page = document.getElementById('page');
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
 * Adds the corresponding button listeners to the buttons in
 * the header
 */
const add_button_listeners = () => {
  document.getElementById('originalNFABtn').onclick = () => {
    setup_graph('original_NFA');
  };
  document.getElementById('convertToDFABtn').onclick = () => {
    setup_graph('converted_DFA');
  };
  document.getElementById('minimizeDFABtn').onclick = () => {
    setup_graph('minimized_DFA');
  };
};

/**
 * Processes the recieved file
 * @param file 
 */
const recieved_file = (file: string) => {
  parse_original_NFA(file);
  console.log(window.original_NFA);
  convert_NFA_to_DFA();
  console.log(window.converted_DFA);
  minimize_DFA();
  setup_graph('original_NFA');
};
