/*
Author: Jonnar Danielle Diosana
Purpose: To create a connector from frontend to the server
*/
var express = require('express');
var request = require('request');
var hashmap = require('hashmap');
var moment = require('moment');
var config = require('config');
var path = require('path');
var bodyParser = require('body-parser');
var http = require('http');
var fs = require('fs');
var cors = require('cors');
const { createAE, deleteAE, createContentInstance, centralAE, centralContentInstance, createDataContainer, centralDataContainer, resendData } = require('./oneM2MFunctions');
var mqtt = require('mqtt');
const { subscribeToTopic, connectToMQTT, unsubscribeToTopic } = require('./connectToMQTT');
const { getMessage } = require('./gatewayIPE');

var app = express();
const server = http.createServer(app);
app.use(cors());

// initialization phase
connectToMQTT();

// load saved devices
var saved_devices = {};
var devices = [];
var cntList = {};

fs.readFile('config/deviceList.json', 'utf8', function(err, data) {
    if (err) {
        console.log(err);
    } else {
        saved_devices = JSON.parse(data);
        
        // save read devices to devices array
        saved_devices["devices"].forEach(function(device) {
            subscribeToTopic(device.mqttTopic);
            createAE(device.deviceName);
            centralAE(device["central-rn"]);
            devices.push(device);
    });
}
}
);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/devices/:deviceName', function(req, res) {
    var deviceName = req.params.deviceName;
    var value = JSON.parse(req.body.value);
    var creationTime = moment.utc().add(8, 'hours').format('YYYYMMDDTHHmmss');

    var device = saved_devices["devices"].find(d => d.deviceName === deviceName);
    // get the index of the device
    var index = saved_devices["devices"].indexOf(device);
    var outputMessage = getMessage(device, value);
    device.value = outputMessage;

    // list all keys in the request body
    var keyList = Object.keys(value);

    // if deviceName is not in cntList, create a new list
    if (!cntList[deviceName]) {
        cntList[deviceName] = keyList;
        keyList.forEach(function(key) {
            createDataContainer(deviceName, key);
            centralDataContainer(device['central-rn'], key);
        });
    }
    // if a key is not in the list, add it
    keyList.forEach(function(key) {
        if (!cntList[deviceName].includes(key)) {
            cntList[deviceName].push(key);
            createDataContainer(deviceName, key);
            centralDataContainer(device['central-rn'], key);
        };
        // create content instance
        createContentInstance(deviceName, value[key], key, creationTime);
        centralContentInstance(device['central-rn'], value[key], key, creationTime);
    }
    );
}
);

app.delete('/devices/:deviceName', function(req, res) {
    console.log("Delete device");
    var deviceName = req.params.deviceName;
    var device = saved_devices["devices"].find(d => d.deviceName === deviceName);
    var index = saved_devices["devices"].indexOf(device);
    unsubscribeToTopic(device.mqttTopic);
    saved_devices["devices"].splice(index, 1);
    fs.writeFile('config/deviceList.json', JSON.stringify(saved_devices), function(err) {
        if (err) {
            console.log(err);
        }
    }
    );
    deleteAE(deviceName);
    res.status(200).send("Device deleted");
    }
);

app.get('/devices', function(req, res) {
    res.send(saved_devices["devices"]);
    }
);

app.post('/registration', function(req, res) {
    var device = req.body;
    // check if device already exists
    var deviceExists = saved_devices["devices"].find(d => d.deviceName === device.deviceName);
    if (deviceExists) {
        res.status(409).send("Device already exists");
        console.log("Device already exists");
        return;
    }
    var new_device = {
        "deviceName": device.deviceName,
        "model": device.model,
        "wirelessTech": device.wirelessTech,
        "gateway": device.gateway,
        "room": device.room,
        "mqttTopic": device.mqttTopic,
        "central-rn": `${device.gateway}-${device.room}-${device.wirelessTech}-${device.deviceName}`,
        "icon": "",
        "unit": "",
        "value": 0
    };
    if (new_device.deviceName.toLowerCase().includes("temp")) {
        icon = "images/temperature.png";
        unit = "°C";
    } else if (new_device.deviceName.toLowerCase().includes("co2")) {
        icon = "images/co2.png";
        unit = "ppm";
    } else if (new_device.deviceName.toLowerCase().includes("humidity")) {
        icon = "images/humidity.png";
        unit = "%";
    }
    new_device["icon"] = icon;
    new_device["unit"] = unit;
    console.log(new_device);

    saved_devices["devices"].push(new_device);
    devices.push(new_device);

    subscribeToTopic(new_device.mqttTopic);
    centralAE(new_device["central-rn"]);
    createAE(new_device.deviceName);
    console.log("AE Created: " + new_device.deviceName);
    fs.writeFile('config/deviceList.json', JSON.stringify(saved_devices), function(err) {
        if (err) {
            console.log(err);
        }
    }
    );
    res.status(200).send(new_device);
    }
);

server.listen(7776, function() {
    console.log('Gateway listening on port 7776');
    }
);
