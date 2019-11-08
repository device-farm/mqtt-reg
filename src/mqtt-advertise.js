const mqtt = require("@device.farm/mqtt-mtl");

module.exports = (broker, cb) => {

    const client = mqtt(`mqtt://${broker}`);

    client.subscribe(`register/+/advertise`, (topic, message) => {
        let name = topic.split("/")[1];
        let metaString = message.toString();
        
        try {
            let meta = JSON.parse(metaString);
            cb(name, meta);
        } catch(e) {
            console.error(`Error parsing meta object "${metaString}" of register ${name}`);
        }        
    });

    let timeout;

    function resetTimeout() {
		
		if (timeout) {
			clearTimeout(timeout);
		}
		
		timeout = setTimeout(advertiseChallenge, 8000 + Math.random() * 4000);
	}
 
    client.subscribe("register/advertise!", (topic, message) => {
        resetTimeout();
    });

    function advertiseChallenge() {
        client.publish("register/advertise!");
        resetTimeout();
    };

    //TODO detect removals
    advertiseChallenge();
}