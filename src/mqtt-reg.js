const mqtt = require("mqtt");

module.exports = (broker, device, register, cb, timeoutMs = 10000) => {

	const client = typeof broker === "string"? mqtt.connect(`mqtt://${broker}`): broker;

	let timeout;
	let firstTimeout;
	let actual;
	let desired;


	function safeCb(actual, prev) {
		try {
			cb(actual, prev);
		} catch (e) {
			console.error("Error in register callback", e);
		}
	}

	function resetTimeout() {
		
		if (timeout) {
			clearTimeout(timeout);
		}
		
		timeout = setTimeout(() => {
			
			if (!firstTimeout) {
				let prev = actual;
				actual = undefined;
				if (actual !== prev) {
					safeCb(actual, prev);
				}				
			}
			
			firstTimeout = false;
			getOrSet();
			resetTimeout();
			
		}, timeoutMs);
	}

	function getOrSet() {
		if (desired !== undefined) {
			client.publish(`${device}/register/${register}/set`, JSON.stringify(desired));
		} else {
			client.publish(`${device}/register/${register}/get`);
		}
	}

	client.subscribe(`${device}/register/${register}/is`);

	client.on("message", function (topic, message) {

		firstTimeout = true;
		let prev = actual;
		
		let str = message.toString();
		if (str === "") {
			actual = undefined;
		} else {
			actual = JSON.parse(str);
		}

		if (actual !== prev) {
			safeCb(actual, prev);
		}

		resetTimeout();
	});

	getOrSet();
	safeCb();
	resetTimeout();

	return {
		set(value) {
			if (desired !== value && actual !== value) {
				desired = value;
				getOrSet();
			}
		},
		actual() {
			return actual;
		}
	};
};
