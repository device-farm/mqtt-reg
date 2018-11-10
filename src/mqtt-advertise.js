const mqtt = require("mqtt");

module.exports = (broker, cb) => {

    const client = mqtt.connect(`mqtt://${broker}`);

    client.subscribe(`register/+/advertise`);

    client.on("message", (topic, message) => {
        let name = topic.split("/")[1];
        let metaString = message.toString();
        
        try {
            let meta = JSON.parse(metaString);
            cb(name, meta);
        } catch(e) {
            console.error(`Error parsing meta object "${metaString}" of register ${name}`);
        }        
    });

    client.on("connect", () => {
        client.publish("register/advertise!");
    });
}