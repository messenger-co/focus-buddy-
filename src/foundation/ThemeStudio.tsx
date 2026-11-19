import {Check,SlidersHorizontal} from "lucide-react";
import {paletteLibrary,palette,type ThemeId} from "./themes";
import {useAppearance,updateAppearance,type Appearance} from "./appearance";
import {language, switchLanguage} from "./language";
const widgets={missions:"Nhiệm vụ",friend:"Bạn đồng hành",mood:"Điểm danh cảm xúc",assistant:"Trợ lý học tập"};
export default function ThemeStudio({theme,onTheme}:{theme:ThemeId;onTheme:(v:ThemeId)=>Promise<void>}) {
 const a=useAppearance();
 return <section className="design-studio"><header className="page-heading"><div><h1>Xưởng giao diện</h1><p>Chọn ánh sáng, màu sắc và chuyển động cho góc học của bạn.</p></div></header>
 <h2>Bảng chủ đề</h2><div className="palette-grid">{paletteLibrary.map(([id,name,,dark])=>{const p=palette(id);return <button key={id} aria-pressed={id===theme} onClick={()=>void onTheme(id)} className="palette-tile">
 <span className="mini-scene" style={{background:`linear-gradient(145deg,${p["--study-paper"]},${p["--study-mid"]})`,color:p["--study-accent"]}}><i/><b/><em/>{dark?"☾":"☀"}</span>
 <strong>{name}{theme===id&&<Check size={15}/>}</strong></button>;})}</div>
 <div className="studio-settings-grid"><section className="card work-settings"><h2><SlidersHorizontal size={18}/> Tùy chỉnh</h2>
 <label>Màu nhấn<select value={a.accent??"auto"} onChange={e=>updateAppearance({accent:e.target.value==="auto"?null:Number(e.target.value)})}>
 {[["auto","Theo chủ đề"],["146","Lá trà"],["196","Xanh hồ"],["265","Hoa tím"],["342","Hồng đào"],["28","Hổ phách"]].map(([v,n])=><option key={v} value={v}>{n}</option>)}</select></label>
 <label>Họa tiết nền<select value={a.backdrop} onChange={e=>updateAppearance({backdrop:e.target.value as Appearance["backdrop"]})}>{[["plain","Nền trơn"],["grid","Trang vở"],["stars","Trời sao"],["leaves","Hạt mầm"]].map(([v,n])=><option key={v} value={v}>{n}</option>)}</select></label>
 <label>Mức chuyển động<select value={a.motion} onChange={e=>updateAppearance({motion:e.target.value as Appearance["motion"]})}>{[["off","Tắt"],["minimal","Nhẹ"],["normal","Vừa"],["enhanced","Sinh động"]].map(([v,n])=><option key={v} value={v}>{n}</option>)}</select></label>
 <label>Ngôn ngữ giao diện<select value={language} onChange={e=>switchLanguage(e.target.value==="en"?"en":"vi")}><option value="vi">Tiếng Việt</option><option value="en">English</option></select></label>
 </section><section className="card work-settings"><h2>Trang chính của bạn</h2>{Object.entries(widgets).map(([id,label])=><label key={id}>{label}<input type="checkbox" checked={a.widgets.includes(id)} onChange={e=>updateAppearance({widgets:e.target.checked?[...a.widgets,id]:a.widgets.filter(x=>x!==id)})}/></label>)}</section></div>
 </section>;
}
