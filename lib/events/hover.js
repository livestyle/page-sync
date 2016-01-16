/**
 * Simulates :hover CSS pseudo-state.
 * This module doesn’t produce any events as host, it listens to `mouseenter`
 * and `mouseleave` events from `mouse` module as guest
 */

import EventEmitter from 'eventemitter3';
import getMatchedCSSRules from '../matched-css-rules';
import * as xpath from '../xpath';

const styleCache = {};
const cacheExpire = 3000;

export function host(doc) {
    return new EventEmitter();
}

export function guest(doc, options) {
    return event => {
        if (event.name === 'mouse' && event.data.type === 'mouseenter') {
            return hoverIn(doc, event);
        }

        if (event.name === 'mouse' && event.data.type === 'mouseleave') {
            return hoverOut(doc, event);
        }
    };
}

function hoverIn(doc, event) {
    let elem = xpath.find(event.target, doc);
    if (!elem) {
        return;
    }

    var style = getHoverStyles(elem, event.target, true);
    Object.keys(style).forEach(key => elem.style[key] = style[key].hover);
}

function hoverOut(doc, event) {
    let elem = xpath.find(event.target, doc);
    if (!elem) {
        return;
    }

    var style = getHoverStyles(elem, event.target, false);
    Object.keys(style).forEach(key => elem.style[key] = style[key].original);
}

function getHoverStyles(elem, cacheKey=xpath.serialize(elem), checkExpires=false) {
    var entry = styleCache[cacheKey];
    if (entry && checkExpires && entry.expires < Date.now()) {
        entry = null;
    }

    if (!entry) {
        let originalStyle = elem.ownerDocument.defaultView.getComputedStyle(elem);
        let style = getMatchedCSSRules(elem, ':hover').reduce((result, rule) => {
            for (var i = 0; i < rule.style.length; i++) {
                let name = rule.style[i];
                let elemValue = elem.style.getPropertyValue(name);
                let originalValue = originalStyle.getPropertyValue(name);
                let hoverValue = rule.style.getPropertyValue(name);
                if (originalValue !== hoverValue && !elemValue) {
                    result[name] = {
                        original: elemValue,
                        hover: hoverValue
                    };
                }
            }
            return result;
        }, {});

        entry = {style, expires: Date.now() + cacheExpire};
        styleCache[cacheKey] = entry;
    }

    return entry.style;
}
