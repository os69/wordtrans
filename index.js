/* global require, console */

// ===========================================================================
// package import
// ===========================================================================
var buttons = require('sdk/ui/button/toggle');
var tabs = require("sdk/tabs");
var self = require("sdk/self");
var Request = require("sdk/request").Request;
var pageMod = require("sdk/page-mod");
var remote = require('./data/remoteaddon');
var prefs = require("sdk/simple-prefs").prefs;

// ===========================================================================
// logging
// ===========================================================================
var log = function (msg) {
	console.log(msg);
};

// ===========================================================================
// helper: bind function to object
// ===========================================================================
var bind = function (func, that, args) {
	return function () {
		var currentArgs = [];
		currentArgs.push.apply(currentArgs, arguments);
		if (args) {
			currentArgs.push.apply(currentArgs, args);
		}
		return func.apply(that, currentArgs);
	};
};

// ===========================================================================
// tab handler
// ===========================================================================
var tabHandler = {

	tabs: [],
	workers: [],
	tabState: {},
	isInitialized: false,
	contentScripts: ['init.js', 'util.js', 'languages.js', 'preferences.js', 'remote.js', 'textextract.js', 'mouse.js', 'ui.js', 'ajax.js',
					 'translator.js', 'wordtrans.js', 'providers/google.js', 'providers/microsoft.js'],

	delayedInit1: function () {
		if (this.init1) {
			return;
		}
		this.init1 = true;
		this.exposedFunctions = {
			getUrl: this.getUrl
		};
		for (var i = 0; i < tabs.length; ++i) {
			var tab = tabs[i];
			this.tabs.push(tab);
			tab.on("close", bind(this.closeTab, this, [tab]));
		}
		tabs.on('open', bind(this.openTab, this));
		tabs.on('activate', bind(this.activateTab, this));
		require("sdk/simple-prefs").on('', bind(this.handlePrefsChanged, this));
		if (prefs.trans_custom) {
			this.setCustomServiceUrl(prefs.customServiceUrl);
		}
	},

	delayedInit2: function () {
		if (this.init2) {
			return;
		}
		this.init2 = true;
		pageMod.PageMod({
			include: '*',
			attachTo: ['top', 'existing'],
			contentScriptFile: this.assembleContentScripts(),
			contentStyleFile: [self.data.url('wordtrans.css')],
			onAttach: bind(this.attachWorker, this),
			contentScriptWhen: 'ready'
		});
	},

	getCustomServiceScript: function () {
		if (this.customServiceScriptPromise) {
			return this.customServiceScriptPromise;
		}
		if (!this.customServiceUrl || this.customServiceUrl.length === 0) {
			this.customServiceScriptPromise = remote.resolvedPromise('');
			return this.customServiceScriptPromise;
		}
		this.customServiceScriptPromise = this.getUrl(this.customServiceUrl).then(function (data) {
			return data.responseText;
		});
		return this.customServiceScriptPromise;
	},

	setCustomServiceUrl: function (url) {
		url = url.trim();
		if (url === this.customServiceUrl) {
			return;
		}
		this.customServiceUrl = url;
		this.customServiceScriptPromise = null;
		var that = this;
		this.getCustomServiceScript().done(function (customServiceScript) {
			for (var i = 0; i < that.workers.length; ++i) {
				var worker = that.workers[i];
				worker.contentScriptExecutor.execute('setCustomServiceScript', customServiceScript);
			}
		});
	},

	handlePrefsChanged: function () {
		if (prefs.trans_custom) {
			this.setCustomServiceUrl(prefs.customServiceUrl);
		}
		for (var i = 0; i < this.workers.length; ++i) {
			var worker = this.workers[i];
			worker.contentScriptExecutor.execute('setPreferences', prefs);
		}
	},

	getUrl: function (url) {
		var errorText = 'Failed to fetch url ' + url;
		var promise = new remote.Promise();
		try {
			var request = Request({
				url: url,
				onComplete: function (response) {
					if (response.status !== 200) {
						promise.reject(errorText + ' status:' + response.status + ' statusText:' + response.statusText);
					} else {
						promise.resolve({
							responseText: response.text
						});
					}
				}
			});
			request.get();
		} catch (e) {
			promise.reject(errorText + JSON.stringify(e));
		}
		return promise;
	},

	assembleContentScripts: function () {
		var scripts = [];
		for (var i = 0; i < this.contentScripts.length; ++i) {
			scripts.push(self.data.url(this.contentScripts[i]));
		}
		return scripts;
	},

	openTab: function (tab) {
		this.tabs.push(tab);
		tab.on("close", bind(this.closeTab, this, [tab]));
		log('tab open');
	},

	closeTab: function (tab) {
		var index = this.tabs.indexOf(tab);
		if (index >= 0) {
			this.tabs.splice(index, 1);
			log('tab close');
		} else {
			log('tab close - failed');
		}
	},

	activateTab: function () {
		button.state('tab', {
			checked: this.tabState[tabs.activeTab.id]
		});
	},

	getWorkerIndex: function (worker) {
		for (var i = 0; i < this.workers.length; ++i) {
			if (this.workers[i].worker === worker) {
				return i;
			}
		}
		return -1;
	},

	attachWorker: function (worker) {
		if (worker.tab.id === undefined) {
			log('attach ignore');
			return;
		}
		log('attach', worker.tab.id);
		if (this.getWorkerIndex(worker) >= 0) {
			log('attach - duplicate');
			return;
		}
		var contentScriptExecutor = new remote.Executor('addon', 'content', worker.port, this.exposedFunctions);
		this.workers.push({
			worker: worker,
			contentScriptExecutor: contentScriptExecutor
		});
		worker.on('detach', bind(this.detachWorker, this, [worker]));
		var enabled = !!this.tabState[worker.tab.id];
		contentScriptExecutor.execute('enable', enabled);
		contentScriptExecutor.execute('setPreferences', prefs);
		this.getCustomServiceScript().done(function (customServiceScript) {
			contentScriptExecutor.execute('setCustomServiceScript', customServiceScript);
		});
	},

	detachWorker: function (worker) {
		var index = this.getWorkerIndex(worker);
		if (index >= 0) {
			this.workers.splice(index, 1);
			log('detach', worker.tab.id);
		} else {
			log('detach - failed', worker.tab.id);
		}
	},

	enableTab: function (tab, flagActive) {
		this.tabState[tab.id] = true;
		for (var i = 0; i < this.workers.length; ++i) {
			var worker = this.workers[i];
			if (worker.worker.tab !== tab) {
				continue;
			}
			worker.contentScriptExecutor.execute('enable', flagActive);
		}
	}

};

// ===========================================================================
// ui
// ===========================================================================
var button = buttons.ToggleButton({
	id: "wordtrans-toggle",
	label: "wordtrans",
	icon: {
		"16": "./img/icon_016.png",
		"32": "./img/icon_032.png",
		"64": "./img/icon_064.png"
	},
	onChange: function (state) {

		// delete the window state for the current window,
		// automatically set when the user click on the button
		this.state('window', null);

		// now that the state hierarchy is clean, set the
		// tab state for the current tab
		var checked = this.state('tab').checked;
		checked = !checked;
		this.state('tab', {
			checked: checked
		});

		// enable/disable tab
		tabHandler.delayedInit1();
		tabHandler.enableTab(tabs.activeTab, checked);
		tabHandler.delayedInit2();
	}
});