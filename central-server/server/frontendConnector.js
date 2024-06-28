/*
Author: Jonnar Danielle Diosana
Purpose: To create a connector from frontend to the server
*/
var express = require('express');
var request = require('request');
var hashmap = require('hashmap');
var config = require('config');
var path = require('path');
var bodyParser = require('body-parser');
var http = require('http');
var fs = require('fs');
const { spawn } = require('child_process');

var app = express();
const server = http.createServer(app);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'public', 'homepage.html'));
    }
);

app.get('/ping', function(req, res) {
    res.sendStatus(200);
    }
);

app.get('/templates', function(req, res) {
    res.sendFile(templates);
    }
);

app.get('/registration', function(req, res) {
    res.sendFile(path.join(__dirname, 'public', 'registration.html'));
    }
);

app.get('/:gateway', function(req, res) {
    res.sendFile(path.join(__dirname, 'public', `${req.params.gateway}.html`));
    }
);

app.post('/registration', function(req, res) {
    var device = req.body;
    var gateway = device.gateway;
    var gatewayIP = '';
    // send device to gateway
    config.mnList.forEach(mn => {
        if (mn.name == gateway){
            gatewayIP = mn.gatewayIP + '/registration';
        }
    });
    console.log(gatewayIP);    
    request.post(gatewayIP, {
        json: device
    }, function(error, response, body) {
        if (error) {
            console.log(error);
            res.status(409).send('Device name already exists. Please choose a different name.');
        } else {
            console.log(body);
            res.status(200).send(body);
        }
    }
    );
    },
);

server.listen(7777, function() {
    console.log('Frontend listening on port 7777');
    }
);


function loadBalancing() {
    const child = spawn('node', ['./loadBalancing.js'], { stdio: 'inherit' });
    child.on('close', (code) => {
        console.log(`Load balancing process exited with code ${code}`);
        }
    );   
    child.on('error', (err) => {
        console.log('Failed to start load balancing process.');
        }
    ); 
};

setInterval(loadBalancing, 1000*60*5); // run data redistribution every 5 minutes