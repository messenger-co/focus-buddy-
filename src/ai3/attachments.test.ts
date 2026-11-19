import { describe, expect, it } from "vitest";
import {
  composeAttachmentMessage, MAX_COMBINED_CHAT_CHARS,
  MAX_EXCERPT_CHARS, readTextAttachment, type TextAttachment,
} from "./attachments";

function mockFile(name:string,text:string) {
  const bytes = new TextEncoder().encode(text);
  const file = new File([bytes],name);
  Object.defineProperty(file,"arrayBuffer",{value:async()=>bytes.buffer});
  return file;
}
const attachment = (name:string,text:string):TextAttachment => ({
  id:name,name,excerpt:text.slice(0,MAX_EXCERPT_CHARS),
  totalCharacters:text.length,size:text.length,type:"text",
});

describe("Chat document attachments",()=>{
  it("reads UTF-8 text locally without changing the original",async()=>{
    const file=mockFile("ôn_tập.md","# Sinh học\nQuang hợp tạo glucose.");
    expect(await readTextAttachment(file,"a")).toMatchObject({
      name:"ôn_tập.md",type:"text",totalCharacters:33,
    });
  });
  it("refuses unsupported PDF/images, binary data and files over 2 MB",async()=>{
    await expect(readTextAttachment(mockFile("scan.pdf","test"),"1"))
      .rejects.toThrow(/PDF\/ảnh/);
    await expect(readTextAttachment(mockFile("picture.png","image"),"2"))
      .rejects.toThrow(/PDF\/ảnh/);
    await expect(readTextAttachment(mockFile("bad.txt","\u0000abc"),"3"))
      .rejects.toThrow("không phải văn bản");
    const huge=new File([new Uint8Array(2_000_001)],"big.txt");
    await expect(readTextAttachment(huge,"4")).rejects.toThrow("2 MB");
  });
  it("bounds long material for the 4,000-char Groq message limit",()=>{
    const first=attachment("lesson.txt","B".repeat(100_000));
    const second=attachment("code.py","C".repeat(50_000));
    const result=composeAttachmentMessage("Hãy tóm tắt và đặt câu hỏi.",[first,second]);
    expect(result.content.length).toBeLessThanOrEqual(MAX_COMBINED_CHAT_CHARS);
    expect(result.partial).toBe(true);
    expect(result.content).toContain("lesson.txt");
    expect(result.content).toContain("code.py");
    expect(result.content).toContain("Đoạn trích đã được rút ngắn");
    expect(result.content).not.toContain("B".repeat(3100));
    expect(composeAttachmentMessage("Hello",[]).content).toBe("Hello");
  });
  it("accepts only three documents and rejects oversized questions",()=>{
    const doc=attachment("topic.txt","Short document.");
    expect(()=>composeAttachmentMessage("q",[doc,doc,doc,doc]))
      .toThrow("tối đa 3");
    expect(()=>composeAttachmentMessage("X".repeat(3850),[doc]))
      .toThrow("Câu hỏi quá dài");
  });
  it("extracts plain-text WordprocessingML from an uncompressed .docx",async()=>{
    const name=new TextEncoder().encode("word/document.xml");
    const xml=new TextEncoder().encode(
      '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Xin chào</w:t></w:r></w:p><w:p><w:r><w:t>Đồng Giao</w:t></w:r></w:p></w:body></w:document>');
    const localLength=30+name.length+xml.length;
    const centralLength=46+name.length;
    const buffer=new ArrayBuffer(localLength+centralLength+22);
    const view=new DataView(buffer);
    const bytes=new Uint8Array(buffer);
    const w16=(o:number,n:number)=>view.setUint16(o,n,true);
    const w32=(o:number,n:number)=>view.setUint32(o,n,true);
    w32(0,0x04034b50); w16(8,0); w32(18,xml.length); w32(22,xml.length);
    w16(26,name.length);
    bytes.set(name,30); bytes.set(xml,30+name.length);
    const c=localLength;
    w32(c,0x02014b50);w16(c+10,0);w32(c+20,xml.length);w32(c+24,xml.length);
    w16(c+28,name.length);w32(c+42,0);
    bytes.set(name,c+46);
    const e=c+centralLength;
    w32(e,0x06054b50);w16(e+8,1);w16(e+10,1);w32(e+12,centralLength);w32(e+16,c);
    const file=new File([buffer],"lesson.docx");
    Object.defineProperty(file,"arrayBuffer",{value:async()=>buffer});
    const result=await readTextAttachment(file,"docx");
    expect(result.type).toBe("docx");
    expect(result.excerpt).toBe("Xin chào\nĐồng Giao");
  });
});
