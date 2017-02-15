//@flow

global.WebSocket = require('ws');
global.XMLHttpRequest = require('xhr2');
var soapclient = require('./lib/soapclient');
var DeviceHive = require('./lib/devicehive.device');
var timeInterval = 60000;
var lastRunPower = 0;
var dh = new DeviceHive("http://playground.devicehive.com/api/rest", "d-link-switch", "FsJCDRAbjTO+5GA8b0nydWJvtHl4Nwc4wZqHnqM/+Gk=");
soapclient.login("admin", "814993", "http://192.168.50.102/HNAP1").done(function(status) {
    if (!status) {
        throw "Login failed!";
    }
    if (status != "success") {
        throw "Login failed!";
    }
});

dh.registerDevice({
        guid: "d-link-switch",
        name: "d-link-switch",
        key: "d-link-switch", // obsolete but still required
        status: "Online",
        deviceClass: {
            name: "d-link-switch",
            version: "1.0.0",
        },
        equipment: [{
            name: "d-link-switch",
            type: "smart_switch",
            code: "smart_switch"
        }]
    },
    function(err, res) {
        if (err)
            console.log(err);
        else {
            dh.openChannel(function(err, res) {
                if (err)
                    console.log(err);
                else {
                    var SubCommands = {
                        names: ["dlink/switch", "dlink/init"]
                    };
                    var CmdSub = dh.subscribe(function(err, res) {
                        if (err)
                            console.log(err);
                        else
                            console.log('DEVICE SUBSCRIBES TO MASAGES ' + JSON.stringify(res));
                    }, SubCommands);
                    CmdSub.message(function(cmd) {
                        console.log(cmd);
                        if (cmd.command == "dlink/switch") {
                            if (cmd.parameters.state == 'ON') {
                                soapclient.on().done(function() {
                                    cmd.update({
                                        "command": "dlink/switch",
                                        "status": "OK",
                                        "result": {
                                            "message": "Switch ON!"
                                        }
                                    }, function(err, res) {
                                        if (err)
                                            console.log(err);
                                        else
                                            console.log("Command updated");
                                    });
                                });
                            } else if (cmd.parameters.state == 'OFF') {
                                soapclient.off().done(function() {
                                    cmd.update({
                                        "command": "dlink/switch",
                                        "status": "OK",
                                        "result": {
                                            "message": "Switch OFF!"
                                        }
                                    }, function(err, res) {
                                        if (err)
                                            console.log(err);
                                        else
                                            console.log("Command updated");
                                    });
                                });
                            }
                        } else if (cmd.command == "dlink/init") {
                            read_data();
                            cmd.update({
                                "command": "dlink/init",
                                "status": "OK",
                                "result": {
                                    "message": "Started sending data!"
                                }
                            }, function(err, res) {
                                if (err)
                                    console.log(err);
                                else
                                    console.log("Command updated");
                            });
                        }
                    });
                }
            }, "websocket");
        }
    });

function read_data() {
    console.log("read data");
    setInterval(function() {
        soapclient.consumption().done(function(power) {
            if (power != "ERROR") {
                var lastRunPower = power;
                var energy = power / (3600 / (timeInterval / 1000));
                dh.sendNotification("dlink/init", {
                    "power": power,
                    "energy": energy,
                    "status": "OK"
                }, function(err, res) {
                    if (err)
                        console.log(err);
                    else {
                        console.log({
                            "power": power,
                            "energy": energy,
                            "status": "OK"
                        });
                    }
                })
            } else {
                var energy = parseInt(lastRunPower) / (3600 / (timeInterval / 1000));
                dh.sendNotification("dlink/init", {
                    "power": lastRunPower,
                    "energy": energy,
                    "status": "ERROR"
                }, function(err, res) {
                    if (err)
                        console.log(err);
                    else {
                        console.log({
                            "power": lastRunPower,
                            "energy": energy,
                            "status": "ERROR"
                        });
                    }
                })
            }
        });
    }, timeInterval);

};
