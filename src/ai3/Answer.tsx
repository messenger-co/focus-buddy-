import { Fragment, memo, useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import type { Language } from "./modes";

export function CopyButton({text,lang,code=false}:{text:string;lang:Language;code?:boolean}) {
  const [status,setStatus]=useState<"ready"|"copied"|"error">("ready");
  const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  const label=lang==="vi" ? (code?"Sao chép mã":"Sao chép câu trả lời") : (code?"Copy code":"Copy answer");
  return <button type="button" className="ai-copy" aria-label={label} title={label} onClick={async()=>{
    try { await navigator.clipboard.writeText(text);setStatus("copied"); }
    catch {setStatus("error");}
    clearTimeout(timer.current);timer.current=setTimeout(()=>setStatus("ready"),2200);
  }}>{status==="copied"?<Check size={13}/>:<Copy size={13}/>}<span aria-live="polite">{status==="copied"?(lang==="vi"?"Đã chép":"Copied"):status==="error"?(lang==="vi"?"Chọn và chép thủ công":"Select text to copy"):label}</span></button>;
}
function inline(text:string):ReactNode[] {
  // React tự mã hóa văn bản; không chạy HTML, URL hay mã mà mô hình sinh ra.
  return text.split(/(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g).map((s,i)=>
    s.startsWith("`")&&s.endsWith("`")&&s.length>2?<code key={i}>{s.slice(1,-1)}</code>:
    s.startsWith("**")&&s.endsWith("**")&&s.length>4?<strong key={i}>{s.slice(2,-2)}</strong>:
    s.startsWith("*")&&s.endsWith("*")&&s.length>2?<em key={i}>{s.slice(1,-1)}</em>:s);
}
function highlight(text:string) {
  const re=/(\/\/[^\n]*|#[^\n]*|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|\b(?:const|let|if|else|elif|for|while|def|function|return|class|import|from|in|range|print|async|await|try|except|throw|new|select|where|true|false|null|none)\b|\b\d+(?:\.\d+)?\b)/gi;
  return text.split(re).map((token,index)=>{
    if(index%2===0)return token;
    const kind=/^(\/\/|#)/.test(token)?"comment":/^["']/.test(token)?"string":/^\d/.test(token)?"number":"keyword";
    return <span className={`ai-code-${kind}`} key={index}>{token}</span>;
  });
}
export const Answer = memo(function Answer({text,lang}:{text:string;lang:Language}) {
  const blocks: ReactNode[]=[];
  const lines=text.replaceAll("\r\n","\n").split("\n");
  let i=0;
  while(i<lines.length){
    const line=lines[i], key=i;
    if(!line.trim()){i++;continue;}
    const fence=/^\s*```([\w+.#-]{0,32})\s*$/.exec(line);
    if(fence){const data:string[]=[];i++;while(i<lines.length&&!/^\s*```\s*$/.test(lines[i]))data.push(lines[i++]);i++;
      const code=data.join("\n");blocks.push(<section key={key} className="ai-code"><div><span>{fence[1]||(lang==="vi"?"Mã":"Code")}</span><CopyButton lang={lang} code text={code}/></div><pre tabIndex={0}><code>{highlight(code)}</code></pre></section>);continue;}
    if(/^#{1,6}\s/.test(line)){blocks.push(<h3 key={key}>{inline(line.replace(/^#{1,6}\s+/,""))}</h3>);i++;continue;}
    const ordered=/^\s*\d+[.)]\s+/.test(line),list=ordered?/^\s*\d+[.)]\s+/:/^\s*[-*+]\s+/;
    if(list.test(line)){const items:ReactNode[]=[];while(i<lines.length&&list.test(lines[i])){items.push(<li key={i}>{inline(lines[i].replace(list,""))}</li>);i++;}
      blocks.push(ordered?<ol start={Number.parseInt(line,10)||1} key={key}>{items}</ol>:<ul key={key}>{items}</ul>);continue;}
    const para=[line];i++;
    while(i<lines.length&&lines[i].trim()&&!/^\s*(?:```|#{1,6}\s|[-*+]\s|\d+[.)]\s)/.test(lines[i]))para.push(lines[i++]);
    blocks.push(<p key={key}>{para.map((s,j)=><Fragment key={j}>{j>0&&<br/>}{inline(s)}</Fragment>)}</p>);
  }
  return <div className="ai-markdown">{blocks}</div>;
});
