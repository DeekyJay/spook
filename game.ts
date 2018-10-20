import * as WebSocket from 'ws';
const noble = require('noble-uwp');

// versionID: 244513

let pulse: number = 0;
let ready: boolean = false;
let voted: string[] = [];

noble.on('stateChange', function (state: any) {
    if (state === 'poweredOn') {
        // Seek for peripherals broadcasting the heart rate service
        // This will pick up a Polar H7 and should pick up other ble heart rate bands
        // Will use whichever the first one discovered is if more than one are in range
        noble.startScanning(["180d"]);
    } else {
        noble.stopScanning();
    }
});

noble.on('discover', function (peripheral: any) {
    // Once peripheral is discovered, stop scanning
    noble.stopScanning();

    // connect to the heart rate sensor
    peripheral.connect(function (error: any) {
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
        peripheral.discoverSomeServicesAndCharacteristics(serviceUUID, characteristicUUID, function (error: any, services: any, characteristics: any) {
            console.log(error, services, characteristics);
            characteristics[0].notify(true, function (error: any) {
                if (error) {
                    console.log(error);
                }
                characteristics[0].on('data', function (data: any) {
                    //console.log(data[0], data[1], data[2], data[3]);
                    // Upon receiving data, output the BPM
                    // The actual BPM data is stored in the 2nd bit in data (at array index 1)
                    // Thanks Steve Daniel: http://www.raywenderlich.com/52080/introduction-core-bluetooth-building-heart-rate-monitor
                    // Measurement docs here: https://developer.bluetooth.org/gatt/characteristics/Pages/CharacteristicViewer.aspx?u=org.bluetooth.characteristic.heart_rate_measurement.xml
                    const arr = new Uint8Array(data);
                    pulse = arr[1];
                    if (ready) {
                        calculateIfSpike(pulse);
                        updateControls('pulse', pulse);
                    }
                });
            });
        });
    });
});

import {
    GameClient,
    setWebSocket,
    IScene,
    IControl,
    IParticipant,
    IInputEvent,
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
// client.on('message', (err: any) => console.log('<<<', err));
// client.on('send', (err: any) => console.log('>>>', err));

// client.on('error', (err: any) => console.log(err));
// Now we open the connection passing in our authentication details and an experienceId.
client.open({
    authToken: process.argv[2],
    versionId: parseInt(process.argv[3], 10),
})
.then(() => client.synchronizeState())
.then(() => client.state.getScene('default'))
.then((scene: IScene) =>
    scene.getControls()
        .forEach((control: IControl) =>
            control.on('click',
                handleClick)))
.then(() => {
    // Controls don't appear unless we tell Interactive that we are ready!
    ready = true;
    return client.ready(true);
});


const data: number[] = [];
let scares: number = 0;
let low: number = 140;
let high: number = 0;
function calculateIfSpike(value: number) {
    if (!value) {
        return;
    }

    // Calculate the highest
    if (value < low) {
        low = value;
        updateControls('low', low);
    }

    if (value > high) {
        high = value;
        updateControls('high', high);
    }

    let total = 0;
    for (let i = 0; i < data.length; i++) {
        total += data[i];
    }

    data.push(value);
    if (data.length === 10) {
        data.shift();
    } else {
        return;
    }

    let threshold = 1.2;
    const avg = Math.floor(total / data.length);

    if (value > (avg * threshold)) {
        scares = scares + 1;
        updateControls('scares', value);
    }
}

function updateControls(key: string, value: any) {
    client.updateControls({
        sceneID: 'default',
        controls: [
            {
                controlID: key,
                meta: {
                    [key]: {
                        value: value
                    }
                }
            }
        ]
    })
}

function handleClick(_event: IInputEvent<IControl>, participant: IParticipant & { channelGroups: string[]}) {
    if (participant.channelGroups.indexOf('Owner') !== -1) {
        // Clip the video as you would.
        console.log('Owner wants to clip!');
        updateControls('toaster', 'Scare has been clipped!');
        scares = scares + 1;
        updateControls('scares', scares);
    } else {
        const username = participant.username;
        if (voted.indexOf(username) === -1) {
            console.log(`${username} wants to clip!`);
            voted.push(username);
            if (voted.length === 3) {
                // trigger clip.
                console.log('Clip triggered!');
                updateControls('toaster', 'Scare has been clipped!');
                scares = scares + 1;
                updateControls('scares', scares);
                voted = [];
            } else if (voted.length === 1) {
                updateControls('toaster', `${username} wants to record the scare! We need 2 more votes!`);
                setTimeout(() => voted = [], 10000);
            }
        }
    }
}
