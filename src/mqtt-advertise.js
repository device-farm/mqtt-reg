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

    function advertiseChallenge() {
        client.publish("register/advertise!");
    };

    //TODO detect removals
    //TODO subscribe to register/advertise! and avoid simultaneous challenges  
    setInterval(advertiseChallenge, 10000);
    client.on("connect", advertiseChallenge);
}