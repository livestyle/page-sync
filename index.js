'use strict';

import EventEmitter from 'eventemitter3';
import * as events from './lib/events';

const eventList = Object.keys(events).map(key => events[key]);

export function host(doc, options={}) {
	let out = new EventEmitter();
	let proxy = data => out.emit('data', data);
	let onUnload = evt => {
		if (evt.target === doc) {
			out.dispose();
		}
	};
	let bindings = eventList.map(e => e.host(doc, options).on('data', proxy));
	out.document = doc;
	out.dispose = () => {
		bindings.forEach(binding => {
			binding.off('data', proxy);
			if (binding.dispose) {
				binding.dispose();
			}
		});
		bindings.length = 0;
		if (doc.defaultView) {
			doc.defaultView.removeEventListener('unload', onUnload);
		}
		out.document = null;
		out.emit('dispose');
	};

	doc.defaultView.addEventListener('unload', onUnload);
	return out;
}

export function guest(doc, options={}) {
	let bindings = eventList.map(e => e.guest(doc, options));
	let out = data => bindings.forEach(b => b(data));
	out.document = doc;
	out.dispose = () => {
		bindings.forEach(b => b.dispose && b.dispose());
		bindings.length = 0;
		out.document = null;
	};
	return out;
}