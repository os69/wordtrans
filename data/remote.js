/* global window,alert,XMLHttpRequest, self, exports */

var addon = true;
try {
	var a = exports;
} catch (e) {
	addon = false;
}
var root;
if (addon) {
	root = {
		wordtrans: {}
	};
} else {
	root = window;
}

(function (root) {

	var remote = root.wordtrans.remote = {};

	// ===========================================================================
	// helper bind
	// ===========================================================================	
	var bind = function (func, that) {
		return function () {
			func.apply(that, arguments);
		};
	};

	// ===========================================================================
	// promise
	// ===========================================================================
	remote.Promise = function () {
		this.init.apply(this, arguments);
	};
	remote.rejectedPromise = function (value) {
		var p = new remote.Promise();
		p.reject(value);
		return p;
	};
	remote.resolvedPromise = function (value) {
		var p = new remote.Promise();
		p.resolve(value);
		return p;
	};
	remote.Promise.prototype = {
		init: function () {
			this.status = 'pending';
			this.value = null;
			this.listeners = [];
		},
		resolve: function (value) {
			this.value = value;
			this.status = 'resolved';
			this.notifyListeners('done');
			return this;
		},
		reject: function (value) {
			this.value = value;
			this.status = 'rejected';
			this.notifyListeners('fail');
			return this;
		},
		notifyListeners: function (type) {
			for (var i = 0; i < this.listeners.length; ++i) {
				var listener = this.listeners[i];
				if (listener.type === type) {
					listener.listener.apply(this, [this.value]);
				}
			}
		},
		addListener: function (type, listener) {
			this.listeners.push({
				type: type,
				listener: listener
			});
		},
		done: function (listener) {
			switch (this.status) {
			case 'pending':
				this.addListener('done', listener);
				break;
			case 'resolved':
				listener.apply(this, [this.value]);
				break;
			case 'rejected':
				break;
			}
			return this;
		},
		fail: function (listener) {
			switch (this.status) {
			case 'pending':
				this.addListener('fail', listener);
				break;
			case 'resolved':
				break;
			case 'rejected':
				listener.apply(this, [this.value]);
				break;
			}
			return this;
		},
		then: function (func, elseFunc) {

			var resultPromise = new remote.Promise();

			this.done(function (value) {

				var ret = func.apply(null, [value]);
				if (ret instanceof remote.Promise) {
					ret.done(function (value) {
						resultPromise.resolve(value);
					}).fail(function (value) {
						resultPromise.reject(value);
					});
				} else {
					resultPromise.resolve(ret);
				}

			}).fail(function (value) {

				if (!elseFunc) {
					resultPromise.reject(value);
				} else {
					var ret = elseFunc.apply(null, [value]);
					if (ret instanceof remote.Promise) {
						ret.done(function (value) {
							resultPromise.resolve(value);
						}).fail(function (value) {
							resultPromise.reject(value);
						});
					} else {
						resultPromise.resolve(ret);
					}
				}

			});

			return resultPromise;
		}
	};

	// ===========================================================================
	// remote executor
	// ===========================================================================	
	remote.Executor = function () {
		this.init.apply(this, arguments);
	};

	remote.Executor.prototype = {

		init: function (id, remoteId, port, functions) {
			var that = this;
			this.id = id;
			this.remoteId = remoteId;
			this.port = port;
			this.functions = functions;
			this.commands = {};
			this.commandId = 0;
			this.handleMessage = bind(this.handleMessage, this);
			this.port.on(this.id + '-message', this.handleMessage);
		},

		destroy: function () {
			this.port.off(this.id + '-message', this.handleMessage);
		},

		handleMessage: function (message) {
			switch (message.type) {
			case 'executeCommand':
				this.handleMessageExecuteCommand(message);
				break;
			case 'resultOfCommand':
				this.handleMessageReceiveCommandResult(message);
				break;
			}
		},

		handleMessageExecuteCommand: function (message) {
			var func = this.functions[message.functionName];
			var args = message.args;
			var that = this;

			var resultPromise = func.apply(this, args);
			if (!resultPromise || !(resultPromise instanceof remote.Promise)) {
				resultPromise = new remote.Promise();
				resultPromise.resolve();
			}

			resultPromise.done(function (value) {
				that.port.emit(message.sender + '-message', {
					type: 'resultOfCommand',
					id: message.id,
					status: 'resolved',
					value: value
				});
			}).fail(function (value) {
				that.port.emit(message.sender + '-message', {
					type: 'resultOfCommand',
					id: message.id,
					status: 'rejected',
					value: value
				});
			});

		},

		handleMessageReceiveCommandResult: function (message) {
			var command = this.commands[message.id];
			if (message.status === 'resolved') {
				command.promise.resolve(message.value);
			} else {
				command.promise.reject(message.value);
			}
			delete this.commands[message.id];
		},

		execute: function () {
			var args = Array.prototype.slice.call(arguments);
			var message = {
				type: 'executeCommand',
				functionName: args[0],
				args: args.slice(1, args.length),
				id: ++this.commandId,
				sender: this.id,
			};
			this.port.emit(this.remoteId + '-message', message);
			var command = message;
			command.promise = new remote.Promise();
			this.commands[command.id] = command;
			return command.promise;
		}

	};

})(root);
if (addon) {
	for (var prop in root.wordtrans.remote) {
		exports[prop] = root.wordtrans.remote[prop];
	}
}