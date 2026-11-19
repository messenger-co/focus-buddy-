export const paletteLibrary = [
  ["meadow","Đồng cỏ",143,false],["tide","Thủy triều",182,false],["dusk","Chạng vạng",277,false],
  ["minimal","Tối giản sáng",204,false],["charcoal","Tối giản tối",218,true],["pastel","Mơ pastel",275,false],
  ["cozy","Góc học ấm áp",28,false],["forest","Rừng xanh",149,false],["ocean","Đại dương",207,false],
  ["sakura","Hoa anh đào",340,false],["midnight","Tím nửa đêm",266,true],["neon","Neon",177,true],
  ["galaxy","Dải ngân hà",240,true],["winter","Tuyết đầu mùa",198,false],["autumn","Cà phê mùa thu",23,false],
] as const;
export type ThemeId=(typeof paletteLibrary)[number][0];
export function palette(id:string, accent:number|null=null) {
  const [key,,h,dark]=paletteLibrary.find(t=>t[0]===id)??paletteLibrary[0];
  const s=key==="minimal"||key==="charcoal"?9:35;
  const color=(sat:number,light:number,hue=h as number)=>`hsl(${hue} ${sat}% ${light}%)`;
  return {
    "--study-ink":color(s,dark?88:21), "--study-accent":color(accent===null?s+5:46,dark?35:32,accent??h),
    "--study-pale":color(s,dark?18:95),"--study-mid":color(s+3,dark?24:86),"--study-line":color(s/1.8,dark?33:83),
    "--study-paper":color(s/1.7,dark?10:97),"--panel":color(s/1.6,dark?14:99),"--raised":color(s/1.7,dark?19:96),
    "--text":color(s/1.5,dark?91:18),"--subtext":color(s/2,dark?77:33),"--quiet":color(s/2,dark?72:39),
    "--highlight":color(44,dark?76:32,accent??h),
  };
}
