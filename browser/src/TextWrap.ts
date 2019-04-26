/**
 * @author [S. Mahdi Mir-Ismaili](https://mirismaili.github.io).
 * Created on 1398/2/6 (2019/4/26).
 */

export class TextWrap implements WrapStyle {
	private readonly tabLength_1: number;
	private readonly continuationIndentVLength: number;
	
	readonly continuationIndent: string;
	readonly tabLength: number;
	readonly wrapOn: number;
	
	constructor(wrapStyle: WrapStyle = DEF_WRAP_STYLE) {
		initWrapStyle(this, wrapStyle);
		this.tabLength_1 = this.tabLength - 1;
		
		this.continuationIndentVLength = this.getVisualLength(this.continuationIndent);
	}
	
	private getVisualLength(s: string) {
		return s.length + this.tabLength_1 * (s.split('\t').length - 1);  // (s.split('\t').length-1) counts occurrences of '\t' in `s`
	}
	
	private reduceToVisualLength(s: string, visualLen: number): number {
		const l = s.length;
		let i = 0;
		
		if (visualLen > l)
			for (let j = 0; i < l && j < visualLen; ++i)
				j += s[i] === '\t' ? this.tabLength : 1;
		else
			for (let j = 0; j < visualLen; ++i)
				j += s[i] === '\t' ? this.tabLength : 1;
		
		return i;
	}
	
	wrap(text: string, indents: string): WrapResult {
		//console.debug(JSON.stringify(text));
		const lines: Line[] = [];
		const markers: number[] = [];
		let marker = 0;
		let wrappedText = '';
		
		//console.debug(`wrapOn: ${this.wrapOn} - Received indents: ${JSON.stringify(indents)} - lengthN: ${lengthN}`);
		const indentsN = indents + this.continuationIndent;
		const indentsNLen = indentsN.length;
		const indentsNVLen = this.getVisualLength(indentsN);
		const lengthN = this.wrapOn - indentsNVLen;
		// 1. In zero-cycle loops this must not be `0`. See return statement.
		// 2. In first-cycle of below loops this must be `1`.
		let breakLineFound = 1;
		
		for (let i = 0; marker < text.length; ++i) {
			let length: number;
			let len: number;
			let line: string;
			let conditionalIndents: string;
			
			if (breakLineFound === 1) {
				length = this.wrapOn;
				conditionalIndents = '';
			} else {
				length = lengthN;
				conditionalIndents = indentsN;
			}
			
			len = this.reduceToVisualLength(text, length);  //console.debug(`Reduced-length (len): ${len}`);
			line = text.substr(marker, length = len); //console.debug(`line0: ${JSON.stringify(line)}`);
			
			let restText = text.slice(marker + len);
			breakLineFound = 0;
			len = line.indexOf('\n');
			
			process:
			{
				if (len !== -1) {
					//console.debug(`Found break-line at: ${len}`);
					breakLineFound = 1;
					break process;
				}
				
				len = line.length;
				
				if (restText.length === 0) {
					//console.debug(`Reached last line.`);
					break process;
				}
				
				const precededWSesInRest = /^[^\S\xA0]+/.exec(restText);
				//console.debug(`Found preceded white-spaces in the rest of the text: ${!!precededWSesInRest}\nrestText: ${JSON.stringify(restText)}`);
				
				if (precededWSesInRest !== null) {
					const i = precededWSesInRest[0].indexOf('\n');
					
					if (i === -1) {
						len += precededWSesInRest[0].length;
						break process;
					}
					
					//console.debug(`Found preceded break-line in \`restText\` at: ${i}`);
					breakLineFound = 1;
					len += i;
					
					break process;
				}
				
				const latestWSToEnd = /[^\S\xA0][\S\xA0]*?$/.exec(line);
				//console.debug(`Found latest white-space (+ subsequent characters to the end) in line: ${!!latestWSToEnd}\nline: ${JSON.stringify(line)}`);
				
				if (latestWSToEnd !== null) {
					len = latestWSToEnd.index + 1;
					
					// The second condition will always be true if the first is true. Actually, it is the main condition we
					// need to check, but we know in most cases (more than 95%) the first is true.
					if (len > indentsNVLen || this.getVisualLength(line.slice(0, len)) > indentsNVLen) break process;
					
					console.info(`OOPS! A bad state! Wrapping is useless in this state. We have to continue. len: ${len}`);
				}
				
				len = line.length;
				
				const firstWSesInRest = /[^\S\xA0]+/.exec(restText);
				//console.debug(`Found first occurrence of white-spaces in the rest of the text: ${!!firstWSesInRest}\nrestText: ${JSON.stringify(restText)}`);
				
				if (firstWSesInRest === null) {
					console.info(`Couldn't wrap. No white-space find!`);
					len += restText.length;
					break process;
				}
				
				const i = firstWSesInRest[0].indexOf('\n');
				
				if (i !== -1) {
					//console.debug(`Found break-line in \`restText\` at: ${i}`);
					breakLineFound = 1;
					len += firstWSesInRest.index + i;
					break process;
				}
				
				len += firstWSesInRest.index + firstWSesInRest[0].length;
				
				//break process;
			}
			
			line = conditionalIndents + (
					len === length ? line : text.substr(marker, len)  // Caveat: Don't get new value of line by slicing previous value of it! Maybe: len > length
			);
			wrappedText += line + '\n';
			marker += len + breakLineFound;
			lines.push({
				content: line,
				endOffset: marker,
				lineBreakAlreadyExists: breakLineFound === 1,
			});
			if (breakLineFound === 0) markers.push(marker);
			
			//console.log(`Wrapped at len: ${len}. marker: ${marker}, length: ${length}`);
			//console.log(line);
		}
		
		//console.debug(wrappedText);
		return {
			lines: lines,
			markers: markers,
			wrappedText: breakLineFound === 0 ? wrappedText.slice(0, -1) : wrappedText,
		}
	}
}

export interface WrapResult {
	lines: Line[];
	markers: number[];
	wrappedText: string;
}

export interface Line {
	content: string;
	endOffset: number;
	lineBreakAlreadyExists: boolean;
}

export interface WrapStyle {
	continuationIndent: string;
	tabLength: number;
	wrapOn: number;
}

export const DEF_WRAP_STYLE: WrapStyle = {
	continuationIndent: '',
	tabLength: 4,
	wrapOn: 120,
};

export function initWrapStyle(target: WrapStyle, source: WrapStyle) {
	target.continuationIndent = source.continuationIndent || DEF_WRAP_STYLE.continuationIndent;
	target.tabLength = source.tabLength || DEF_WRAP_STYLE.tabLength;
	target.wrapOn = source.wrapOn || DEF_WRAP_STYLE.wrapOn;
}
