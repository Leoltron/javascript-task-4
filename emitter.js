'use strict';

/**
 * Сделано задание на звездочку
 * Реализованы методы several и through
 */
const isStar = true;

class EventSubscriber {

    /**
     * @param {Object} context
     * @param {Function} handler
     */
    constructor(context, handler) {
        this.context = context;
        this.handler = handler;
    }

    onEvent() {
        this.handler.apply(this.context);
    }
}

function removeSubscribersWithContext(subscribers, context) {
    const newSubscribers = [];
    for (const subscriber of subscribers) {
        if (subscriber.context !== context) {
            newSubscribers.push(subscriber);
        }
    }

    return newSubscribers;
}

class SeveralEventSubscriber extends EventSubscriber {
    constructor(context, handler, amount) {
        super(context, handler);
        this._amount = amount;
        this._counter = 0;
    }

    onEvent() {
        if (this._counter < this._amount) {
            super.onEvent();
            ++this._counter;
        }
    }
}

class FrequencyEventSubscriber extends EventSubscriber {
    constructor(context, handler, frequency) {
        super(context, handler);
        this._frequency = frequency;
        this._counter = this._frequency - 1;
    }

    onEvent() {
        ++this._counter;

        if (this._counter === this._frequency) {
            super.onEvent();
            this._counter = 0;
        }
    }
}

/**
 * Возвращает новый emitter
 * @returns {Object}
 */
function getEmitter() {
    return {
        _subscribers: new Map(),

        /**
         * Найти все события, которые принадлежат пространству имен и на которые кто-либо
         * подписывался
         * @param {String} namespace
         * @returns {String[]}
         * @private
         */
        _getAllEvents: function (namespace) {
            const prefix = namespace + '.';

            const events = [];
            for (const event of this._subscribers.keys()) {
                if (event === namespace || event.startsWith(prefix)) {
                    events.push(event);
                }
            }

            return events;
        },

        _subscribe(event, subscriber) {
            if (!this._subscribers.has(event)) {
                this._subscribers.set(event, []);
            }

            this._subscribers.get(event)
                .push(subscriber);

            return this;
        },

        on: function (event, context, handler) {
            console.info(event, context, handler);

            return this._subscribe(event, new EventSubscriber(context, handler));
        },

        /**
         * Отписаться от одного события
         * @param {String} event
         * @param {Object} context
         * @private
         */
        _unsubscribeSimple: function (event, context) {
            if (this._subscribers.has(event)) {
                const newSubscribers = removeSubscribersWithContext(this._subscribers.get(event),
                    context);
                this._subscribers.set(event, newSubscribers);
            }
        },

        off: function (event, context) {
            console.info(event, context);
            for (const subEvent of this._getAllEvents(event)) {
                this._unsubscribeSimple(subEvent, context);
            }

            return this;
        },

        /**
         * Уведомить о событии
         * @param {String} event
         * @returns {Object} this
         */
        emit: function (event) {
            console.info(event);
            if (this._subscribers.has(event)) {
                for (const subscriber of this._subscribers.get(event)) {
                    subscriber.onEvent();
                }
            }

            if (event.includes('.')) {
                this.emit(event.slice(0, event.lastIndexOf('.')));
            }

            return this;
        },

        several: function (event, context, handler, times) {
            console.info(event, context, handler, times);
            if (times <= 0) {
                return this.on(event, context, handler);
            }

            return this._subscribe(event, new SeveralEventSubscriber(context, handler, times));
        },

        through: function (event, context, handler, frequency) {
            console.info(event, context, handler, frequency);
            if (frequency <= 0) {
                return this.on(event, context, handler);
            }

            return this._subscribe(event,
                new FrequencyEventSubscriber(context, handler, frequency));
        }
    };
}

// noinspection JSUnresolvedVariable
module.exports = {
    getEmitter,

    isStar
};
