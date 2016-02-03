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
const reImportant = /!important$/;

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

function addCSSProperty(target, name, value) {
    if ( !(name in target) ||(reImportant.test(value) && !reImportant.test(target[name])) ) {
        target[name] = value;
    }
    return target;
}

function getHoverStyles(elem, cacheKey=xpath.serialize(elem), checkExpires=false) {
    var entry = styleCache[cacheKey];
    if (entry && checkExpires && entry.expires < Date.now()) {
        entry = null;
    }

    if (!entry) {
        let originalStyle = elem.ownerDocument.defaultView.getComputedStyle(elem);
        let baseStyle = {}, hoverStyle = {};

        // collapse all matched rules into a single style payload
        getMatchedCSSRules(elem, ':hover').forEach(item => {
            let target = /:hover\b/.test(item.selector) ? hoverStyle : baseStyle;
            let rule = item.rule;
            for (var i = 0; i < rule.style.length; i++) {
                let name = rule.style[i];
                let value = rule.style.getPropertyValue(name);
                addCSSProperty(hoverStyle, name, value);
                if (!/:hover\b/.test(item.selector)) {
                    addCSSProperty(baseStyle, name, value);
                }
            }
        });

        Object.keys(hoverStyle).forEach(key => {
            if (hoverStyle[key] === baseStyle[key]) {
                delete hoverStyle[key];
            }
        });

        // extract preperties we should actually apply
        let style = Object.keys(hoverStyle).reduce((result, name) => {
            let elemValue = elem.style.getPropertyValue(name);
            let originalValue = originalStyle.getPropertyValue(name);
            if (originalValue !== hoverStyle[name] && !elemValue) {
                result[name] = {
                    original: elemValue,
                    hover: hoverStyle[name]
                };
            }
            return result;
        }, {});

        entry = {style, expires: Date.now() + cacheExpire};
        styleCache[cacheKey] = entry;
    }

    return entry.style;
}
