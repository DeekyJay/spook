var recentPulse = 0;
var shakeInterval;

window.addEventListener('load', function initMixer() {
  var elHeartRate = document.getElementById('heart-rate');
  var elScares = document.getElementById('heart-rate-scare-number');
  var elGhost = document.getElementById('ghost-image');
  var elGhostMsg = document.getElementById('ghost-message');
  var scares = 0;

  mixer.display.position().subscribe(handleVideoResized);

  mixer.socket.on('onControlUpdate', handleControlUpdate);

  shakeit(elGhost);
  shakeInterval = setInterval(function () {
    shakeit(elGhost);
  }, 5000);

  elGhost.addEventListener('mouseover', function (ev) {
    clearInterval(shakeInterval);
    elGhost.style = '';
    elGhost.setAttribute('class', 'hover');
    elGhostMsg.setAttribute('class', 'hover');
  });

  elGhost.addEventListener('mouseout', function (ev) {
    shakeInterval = setInterval(function () {
      shakeit(elGhost);
    }, 5000);
    elGhost.setAttribute('class', 'hoverout');
    setTimeout(function () {
      elGhost.setAttribute('class', '');
    }, 500);
    elGhostMsg.setAttribute('class', '');
  });

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
  var ghost = document.getElementById('ghost');
  const player = position.connectedPlayer;
  overlay.style.position = 'absolute';
  overlay.style.top = `${player.top + player.height}px`;
  overlay.style.left = `${player.left}px`;
  overlay.style.width = `${player.width - 20}px`;
  ghost.style.position = 'absolute';
  ghost.style.top = `${player.top}px`;
  ghost.style.left = `${player.left}px`;
  ghost.style.width = `${player.width}px`;
  ghost.style.height = `${player.height}px`;
}

<<<<<<< HEAD
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
=======
function handleControlUpdate(update) {
  recentPulse = update.controls[0].meta.pulse.value;
}


var interval;
shakeit = function (element) {
  element.style.display = "block";
  var x = -1;
  interval = setInterval(function () {
    if (x == -1) {
      element.style.transform = "rotate(-160deg)"
    } else {
      switch (x) {
        case 0:
          element.style.transform = "rotate(-145deg)";
          break;
        case 1:
          element.style.transform = "rotate(-165deg)";
          break;
        case 2:
          element.style.transform = "rotate(-165deg)"
          break;
        default:
          element.style.transform = "rotate(-155deg)"
          clearInterval(interval);
      }
    }
    x++;
  }, 50)
}
>>>>>>> manual-scare
