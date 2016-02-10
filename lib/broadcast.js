/**
 * Broadcast cross-origin message
 */
'use strict';
export default function(wnd, name, data, options={}) {
    if (!wnd) {
        return;
    }
    
    var message = {ns: 'page-sync', name, data};

    if (options.sessionId) {
        message.sessionId = options.sessionId;
    }

    if (options.documentId) {
        message.documentId = options.documentId;
    }

    wnd.postMessage(message, '*');
}
