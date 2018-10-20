var recentPulse = 0;
var recentScare = 0;
var shakeInterval;

window.addEventListener('load', function initMixer() {
  var elHeartRate = document.getElementById('heart-rate');
  var elScares = document.getElementById('heart-rate-scare-number');
  var elGhost = document.getElementById('ghost-image');
  var elGhostMsg = document.getElementById('ghost-message');
  var elToaster = document.getElementById('toaster');
  var scares = 0;

  var interval;
  const shakeit = function(element) {
    element.style.display = 'block';
    const STILL_POINT = 0;
    var x = -1;
    interval = setInterval(function() {
      if (x == -1) {
        element.style.transform = `rotate(${STILL_POINT}deg)`;
      } else {
        switch (x) {
          case 0:
            element.style.transform = `rotate(${STILL_POINT + 15}deg)`;
            break;
          case 1:
            element.style.transform = `rotate(${STILL_POINT - 5}deg)`;
            break;
          case 2:
            element.style.transform = `rotate(${STILL_POINT - 5}deg)`;
            break;
          default:
            element.style.transform = `rotate(${STILL_POINT + 5}deg)`;
            clearInterval(interval);
        }
      }
      x++;
    }, 50);
  };
  mixer.display.position().subscribe(handleVideoResized);

  mixer.socket.on('onControlUpdate', handleControlUpdate);
  mixer.socket.on('onSceneCreate', handleSceneCreate);

  const offset = 50;
  const position = {
    top: offset,
    bottom: offset + offset + 10,
    left: offset,
    right: offset
  };
  mixer.display.moveVideo(position);
  setTimeout(function() {
    mixer.display.moveVideo(position);
  }, 500);

  shakeit(elGhost);
  shakeInterval = setInterval(function() {
    shakeit(elGhost);
  }, 5000);

  elGhost.addEventListener('mouseover', function(ev) {
    clearInterval(shakeInterval);
    elGhost.style = '';
    // elGhost.setAttribute('class', 'hover');
    elGhostMsg.setAttribute('class', 'hover');
  });

  elGhost.addEventListener('mouseout', function(ev) {
    shakeInterval = setInterval(function() {
      shakeit(elGhost);
    }, 5000);
    // elGhost.setAttribute('class', 'hoverout');
    // setTimeout(function() {
    //   elGhost.setAttribute('class', '');
    // }, 500);
    elGhostMsg.setAttribute('class', '');
  });

  elGhost.onclick = function(ev) {
    mixer.socket.call('giveInput', {
      controlID: 'scare',
      event: 'click'
    });
  };

  Chart.defaults.global.tooltips = false;

  var ctx = document.getElementById('pulse').getContext('2d');
  var myChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: '',
          data: [],
          borderColor: 'red',
          fill: false,
          lineTension: 0.1
        }
      ]
    },
    options: {
      legend: {
        display: false
      },
      scales: {
        yAxes: [
          {
            ticks: {
              min: 60
            }
          }
        ],
        xAxes: [
          {
            type: 'realtime',
            // position: 'bottom',
            display: false
          }
        ]
      },
      plugins: {
        streaming: {
          // enabled by default
          duration: 20000, // data in the past 20000 ms will be displayed
          refresh: 1000, // onRefresh callback will be called every 1000 ms
          delay: 1000, // delay of 1000 ms, so upcoming values are known before plotting a line
          frameRate: 30, // chart is drawn 30 times every second

          // a callback to update datasets
          onRefresh: function(chart) {
            const newPulse = recentPulse;
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

  function handleVideoResized(position) {
    console.log('video resized', position);
    const overlay = document.getElementById('spook-panel');
    const ghost = document.getElementById('ghost');
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

  function handleControlUpdate(update) {
    const control = update.controls[0];
    switch(control.controlID) {
      case 'pulse':
        recentPulse = control.meta.pulse.value;
        break;
      case 'scares':
        recentScare = control.meta.scares.value;
        elScares.innerText = recentScare;
        break;
      case 'toaster':
        elToaster.innerText = control.meta.toaster.value;
        popToast();
        break;
      default:
        break;
    }
  }

  function handleSceneCreate(data) {
    const scenes = data.scenes;
    if (scenes[0]) {
      const scene = scenes[0];
      const scaresControl = scene.controls.find(function (c) { return c.controlID === 'scares' });
      console.log(scaresControl);
      if (scaresControl && scaresControl.meta && scaresControl.meta.scares) {
        elScares.innerText = scaresControl.meta.scares.value;
      }
    }
  }

  function popToast() {
    elToaster.style.top = `${elToaster.offsetTop + 120}px`;
    setTimeout(function () {
      elToaster.style.top = `${elToaster.offsetTop - 120}px`;
    }, 3000);
  }

  mixer.isLoaded();
});
