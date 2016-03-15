/* global alert,XMLHttpRequest, console */
(function (root) {

	// =======================================================================
	// import packages
	// =======================================================================		
	var ajax = root.wordtrans.ajax;
	var wordtrans = root.wordtrans;
	var preferences = root.wordtrans.preferences;
	var util = root.wordtrans.util;
	var remote = root.wordtrans.remote;

	// =======================================================================
	// google translation provider
	// =======================================================================		
	var provider = root.wordtrans.providers.google = {

		name: 'Google',

		translate: function (query) {

			var that = this;
			var prefs = preferences.getPreferences();

			var url = {
				url: 'https://www.google.de/search',
				parameters: {
					q: 'translate ' + query.term + ' to ' + prefs.targetLanguage.name
				}
			};

			return ajax.getUrl(url).then(function (data) {

				var result = util.multiGrep(data.responseText, [{
					searchTerm: 'id="tw-target-text"',
					mode: 'cutAfter'
				}, {
					searchTerm: '<span>',
					mode: 'cutAfter'
				}, {
					searchTerm: '</span>',
					mode: 'cutBefore'
				}]);
				if (!result.success) {
					return remote.rejectedPromise(result.error);
				}

				return [{
					provider: that.name,
					term: query.term,
					translation: result.text
				}];

			});
		}

	};


})(this);