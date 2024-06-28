$(document).ready(function () {
    function deleteDevice(deviceName) {
        $.ajax({
            type: "DELETE",
            url: "http://100.83.107.52:7776/devices/" + deviceName,
            success: function (response) {
                console.log("Device deleted:", response);
                fetchDevices();
                //alert("Device deleted:", response);
            },
            error: function (xhr, status, error) {
                console.error("Error deleting device:", status, error);
                alert("Error deleting device:", status, error);
            }

        })};
    function fetchDevices() {
        $.ajax({
            type: "GET",
            url: "http://100.83.107.52:7776/devices",
            dataType: "json",
            success: function (devices) {
                $('#cards').empty(); // Clear existing content
                devices.forEach(device => {
                    const card = `
                        <div class="card">
                            <img src="${device.icon}" alt="${device.deviceType}">
                            <h2>${device.wirelessTech} ${device.model}</h2>
                            <p class="value">${device.value} ${device.unit}</p>
                            <button class="delete-button" data-device-name="${device.deviceName}">Delete device</button>
                        </div>
                    `;
                    $('#cards').append(card);
                });

                $('.delete-button').on('click', function () {
                    const deviceName = $(this).data('device-name');
                    deleteDevice(deviceName);
                });
            },
            error: function (xhr, status, error) {
                console.error("Error fetching devices:", status, error);
            }
        });
    }

    // Fetch devices initially and set up an interval to update them
    fetchDevices();
    setInterval(fetchDevices, 2000); // Update every 2 seconds
});
