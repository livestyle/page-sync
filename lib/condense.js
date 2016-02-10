/**
 * Condenses given list of incoming events. Produces a smaller array that,
 * when applied synchonously, produces the same result as given one.
 */
'use strict';

const counterparts = {
    'mouseenter': 'mouseleave',
    'mouseover': 'mouseout'
};

export default function(events) {
    var skip = [], lookup = {};
    // remove events with counterparts
    events = events.filter((event, i) => {
        if (event.name === 'mouse' && event.data.type in counterparts) {
            while (++i < events.length) {
                let ce = events[i];
                if (ce.name === 'mouse') {
                    if (ce.data.type === event.data.type) {
                        // same event upfront, keep current one
                        return true;
                    }
                    if (ce.data.type === counterparts[event.data.type]) {
                        // found cunterpart, skip both
                        skip.push(ce);
                        return false;
                    }
                }
            }
        }

        return skip.indexOf(event) === -1;
    });

    // keep events that can safely exist in single instance
    events = events.reduceRight((out, event) => {
        if (event.name === 'scroll' || event.data.type === 'mousemove') {
            let key = (event.data.type || event.name) + ';' + event.target;
            if (!(key in lookup)) {
                lookup[key] = event;
                out.unshift(event);
            }
        } else {
            out.unshift(event);
        }
        return out;
    }, []);

    return events;
};
