'use strict';

export default function(elem, name, detail) {
	let evt;
	let params = {
		bubbles: true,
		cancelable: true,
		detail
	};

	if (typeof CustomEvent !== 'undefined') {
		evt = new CustomEvent(name, params);
	} else {
		evt = elem.ownerDocument.createEvent('CustomEvent');
		evt.initCustomEvent(name, params.bubbles, params.cancelable, params.detail);
	}
	
	elem.dispatchEvent(evt);
}

function eventConstructor(name) {
	
}