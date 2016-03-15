/* global alert,XMLHttpRequest, console, document, window */
(function (root) {

	var preferences = root.wordtrans.preferences;

	// ===========================================================================
	// render html table
	// ===========================================================================	
	var Table = function () {
		this.init.apply(this, arguments);
	};

	Table.prototype = {

		init: function () {
			this.tableNode = document.createElement('table');
		},

		addRow: function (row) {

			var rowNode = document.createElement('tr');
			this.tableNode.appendChild(rowNode);
			for (var j = 0; j < row.length; ++j) {
				var data = row[j];
				var dataNode = document.createElement('td');
				dataNode.appendChild(document.createTextNode(data));
				rowNode.appendChild(dataNode);
			}

		},

		render: function () {
			return this.tableNode;
		}

	};

	// ===========================================================================
	// translation popup
	// ===========================================================================	
	root.wordtrans.ui = {

		show: function (x, y, term, translations, statusText) {
			this.hide();
			this.container = document.createElement('div');
			this.container.appendChild(this.createCloseButton());
			document.body.appendChild(this.container);
			this.table = new Table();
			this.table.tableNode.classList.add('wordtrans');
			for (var i = 0; i < Math.min(translations.length, 6); ++i) {
				var translation = translations[i];
				this.table.addRow([translation.term, translation.translation, translation.provider]);
			}
			this.container.appendChild(this.table.render());

			var prefs = preferences.getPreferences();

			this.container.style.position = 'absolute';
			this.container.style.top = y + 'px';
			this.container.style.left = x + 'px';
			this.container.style.backgroundColor = prefs.backgroundColor;
			this.container.style.color = prefs.textColor;
			this.container.style.fontFamily = prefs.fontFamily;
			this.container.style.fontWeight = 'bold';
			this.container.style.fontSize = prefs.fontSize + 'px';
			this.container.style.padding = '10px';
			this.container.style.borderWidth = '2px';
			this.container.style.borderStyle = 'solid';
			this.container.style.borderColor = prefs.borderColor;
			this.container.style.borderRadius = '10px';
			this.container.style.zIndex = '20';
			if (statusText) {
				this.container.appendChild(document.createTextNode(statusText));
			}
			this.container.classList.add('wordtrans');
		},

		addTranslations: function (translations) {
			for (var i = 0; i < Math.min(translations.length, 6); ++i) {
				var translation = translations[i];
				this.table.addRow([translation.term, translation.translation, translation.provider]);
			}
		},

		createCloseButton: function () {
			var that = this;
			var button = document.createElement('a');
			button.classList.add('wordtransclose');
			button.addEventListener('click', function () {
				that.emit('closebutton');
				that.hide();
			});
			return button;
		},

		isVisible: function () {
			return !!this.container;
		},

		hide: function () {
			if (!this.container) {
				return;
			}
			document.body.removeChild(this.container);
			this.container = null;
		},

		on: function (event, listener) {
			var listenerMap = this.listenerMap;
			if (!listenerMap) {
				listenerMap = this.listenerMap = {};
			}
			var eventListeners = this.listenerMap[event];
			if (!eventListeners) {
				eventListeners = this.listenerMap[event] = [];
			}
			eventListeners.push(listener);
		},

		emit: function (event) {
			var listenerMap = this.listenerMap;
			if (!listenerMap) {
				return;
			}
			var eventListeners = listenerMap[event];
			if (!eventListeners) {
				return;
			}
			for (var i = 0; i < eventListeners.length; ++i) {
				eventListeners[i].apply(null, []);
			}
		},

		includesPoint: function (x, y) {

			if (!this.container) {
				return false;
			}

			var rect = this.container.getBoundingClientRect();
			rect = {
				left: rect.left + window.scrollX,
				top: rect.top + window.scrollY,
				width: rect.width,
				height: rect.height
			};

			if (x >= rect.left && x <= (rect.left + rect.width) && y >= rect.top && y <= (rect.top + rect.height)) {
				return true;
			} else {
				return false;
			}
		}
	};

})(this);