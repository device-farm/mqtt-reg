const mqtt = require("mqtt");

module.exports = config => {

	console.info(config);

	function register(device, ep, cb, timeoutMs = 5000) {

		const client = mqtt.connect(`mqtt://${config.mqttHost}`);

		let readTimeout;

		let actual;
		let desired;

		function is(v) {
			let prev = actual;
			actual = v;

			if (actual !== prev) {
				cb(actual, prev);
			}

			if (actual !== undefined && desired === actual) {
				desired = undefined;
			}

			if (desired !== undefined) {
				set();
			} else {
				if (actual === undefined) {
					get();
				}
			}

		}

		function resetTimeout() {
			if (readTimeout) {
				clearTimeout(readTimeout);
			}
			readTimeout = setTimeout(() => {
				is();
			}, timeoutMs);
		}

		function set() {
			resetTimeout();
			client.publish(`${device}/register/${ep}/set`, JSON.stringify(desired));
		}

		function get() {
			resetTimeout();
			client.publish(`${device}/register/${ep}/get`);
		}

		client.subscribe(`${device}/register/${ep}/is`);

		client.on("message", function (topic, message) {
			resetTimeout();
			let value = JSON.parse(message.toString());
			is(value);
		});

		get();
		cb();

		return (v) => {
			if (desired !== v && actual !== v) {
				desired = v;
				set();
			}
		};
	}


	let temp = register("ESP", "Temperature", (value, prev) => {
		console.info("Temp:", prev, "=>", value);
	});

	temp(20);
	

};