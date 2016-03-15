/* global document, window, console, self */

(function (root) {

	// =======================================================================
	// import packages
	// =======================================================================		
	var mouse = root.wordtrans.mouse;
	var textextract = root.wordtrans.textextract;
	var translator = root.wordtrans.translator;
	var ui = root.wordtrans.ui;
	var remote = root.wordtrans.remote;
	var preferences = root.wordtrans.preferences;

	// =======================================================================
	// global fields
	// =======================================================================		
	var hideTimeout;
	var enabled = true;
	var uiEnabled = true;
	var oldText;
	var requestId = 0;

	// =======================================================================
	// addon executor
	// =======================================================================	
	root.wordtrans.executor = new remote.Executor('content', 'addon', self.port, {
		enable: function (flgActive) {
			enabled = flgActive;
		},
		isEnabled: function (cb) {
			cb(null, enabled);
		},
		setPreferences: function (prefs) {
			preferences.setPreferences(prefs);
		},
		add: function (p1, p2, cb) {
			cb(null, p1 + p2);
		},
		setCustomServiceScript: function (customeServiceScript) {
			delete root.wordtrans.providers.custom;
			try {
				(function () {
					eval(customeServiceScript); // jshint ignore:line
				}).apply(root, []);
			} catch (e) {}
		}
	});

	// =======================================================================
	// listen on closebutton of translation popup
	// =======================================================================		
	ui.on('closebutton', function () {
		uiEnabled = false;
		window.setTimeout(function () {
			uiEnabled = true;
		}, preferences.getPreferences().translationPopupCloseDelay);
	});

	// =======================================================================
	// listen on mouse event
	// =======================================================================		
	mouse.listener(function (type, event) {
		switch (type) {

		case 'move':

			if (ui.includesPoint(event.pageX, event.pageY)) {
				window.clearTimeout(hideTimeout);
				hideTimeout = null;
				return;
			} else {
				if (!hideTimeout) {
					hideTimeout = window.setTimeout(function () {
						hideTimeout = null;
						ui.hide();
					}, preferences.getPreferences().translationPopupHideDelay);
				}
			}
			break;

		case 'stop':

			if (!enabled || !uiEnabled) {
				return;
			}
			if (ui.includesPoint(event.pageX, event.pageY)) {
				return;
			}
			var text = textextract.getText(event.clientX, event.clientY);
			if (!text) {
				return;
			}
			if (text === oldText && ui.isVisible()) {
				window.clearTimeout(hideTimeout);
				hideTimeout = null;
				return;
			}

			var currentRequestId = ++requestId;
			var success = false;

			window.clearTimeout(hideTimeout);
			hideTimeout = null;
			ui.hide();

			translator.translate({
				term: text
			}, function (err, translations, completed) {
				if (currentRequestId !== requestId) {
					return;
				}
				if (completed) {
					if (!success) {
						ui.show(event.pageX, event.pageY, text, [], 'No results');
					}
					return;
				}
				if (err) {
					console.log('translation error', err);
					return;
				}
				if (translations.length > 0) {
					if (!success) {
						success = true;
						oldText = text;
						ui.show(event.pageX, event.pageY, text, translations);
					} else {
						ui.addTranslations(translations);
					}
				}
			});

			break;
		}
	});

})(this);