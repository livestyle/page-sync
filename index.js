'use strict';

import EventEmitter from 'eventemitter3';
import * as events from './lib/events';
import documentReady from './lib/document-ready';
import broadcast from './lib/broadcast';
import parseViewport from './lib/meta-parser';

const eventList = Object.keys(events).map(key => events[key]);

/**
 * Setup given window object for cross-origin host-guest messaging.
 * This function must be invoked *inside* iframe (e.g. have direct access to
 * `document`). When called, listens `page-sync` events and routes them to
 * to specific destination
 * @param  {Window} wnd
 */
export default function(wnd, options={}) {
	var controller;
	var ready = false, disposed = false;
	var doc = getDocument(wnd);
	var emitEvent = data => broadcast(wnd, 'event', data, options);
	var onMessage = evt => {
		// listen to events for given session only
		var data = evt.data;
		if (data.ns === 'page-sync' && (!options.sessionId || data.sessionId === options.sessionId)) {
			handleEvent(evt.data);
		}
	};

	var handleEvent = payload => {
		let {name, data} = payload;
		if (name === 'host' && controller.type !== name) {
			// promote current view to host
			controller.dispose();
			controller = host(doc, options);
			controller.on('data', emitEvent);
		} else if (name === 'guest' && controller.type !== name) {
			// lower current view to guest
			controller.off(emitEvent).dispose();
			controller = guest(doc, options);
		} else if (name === 'event' && controller.type === 'guest') {
			// apply incoming UI events to guest
			if (!Array.isArray(data)) {
				data = [data];
			}

			data.forEach(controller);
		}
	};

	if (doc) {
		console.log('creating pagesync controller');
		// Document is available, no cross-origin issues: we can control it from here.
		documentReady(doc).then(() => {
			if (!disposed) {
				ready = true;
				controller = guest(doc, options);
				wnd.addEventListener('message', onMessage);
				broadcast(wnd, 'document-ready', parseViewport(doc));
			}
		});
	} else {
		// No document, most likely because of cross-origin issues.
		// Assume that given window contains the same controller in it
		// (injected via <script> tag on page) so we can communicate with
		// via `postMessage`
	}

	var out = function(name, data) {
		if (doc) {
			// we can handle event locally
			ready && handleEvent({name, data});
		} else {
			// use cross-origin messaging instead
			broadcast(wnd, name, data, options);
		}
	};

	out.dispose = () => {
		disposed = true;
		wnd.removeEventListener('message', onMessage);
		controller && controller.dispose();
	};

	return out;
};

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
	out.type = 'host';
	out.dispose = () => {
		bindings.forEach(binding => {
			binding.off('data', proxy);
			binding.dispose && binding.dispose();
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
	out.type = 'guest';
	out.dispose = () => {
		bindings.forEach(b => b.dispose && b.dispose());
		bindings.length = 0;
		out.document = null;
	};
	return out;
}

function getDocument(wnd) {
	try {
		return wnd.document;
	} catch(e) {
		console.error(e);
	}
}
