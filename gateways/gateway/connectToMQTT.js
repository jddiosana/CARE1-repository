// Author: Jonnar Danielle Diosana
// Purpose: To connect to the MQTT broker and subscribe to topics

/* MQTT connection */

const mqtt = require('mqtt');
const config = require('config');
const request = require('request');
var fs = require('fs');

const { createAE, createDataContainer, createContentInstance } = require('./oneM2MFunctions');
const { getMessage, devices } = require('./gatewayIPE');

const gatewayIP = config.cse.ip;

function connectToMQTT() {

    const clientId = "client" + Math.random().toString(36).substring(7);
  
    var mqttServer = "mqtt://localhost:1883";
  
    const options = {
        keepalive: 60,
        clientId: clientId,
        protocolId: "MQTT",
        protocolVersion: 4,
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000,
    };
  
    mqttClient = mqtt.connect(mqttServer, options);
  
    mqttClient.on("error", (err) => {
        console.log("Error: ", err);
        mqttClient.end();
    });
  
    mqttClient.on("reconnect", () => {
        console.log("Reconnecting...");
    });
  
    mqttClient.on("connect", () => {
        console.log(`MQTT client connected on: mqtt://localhost:1883`);
    });
  
    // Received Message
    mqttClient.on("message", (topicName, message) => {
        //console.log(message.toString());
        
        fs.readFile('config/deviceList.json', 'utf8', function(err, data) {
            if (err) {
                console.log(err);
            } else {
                var saved_devices = JSON.parse(data);
                var deviceName = saved_devices["devices"].find(device => device.mqttTopic === topicName).deviceName;
                request.post(`${gatewayIP}:7776/devices/${deviceName}`, {
                    json: { value: message.toString() }
                }, function(error, response, body) {
                    if (error) {
                        console.log('error occured');
                    } else {
                        console.log(body);
                    }
                });

  }
})})};

connectToMQTT();

function subscribeToTopic(topicName) {
    mqttClient.subscribe(topicName, (err) => {
        if (!err) {
            console.log("\nSubscribed to topic: " + topicName);

        } else {
            console.log("Error subscribing to topic: " + topicName);
        }
    }
    );
}

function unsubscribeToTopic(topicName) {
    mqttClient.unsubscribe(topicName, (err) => {
        if (!err) {
            console.log("\nUnsubscribed to topic: " + topicName);
        } else {
            console.log("Error unsubscribing to topic: " + topicName);
        }
    }
    );
}

module.exports = { connectToMQTT, subscribeToTopic, unsubscribeToTopic };
