document.addEventListener('readystatechange', () => {
  if (document.readyState === 'interactive') {
    console.log('Page has finished loading');
  }
});
