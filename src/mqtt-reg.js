const mqtt = require("mqtt");

module.exports = (mqtt, device, register, cb, timeoutMs = 5000) => {

	const client = mqtt.connect(`mqtt://${mqtt}`);

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
		client.publish(`${device}/register/${register}/set`, JSON.stringify(desired));
	}

	function get() {
		resetTimeout();
		client.publish(`${device}/register/${register}/get`);
	}

	client.subscribe(`${device}/register/${register}/is`);

	client.on("message", function (topic, message) {
		resetTimeout();
		let value = JSON.parse(message.toString());
		is(value);
	});

	get();
	cb();

	return {
		set(value) {
			if (desired !== value && actual !== value) {
				desired = value;
				set();
			}
		},
		actual() {
			return actual;
		}
	};
};
