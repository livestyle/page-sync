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
		} else if (name === 'initial-scale') {
			// Mobile Safari infers all properties if only one is set
			// https://developer.apple.com/library/safari/documentation/AppleApplications/Reference/SafariWebContent/UsingtheViewport/UsingtheViewport.html#//apple_ref/doc/uid/TP40006509-SW29
			if (!('width' in obj)) {
				obj.width = 'device-width';
			}
			if (!('height' in obj)) {
				obj.height = 'device-height';
			}
		}
		obj[name] = value;
		return obj;
	}, {});
}
