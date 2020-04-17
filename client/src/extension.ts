/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { workspace, ExtensionContext, commands, window } from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
	// The server is implemented in node
	let serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server.js')
	);
	// The debug options for the server
	// --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
	let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	let serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
	};

	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'sqlscript' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'languageServerExample',
		'Language Server Example',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.start();

	// This is the activation for Reverse Word command
	let disposable = commands.registerCommand(
		'extension.reverseWord',
		function () {
			// Get the active text editor
			let editor = window.activeTextEditor;

			if (editor) {
				let document = editor.document;
				let selection = editor.selection;

				// Get the word within the selection
				const search: RegExp = /(\/\*)[\w\d\-\n\r\t\? .,;:|/<>"'~!@#$%^&*()+=]*?(\*\/)|--[\w\d\-\t\? .,;:|/<>"'~!@#$%^&*()+=]*|(('[\w\d ".,|()]*?')|("[\w.]*?")(?!\())/g;
				const keyWordRegex: RegExp = /^\b(library|sqlscript|replace|increment|minvalue|maxvalue|right|public|variable|constant|invoker|true|false|for|do|exit handler|reads|sqlexception|elseif|record_count|round|round_half_up|array_agg|cardinality|string|cast|avg|min|concat|bintostr|sum|(row|table) like|procedure|function|returns?|in|out|declare|using|array|language|sql|security|as|begin|end|if|is|not|or|else|and|then|case|when|while|(tiny)?int|date|integer|boolean|n?varchar|decimal|table|data|select|distinct|top|union all|(inner|left outer) join|on|ifnull|(group|order) by|desc|where|count|into|from|call|break|continue|now|null|values|update|set|insert|delete|commit|exec)\b$/i;
				const wordRegex: RegExp = /\b(exit handler|union all|(group|order) by|(row|table) like|(inner|left outer) join|(?!\d)(?!\.)[\w.]+)\b/gi;
				let text = document.getText(selection);

				if (text === '') {
					window.showWarningMessage('Select a document range to format!');
					return;
				}

				let comments: string[] = [];
				let result: any;
				
				do {
					result = search.exec(text);
					if (result !== null) {
						comments.push(result[0]);
					}
				} while (result !== null);

				text = text.replace(search, '---');
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

				editor.edit((editBuilder) => {
					editBuilder.replace(selection, text);
				});
			}
		}
	);

	context.subscriptions.push(disposable);
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}