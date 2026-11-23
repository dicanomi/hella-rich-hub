import { Children, cloneElement, isValidElement } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';

// Group adjacent text (including JSX punctuation) before finding the final pair.
function protectTail(children:ReactNode):ReactNode {
  const nodes:ReactNode[]=[];
  for(const child of Children.toArray(children)) {
    if(typeof child==='string' && typeof nodes.at(-1)==='string') nodes[nodes.length-1]=String(nodes.at(-1))+child;
    else nodes.push(child);
  }
  for(let index=nodes.length-1;index>=0;index--) {
    const child=nodes[index];
    if(typeof child==='string') {
      if(!child.trim()) continue;
      const match=child.match(/^(.*?)(\S+\s+\S+)(\s*)$/s);
      if(match) nodes[index]=<span key="protected-tail" className="text-ending">{match[1]}<span className="text-tail">{match[2]}</span>{match[3]}</span>;
      break;
    }
    if(isValidElement<{children?:ReactNode}>(child)) {
      // Nested body components already protect their own tail.
      if(child.type!==BodyText && child.props.children) nodes[index]=cloneElement(child as ReactElement<{children?:ReactNode}>,{children:protectTail(child.props.children)});
      break;
    }
  }
  return nodes;
}

type BodyTag='p'|'li'|'figcaption'|'blockquote'|'td'|'th';
export function BodyText({as:Tag='p',children,...props}:HTMLAttributes<HTMLElement>&{as?:BodyTag;children?:ReactNode;role?:string;scope?:"row"|"col"|"rowgroup"|"colgroup"}) {
  return <Tag {...props}>{protectTail(children)}</Tag>;
}
