document.addEventListener('DOMContentLoaded', function() {
    const deviceNameInput = document.getElementById('deviceName');
    const modelInput = document.getElementById('model');
    const wirelessTechSelect = document.getElementById('wirelessTech');
    const mqttTopicInput = document.getElementById('mqttTopic');
    const gatewaySelect = document.getElementById('gateway');
    const roomInput = document.getElementById('room');

    function updateMqttTopic() {
        const deviceName = deviceNameInput.value;
        const model = modelInput.value;
        const wirelessTech = wirelessTechSelect.value;
        const gateway = gatewaySelect.value;
        const room = roomInput.value;

        if (deviceName && model && wirelessTech && gateway && room) {
            mqttTopicInput.value = `${gateway}/${room}/${wirelessTech}/${model}/${deviceName}`;
        } else {
            mqttTopicInput.value = '';
        }
    }

    deviceNameInput.addEventListener('input', updateMqttTopic);
    modelInput.addEventListener('input', updateMqttTopic);
    wirelessTechSelect.addEventListener('change', updateMqttTopic);
    gatewaySelect.addEventListener('change', updateMqttTopic);
    roomInput.addEventListener('input', updateMqttTopic);

    document.getElementById('registration-form').addEventListener('submit', function(event) {
        event.preventDefault();

        const formData = {
            deviceName: deviceNameInput.value,
            model: modelInput.value,
            wirelessTech: wirelessTechSelect.value,
            gateway: document.getElementById('gateway').value,
            room: roomInput.value,
            mqttTopic: mqttTopicInput.value
        };

        fetch('http://100.70.99.17:7777/registration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            alert("Device registration submitted");
        })
        .catch((error) => {
            console.error('Error:', error);
            // "Device name already exists. Please choose a different name." in devieName text box
            alert("Device name already exists. Please choose a different name.");
            deviceNameInput.value = '';
        });
    });
});
