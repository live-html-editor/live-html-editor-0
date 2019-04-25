/**
 * @author [S. Mahdi Mir-Ismaili](https://mirismaili.github.io).
 * Created on 1398/2/5 (2019/4/25).
 */
import {countOccurrences} from "./utilities";

export class BeautifyHtml implements CodeStyle {
	private static readonly BLOCKS = /^(?:P|H[123456]|BLOCKQUOTE|[UO]L|LI|DIV)$/;
	
	private readonly textWrap: TextWrap;
	
	readonly indent                  : string;
	readonly continuationIndent      : string;
	readonly keepIntentsOnEmptyLines : boolean;
	readonly emptyLinesBetweenBlocks : number;
	readonly tabLength               : number;
	readonly wrapOn                  : number;
	
	//private static readonly TEXT_OR_INLINE = /^(?:#text|[BIA]|CODE|FONT|SPAN)$/;
	
	constructor(codeStyle: CodeStyle = DEF_CODE_STYLE) {
		initCodeStyle(this, codeStyle);
		this.textWrap = new TextWrap(codeStyle);
	}
	
	form(element: HTMLElement) {
		this.formR(element, null);
	}
	
	formR(element: HTMLElement, parentIndents: string): HTMLElement {
		if (!BeautifyHtml.BLOCKS.test(element.nodeName)) return element;
		
		let indents: string;
		let preFirst: string;
		let sufLast: string;
		
		if (parentIndents === null)
			indents = preFirst = sufLast = '';
		else {
			indents = parentIndents + this.indent;
			preFirst = '\n' + indents;
			sufLast = '\n' + parentIndents;
		}
		
		const blockSeparator =
				('\n' + (this.keepIntentsOnEmptyLines ? indents : '')).repeat(this.emptyLinesBetweenBlocks)
				+ ('\n' + indents);
		//--------------------------------------------------------/
		
		const nodes = element.childNodes;
		const l = nodes.length;
		const l_1 = l - 1;
		let isBlock: boolean;
		let previousIsBlock = false;
		let output = '';
		
		for (let i = 0; i < l; ++i) {
			let node: ChildNode;
			const i0 = i;
			while (true) {
				node = nodes[i]; //console.debug(node);
				
				if (BeautifyHtml.BLOCKS.test(node.nodeName)) break;
				
				if (++i === l) break;
			}
			
			if (i > i0) {
				--i;
				isBlock = false;
			} else
				isBlock = true;
			//console.debug(isBlock);
			
			let pre: string;			// WhiteSpaces; Before Non-blocks (Between-Blocks-and-Non-blocks or Before-First-Non-block)
			let suf: string;			// WhiteSpaces; After Non-Blocks (Between-Non-blocks-and-Blocks or After-Last-Non-block)
			let separator: string;  // WhiteSpaces; Between-2-Blocks or Before-First-Block or After-Last-Block
			
			if (!(i0 === 0 || i === l_1)) {	// Not First, Not Last => Middle
				//console.debug('MIDDLE');
				pre = suf = blockSeparator;
				separator = blockSeparator;
			} else if (!(i === l_1)) { 		// Not Last => First
				//console.debug('FIRST');
				pre = preFirst;
				suf = blockSeparator;
				separator = preFirst;
			} else if (!(i0 === 0)) { 			// Not First => Last
				//console.debug('LAST');
				pre = blockSeparator;
				suf = sufLast;
				separator = sufLast;
			} else { 								// First and Last
				//console.debug('BOTH');
				pre = preFirst;
				suf = sufLast;
				separator = '';
			}
			
			if (!isBlock) {
				previousIsBlock = false;
				
				let text = '';
				for (let j = i0; j <= i; ++j) {
					node = nodes[j];
					
					if (node.nodeType === Node.ELEMENT_NODE) {
						text += (<HTMLElement>node).outerHTML;
						continue;
					}
					
					text += node.nodeValue; //console.debug(JSON.stringify(text));
				}
				
				if (text === separator) {
					output += text; //console.debug(JSON.stringify(output));
					continue;
				}
				
				const wrappedText = this.wrapOn === 0 ? text : this.textWrap.wrap(text, indents);
				
				const start = /^\s*/.exec(wrappedText)[0];
				if (start.length === wrappedText.length) { // If text only contains white spaces
					output += separator; //console.debug(JSON.stringify(output));
					continue;
				}
				const end = /\s*$/.exec(wrappedText)[0];
				
				//console.debug(wrappedText !== text);console.debug(JSON.stringify(start));console.debug(JSON.stringify(end));
				output +=
						wrappedText === text && start === pre && end === suf ?
								wrappedText :
								pre + wrappedText.slice(start.length, wrappedText.length - end.length) + suf;
				
				//console.debug(JSON.stringify(output));
				continue;
			}
			
			if (previousIsBlock) output += separator;
			
			previousIsBlock = true;
			
			output += this.formR(<HTMLElement>node, indents).outerHTML;
			
			if (i === l_1) output += separator;
		}
		
		if (output !== element.innerHTML) element.innerHTML = output;
		
		return element;
	}
}

