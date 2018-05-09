"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var WebSocket = require("ws");
var noble = require('noble-uwp');
var pulse = 0;
noble.on('stateChange', function (state) {
    if (state === 'poweredOn') {
        // Seek for peripherals broadcasting the heart rate service
        // This will pick up a Polar H7 and should pick up other ble heart rate bands
        // Will use whichever the first one discovered is if more than one are in range
        noble.startScanning(["180d"]);
    }
    else {
        noble.stopScanning();
    }
});
noble.on('discover', function (peripheral) {
    // Once peripheral is discovered, stop scanning
    noble.stopScanning();
    // connect to the heart rate sensor
    peripheral.connect(function (error) {
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
        peripheral.discoverSomeServicesAndCharacteristics(serviceUUID, characteristicUUID, function (error, services, characteristics) {
            console.log(error, services, characteristics);
            characteristics[0].notify(true, function (error) {
                if (error) {
                    console.log(error);
                }
                characteristics[0].on('data', function (data) {
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
var beam_interactive_node2_1 = require("beam-interactive-node2");
if (process.argv.length < 4) {
    console.log('Usage gameClient.exe <token> <versionId>');
    process.exit();
}
// We need to tell the interactive client what type of websocket we are using.
beam_interactive_node2_1.setWebSocket(WebSocket);
// As we're on the Streamer's side we need a "GameClient" instance
var client = new beam_interactive_node2_1.GameClient();
// Log when we're connected to interactive
client.on('open', function () { return console.log('Connected to interactive'); });
// These can be un-commented to see the raw JSON messages under the hood
client.on('message', function (err) { return console.log('<<<', err); });
client.on('send', function (err) { return console.log('>>>', err); });
// client.on('error', (err: any) => console.log(err));
// Now we open the connection passing in our authentication details and an experienceId.
client.open({
    authToken: process.argv[2],
    versionId: parseInt(process.argv[3], 10),
}).then(function () {
    // Controls don't appear unless we tell Interactive that we are ready!
    return client.ready(true);
}).then(function () {
    setInterval(function () {
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
        });
    }, 2000);
});
//# sourceMappingURL=game.js.map