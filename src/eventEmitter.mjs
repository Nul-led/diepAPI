export default class EventEmitter extends EventTarget {
    constructor() {
        super();
        this._listenerWrappers = new Map();
    }

    /**
     *
     * @param {string} eventName The name of the event
     * @param  {...any} args The arguments that will be passed to the listener
     */
    emit(eventName, ...args) {
        this.dispatchEvent(new CustomEvent(eventName, { detail: args }));
    }

    /**
     *
     * @param {string} eventName The name of the event
     * @param {Function} listener The callback function
     */
    on(eventName, listener) {
        const wrapped = this._wrapListener(eventName, listener);
        this.addEventListener(eventName, wrapped);
    }

    /**
     *
     * @param {string} eventName The name of the event
     * @param {Function} listener The callback function
     */
    once(eventName, listener) {
        const wrapped = this._wrapListener(eventName, listener, true);
        this.addEventListener(eventName, wrapped, { once: true });
    }

    /**
     *
     * @param {string} eventName The name of the event
     * @param {Function} listener The callback function
     */
    off(eventName, listener) {
        const eventListeners = this._listenerWrappers.get(eventName);
        const wrappers = eventListeners?.get(listener);
        const wrapped = wrappers?.pop();
        if (!wrapped) return;

        this.removeEventListener(eventName, wrapped);
        this._cleanupListenerEntry(eventName, listener, eventListeners, wrappers);
    }

    _wrapListener(eventName, listener, once = false) {
        const wrapped = (event) => {
            if (once) this._forgetWrapper(eventName, listener, wrapped);
            Reflect.apply(listener, this, event.detail);
        };

        let eventListeners = this._listenerWrappers.get(eventName);
        if (!eventListeners) {
            eventListeners = new Map();
            this._listenerWrappers.set(eventName, eventListeners);
        }

        let wrappers = eventListeners.get(listener);
        if (!wrappers) {
            wrappers = [];
            eventListeners.set(listener, wrappers);
        }
        wrappers.push(wrapped);
        return wrapped;
    }

    _forgetWrapper(eventName, listener, wrapped) {
        const eventListeners = this._listenerWrappers.get(eventName);
        const wrappers = eventListeners?.get(listener);
        if (!wrappers) return;

        const index = wrappers.indexOf(wrapped);
        if (index !== -1) wrappers.splice(index, 1);
        this._cleanupListenerEntry(eventName, listener, eventListeners, wrappers);
    }

    _cleanupListenerEntry(eventName, listener, eventListeners, wrappers) {
        if (wrappers.length > 0) return;

        eventListeners.delete(listener);
        if (eventListeners.size === 0) this._listenerWrappers.delete(eventName);
    }
}
