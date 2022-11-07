;(function(){
  const ws = new WebSocket('ws://localhost:8081');

  ws.onmessage = (event) => {
    if (event.data === 'changed') {
      location.reload();
    };
  }
})();