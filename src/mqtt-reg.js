const mqtt = require("mqtt");

module.exports = (broker, register, cb, timeoutMs = 10000) => {

	const client = mqtt.connect(`mqtt://${broker}`);

	let timeout;
	let firstTimeout;
	let actual;
	let desired;
	let unset = true;

	function safeCb(...args) {
		try {
			cb(...args);
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
					safeCb(actual, prev, false);
				}				
			}
			
			firstTimeout = false;
			getOrSet();
			resetTimeout();
			
		}, timeoutMs);
	}

	function getOrSet() {
		if (desired !== undefined) {
			client.publish(`register/${register}/set`, JSON.stringify(desired));
		} else {
			client.publish(`register/${register}/get`);
		}
	}

	client.subscribe(`register/${register}/is`);

	client.on("message", function (topic, message) {

		firstTimeout = true;
		let prev = actual;
		
		let str = message.toString();
		if (str === "") {
			actual = undefined;
		} else {
			actual = JSON.parse(str);
		}

		if (actual !== prev || unset) {
			safeCb(actual, prev, false);
		}
		unset = false;

		resetTimeout();
	});

	getOrSet();
	safeCb(actual, undefined, true);
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