class TextWrap implements CodeStyle {
	private readonly tabLength_1: number;
	private readonly continuationIndentLength: number;
	
	readonly indent                  : string;
	readonly continuationIndent      : string;
	readonly keepIntentsOnEmptyLines : boolean;
	readonly emptyLinesBetweenBlocks : number;
	readonly tabLength               : number;
	readonly wrapOn                  : number;
	
	constructor(codeStyle: CodeStyle = DEF_CODE_STYLE) {
		initCodeStyle(this, codeStyle);
		this.tabLength_1 = this.tabLength - 1;
		
		this.continuationIndentLength = this.calculateSpaceLength(this.continuationIndent);
	}
	
	private calculateSpaceLength(s: string) {
		return s.length + this.tabLength_1 * (s.split('\t').length - 1);  // (s.split('\t').length-1) counts occurrences of '\t' in `s`
	}
	
	wrap(text: string, indents: string): string { return text;
		let len0 = this.wrapOn - this.calculateSpaceLength(indents);
		
		let line0 = text.substr(0, len0);
		let n = line0.split('\t').length - 1;	// Count occurrences of '\t' in `line0`
		len0 -= n * this.tabLength_1;
		if (n > 0) line0 = line0.slice(0, len0);
		
		let restText = text.slice(len0);
		
		let lf = 0;
		
		n = line0.indexOf('\n');
		if (n !== -1) {
			lf = 1;
		} else {
			let match = /\s\S*?$/.exec(line0);
			
			if (match === null) {
				// Find first occurrence of white-spaces at the rest of the text:
				match = /\s+/.exec(restText);
				
				if (match === null) {
					n = text.length;
					//---------------------
				} else {
					n = match[0].indexOf('\n');
					if (n === -1) {
						n = match.index + match[0].length;
					} else {
						lf = 1;
						n += match.index;
					}
					//---------
				}
			} else {
				n = match.index;
				
				if (n === line0.length) {
				} else {
					//------------------
				}
			}
		}
		
		line0 = line0.slice(0, n);
		
		
		const len = len0 - this.continuationIndentLength;
	}
}

export interface CodeStyle {
	indent                    : string;
	continuationIndent        : string;
	keepIntentsOnEmptyLines   : boolean;
	emptyLinesBetweenBlocks   : number;
	tabLength                 : number;
	wrapOn                    : number;
}

export const DEF_CODE_STYLE: CodeStyle = {
	indent                    : '\t',
	continuationIndent        : '',
	keepIntentsOnEmptyLines   : true,
	emptyLinesBetweenBlocks   : 1,
	tabLength                 : 4,
	wrapOn                    : 100,
};

export function initCodeStyle(target: CodeStyle, source: CodeStyle) {
	target.indent                  = source.indent                  || DEF_CODE_STYLE.indent                 ;
	target.continuationIndent      = source.continuationIndent      || DEF_CODE_STYLE.continuationIndent     ;
	target.keepIntentsOnEmptyLines = source.keepIntentsOnEmptyLines || DEF_CODE_STYLE.keepIntentsOnEmptyLines;
	target.emptyLinesBetweenBlocks = source.emptyLinesBetweenBlocks || DEF_CODE_STYLE.emptyLinesBetweenBlocks;
	target.tabLength               = source.tabLength               || DEF_CODE_STYLE.tabLength              ;
	target.wrapOn                  = source.wrapOn                  || DEF_CODE_STYLE.wrapOn                 ;
}
