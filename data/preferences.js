/* global document, window, console */

(function (root) {

	var languages = root.wordtrans.languages;

	root.wordtrans.preferences = {

		prefs: null,

		setPreferences: function (prefs) {
			this.prefs = prefs;
			this.prefs.sourceLanguage = {
				id: prefs.sourceLanguage,
				name: languages[prefs.sourceLanguage].name
			};
			this.prefs.targetLanguage = {
				id: prefs.targetLanguage,
				name: languages[prefs.targetLanguage].name
			};
		},

		getPreferences: function () {
			return this.prefs;
		}

	};

})(this);