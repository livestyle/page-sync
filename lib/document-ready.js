/**
 * Check if given document is ready for interation.
 */
'use strict';

export default function(doc) {
    return Promise.race([waitUntilReady(doc), rejectOnTimeout()]);
};

function waitUntilReady(doc) {
    return new Promise(resolve => {
        if (doc.readyState === 'interactive' || doc.readyState === 'complete') {
            resolve(doc);
        } else {
            doc.addEventListener('DOMContentLoaded', () => resolve(doc));
        }
    });
}

function rejectOnTimeout(timeout=30000) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            var err = new Error('Document ready timeout');
            err.code = 'EREADYTIMEOUT';
            reject(err);
        }, timeout);
    });
}
