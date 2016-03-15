/* global alert,XMLHttpRequest, console */
(function (root) {

	// =======================================================================
	// import packages
	// =======================================================================				
	var ajax = root.wordtrans.ajax;
	var wordtrans = root.wordtrans;
	var languages = root.wordtrans.languages;
	var util = root.wordtrans.util;
	var preferences = root.wordtrans.preferences;
	var remote = root.wordtrans.remote;

	// =======================================================================
	// translation provider microsoft
	// =======================================================================				
	var provider = root.wordtrans.providers.microsoft = {

		name: 'Microsoft',

		translate: function (query, cb) {

			var that = this;

			var prefs = preferences.getPreferences();

			var url = {
				url: 'https://www.bing.com/search',
				parameters: {
					q: 'translate ' + query.term + ' to ' + prefs.targetLanguage.name
				}
			};

			return ajax.getUrl(url).then(function (data) {

				var result = util.multiGrep(data.responseText, [{
					searchTerm: 'textarea readonly="readonly"',
					mode: 'cutAfter'
				}, {
					searchTerm: '>',
					mode: 'cutAfter'
				}, {
					searchTerm: '</textarea>',
					mode: 'cutBefore'
				}]);
				if (!result.success) {
					return remote.rejectedPromise(result.error);
				}

				return [{
					provider: that.name,
					term: query.term,
					translation: util.decodeEntities(result.text)
				}];

			});
		}

	};


})(this);