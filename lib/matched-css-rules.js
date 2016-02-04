/**
 * A refactored `getMatchedCSSRules()` polyfill.
 * Original: https://gist.github.com/ssafejava/6605832
 */
'use strict';

const ELEMENT_RE = /[\w-]+/g;
const ID_RE = /#[\w-]+/g;
const CLASS_RE = /\.[\w-]+/g;
const ATTR_RE = /\[[^\]]+\]/g;
// :not() pseudo-class does not add to specificity, but its content does as if it was outside it
const PSEUDO_CLASSES_RE = /\:(?!not)[\w-]+(\(.*\))?/g;
const PSEUDO_ELEMENTS_RE = /\:\:?(after|before|first-letter|first-line|selection)/g;

export default function(element, pseudo, rules=createIndex(element.ownerDocument)) {
    var match = pseudo ? matchSelectorWithPseudo : matchesSelector;
    return rules
    .reduce((out, rule, index) => {
        if (match(element, rule.selectorText, pseudo)) {
            // in matched rules, extract only those selectors that match given element
            // then sort them by specificity
            var selectors = splitSelector(rule.selectorText);
            for (let i = 0, selector; i < selectors.length; i++) {
                selector = selectors[i];
                if (match(element, selector, pseudo)) {
                    out.push({selector, rule, index});
                }
            }
        }
        return out;
    }, [])
    .sort(bySpecificity);
}

/**
 * Creates stylesheet index for given document
 * @param  {Document} doc
 * @return {Array}
 */
export function createIndex(doc) {
    var result = [];
    var wnd = doc.defaultView;

    // assuming the browser hands us stylesheets in order of appearance
    // we iterate them from the beginning to follow proper cascade order
    var styleSheets = toArray(doc.styleSheets), sheet;
    while (sheet = styleSheets.shift()) {
        let rules = getSheetRules(sheet, wnd), rule;
        while (rule = rules.shift()) {
            if (rule.styleSheet) {
                // If this is an @import rule insert the imported stylesheet's
                // rules at the beginning of this stylesheet's rules and skip
                // this rule
                rules = getSheetRules(rule.styleSheet, wnd).concat(rules);
                continue;
            } else if (rule.media) {
                // If there's no stylesheet attribute BUT there IS a media
                // attribute it's a media rule.
                // Insert the contained rules of this media rule to the beginning
                // of this stylesheet's rules and skip it
                rules = getSheetRules(rule, wnd).concat(rules);
                continue;
            }

            result.push(rule);
        }
    }

    return result;
}

/**
 * Handles extraction of `cssRules` as an `Array` from a stylesheet or something
 * that behaves the same
 * @param  {CSSStyleSheet} stylesheet
 * @return {Array}
 */
function getSheetRules(stylesheet, wnd=window) {
    if (!stylesheet || stylesheet.disabled) {
        return [];
    }

    // if this sheet's media is specified and doesn't match the viewport then skip it
    var sheetMedia = stylesheet.media && stylesheet.media.mediaText;
    if (sheetMedia && sheetMedia.length && !wnd.matchMedia(sheetMedia).matches) {
        return [];
    }

    // get the style rules of this sheet
    return toArray(stylesheet.cssRules);
}

/**
 * Calculates the specificity of a given `selector`
 * @param  {String} selector
 * @return {Number}
 */
function calculateScore(selector) {
    var score = [0,0,0];
    var parts = selector.split(' ');
    var part, match;

    //TODO: clean the ':not' part since the last ELEMENT_RE will pick it up
    while (part = parts.shift(), typeof part === 'string') {
        // find all pseudo-elements
        match = _find(part, PSEUDO_ELEMENTS_RE);
        score[2] += match;
        // and remove them
        match && (part = part.replace(PSEUDO_ELEMENTS_RE, ''));
        // find all pseudo-classes
        match = _find(part, PSEUDO_CLASSES_RE);
        score[1] += match;
        // and remove them
        match && (part = part.replace(PSEUDO_CLASSES_RE, ''));
        // find all attributes
        match = _find(part, ATTR_RE);
        score[1] += match;
        // and remove them
        match && (part = part.replace(ATTR_RE, ''));
        // find all IDs
        match = _find(part, ID_RE);
        score[0] += match;
        // and remove them
        match && (part = part.replace(ID_RE, ''));
        // find all classes
        match = _find(part, CLASS_RE);
        score[1] += match;
        // and remove them
        match && (part = part.replace(CLASS_RE, ''));
        // find all elements
        score[2] += _find(part, ELEMENT_RE);
    }
    return parseInt(score.join(''), 10);
}

function matchesSelector(elem, selector) {
    var matcher = elem.matches || elem.matchesSelector || elem.mozMatchesSelector ||
        elem.webkitMatchesSelector || elem.oMatchesSelector || elem.msMatchesSelector;
    return matcher ? matcher.call(elem, selector) : false;
}

/**
 * A fast and naive check for pseudo-class match.
 * For PageSync needs, we only have to check for `:hover` pseudo-class.
 * For this case, remove `:hover` from original selector and then check if
 * it matches given element
 * @param  {Element} elem
 * @param  {String} selector
 * @return {Boolean}
 */
function matchSelectorWithPseudo(elem, selector, pseudo) {
    if (!selector) {
        return false;
    }

    selector = selector.replace(new RegExp(pseudo + '\\b', 'g'), '');
    return matchesSelector(elem, selector);
}

function _find(string, re) {
    var matches = string.match(re);
    return matches ? matches.length : 0;
}

function toArray(list) {
    return Array.prototype.slice.call(list || []);
}

/**
 * Splits given CSS selector by comma
 */
function splitSelector(selector) {
    var parts = [];
    var start = 0, pos = 0, ch;
    var len = selector.length;
    while (pos < len) {
        ch = selector[pos++];
        if (ch === ',') {
            parts.push(selector.slice(start, pos - 1).trim());
            start = pos;
            continue;
        }

        if (ch === '"' || ch === "'") {
            while (pos < len) {
                if (selector[pos++] === ch) {
                    break;
                }
            }
        }
    }

    parts.push(selector.slice(start).trim());
    return parts.filter(Boolean);
}

function bySpecificity(a, b) {
    return (calculateScore(b.selector) - calculateScore(a.selector)) || (b.index - a.index);
}
