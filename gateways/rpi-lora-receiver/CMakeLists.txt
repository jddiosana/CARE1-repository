cmake_minimum_required(VERSION 3.18)

# create the project
project(rpi-lora-receiver)

# when using debuggers such as gdb, the following line can be used
#set(CMAKE_BUILD_TYPE Debug)

# if you did not build RadioLib as shared library (see wiki),
# you will have to add it as source directory
# the following is just an example, yours will likely be different
add_subdirectory("/home/dan/rpi-lora-receiver/RadioLib-Portable" "${CMAKE_CURRENT_BINARY_DIR}/RadioLib")

# Add include directory for Paho MQTT
include_directories(/usr/local/include/mqtt)

# add the executable
add_executable(${PROJECT_NAME} main.cpp)

# link both libraries
target_link_libraries(${PROJECT_NAME} RadioLib pigpio paho-mqttpp3 paho-mqtt3as)

# you can also specify RadioLib compile-time flags here
#target_compile_definitions(RadioLib PUBLIC RADIOLIB_DEBUG_BASIC RADIOLIB_DEBUG_SPI)
#target_compile_definitions(RadioLib PUBLIC RADIOLIB_DEBUG_PORT=stdout)