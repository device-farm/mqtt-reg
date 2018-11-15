#!/usr/bin/env node

const mqtt = require("mqtt");
const deepEqual = require("fast-deep-equal");
mqttReg = require("./mqtt-reg.js");
mqttAdvertise = require("./mqtt-advertise.js");

[
    nodePath,
    scriptPath,
    regName,
    regValue
] = process.argv;

let mqttBroker = process.env.MQTT;

if (!mqttBroker || regName === "-h" || regName === "--help") {
    console.info(
        `use:

to list registers and watch their values:
mqttreg <mqtt-broker>

to get specific register value as JSON:
mqttreg <mqtt-broker> <reg-name>

to set specific register value as JSON:
mqttreg <mqtt-broker> <reg-name> <reg-value>

the tool expects MQTT environment variable to point to MQTT broker
`
    );
} else {

    if (!regName) {
        let regs = {};
        mqttAdvertise(mqttBroker, (name, meta) => {

            if (!regs[name]) {
                regs[name] = meta;
                console.info(name, "-", Object.entries(meta).map(([k, v]) => `${k}:${v}`).join(", "));               
                mqttReg(mqttBroker, name, (actual, prev, initial) => {
                    if (!initial) {
                        console.info(name, "=", actual);
                    }
                });
            }

        });
    } else {
        if (regValue === undefined) {

            let reg = mqttReg(mqttBroker, regName, (actual, prev, initial) => {
                if (!initial) {
                    console.info(JSON.stringify(actual));
                    process.exit(0);
                }
            });

        } else {
            regValue = JSON.parse(regValue);

            let reg = mqttReg(mqttBroker, regName, actual => {
                if (deepEqual(actual, regValue)) {
                    process.exit(0);
                }
            });

            reg.set(regValue);
        }
    }
}