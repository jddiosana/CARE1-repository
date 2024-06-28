// Author: Jonnar Danielle Diosana
// Purpose: To create AE, Data Container, and Content Instance in the oneM2M CSE

// Load required modules
const request = require('request');
const config = require('config');

// Initialize variables
let requestNr = 0;
let cseRelease = config.cse.cseRelease;

var unsentData = {};

/* oneM2M Functions */

// createAE function
function createAE(rn){
	console.log("\n[REQUEST] CREATE AE: " + rn);
	
		var options = {
		uri: config.cse.ip + ':' + config.cse.port + "/" + config.cse.name,
		method: "POST",
		headers: {
			"X-M2M-Origin": "S" + config.cse.name + '-' + rn,
			"X-M2M-RI": "req"+requestNr,
			"Content-Type": "application/vnd.onem2m-res+json;ty=2"
		},
		json: { 
			"m2m:ae":{
				"rn": rn,			
				"api": config.cse.name + '-' + rn,
				"rr":false,
                "poa": [config.cse.gatewayIP + ":" + config.cse.port],
			}
		}
	};

	if(cseRelease != "1") {
		options.headers = Object.assign(options.headers, {"X-M2M-RVI":cseRelease});
		options.json["m2m:ae"] = Object.assign(options.json["m2m:ae"], {"srv":["2a"]});
	}
	
	requestNr += 1;
	request(options, function (err, resp, body) {
		console.log("[RESPONSE] AE: " + rn);
		if(err){
			console.log("AE Creation error: " + err);
		} else {
			if(resp.statusCode==409){
				console.log("Code 409: AE already exists\n");
			}else if(resp.statusCode==404){
                console.log("Code 404: CSE not found\n");
            }
            else{
                console.log("AE Creation: " + resp.statusCode);
                console.log("");
			};
		}
	});
}

function centralAE(rn){
	console.log("\n[REQUEST] CREATE AE " + rn + " in central CSE");
	
		var options = {
		uri: config.cse.parentIP + "/" + config.cse.parentName,
		method: "POST",
		headers: {
			"X-M2M-Origin": "S" + rn,
			"X-M2M-RI": "req"+requestNr,
			"Content-Type": "application/vnd.onem2m-res+json;ty=2"
		},
		json: { 
			"m2m:ae":{
				"rn": rn,			
				"api": rn,
				"rr":false,
                "poa": [config.cse.gatewayIP + ":" + config.cse.port],
			}
		}
	};

	if(cseRelease != "1") {
		options.headers = Object.assign(options.headers, {"X-M2M-RVI":cseRelease});
		options.json["m2m:ae"] = Object.assign(options.json["m2m:ae"], {"srv":["2a"]});
	}
	
	requestNr += 1;
	request(options, function (err, resp, body) {
		console.log("[RESPONSE] central AE: " + rn);
		if(err){
			console.log("AE Creation error: " + err);
		} else {
			if(resp.statusCode==409){
				console.log("Code 409: AE already exists\n");
			}else if(resp.statusCode==404){
                console.log("Code 404: CSE not found\n");
            }
            else{
                console.log("AE Creation: " + resp.statusCode);
                console.log("");
			};
		}
	});
}

// createDataContainer function
function createDataContainer(rn, key){
    console.log("\n[REQUEST] CREATE DATA CONTAINER " + rn + '-' + key);
    
        var options = {
        uri: config.cse.ip + ':' + config.cse.port + "/" + config.cse.name + "/" + rn,
        method: "POST",
        headers: {
            "X-M2M-Origin": "S" + config.cse.name + '-' + rn,
            "X-M2M-RI": "req"+requestNr,
            "Content-Type": "application/vnd.onem2m-res+json;ty=3"
        },
        json: { 
            "m2m:cnt":{
                "rn": key,
                "mni": 100000000,
            }
        }
    };

    if(cseRelease != "1") {
        options.headers = Object.assign(options.headers, {"X-M2M-RVI":cseRelease});
    }
    
    requestNr += 1;
    request(options, function (err, resp, body) {
        console.log("[RESPONSE] DATA CONTAINER " + rn + '-' + key);
        if(err){
            console.log("Data Container Creation error : " + err);
        } else {
            console.log("Data Container Creation :" + resp.statusCode);
            if(resp.statusCode==409){
                console.log("Data Container already exists");
            }else if(resp.statusCode==404){
                console.log("Parent resource not found");
            }else{
                console.log("Data Container Created");
            }
        }
    });
};

