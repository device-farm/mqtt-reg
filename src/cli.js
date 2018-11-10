#!/usr/bin/env node

const mqtt = require("mqtt");
mqttReg = require("./mqtt-reg.js");
mqttAdvertise = require("./mqtt-advertise.js");

[
    nodePath,
    scriptPath,
    mqttBroker,
    regName,
    regValue
] = process.argv;

if (!mqttBroker) {
    console.info(
        `use:

to list registers and watch their values:
mqttreg <mqtt-broker>

to get specific register value as JSON:
mqttreg <mqtt-broker> <reg-name>

to set specific register value as JSON:
mqttreg <mqtt-broker> <reg-name> <reg-value>
`
    );
} else {

    if (!regName) {
        let regs = {};
        mqttAdvertise(mqttBroker, (name, meta) => {

            if (!regs[name]) {
                regs[name] = meta;
                console.info(name, "-", Object.entries(meta).map(([k, v]) => `${k}:${v}`).join(", "));
                let firstCb = true;
                mqttReg(mqttBroker, name, v => {
                    if (!firstCb || v !== undefined) {
                        firstCb = false;
                        console.info(name, "=", v);
                    }
                });
            }

        });
    } else {
        if (regValue === undefined) {

            let firstCb = true;
            let reg = mqttReg(mqttBroker, regName, v => {
                if (!firstCb || v !== undefined) {
                    firstCb = false;
                    console.info(JSON.stringify(v));
                    process.exit(0);
                }
            });

        } else {
            regValue = JSON.parse(regValue);

            let reg = mqttReg(mqttBroker, regName, v => {
                if (v === regValue) {
                    process.exit(0);
                }
            });

            reg.set(regValue);
        }
    }
}