'use strict';

import EventEmitter from 'eventemitter3';
import extend from 'xtend';
import * as xpath from '../xpath';
import * as uiMouse from '../ui-events/mouse';

const defaultOptions = {
	// Indicates that both host and guest documents share same browser
	// tab. This option slightly changes behaviour on some UI controls
	sameParent: false
};

export function host(doc) {
	let out = new EventEmitter();
	let handler = evt => {
		if (isImplicitInputClick(evt)) {
			return;
		}

		if (evt.target.nodeName === 'OPTION') {
			// wierd behavior in Chrome when sending mouse events on <option>
			// of <select multiple> with Cmd button pressed
			return;
		}

		out.emit('data', {
			name: 'mouse',
			target: xpath.serialize(evt.target),
			data: uiMouse.serialize(evt)
		});
	};

	uiMouse.supportedEvents.forEach(e => doc.addEventListener(e, handler, true));

	out.dispose = function() {
		uiMouse.supportedEvents.forEach(e => doc.removeEventListener(e, handler, true));
		handler = null;
	};

	return out;
}

export function guest(doc, options) {
	options = extend(defaultOptions, options || {});
	return event => {
		if (event.name !== 'mouse') {
			return;
		}

		let elem = xpath.find(event.target, doc);
		if (!elem) {
			return;
		}

		let nativeEvent = uiMouse.unserialize(elem, event.data);
		if (nativeEvent && allowGuestEvent(nativeEvent, elem, options)) {
			elem.dispatchEvent(nativeEvent);
		}
	};
}

/**
 * Edge case: click on <label> element may cause implicit click on matched
 * <input> element. In this case we shouldn’t handle such event because 
 * it will be implicitly created in guest when we send <label> click
 * @param  {MouseEvent}  event
 * @return {Boolean}
 */
function isImplicitInputClick(event) {
	if (event.type !== 'click' || event.target.nodeName !== 'INPUT') {
		return false;
	}

	// Check if event occured outside of element. If so, this is implicit event
	var [x, y] = [event.offsetX, event.offsetY];
	var [w, h] = [event.target.offsetWidth, event.target.offsetHeight];
	return x < 0 || x > w || y < 0 || y > h;
}

function allowGuestEvent(event, elem, options) {
	// for better UX, do not trigger select popup in guests with same parent
	// as host
	return !(options.sameParent && (event.type === 'click' || event.type === 'mousedown') && elem.nodeName === 'SELECT');
}