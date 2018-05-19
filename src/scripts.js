var recentPulse = 0;

window.addEventListener('load', function initMixer() {
  var elHeartRate = document.getElementById('heart-rate');
  var elScares = document.getElementById('heart-rate-scare-number');
  var scares = 0;

  mixer.display.position().subscribe(handleVideoResized);

  mixer.socket.on('onControlUpdate', handleControlUpdate);

  // Move the video by a static offset amount
  const offset = 50;
  mixer.display.moveVideo({
    top: offset,
    bottom: offset + offset + 10,
    left: offset,
    right: offset,
  });

  Chart.defaults.global.tooltips = false;

  var ctx = document.getElementById("pulse").getContext('2d');
  var myChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: "",
        data: [],
        borderColor: 'green',
        fill: false,
        lineTension: 0.1
      }]
    },
    options: {
      legend: {
        display: false
      },
      scales: {
        yAxes: [{
          ticks: {
            min: 60
          }
        }],
        xAxes: [{
          type: 'realtime',
          // position: 'bottom',
          display: false
        }]
      },
      plugins: {
        streaming: { // enabled by default
          duration: 20000, // data in the past 20000 ms will be displayed
          refresh: 1000, // onRefresh callback will be called every 1000 ms
          delay: 1000, // delay of 1000 ms, so upcoming values are known before plotting a line
          frameRate: 30, // chart is drawn 30 times every second

          // a callback to update datasets
          onRefresh: function (chart) {
            const newPulse = recentPulse;
            if (newPulse > 130) {
              scares++;
              elScares.innerText = scares;
            }
            elHeartRate.innerText = newPulse.toFixed(0);
            chart.data.datasets[0].data.push({
              x: Date.now(),
              y: newPulse
            });
          }
        }
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

function handleControlUpdate (update) {
  const control = update.controls[0];
  if (control.controlID === 'pulse') {
    recentPulse = control.meta.pulse.value;
  } else {
    recentScare = control.meta.scares.value;
  }
}

function handleScareUpdate (update) {
  
}