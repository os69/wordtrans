/* global window,alert,XMLHttpRequest */
(function (root) {

	// =======================================================================
	// import packages
	// =======================================================================		
	var addonexecutor = root.wordtrans.addonexecutor;
	var wordtrans = root.wordtrans;

	// =======================================================================
	// ajax request
	// =======================================================================	
	root.wordtrans.ajax = {

		getUrl: function (url) {
			if (url instanceof Object) {
				url = this.createUrlFromParameters(url);
			}
			return root.wordtrans.executor.execute('getUrl', url);

			/*			var responseXML;
						try {
							responseXML = (new window.DOMParser()).parseFromString(data, "text/xml");
						} catch (e) {}
						cb(err, {
							responseXML: responseXML,
							responseText: data
						});*/

		},

		createUrlFromParameters: function (url) {
			var encodedParams = [];
			for (var parameter in url.parameters) {
				var value = url.parameters[parameter];
				encodedParams.push(encodeURIComponent(parameter) + '=' + encodeURIComponent(value));
			}
			return url.url + '?' + encodedParams.join('&');
		}

	};

})(this);