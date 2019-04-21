/**
 * @author [S. Mahdi Mir-Ismaili](https://mirismaili.github.io).
 * Created on 1398/1/29 (2019/4/18).
 */

export const TOOLS_POSITION = 'tools-position';

/**
 * https://stackoverflow.com/a/7290395/5318303
 */
class Draggable0 {
	constructor(target: HTMLElement) {
		target.addEventListener('dragstart', Draggable0.onDragStart, false);
		
		document.body.addEventListener('dragover', event => {
			event.preventDefault();
			return false;
		}, false);
		
		document.body.addEventListener('drop', event => Draggable0.onDrop(event, target), false);
	}
	
	static onDragStart(event: any) {
		const style = window.getComputedStyle(event.target, null);
		event.dataTransfer.setData("text/plain",
				(parseInt(style.getPropertyValue("left"), 10) - event.clientX) + ',' + (parseInt(style.getPropertyValue("top"), 10) - event.clientY));
	}
	
	static onDrop(event: any, draggable: any) {
		const offset = event.dataTransfer.getData("text/plain").split(',');
		draggable.style.left = (event.clientX + parseInt(offset[0], 10)) + 'px';
		draggable.style.top = (event.clientY + parseInt(offset[1], 10)) + 'px';
		event.preventDefault();
		return false;
	}
}

/**
 * https://www.w3schools.com/howto/howto_js_draggable.asp
 */
export class Draggable {
	static element: HTMLElement;
	static handlerEl: HTMLElement;
	static onMouseUp: (left: number, top: number, event: MouseEvent) => void;
	static x: number;
	static y: number;
	
	static makeElementDraggable(el: HTMLElement, handlerEl: HTMLElement, onMouseUp: (left: number, top: number, event: MouseEvent) => void) {
		Draggable.element = el;
		Draggable.handlerEl = handlerEl;
		Draggable.onMouseUp = onMouseUp;
		
		// noinspection UnnecessaryLocalVariableJS
		handlerEl.addEventListener('mousedown', Draggable.onMouseDown, false);
	}
	
	static onMouseDown(event: MouseEvent) {//console.log(event);
		// Don't fire when user clicks on child elements:
		if (event.target !== Draggable.handlerEl) return;
		
		event.preventDefault();
		
		Draggable.x = event.clientX;
		Draggable.y = event.clientY;
		
		document.addEventListener('mousemove', Draggable.onMouseMove);
		
		document.addEventListener('mouseup', (event) => {
			document.removeEventListener('mousemove', Draggable.onMouseMove);
			
			const left = Draggable.element.offsetLeft + (event.clientX - Draggable.x);
			const top = Draggable.element.offsetTop + (event.clientY - Draggable.y);
			
			Draggable.onMouseUp(left, top, event);
		}, {once: true});
	}
	
	static onMouseMove(event: MouseEvent) {
		event.preventDefault();
		
		const left = Draggable.element.offsetLeft + (event.clientX - Draggable.x);
		const top = Draggable.element.offsetTop + (event.clientY - Draggable.y);
		
		Draggable.element.style.left = left + 'px';
		Draggable.element.style.top = top + 'px';
		
		Draggable.x = event.clientX;
		Draggable.y = event.clientY;
	}
}

/*https://stackoverflow.com/a/21125098/5318303*/
export function getCookie(name: string) {
	// const decodedCookie = decodeURIComponent(document.cookie);
	const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
	if (match) return match[2];
	
	return null;
}

/**
 * https://stackoverflow.com/a/31281201/5318303
 */
export function getDomPath(el: any) {
	let stack = [];
	let isShadow = false;
	
	while (el.parentNode != null) {
		// console.log(el.nodeName);
		let sibCount = 0;
		let sibIndex = 0;
		
		// get sibling indexes
		for (let i = 0; i < el.parentNode.childNodes.length; ++i) {
			let sib = el.parentNode.childNodes[i];
			
			if (sib.nodeName === el.nodeName) {
				if (sib === el) sibIndex = sibCount;
				
				++sibCount;
			}
		}
		// if ( el.hasAttribute('id') && el.id != '' ) { no id shortcuts, ids are not unique in shadowDom
		//   stack.unshift(el.nodeName.toLowerCase() + '#' + el.id);
		// } else
		let nodeName = el.nodeName.toLowerCase();
		
		if (isShadow) {
			console.error(
					'Warning: shadow DOM v1 has dropped support for ::shadow selectors. There is no way to generate a full CSS selector for shadow DOM elements.' +
					'\nSee: https://stackoverflow.com/questions/5728558/get-the-dom-path-of-the-clicked-a#comment91292627_31281201'
			);
			
			nodeName += "::shadow";
			isShadow = false;
		}
		
		stack.unshift(sibCount === 1 ?
				nodeName :
				`${nodeName}:nth-of-type(${sibIndex + 1})`
		);
		
		el = el.parentNode;
		
		if (el.nodeType === 11) { // for shadow dom, we
			isShadow = true;
			el = el.host;
		}
	}
	
	return stack.splice(1); // removes the html element
}

export function setCookie(key: string, value: string, expireTime: (now: Date) => number) {
	document.cookie = `${key}=${value}; expires=${new Date(expireTime(new Date())).toUTCString()}`;
}
