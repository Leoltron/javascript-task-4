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

function removeSubscribersWithContext(oldSubscribers, context, newSubscribers) {
    for (const subscriber of oldSubscribers) {
        if (subscriber.context !== context) {
            newSubscribers.push(subscriber);
        }
    }
}

class SeveralEventSubscriber extends EventSubscriber {
    constructor(context, handler, callCount) {
        super(context, handler);
        this._callCount = callCount;
    }

    onEvent() {
        if (this._callCount === 0) {
            return;
        }
        super.onEvent();
        this._callCount--;
    }
}

class FrequencyEventSubscriber extends EventSubscriber {
    constructor(context, handler, frequency) {
        super(context, handler);
        this._frequency = frequency - 1;
        this._counter = 0;
    }

    onEvent() {
        if (this._counter === 0) {
            super.onEvent();
            this._counter = this._frequency;
        } else {
            this._counter--;
        }
    }
}

/**
 * Возвращает новый emitter
 * @returns {Object}
 */
function getEmitter() {
    return {
        subscribers: new Map(),

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
            for (const event of this.subscribers.keys()) {
                if (event === namespace || event.startsWith(prefix)) {
                    events.push(event);
                }
            }

            return events;
        },

        /**
         * Подписаться на событие, используя указанный способ подписки
         * @param {String} event
         * @param {EventSubscriber} subscriber
         * @returns {Object} this
         * @private
         */
        _subscribe(event, subscriber) {
            if (!this._hasSubscribersFor(event)) {
                this.subscribers.set(event, []);
            }

            this.subscribers.get(event)
                .push(subscriber);

            return this;
        },

        /**
         * Подписаться на событие
         * @param {String} event
         * @param {Object} context
         * @param {Function} handler
         * @returns {Object} this
         */
        on: function (event, context, handler) {
            console.info(event, context, handler);

            return this._subscribe(event, new EventSubscriber(context, handler));
        },

        /**
         * Есть ли подписчики для данного события
         * @param {String} event
         * @returns {boolean}
         * @private
         */
        _hasSubscribersFor: function (event) {
            return this.subscribers.has(event);
        },

        /**
         * Отписаться от одного события
         * @param {String} event
         * @param {Object} context
         * @private
         */
        _unsubscribeSimple: function (event, context) {
            if (this._hasSubscribersFor(event)) {
                const newSubscribers = [];
                removeSubscribersWithContext(this.subscribers.get(event), context, newSubscribers);
                this.subscribers.set(event, newSubscribers);
            }
        },

        /**
         * Отписаться от события
         * @param {String} event
         * @param {Object} context
         * @returns {Object} this
         */
        off: function (event, context) {
            console.info(event, context);
            for (const subEvent of this._getAllEvents(event)) {
                this._unsubscribeSimple(subEvent, context);
            }

            return this;
        },

        _emitSimple: function (event) {
            console.info(event);
            if (this._hasSubscribersFor(event)) {
                for (const subscriber of this.subscribers.get(event)) {
                    subscriber.onEvent();
                }
            }
        },

        /**
         * Уведомить о событии
         * @param {String} event
         * @returns {Object} this
         */
        emit: function (event) {
            this._emitSimple(event);

            if (event.includes('.')) {
                this.emit(event.slice(0, event.lastIndexOf('.')));
            }

            return this;
        },

        /**
         * Подписаться на событие с ограничением по количеству полученных уведомлений
         * @star
         * @param {String} event
         * @param {Object} context
         * @param {Function} handler
         * @param {Number} times – сколько раз получить уведомление
         * @returns {Object} this
         */
        several: function (event, context, handler, times) {
            console.info(event, context, handler, times);
            if (times <= 0) {
                return this.on(event, context, handler);
            }

            return this._subscribe(event, new SeveralEventSubscriber(context, handler, times));
        },

        /**
         * Подписаться на событие с ограничением по частоте получения уведомлений
         * @star
         * @param {String} event
         * @param {Object} context
         * @param {Function} handler
         * @param {Number} frequency – как часто уведомлять
         * @returns {Object} this
         */
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
