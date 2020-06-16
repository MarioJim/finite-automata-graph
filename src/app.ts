import {
  parseOriginalNFA,
  convertNFA2DFA,
  minimizeDFA,
} from './automata_processor';
import { displayGraphs } from './graph';
import { FiniteAutomata } from './types';

declare global {
  interface Window {
    originalNFA: FiniteAutomata;
    convertedDFA: FiniteAutomata;
    minimizedDFA: FiniteAutomata;
  }
}

// When document is ready, call addDropListener
document.addEventListener('readystatechange', () => {
  if (document.readyState === 'interactive') {
    addDropListener();
    enableExampleButtons();
    enableReturnButton();
  }
});

const ignoreEvent = (event: DragEvent) => {
  event.stopPropagation();
  event.preventDefault();
};

/**
 * Adds the drop listener to the element #page.
 *
 * When an plain text file is dropped into the area, recievedFile
 * is called with the string of the file as a parameter.
 */
const addDropListener = () => {
  const page = document.getElementsByTagName('body')[0];
  page.ondragenter = ignoreEvent;
  page.ondragover = ignoreEvent;
  page.ondrop = (event) => {
    ignoreEvent(event);
    if (event.dataTransfer.files.length !== 1) return;
    const file = event.dataTransfer.files[0];
    if (file.type !== 'text/plain') return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target.result === 'string')
        recievedFile(event.target.result);
    };
    reader.readAsText(file);
  };
};

/**
 * Adds an onclick callback to every button in div#buttons
 */
const enableExampleButtons = () => {
  const buttonsDiv = document.getElementById('buttons');
  Array.from(buttonsDiv.getElementsByTagName('button')).forEach((child, i) => {
    child.onclick = async () => {
      const response = await fetch(`${i + 1}.txt`);
      const file = await response.text();
      recievedFile(file);
    };
  });
};

const enableReturnButton = () => {
  const returnBtn = document.getElementById('return-btn') as HTMLButtonElement;
  returnBtn.onclick = () => {
    document.getElementById('start-page').style.display = 'flex';
    ['page1', 'page2', 'page3'].forEach((pageID) => {
      document.getElementById(pageID).style.display = 'none';
    });
    document.getElementById('return-btn').style.display = 'none';
  };
};

/**
 * Processes the recieved file
 * @param file
 */
const recievedFile = (file: string) => {
  document.getElementById('start-page').style.display = 'none';
  document.getElementById('return-btn').style.display = 'block';

  parseOriginalNFA(file);
  convertNFA2DFA();
  minimizeDFA();
  displayGraphs();
};
