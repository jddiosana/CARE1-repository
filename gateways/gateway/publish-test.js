// publish random mqtt messages to the topics every 2 seconds

var mqtt = require('mqtt');
var config = require('config');
var fs = require('fs');

var mqttClient = mqtt.connect('mqtt://localhost:1883');

//read json file and parse it
var devices = JSON.parse(fs.readFileSync('config/deviceList.json', 'utf8'));

mqttClient.on('connect', function () {
    setInterval(function () {
        
        var tempRandom = Math.floor(Math.random() * 30) + 20;
        var humidityRandom = Math.floor(Math.random() * 100);
        var co2Random = Math.floor(Math.random() * 2000) + 2000;
        
        devices["devices"].forEach(function(device) {
            if (device.deviceName.toLowerCase().includes("temp")) {
                mqttClient.publish(device.mqttTopic, tempRandom.toString());
                console.log("Published message: " + tempRandom + " to topic: " + device.mqttTopic);
            } else if (device.deviceName.toLowerCase().includes("humidity")) {
                mqttClient.publish(device.mqttTopic, humidityRandom.toString());
                console.log("Published message: " + humidityRandom + " to topic: " + device.mqttTopic);
            } else if (device.deviceName.toLowerCase().includes("co2")) {
                mqttClient.publish(device.mqttTopic, co2Random.toString());
                console.log("Published message: " + co2Random + " to topic: " + device.mqttTopic);
            }
            
        });

    }, 3000);

    //mqttClient.publish('zigbee', '{"battery":100,"humidity":71.81,"linkquality":240,"temperature":32.96,"voltage":3300}');
    //mqttClient.publish('lora', '{"packetNum": 1, "value": 1}');
});




