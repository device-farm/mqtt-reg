const deepEqual = require("fast-deep-equal");

module.exports = (mqttMtl, register, cb, timeoutMs) => {

	if (!timeoutMs) {
		timeoutMs = 8000 + Math.random() * 4000;
	}

	let timeout;
	let firstTimeout;
	let actual;
	let desired;
	let unset = true;
	let askedByAnother = false;

	function safeCb(...args) {
		try {
			cb(...args);
		} catch (e) {
			console.error("Error in register callback", e);
		}
	}

	function resetTimeout() {

		askedByAnother = false;
		
		if (timeout) {
			clearTimeout(timeout);
		}
		
		timeout = setTimeout(() => {
			
			if (!firstTimeout) {
				let prev = actual;
				actual = undefined;
				if (!deepEqual(actual, prev)) {
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
			mqttMtl.publish(`register/${register}/set`, JSON.stringify(desired));
		} else {
			if (!askedByAnother) {
				mqttMtl.publish(`register/${register}/get`);
			}
		}
	}

	// reset timeout if someone else is also trying to get/set the register 
	mqttMtl.subscribe(`register/${register}/get`, (topic, message) => {
		askedByAnother = true;
	});

	mqttMtl.subscribe(`register/${register}/set`, (topic, message) => {
		askedByAnother = true;
	});

	mqttMtl.subscribe(`register/${register}/is`, (topic, message) => {

		firstTimeout = true;
		let prev = actual;
		
		let str = message.toString();
		if (str === "") {
			actual = undefined;
		} else {
			actual = JSON.parse(str);
		}

		if (deepEqual(actual, desired)) {
			desired = undefined;
		}

		if (!deepEqual(actual, prev) || unset) {
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
			if (!deepEqual(desired, value) && !deepEqual(actual, value)) {
				desired = value;
				getOrSet();
			}
		},
		actual() {
			return actual;
		}
	};
};
