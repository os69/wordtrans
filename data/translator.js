/* global alert,XMLHttpRequest, console */
(function (root) {

	var providers = root.wordtrans.providers;
	var preferences = root.wordtrans.preferences;

	root.wordtrans.translator = {

		translate: function (query, cb) {

			var prefs = preferences.getPreferences();
			var pending = 0;

			for (var property in prefs) {
				if (property.slice(0, 6) !== 'trans_') {
					continue;
				}
				if (!prefs[property]) {
					continue;
				}
				var providerName = property.slice(6);
				if (providers[providerName]) {
					pending++;
					providers[providerName].translate(query).then(function (translations) {
						translations = translations.slice(0, prefs.maxTranslationsPerProvider);
						cb(null, translations);
						pending--;
						if (pending === 0) {
							cb(null, [], true);
						}
					}, function (error) {
						cb(error);
						pending--;
						if (pending === 0) {
							cb(null, [], true);
						}
					});
				}

			}
		}

	};

})(this);