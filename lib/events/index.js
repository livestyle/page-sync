'use strict';

import EventEmitter from 'eventemitter3';
import * as scroll from './scroll';
import * as mouse from './mouse';
import * as form from './form';

const events = [scroll, mouse, form];

export function host(elem, options={}) {
	let out = new EventEmitter();
	let proxy = data => out.emit('data', data);
	let bindings = events.map(e => e.host(elem, options).on('data', proxy));
	out.dispose = () => {
		bindings.forEach(binding => {
			binding.off('data', proxy);
			if (binding.dispose) {
				binding.dispose();
			}
		});
		bindings = null;
	};
	return out;
}

export function guest(elem, options={}) {
	let bindings = events.map(e => e.guest(elem, options));
	let out = data => bindings.forEach(b => b(data));
	out.dispose = () => {
		bindings.forEach(b => b.dispose && b.dispose());
		bindings = null;
	};
	return out;
}