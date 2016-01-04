/**
 * There’s no way to detect destination URL when user navigates somewhere.
 * In case we are on same “domain” (for example, Re:View UI), when host
 * loads new page, it re-initiates page-sync lib, so sending `location`
 * event on start will force all guests to change location as well
 */
'use strict';

import EventEmitter from 'eventemitter3';

export function host(doc) {
	var out = new EventEmitter();
	setTimeout(() => out.emit('data', {
		name: 'location',
		data: doc.location.href
	}), 100);
	out.dispose = () => 0;
	return out;
}

export function guest(doc) {
	return event => {
		if (event.name === 'location' && doc.location && doc.location.href !== event.data) {
			doc.location.href = event.data;
		}
	};
}