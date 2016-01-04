'use strict';

const screenCoords = {
	x: ['screenX', 'clientX'],
	y: ['screenY', 'clientY']
};
const localCoords = {
	x: ['offsetX'],
	y: ['offsetY']
};
const copyProps = [
	'type', 'ctrlKey', 'shiftKey', 'altKey', 'metaKey', 
	'button', 'buttons', 'bubbles', 'cancelable'
];

const coordsLookup = [screenCoords, localCoords]
.reduce((obj, arr) => {
	arr.x.forEach(key => obj[key] = arr.x);
	arr.y.forEach(key => obj[key] = arr.y);
	return obj;
}, {});

export var supportedEvents = [
	'click', 'mouseup', 'mousedown', 'mousemove', 
	'mouseenter', 'mouseleave'
];

export function serialize(event) {
	// serialization strategy:
	// * global screen coordinates to viewport-relative values
	// * local element coordinates to element-relative values
	var out = copyProps.reduce((obj, key) => {
		obj[key] = event[key];
		return obj;
	}, {});

	let [vpWidth, vpHeight] = getViewportSize(event.target);
	let [elWidth, elHeight] = getElementSize(event.target);

	screenCoords.x.forEach(key => out[key] = event[key] / vpWidth);
	screenCoords.y.forEach(key => out[key] = event[key] / vpHeight);
	localCoords.x.forEach(key => out[key] = event[key] / elWidth);
	localCoords.y.forEach(key => out[key] = event[key] / elHeight);
	return out;
};

export function unserialize(elem, data) {
	if (!data.type) {
		return null;
	}

	var [vpWidth, vpHeight] = getViewportSize(elem);
	var [elWidth, elHeight] = getElementSize(elem);
	var payload = Object.keys(data).reduce((obj, key) => {
		let arr = coordsLookup[key];
		let value = data[key];
		let t = arg => (arg * value)|0;
		if (arr === screenCoords.x) {
			obj[key] = t(vpWidth);
		} else if (arr === screenCoords.y) {
			obj[key] = t(vpHeight);
		} else if (arr === localCoords.x) {
			obj[key] = t(elWidth);
		} else if (arr === localCoords.y) {
			obj[key] = t(elHeight);
		} else if (key !== 'type') {
			obj[key] = value;
		}
		return obj;
	}, {});

	return new MouseEvent(data.type, payload);
}

function getViewportSize(elem) {
	let doc = isDocument(elem) ? elem : elem.ownerDocument;
	let wnd = doc.defaultView;
	return [wnd.innerWidth, wnd.innerHeight];
}

function getElementSize(elem) {
	if (isDocument(elem)) {
		elem = elem.documentElement;
	}
	return [elem.offsetWidth, elem.offsetHeight];
}

function isDocument(elem) {
	return elem.nodeType === 9;
}