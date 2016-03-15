/* global document, window, console */

(function (root) {

	var preferences = root.wordtrans.preferences;

	root.wordtrans.mouse = {

		listener: function (listener) {
			var timer;
			window.addEventListener('mousemove', function (event) {
				listener.apply(null, ['move', event]);
				window.clearTimeout(timer);
				timer = window.setTimeout(function () {
					listener.apply(null, ['stop', event]);
				}, preferences.getPreferences().mouseStopDelay);
			});
		}

	};

})(this);