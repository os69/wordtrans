/* global document, window, console */

(function (root) {

	var preferences = root.wordtrans.preferences;

	root.wordtrans.textextract = {

		isDelimiter: function (char) {
			return preferences.getPreferences().delimiters.indexOf(char) >= 0;
		},

		extractWord: function (text, index) {
			if (text.length === 0 || index >= text.length) {
				return null;
			}
			var char = text[index];
			if (this.isDelimiter(char)) {
				return null;
			}
			for (var endIndex = index + 1; endIndex < text.length; ++endIndex) {
				char = text[endIndex];
				if (this.isDelimiter(char)) {
					break;
				}
			}
			for (var startIndex = index - 1; startIndex >= 0; --startIndex) {
				char = text[startIndex];
				if (this.isDelimiter(char)) {
					break;
				}
			}
			var word = text.slice(startIndex + 1, endIndex);
			return word;
		},

		getText: function (x, y) {
			var caretPosition = document.caretPositionFromPoint(x, y);
			if (!caretPosition || !caretPosition.offsetNode) {
				return;
			}
			if (caretPosition.offsetNode.nodeType !== document.TEXT_NODE) {
				return;
			}
			return this.extractWord(caretPosition.offsetNode.nodeValue, caretPosition.offset);
		}

	};

})(this);