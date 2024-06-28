#!/bin/bash

# NOTE: Move this file to /home/pi and type ./get-paho-mqtt.sh to run the ff. commands.
#       Go to /home/pi/rpi-lora-receiver/build and type 
#       sudo make install && sudo ./rpi-lora-receiver to COMPILE and RUN the C++ script. 

# install packages (cmake, ssl, doxygen, and graphviz)
sudo apt-get update
sudo apt-get install pigpio python3-pigpio
sudo apt-get install build-essential gcc make cmake cmake-gui cmake-curses-gui
sudo apt-get install libssl-dev
sudo apt-get install doxygen graphviz

# clone paho mqtt libraries
mkdir paho-mqtt-src
cd paho-mqtt-src
git clone https://github.com/eclipse/paho.mqtt.c.git
git clone https://github.com/eclipse/paho.mqtt.cpp.git

# build paho mqtt c library, install to default directory
cd paho.mqtt.c
cmake -Bbuild -H. -DPAHO_ENABLE_TESTING=OFF -DPAHO_BUILD_STATIC=ON -DPAHO_WITH_SSL=ON -DPAHO_HIGH_PERFORMANCE=ON
sudo cmake --build build --target install

# build paho mqtt c++ library, install to default directory
cd ../paho.mqtt.cpp
cmake -Bbuild -H. -DPAHO_BUILD_STATIC=ON -DPAHO_BUILD_DOCUMENTATION=FALSE -DPAHO_BUILD_SAMPLES=FALSE
sudo cmake --build build --target install

# refresh your machine's static libraries
sudo ldconfig
