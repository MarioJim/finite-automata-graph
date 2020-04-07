import { process_file } from './file_processor';
import { setup_graph } from './graph';
import { FiniteAutomata } from './types';

declare global {
  interface Window {
    automata: FiniteAutomata
  }
}

document.addEventListener('readystatechange', () => {
  if (document.readyState === 'interactive')
    addDropListener();
});

const ignoreEvent = (event: DragEvent) => {
  event.stopPropagation();
  event.preventDefault();
};

const addDropListener = () => {
  const page = document.getElementById('page');
  page.ondragenter = ignoreEvent;
  page.ondragover = ignoreEvent;
  page.ondrop = event => {
    ignoreEvent(event);
    if (event.dataTransfer.files.length !== 1) return;
    const file = event.dataTransfer.files[0];
    if (file.type !== 'text/plain') return;
    const reader = new FileReader();
    reader.onload = event => {
      if (typeof event.target.result === 'string')
        recievedFile(event.target.result);
    };
    reader.readAsText(file);
  };
};

const recievedFile = (file: string) => {
  process_file(file);
  console.log(window.automata);
  setup_graph();
};
