import {Draggable, getCookie, setCookie, TOOLS_POSITION} from './utilities';
import {styleSheet} from './css';
import {htmlSourceOfTools} from './html';

/**
 * @author [S. Mahdi Mir-Ismaili](https://mirismaili.github.io).
 * Created on 1397/11/9 (2019/1/29).
 */

class EditorManager implements Options {
	indent: string;
	serverUrl: string;
	sourceFiles: SourceFile[];
	
	private tools: any;
	private toolsContainer: any;
	private styles: HTMLStyleElement;
	private readonly editors: Editor[] = [];
	private idAttr = '[data-live-editor]';
	
	static readonly DEF_OPTIONS: Options = {
		indent: '\t',
		serverUrl: 'http://127.0.0.1:3000',
		sourceFiles: []
	};
	
	config(options: Options = EditorManager.DEF_OPTIONS) {
		this.indent = options.indent || EditorManager.DEF_OPTIONS.indent;
		this.serverUrl = options.serverUrl || EditorManager.DEF_OPTIONS.serverUrl;
		this.sourceFiles = options.sourceFiles || EditorManager.DEF_OPTIONS.sourceFiles;
		//**********************************************************************************/
		
		let editables = document.querySelectorAll(this.idAttr);
		if (editables.length === 0) {
			this.idAttr = '[live-editor]';
			editables = document.querySelectorAll(this.idAttr);
		}
		
		for (const editable of editables)
			this.editors.push({
				editable: <HTMLElement>editable,
				index: editable.getAttribute(this.idAttr),
				initDoc: editable.innerHTML,
			});
		//**********************************************************************************/
		
		this.styles = document.createElement('style');
		//this.styles.type = 'text/css';
		this.styles.innerHTML = styleSheet;
		
		const template = document.createElement('template');
		template.innerHTML = htmlSourceOfTools.trim();
		this.toolsContainer = template.content.firstChild;
	}
	
	start() {
		document.getElementsByTagName('head')[0].appendChild(this.styles);
		
		document.body.appendChild(this.toolsContainer);
		
		this.tools = this.toolsContainer.firstElementChild;
		
		Draggable.makeElementDraggable(this.toolsContainer, this.tools,
				(left, top) => setCookie(TOOLS_POSITION, `(${left},${top})`,
						now => now.setDate(now.getDate() + 30)
				)
		);
		
		const toolsPosition = getCookie(TOOLS_POSITION);
		
		if (toolsPosition) {
			const match = /\((\d+)\s*,\s*(\d+)\)/.exec(toolsPosition);
			
			this.toolsContainer.style.left = match[1] + 'px';
			this.toolsContainer.style.top = match[2] + 'px';
		}
		
		for (const editor of this.editors)
			(<any>editor.editable).contentEditable = true;
	}
	
	shutdown() {
		for (const editor of this.editors)
			(<any>editor.editable).contentEditable = false;
		document.body.removeChild(this.toolsContainer);

		document.getElementsByTagName('head')[0].removeChild(this.styles);
	}
	
	submit(editor: Editor): void {
		const editable = editor.editable;
		
		if (!this.validateMode(editable)) return;
		console.dir(this.sourceFiles[0].domPath);
		const req: Req = {
			htmlDocument: this.formHtml(editable.innerHTML).trim(),
			
			sourceFiles: this.sourceFiles.map(sourceFile => ({
				path: sourceFile.path,
				domPath: sourceFile.domPath ? sourceFile.domPath(editor.index) : null,
				regexp: sourceFile.regexp ? sourceFile.regexp(editor.index).toString() : null,
			})),
			// extendedFunctionality: this.extendedFunctionality,
		};
		
		fetch(this.serverUrl,
				{
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json; charset=utf-8'
					},
					method: "POST",
					body: JSON.stringify(req)
				})
				.then(res => {
					console.log(res);
					return res.json();
				}, res => console.error(res))
				.then(body => console.log(body.logs))
				.catch(err => console.error(err));
	}
	
	formatDoc(sCmd: string, sValue: string, editable: HTMLElement) {
		if (this.validateMode(editable)) {
			document.execCommand(sCmd, false, sValue);
			editable.focus();
		}
	}
	
	validateMode(editable: HTMLElement) {
		if (!this.tools.switchMode.checked) return true;
		
		alert('Uncheck "Show HTML".');
		editable.focus();
		return false;
	}
	
	setSourceMode() {
		for (const editor of this.editors) {
			const editable = editor.editable;
			
			const source = this.formHtml(editable.innerHTML);
			const oContent = document.createRange();
			oContent.selectNodeContents(editable.firstChild);
			
			//const oContent = document.createTextNode(source);
			(<any>editable).contentEditable = false;
			editable.innerHTML = '';
			const oSourcePreview = document.createElement('pre');
			oSourcePreview.setAttribute('dir', 'auto');
			oSourcePreview.className = 'editable-source';
			oSourcePreview.innerText = source;
			(<any>oSourcePreview).contentEditable = true;
			
			editable.appendChild(oSourcePreview);
			//document.execCommand('defaultParagraphSeparator', false, 'div');
			
			//editable.focus();
			oSourcePreview.focus();
		}
	}
	
	setDocMode() {
		for (const editor of this.editors) {
			const editable = editor.editable;
			
			// const oContent = document.createRange();
			// oContent.selectNodeContents(editable.firstChild);
			editable.innerHTML = (<HTMLElement>editable.firstElementChild).innerText; //oContent.toString();
			
			(<any>editable).contentEditable = true;
			
			editable.focus();
		}
	}
	
	formHtml(str: string) {
		const div = document.createElement('div');
		div.innerHTML = str.trim();
		
		const nudeNodes = [];
		const childNodes = div.childNodes;
		const l = childNodes.length; //console.log(l);
		
		for (let i = 1; i < l; ++i) {
			const node = childNodes[i]; //console.log(i); console.log(node);
			
			if (node.nodeType === Node.TEXT_NODE) {
				++i;
				continue;
			}
			nudeNodes.push(node);
		}
		
		for (const node of childNodes) {
			if (node.nodeType === Node.ELEMENT_NODE) {
				const nodeName = node.nodeName;
				if (nodeName === 'P' || /^H[123456]$/.test(nodeName) || nodeName === 'BLOCKQUOTE' || nodeName === 'UL' || nodeName === 'OL') {
					const el = (<HTMLElement>node);
					const innerHTML = el.innerHTML;
					
					if (innerHTML !== '') {
						const start = /^\s*/.exec(innerHTML)[0];
						const end = /\s*$/.exec(innerHTML)[0];
						const pre = '\n' + this.indent;
						const suf = '\n';
						if (start !== pre || end !== suf)
							el.innerHTML = pre + innerHTML.substring(start.length, innerHTML.length - end.length) + suf;
					}
				}
			}
		}
		
		// const length = nudeNodes.length;
		// for (let i = 1; i < length; ++i)
		for (const nudeNode of nudeNodes)
			div.insertBefore(document.createTextNode('\n\n'), nudeNode);
		
		return div.innerHTML;
	}
}

export const editorManager = new EditorManager();

interface Options {
	indent: string;
	serverUrl: string;
	sourceFiles: SourceFile[];
}

interface SourceFile {
	path: string;
	domPath: (index: string) => string;
	regexp: (index: string) => RegExp;
}

interface ResolvedSourceFile {
	path: string;
	domPath: string;
	regexp: string;
}

interface Editor {
	editable: HTMLElement;
	index: string;
	initDoc: string;
}

interface Req {
	htmlDocument: string;
	sourceFiles: ResolvedSourceFile[];
}
