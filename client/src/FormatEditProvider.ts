import {
	DocumentFormattingEditProvider,
	DocumentRangeFormattingEditProvider,
	FormattingOptions,
	CancellationToken,
	TextDocument,
	TextEdit,
	ProviderResult,
	Range
} from 'vscode';

class FormatEditProvider implements
	DocumentFormattingEditProvider,
	DocumentRangeFormattingEditProvider {

	private commentRegex: RegExp = /(\/\*[\w\d\-\n\r\t\? .,;:|/<>"'~!@#$%^&*()+=©]*?\*\/)|--[\w\d\-\t\? .,;:|/<>"'~!@#$%^&*()+=]*|(('[\w\d ".,|()]*?')|("[\w.]*?")(?!\())/g;
	private keyWordRegex: RegExp = /^\b(library|sqlscript|replace|increment|minvalue|maxvalue|right|public|variable|constant|invoker|true|false|for|do|exit handler|reads|sqlexception|elseif|record_count|round|round_half_up|array_agg|cardinality|string|cast|avg|min|concat|bintostr|sum|(row|table) like|procedure|function|returns?|in|out|declare|using|array|language|sql|security|as|begin|end|if|is|not|or|else|and|then|case|when|while|(tiny)?int|date|integer|boolean|n?varchar|decimal|table|data|select|distinct|top|union all|(inner|left outer) join|on|ifnull|(group|order) by|desc|where|count|into|from|call|break|continue|now|null|values|value|update|set|insert|delete|commit|work|exists|exec)\b$/i;
	private wordRegex: RegExp = /\b(exit handler|union all|(group|order) by|(row|table) like|(inner|left outer) join|(?!\d)(?!\.)[\w.]+)\b/gi;

	public provideDocumentFormattingEdits(
		document: TextDocument,
		options: FormattingOptions,
		token: CancellationToken
	): ProviderResult<TextEdit[]> {
		return this.formatDocument(document, this.getFullDocumentRange(document));
	}

	public provideDocumentRangeFormattingEdits(
		document: TextDocument,
		range: Range,
		options: FormattingOptions,
		token: CancellationToken
	): ProviderResult<TextEdit[]> {
		return this.formatDocument(document, range);
	}

	private formatDocument(
		document: TextDocument,
		range: Range
	): ProviderResult<TextEdit[]> {
		let comments: string[] = [];
		let comment: any;
		let text = document.getText(range);

		do {
			comment = this.commentRegex.exec(text);
			if (comment !== null) {
				comments.push(comment[0]);
			}
		} while (comment !== null);

		if (comments.length) {
			text = text.replace(this.commentRegex, '--placeh0lder');
		}

		text = text.replace(this.wordRegex, (word) => {
			if (this.keyWordRegex.test(word)) {
				return word.toUpperCase();
			} else {
				return word.toLowerCase();
			}
		});

		comments.forEach((comment) => {
			text = text.replace(/--placeh0lder/, comment);
		});

		return [TextEdit.replace(range, text)];
	}

	private getFullDocumentRange(document: TextDocument): Range {
		const lastLineId = document.lineCount - 1;
		return new Range(0, 0, lastLineId, document.lineAt(lastLineId).text.length);
	}
}

export default FormatEditProvider;