function centralDataContainer(rn, key){
    console.log("\n[REQUEST] CREATE DATA CONTAINER " + rn+'-'+key + " in central CSE");
    
        var options = {
        uri: config.cse.parentIP + "/" + config.cse.parentName + "/" + rn,
        method: "POST",
        headers: {
            "X-M2M-Origin": "S" + rn,
            "X-M2M-RI": "req"+requestNr,
            "Content-Type": "application/vnd.onem2m-res+json;ty=3"
        },
        json: { 
            "m2m:cnt":{
                "rn": key,
                "mni": 100000000,
            }
        }
    };

    if(cseRelease != "1") {
        options.headers = Object.assign(options.headers, {"X-M2M-RVI":cseRelease});
    }
    
    requestNr += 1;
    request(options, function (err, resp, body) {
        console.log("[RESPONSE] central CONTAINER " + rn+'-'+key);
        if(err){
            console.log("Data Container Creation error : " + err);
        } else {
            console.log("Data Container Creation :" + resp.statusCode);
            if(resp.statusCode==409){
                console.log("Data Container already exists for " + rn + ' with key ' + key);
            }else if(resp.statusCode==404){
                console.log("Parent resource not found for " + rn + ' wih key ' +key);
            }else{
                console.log("Data Container Created");
            }
        }
    });
};

// createContentInstance function
function createContentInstance(rn, data, key, creationTime){
    //console.log("\n[REQUEST] CREATE CONTENT INSTANCE at " + rn+'-'+key);
    
        var options = {
        uri: config.cse.ip + ':' + config.cse.port + "/" + config.cse.name + "/" + rn + "/" + key,
        method: "POST",
        headers: {
            "X-M2M-Origin": "S" + config.cse.name,
            "X-M2M-RI": "req"+requestNr,
            "Content-Type": "application/vnd.onem2m-res+json;ty=4"
        },
        json: { 
            "m2m:cin":{
                "con": data,
                "ct": creationTime
            }
        }
    };

    if(cseRelease != "1") {
        options.headers = Object.assign(options.headers, {"X-M2M-RVI":cseRelease});
    }
    
    requestNr += 1;
    request(options, function (err, resp, body) {
        //console.log("[RESPONSE] CIN at " + rn + '-' + key);
        if(err){
            //console.log("Content Instance Creation error : " + err);
        } else {
            //console.log("Content Instance Creation: " + resp.statusCode);
            if(resp.statusCode==409){
                //console.log("Content Instance already exists");
            }else if(resp.statusCode==404){
                //console.log("Parent resource not found");
            }else{
                //console.log("Data stored in local container");
            };
        }
    });
};

function centralContentInstance(rn, data, key, creationTime){
    //console.log("\n[REQUEST] CREATE CIN in at " +rn + '-' + key + " in central CSE");
    
        var options = {
        uri: config.cse.parentIP + "/" + config.cse.parentName + "/" + rn + "/" + key,
        method: "POST",
        headers: {
            "X-M2M-Origin": "S" + rn,
            "X-M2M-RI": "req"+requestNr,
            "Content-Type": "application/vnd.onem2m-res+json;ty=4"
        },
        json: { 
            "m2m:cin":{
                "con": data,
                "ct": creationTime
            }
        }
    };

    if(cseRelease != "1") {
        options.headers = Object.assign(options.headers, {"X-M2M-RVI":cseRelease});
    }
    
    requestNr += 1;
    request(options, function (err, resp, body) {
        //console.log("[RESPONSE] CIN at " + rn + '-' + key);
        if(err){
            //console.log("Content Instance Creation error : " + err);
            if(err.code == 'ECONNREFUSED' || err.code == 'ETIMEDOUT'){
                unsentData[`${rn}@${key}@${creationTime}`] = {"con":data,"ct":creationTime,"status":"pending"};
		    //console.log("Cannot connect to central server. Data will be resent once reconnected");
            }
        } else {
            //console.log("Content Instance Creation: " + resp.statusCode);
            if(resp.statusCode==409){
                //console.log("Content Instance already exists");
            }else if(resp.statusCode==404){
                //console.log("Parent resource not found");
            }else{
                //console.log("Data stored in central container");
            };
        }
    });
};

