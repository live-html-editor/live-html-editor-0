/**
 * @author [S. Mahdi Mir-Ismaili](https://mirismaili.github.io).
 * Created on 1397/11/9 (2019/1/29).
 */
"use strict";

function initPage() {
	// noinspection JSUnresolvedFunction, JSUnresolvedVariable
	liveHtmlEditor.editorManager.config({
		serverUrl: 'http://127.0.0.1:3000',
		sourceFiles: [
			{
				// This is on server's local machine and can be relative. If so
				// base-path would be server's working directory.
				path: '../index.html',
				
				// Can be automatically detected from the file's extension. So is
				// unnecessary in this case. This determines how the result must
				// be written down to the file.
				writeMethod: 'html',
				
				// `index` is useful when you have multiple live-editors.
				// Then `index` comes from: [live-editor=INDEX] and must be UNIQUE.
				domPath: index => '[live-editor]',
			},
			{
				// See the above note.
				path: '../README.md',
				
				// This is also unnecessary (in this case). See the above note.
				writeMethod: 'markdown',
			}
		]
	});
	
	// noinspection JSUnresolvedFunction, JSUnresolvedVariable
	liveHtmlEditor.editorManager.start();
	
	// When you don't need this any more run below command. You can start it again.
	//liveHtmlEditor.editorManager.shutdown();
}
