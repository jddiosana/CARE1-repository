#include <Arduino.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <LoRa.h>

HardwareSerial sensorSerial(2);  // RX = 16, TX = 17

// define LoRa transceiver pins
#define ss 5
#define rst 14
#define dio0 27

// define MQTT topic of the sensor
String topic = "EEEI/309/LoRa/HC8/co2-1";

String getJson(uint16_t value, String topic) {
  JsonDocument JSONbuffer;
  JsonObject JSONencoder = JSONbuffer.to<JsonObject>();
  JSONencoder["protocol"] = "lora";
  JSONencoder["model"] = "hc8";
  // JSONencoder["metric"] = "co2";
  JSONencoder["value"] = value;
  // JSONencoder["unit"] = "ppm";
  JSONencoder["topic"] = topic;
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
  for (int ctr = 1; ctr <= 60; ctr++) {  // warm up sensor for 2 minutes by repeatedly reading CO2
    co2Read();
    delay(500);
  }
  Serial.println("Sensor initialized!");
  Serial.println();
  return;
}

void setupLoRa() {
  delay(100);
  Serial.println();
  Serial.println("Initializing LoRa with MQTT topic: " + topic);
  int ctr = 0;
  LoRa.setPins(ss, rst, dio0);
  while (!LoRa.begin(433E6)) {
    Serial.print(".");
    ctr++;
    delay(3000);
    if(ctr > 5) {
        Serial.println();
        Serial.println("Failed to connect to LoRa. Restarting ESP32...");
        delay(3000);
        ESP.restart();
    }
  }
  LoRa.setSyncWord(0x12);
  LoRa.setSpreadingFactor(9);
  LoRa.setSignalBandwidth(125E3);
  LoRa.setCodingRate4(7);
  LoRa.setPreambleLength(8);
  LoRa.enableCrc();

  Serial.println();
  Serial.println("LoRa Initialized!");
  Serial.println();
  return;
}

void setup() {
  Serial.begin(115200);
  sensorSerial.begin(9600);
  setupLoRa();
  co2Start();
}

void loop() {
  setupLoRa();
  uint16_t co2_value = co2Read();
  String doc = getJson(co2_value, topic);

  if(co2_value < 540 | co2_value > 6800) { // don't send if CO2 value out of range
    Serial.println("CO2 value out of range: " + String(co2_value));
    return;
  }

  Serial.print("Sent to RPi LoRa Receiver: ");
  Serial.println(doc);
  LoRa.beginPacket();
  LoRa.print(doc);
  LoRa.endPacket();

  delay(60000);	// send every minute
}