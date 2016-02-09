/**
 * Parses <meta name="viewport"> of given document
 * @param  {Document} doc
 * @return {Object}
 */
'use strict';
const defaultViewport = {};

export default function(doc) {
	var meta = doc.querySelector('meta[name="viewport"]');
	return meta ? parseViewport(meta.getAttribute('content')) : defaultViewport;
}

function parseViewport(str='') {
	return str.split(/[,;]/g).reduce((obj, prop) => {
		let parts = prop.trim().split('=');
		let name = parts.shift().trim().toLowerCase();
		let value = parts.join('=').trim().toLowerCase();

		// validate and transform properties we will actually use
		if (name === 'width' || name === 'height') {
			if (value !== 'device-width' && value !== 'device-height') {
				value = parseInt(value, 10);
				if (isNaN(value)) {
					value = `device-${name}`;
				} else {
					value = Math.min(Math.max(1, value), 10000);
				}
			}
		}
		obj[name] = value;
		return obj;
	}, {});
}
