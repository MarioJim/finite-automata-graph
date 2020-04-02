document.addEventListener('readystatechange', () => {
  if (document.readyState === 'interactive') {
    console.log('Page has finished loading');
    addDropListener();
  }
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

    console.log(event);

    Array.from(event.dataTransfer.files).forEach(file => {
      if (file.type !== 'text/plain') return;
      const reader = new FileReader();
      reader.onload = event => console.log(event.target.result);
      reader.readAsText(file);
    });
  };
};
