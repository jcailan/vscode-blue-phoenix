import {
	DocumentFormattingEditProvider,
	TextDocument,
	TextEdit,
	ProviderResult,
	Range
} from 'vscode';

class FormatEditProvider implements DocumentFormattingEditProvider {

	public provideDocumentFormattingEdits(
		document: TextDocument
	): ProviderResult<TextEdit[]> {
		const commentRegex: RegExp = /(\/\*)[\w\d\-\n\r\t\? .,;:|/<>"'~!@#$%^&*()+=]*?(\*\/)|--[\w\d\-\t\? .,;:|/<>"'~!@#$%^&*()+=]*|(('[\w\d ".,|()]*?')|("[\w.]*?")(?!\())/g;
		const keyWordRegex: RegExp = /^\b(library|sqlscript|replace|increment|minvalue|maxvalue|right|public|variable|constant|invoker|true|false|for|do|exit handler|reads|sqlexception|elseif|record_count|round|round_half_up|array_agg|cardinality|string|cast|avg|min|concat|bintostr|sum|(row|table) like|procedure|function|returns?|in|out|declare|using|array|language|sql|security|as|begin|end|if|is|not|or|else|and|then|case|when|while|(tiny)?int|date|integer|boolean|n?varchar|decimal|table|data|select|distinct|top|union all|(inner|left outer) join|on|ifnull|(group|order) by|desc|where|count|into|from|call|break|continue|now|null|values|update|set|insert|delete|commit|exec)\b$/i;
		const wordRegex: RegExp = /\b(exit handler|union all|(group|order) by|(row|table) like|(inner|left outer) join|(?!\d)(?!\.)[\w.]+)\b/gi;
		let comments: string[] = [];
		let result: any;
		let text = document.getText();

		do {
			result = commentRegex.exec(text);
			if (result !== null) {
				comments.push(result[0]);
			}
		} while (result !== null);

		text = text.replace(commentRegex, '---');
		text = text.replace(wordRegex, function (word) {
			if (keyWordRegex.test(word)) {
				return word.toUpperCase();
			} else {
				return word.toLowerCase();
			}
		});

		comments.forEach((comment) => {
			text = text.replace(/---/, comment);
		});

		return [TextEdit.replace(this.fullDocumentRange(document), text)];
	}

	private fullDocumentRange(document: TextDocument): Range {
		const lastLineId = document.lineCount - 1;
		return new Range(0, 0, lastLineId, document.lineAt(lastLineId).text.length);
	}
}

export default FormatEditProvider;