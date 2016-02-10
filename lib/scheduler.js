/**
 * Event broadcast scheduler: accumulates all incoming events into a queue
 * and once in some period of time sends them to given window.
 * Event queue is optimized for better performance
 */
'use strict';

import broadcast from './broadcast';
import condense from './condense';

export default function(wnd) {
    var queue = [];
    var scheduled = false;

    var flush = () => {
        scheduled = false;
        broadcast(wnd, 'event', condense(queue));
        queue.length = 0;
    };

    return event => {
        queue.push(event);
        if (!scheduled) {
            scheduled = true;
            // flush();
            // setTimeout(flush, 1);
            requestAnimationFrame(flush);
        }
    };
}