function deleteAE(rn){
    console.log("\n[REQUEST] DELETE AE");
    
        var options = {
        uri: config.cse.ip + ':' + config.cse.port + "/" + config.cse.name + "/" + rn,
        method: "DELETE",
        headers: {
            "X-M2M-Origin": "S" + config.cse.name + '-' + rn,
            "X-M2M-RI": "req"+requestNr,
            "Content-Type": "application/vnd.onem2m-res+json;ty=2"
        }
    };

    if(cseRelease != "1") {
        options.headers = Object.assign(options.headers, {"X-M2M-RVI":cseRelease});
    }
    
    requestNr += 1;
    request(options, function (err, resp, body) {
        console.log("[RESPONSE]");
        if(err){
            console.log("AE Deletion error : " + err);
        } else {
            console.log("AE Deletion: " + resp.statusCode);
            if(resp.statusCode==404){
                console.log("AE not found");
            }else{
                console.log("AE Deleted");
                console.log(options.method + " " + options.uri);
            };
        }
    });
}

function resendData(name){
	//console.log("\n[REQUEST] resending Data " + name);
	
	if (!unsentData.hasOwnProperty(name) || unsentData[name].status !== 'pending') {
	    //console.log('Skipping resend for:', name);
	    return;
	}
	
	unsentData[name].status = 'resending';
	
	var rn = name.split("@")[0];
	var key = name.split("@")[1];

	var options = {
		uri: config.cse.parentIP + "/" + config.cse.parentName + "/" + rn + "/" + key,
		method: "POST",
		headers: {
			"X-M2M-Origin": "S"+rn,
			"X-M2M-RI": "req"+requestNr,
			"Content-Type": "application/json;ty=4"
		},
		json: {
			"m2m:cin": {
			    "con": unsentData[name].con,
			    "ct": unsentData[name].ct
			}
		}
	};

	//console.log("");
	//console.log(options.method + " " + options.uri);
	//console.log(options.json);

	if(cseRelease != "1") {
		options.headers = Object.assign(options.headers, {"X-M2M-RVI":cseRelease});
	}
	
	requestNr += 1;
	request(options, function (error, response, body) {
		//console.log("[RESPONSE] resendData");
		if(error){
			//console.log("error");
			unsentData[name].status = 'pending';
		}else{
			//console.log('[RESPONSE] Resending data to server successful: ' + response.statusCode);
			//console.log(body);
			delete unsentData[name];
		}
	});

}

function checkAndResendData() {
    request({url:`http://100.70.99.17:7777/ping`, timeout:10000}, function (error, response) {
	if (!error && response.statusCode == 200) {
	    if(Object.keys(unsentData).length > 0){
		console.log("Connection restored. Resending unsent data to the server.");
	    };
            Object.keys(unsentData).forEach(key => {
                if (unsentData[key].status === 'pending') {
                    resendData(key);
                }
            });
        } else {
	    console.log("Connection lost. Total unsent data: " + Object.keys(unsentData).length);
        }
    });
}

// Periodically check connection status
setInterval(checkAndResendData, 30000); // Check every 10 seconds


module.exports = { createAE, deleteAE, createDataContainer, createContentInstance, centralAE, centralDataContainer, centralContentInstance, resendData};
