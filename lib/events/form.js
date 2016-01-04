/**
 * Form-related events: input, change, submit
 */
'use strict';

import EventEmitter from 'eventemitter3';
import * as xpath from '../xpath';

const supportedEvents = ['change', 'input', 'submit'];

export function host(doc) {
	let out = new EventEmitter();
	let handler = evt => {
		// Edge case in, umm... MS Edge: `change` event appears *before* `click`
		// and contains previous `checked` state, e.g. value *before* it was updated.
		// Postpone event emit to properly handle this case
		let elem = evt.target;
		let data = serialize(evt);
		let target = xpath.serialize(elem);
		setTimeout(() => {
			if ('checked' in elem) {
				data.checked = !!elem.checked;
			}
			out.emit('data', {name: 'form', target, data});
		}, 1);
	};

	supportedEvents.forEach(e => doc.addEventListener(e, handler, true));

	out.dispose = function() {
		supportedEvents.forEach(e => doc.removeEventListener(e, handler, true));
		handler = null;
	};

	return out;
}

export function guest(doc) {
	return event => {
		if (event.name !== 'form') {
			return;
		}

		let elem = xpath.find(event.target, doc);
		if (!elem) {
			return;
		}

		if (event.data.type === 'change') {
			console.log('change', elem.nodeName, elem.checked);
		}

		if (event.data.type === 'submit') {
			elem.submit();
		} else if (elem.multiple) {
			setMultipleValues(elem, event.data.value);
		} else {
			elem.value = event.data.value;
			if (elem.type === 'checkbox') {
				elem.checked = event.data.checked;
			}
		}
	};
}

function serialize(evt) {
	var out = {type: evt.type};
	if (evt.type !== 'submit') {
		out.checked = !!evt.target.checked;
		out.value = evt.target.multiple 
			? getMultipleValues(evt.target) 
			: evt.target.value;
	}
	return out;
}

function getMultipleValues(select) {
	return toArray(select.options || [])
	.filter(opt => opt.selected)
	.map(opt => opt.value);
}

function setMultipleValues(select, values) {
	if (!Array.isArray(values)) {
		values = [values];
	}

	toArray(select.options || [])
	.forEach(opt => opt.selected = values.indexOf(opt.value) !== -1);
}

function toArray(obj, ix=0) {
	return Array.prototype.slice.call(obj, ix);
}