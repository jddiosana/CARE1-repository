#include <iostream>
#include <sstream>
#include <cstdlib>
#include <string>
#include <thread>
#include <atomic>
#include <chrono>
#include <cstring>

#include "mqtt/async_client.h"
#include <RadioLib.h>
#include "PiHal.h"

// Paho MQTT credentials
mqtt::token_ptr CONNTOK;
const char* broker = "mqtt://localhost:1883";
const char* clientName = "ReceiverLoRa";
char* topic;	// topic is dynamic, depends on value received from JSON
mqtt::async_client client(broker, clientName);

// define LoRa transceiver pins
#define NSS 7
#define DIO0 24
#define RESET 25

PiHal* hal = new PiHal(0);
SX1278 radio = new Module(hal, NSS, DIO0, RESET);

class mqtt_callbacks : public virtual mqtt::callback{
	mqtt::async_client& client;
	int& ctr;
	
public:
	mqtt_callbacks(mqtt::async_client& client, int& ctr) : client(client), ctr(ctr){}
};

volatile bool receivedFlag = false;

void setFlag(void) {
  // set flag after receiving packet
  receivedFlag = true;
}

int main(int argc, char** argv) {
	int ctr = 0;

	mqtt_callbacks c(client, ctr);
	client.set_callback(c);

	auto sslOpts = mqtt::ssl_options_builder().error_handler([](const std::string& msg){
			std::cerr << "SSL Error: " << msg;
		})
		.finalize();

	auto connOpts = mqtt::connect_options_builder()
		.keep_alive_interval(std::chrono::seconds(60))
		.automatic_reconnect(true)
		.clean_session(true)
		.ssl(std::move(sslOpts))
		.finalize();

	CONNTOK = client.connect(connOpts);
	CONNTOK->wait();
	std::cout << "[Paho MQTT] \tConnected to broker" << std::endl;

  // initialize LoRa
  std::cout << "[LoRa SX1278] \tReceiver ";
  int state = radio.begin(433.0);
  
  if (state == RADIOLIB_ERR_NONE) {
    std::cout << "initialized!" << std::endl;
  }
  else {
    std::cout << "failed, code " << state << std::endl;
    return 1;
  }

  // set the function that will be called when new packet is received
  radio.setPacketReceivedAction(setFlag);

  // start listening for LoRa packets
  state = radio.startReceive();
  if (state == RADIOLIB_ERR_NONE) {
    std::cout << "[LoRa SX1278] \tListening for packets... " << std::endl;
  } 
  else {
    std::cout << "failed, code " << state << std::endl;
    while (true);
  }
  
  while(1) {
    // check if the flag is set
    if(receivedFlag) {
      // reset flag
      receivedFlag = false;

      // read received data as byte array
      int numBytes = radio.getPacketLength();
      unsigned char byteArr[numBytes];
      int state = radio.readData(byteArr, numBytes);

      if (state == RADIOLIB_ERR_NONE) {
        
        // packet was successfully received
        std::stringstream ss;
        for (int i = 0; i < numBytes - 1; i++) {
          ss << byteArr[i];
        }
	ss << ",\"rssi\":" << radio.getRSSI() << "}"; // add RSSI to JSON
        std::string json = ss.str();

        // print data of the packet
        std::cout << std::endl;
        std::cout << "[LoRa SX1278] \tReceived from ESP32: " << json << std::endl;
	
        // extract "topic" value from JSON
        size_t topicStart = json.find("\"topic\":\"") + 9;
        size_t topicEnd = json.find("\"", topicStart);
        std::string topicStr = json.substr(topicStart, topicEnd - topicStart);

        // store topic in char array
        topic = new char[topicStr.length() + 1];
        std::strcpy(topic, topicStr.c_str());

        // publish to MQTT broker
        auto message = mqtt::make_message(topic, json, 1, false);
        client.publish(message);
        std::cout << "[Paho MQTT] \tPublished to broker" << std::endl;

      } else if (state == RADIOLIB_ERR_CRC_MISMATCH) {
        // packet was received, but is malformed
        std::cout << "[LoRa SX1278] \tCRC error!" << std::endl;

      } else {
        // some other error occurred
        std::cout << "[LoRa SX1278] \tFailed, code " << state << std::endl;
      }
    }
    ctr++;
  }
  return 0;
}
