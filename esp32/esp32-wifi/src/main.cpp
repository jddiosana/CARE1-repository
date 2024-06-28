#include <Arduino.h>
#include <ArduinoJson.h>
#include <WiFi.h>
#include <PubSubClient.h>

HardwareSerial sensorSerial(2);  // UART RX = 16, TX = 17

// define WiFi credentials
const char* ssid = "pcdann";
const char* password = "abcd1234";
WiFiClient wifiClient;

// define MQTT credentials
const char* mqtt_server = "192.168.137.197";
const char* topic = "EEEI/309/WiFi/HC8/co2-2";
const char* mqtt_id = topic;
PubSubClient mqttClient(wifiClient);

void setupWiFi() {
  delay(100);
  Serial.println("Connecting to WiFi network: " + String(ssid));
  WiFi.begin(ssid, password);
  int ctr = 0;
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    ctr++;
    delay(3000);
    if(ctr > 20) {
      Serial.println();
      Serial.println("Failed to connect to WiFi. Restarting ESP32...");
      delay(3000);
      ESP.restart();
    }
  }
  Serial.println();
  Serial.println("WiFi Connected!");
  Serial.println();
  return;
}

void setupMQTT() {
  delay(100);
  mqttClient.setServer(mqtt_server, 1883);
  Serial.println("Connecting to MQTT topic: " + String(topic));
  int ctr = 0;
  while (!mqttClient.connected()) { // while client is not connected to mqtt
    if(WiFi.status() != WL_CONNECTED){  // if wifi is not connected
      setupWiFi();
    }
    Serial.println(".");
    ctr++;
    delay(3000);
  
    if (mqttClient.connect(mqtt_id)) {
      Serial.println();
      Serial.println("MQTT Connected!");
      Serial.println();
    }

    else if (ctr > 20) {
      Serial.println();
      Serial.print("Failed to connect to MQTT. Restarting ESP32...");
      delay(3000);
      ESP.restart();
    }
  }
  return; 
}

String getJson(uint16_t value, String topic) {
  JsonDocument JSONbuffer;
  JsonObject JSONencoder = JSONbuffer.to<JsonObject>();
  JSONencoder["protocol"] = "wifi";
  JSONencoder["model"] = "hc8";
  // JSONencoder["metric"] = "co2";
  JSONencoder["value"] = value;
  // JSONencoder["unit"] = "ppm";
  JSONencoder["topic"] = topic;
  JSONencoder["rssi"] = WiFi.RSSI();
  char JSONmessageBuffer[150];
  serializeJson(JSONencoder, JSONmessageBuffer, sizeof(JSONmessageBuffer));
  return String(JSONmessageBuffer);
}

uint16_t co2Read() { 
  byte packet_sent[] = {0x64, 0x69, 0x03, 0x5E, 0x4E}; // packet to send for query output mode
  sensorSerial.write(packet_sent, sizeof(packet_sent));
  delay(50);
  uint8_t packet_received[16];
  sensorSerial.readBytes(packet_received, 16);
  uint16_t co2_value = (packet_received[5] << 8) | packet_received[4];
  uint16_t calibrated_co2_value = 1.09409 * co2_value + 115;  // calibration formula
  return calibrated_co2_value;
}

void co2Start() {
  Serial.println("Warming up HC8 CO2 NDIR sensor...");
  for (int ctr = 1; ctr <= 30; ctr++) {  // warm up sensor for 1 minute by repeatedly reading CO2
    co2Read();
    delay(1000);
  }
  Serial.println("Sensor initialized!");
  Serial.println();
  return;
}

void setup() {
  Serial.begin(115200);
  sensorSerial.begin(9600);
  setupWiFi();
  co2Start();
  setupMQTT();
}

void loop() {
  if (!mqttClient.connected())
    setupMQTT();
  
  uint16_t co2_value = co2Read();
  String doc = getJson(co2_value, topic);
  
  if(540 < co2_value && co2_value < 6800) {
    Serial.print("Sent to RPi MQTT broker: ");
    Serial.println(doc);
    mqttClient.publish(topic, doc.c_str());
  }
  else
    Serial.println("CO2 value out of range: " + String(co2_value));
  for(int ctr = 0; ctr < 1; ctr++) {
    delay(60000);	// send every minute
    mqttClient.loop();
  }
}