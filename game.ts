import * as WebSocket from 'ws';
var noble = require('noble-uwp');

var pulse = 0;

noble.on('stateChange', function(state: any) {
  if (state === 'poweredOn') {
    // Seek for peripherals broadcasting the heart rate service
    // This will pick up a Polar H7 and should pick up other ble heart rate bands
    // Will use whichever the first one discovered is if more than one are in range
    noble.startScanning(["180d"]);
  } else {
    noble.stopScanning();
  }
});

noble.on('discover', function(peripheral: any) {
  // Once peripheral is discovered, stop scanning
  noble.stopScanning();

  // connect to the heart rate sensor
  peripheral.connect(function(error: any){
      if (error) {
          console.log(error);
      }
    // 180d is the bluetooth service for heart rate:
    // https://developer.bluetooth.org/gatt/services/Pages/ServiceViewer.aspx?u=org.bluetooth.service.heart_rate.xml
    var serviceUUID = ["180d"];
    // 2a37 is the characteristic for heart rate measurement
    // https://developer.bluetooth.org/gatt/characteristics/Pages/CharacteristicViewer.aspx?u=org.bluetooth.characteristic.heart_rate_measurement.xml
    var characteristicUUID = ["2a37"];

    // use noble's discoverSomeServicesAndCharacteristics
    // scoped to the heart rate service and measurement characteristic
    peripheral.discoverSomeServicesAndCharacteristics(serviceUUID, characteristicUUID, function(error: any, services: any, characteristics: any){
        console.log(error, services, characteristics);
      characteristics[0].notify(true, function(error: any){
          if (error) {
              console.log(error);
          }
        characteristics[0].on('data', function(data: any){
          // Upon receiving data, output the BPM
          // The actual BPM data is stored in the 2nd bit in data (at array index 1)
          // Thanks Steve Daniel: http://www.raywenderlich.com/52080/introduction-core-bluetooth-building-heart-rate-monitor
          // Measurement docs here: https://developer.bluetooth.org/gatt/characteristics/Pages/CharacteristicViewer.aspx?u=org.bluetooth.characteristic.heart_rate_measurement.xml
          pulse = data[1];
        });
      });
    });
  });
});

import {
    GameClient,
    setWebSocket,
} from 'beam-interactive-node2';

if (process.argv.length < 4) {
    console.log('Usage gameClient.exe <token> <versionId>');
    process.exit();
}
// We need to tell the interactive client what type of websocket we are using.
setWebSocket(WebSocket);

// As we're on the Streamer's side we need a "GameClient" instance
const client = new GameClient();

// Log when we're connected to interactive
client.on('open', () => console.log('Connected to interactive'));

// These can be un-commented to see the raw JSON messages under the hood
client.on('message', (err: any) => console.log('<<<', err));
client.on('send', (err: any) => console.log('>>>', err));

// client.on('error', (err: any) => console.log(err));
// Now we open the connection passing in our authentication details and an experienceId.
client.open({
    authToken: process.argv[2],
    versionId: parseInt(process.argv[3], 10),
}).then(() => {
    // Controls don't appear unless we tell Interactive that we are ready!
    return client.ready(true);
}).then(() => {
    setInterval(() => {
        client.updateControls({
            sceneID: 'default',
            controls: [
                {
                    controlID: 'pulse',
                    meta: {
                        pulse: {
                            value: pulse
                        }
                    }
                }
            ]
        })
    }, 2000);
});