// Author: Jonnar Danielle Diosana
// Purpose: IPE for data mapping

// Load required modules
const config = require('config');
const { createContentInstance } = require('./oneM2MFunctions');
// load module for parsing JSON
const bodyParser = require('body-parser');
var path = require('path');
const { request } = require('http');

function wifiIPE(device, message){
    var deviceName = device.deviceName;

    // message template: {protocol:wifi,model:hc8,metric:co2,value:1223,unit:ppm,rssi:-60,topic:<<auto>>}
    var messageObj = message;
    var value = messageObj['value'];
    var unit = messageObj.unit;
    return value;

}

function loraIPE(device, message){
    var deviceName = device.deviceName;

    // message template: {protocol:wifi,model:hc8,metric:co2,value:1223,unit:ppm,rssi:-60,topic:<<auto>>}
    var messageObj = message;
    var value = messageObj['value'];
    var unit = messageObj.unit;
    return value;
    
}

function zigbeeIPE(device, message){
    var deviceName = device.deviceName;

    // message template: {"battery":100,"humidity":71.81,"linkquality":240,"temperature":32.96,"voltage":3300}
    var messageObj = message;
    //console.log(messageObj);
    if (deviceName.includes('temp')) {
        var value = messageObj.temperature;
        var unit = '°C';
    } else if (deviceName.includes('humidity')) {
        var value = messageObj.humidity;
        var unit = '%';
    } else if (deviceName.includes('co2')) {
        var value = messageObj.co2;
        var unit = 'ppm';
    }
    return value;
}

function getMessage(device, message){
    
    var wirelessTech = device.wirelessTech;
    if(wirelessTech == 'WiFi'){
        var value = wifiIPE(device, message);
    }else if(wirelessTech == 'LoRa'){
        var value = loraIPE(device, message);
    }else if(wirelessTech == 'Zigbee'){
        var value = zigbeeIPE(device, message);
    }
    return value;
    
};

module.exports = { getMessage };
