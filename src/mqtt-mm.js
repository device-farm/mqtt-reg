const mqtt = require("mqtt");

let brokers = {};

module.exports = brokerUrl => {

    if (!brokers[brokerUrl]) {
        let broker = {

            connection: mqtt.connect(brokerUrl),

            listeners: [],

            publish(topic, message) {
                this.connection.publish(topic, message);
            },

            subscribe(topic, listener) {
                this.connection.subscribe(topic);

                let parsedTopic = topic.split("/");
                this.listeners.push((actTopic, actMessage) => {
                    let parsedActTopic = actTopic.split("/");
                    let matches = true;
                    for (let i in parsedTopic) {
                        if (parsedTopic[i] === parsedActTopic[i] || parsedTopic[i] === "+") {
                            continue;
                        }
                        if (parsedTopic[i] === "#") {
                            break;
                        }
                        matches = false;
                        break;
                    }
                    if (matches) {
                        listener(actTopic, actMessage);
                    }
                });
            }
        }

        brokers[brokerUrl] = broker;

        broker.connection.on("message", (topic, message) => {
            broker.listeners.forEach(l => l(topic, message));
        });
    }

    return brokers[brokerUrl];
}