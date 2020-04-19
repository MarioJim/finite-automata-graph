import { process_file } from './file_processor';
import { setup_graph } from './graph';
import { AutomataTypes, AutomatasInWindow, FiniteAutomata } from './types';

declare global {
  interface Window extends AutomatasInWindow {
    [index: string]: FiniteAutomata
  }
}

document.addEventListener('readystatechange', () => {
  if (document.readyState === 'interactive') addDropListener();
});

const ignore_event = (event: DragEvent) => {
  event.stopPropagation();
  event.preventDefault();
};

const addDropListener = () => {
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

const recieved_file = (file: string) => {
  process_file(file);
  console.log(window[AutomataTypes.originalNFA]);
  setup_graph(AutomataTypes.originalNFA);
};
