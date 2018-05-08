window.addEventListener('load', function initMixer() {
  mixer.display.position().subscribe(handleVideoResized);

  // Move the video by a static offset amount
  const offset = 50;
  mixer.display.moveVideo({
    top: offset,
    bottom: offset + offset + 10,
    left: offset,
    right: offset,
  });


  var ctx = document.getElementById("pulse").getContext('2d');
  var myChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: '',
        data: [80, 110, 122, 128, 124, 120, 40],
        backgroundColor: 'rgba(0, 0, 0, 0.0)',
        borderColor: 'green',
        borderWidth: 2
      }, ]
    },
    options: {
      legend: {
        display: false
      }
    }
  });

  mixer.isLoaded();
});

function handleVideoResized(position) {
  const overlay = document.getElementById('spook-panel');
  const player = position.connectedPlayer;
  overlay.style.position = 'absolute';
  overlay.style.top = `${player.top + player.height}px`;
  overlay.style.left = `${player.left}px`;
  overlay.style.width = `${player.width - 20}px`;
}
