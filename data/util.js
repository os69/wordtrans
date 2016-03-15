/* global alert,XMLHttpRequest, console, document, window */
(function (root) {

	var module = root.wordtrans.util = {};

	// ===========================================================================
	// grep
	// ===========================================================================	
	module.grep = function (text, searchTerm, mode) {
		var index = text.indexOf(searchTerm);
		if (index < 0) {
			return {
				success: false,
				error: 'Cannot find "' + searchTerm + '" in text'
			};
		}
		switch (mode) {
		case 'cutAfter':
			return {
				success: true,
				text: text.slice(index + searchTerm.length)
			};
		case 'cutBefore':
			return {
				success: true,
				text: text.slice(0, index)
			};
		}
	};

	// ===========================================================================
	// multiple greps in sequence
	// ===========================================================================	
	module.multiGrep = function (text, commands) {
		var result;
		for (var i = 0; i < commands.length; ++i) {
			var command = commands[i];
			result = module.grep(text, command.searchTerm, command.mode);
			if (!result.success) {
				return result;
			}
			text = result.text;
		}
		return {
			success: true,
			text: text
		};
	};

	// ===========================================================================
	// html entity decoder
	// ===========================================================================	
	module.decodeEntities = (function () {

		var element = document.createElement('div');

		function decodeHTMLEntities(str) {
			if (str && typeof str === 'string') {

				str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
				str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
				element.innerHTML = str;
				str = element.textContent;
				element.textContent = '';
			}

			return str;
		}

		return decodeHTMLEntities;
	})();

})(this);