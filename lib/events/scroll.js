/**
 * Module for handling scroll events on given page
 */
'use strict';

import EventEmitter from 'eventemitter3';
import * as xpath from '../xpath';

export function host(doc) {
	let out = new EventEmitter();
	let onScroll = evt => {
		let target = evt.target;
		if (target === doc) {
			target = target.scrollingElement || target.body;
		}

		out.emit('data', {
			name: 'scroll',
			target: xpath.serialize(target),
			data: getScrollData(target)
		});
	};

	doc.addEventListener('scroll', onScroll, true);

	out.dispose = function() {
		doc.removeEventListener('scroll', onScroll, true);
		onScroll = null;
	};

	return out;
}

export function guest(doc) {
	return event => {
		if (event.name !== 'scroll') {
			return;
		}

		let elem = xpath.find(event.target, doc);
		if (!elem) {
			return;
		}

		let data = event.data;
		let [vpWidth, vpHeight] = getViewportSize(elem);
		let srcScrollWidth   = Math.max(data.width - data.vpWidth, 0);
		let srcScrollHeight  = Math.max(data.height - data.vpHeight, 0);
		let posX = srcScrollWidth ? (data.left / srcScrollWidth) : 0;
		let posY = srcScrollHeight ? (data.top / srcScrollHeight) : 0;

		let left = (posX * Math.max(elem.scrollWidth - vpWidth, 0)) | 0;
		let top  = (posY * Math.max(elem.scrollHeight - vpHeight, 0)) | 0;

		if (isPageScroller(elem)) {
			elem.ownerDocument.defaultView.scrollTo(left, top);
		} else {
			elem.scrollLeft = left;
			elem.scrollTop = top;
		}
	};
}

function getScrollData(elem) {
	let [vpWidth, vpHeight] = getViewportSize(elem);
	let [left, top] = scrollOffset(elem);
	
	return {
		left, top,
		width: elem.scrollWidth,
		height: elem.scrollHeight,
		vpWidth, vpHeight
	};
}

function getViewportSize(elem) {
	if (isPageScroller(elem)) {
		let wnd = elem.ownerDocument.defaultView;
		return [wnd.innerWidth, wnd.innerHeight];
	}

	return [elem.clientWidth, elem.clientHeight];
}

/**
 * Check if given element actually scrolls page
 * @param  {Element}  elem
 * @return {Boolean}
 */
function isPageScroller(elem) {
	let doc = elem.ownerDocument;
	if ('scrollingElement' in doc) {
		return doc.scrollingElement === elem;
	}

	// most likely global scroller is a <body> element
	return doc.body === elem;
}

function scrollOffset(elem) {
	let wnd = elem.ownerDocument.defaultView;
	return isPageScroller(elem)
		? [wnd.pageXOffset, wnd.pageYOffset]
		: [elem.scrollLeft, elem.scrollTop];
}