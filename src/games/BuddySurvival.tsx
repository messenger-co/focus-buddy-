import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BedDouble, Compass, Hammer, Heart, Leaf, RotateCcw, Sparkles, Sun, Trees } from "lucide-react";
import { Link } from "react-router-dom";
import Companion from "../components/Companion";
import type { Profile } from "../state";
import "./buddy-survival.css";

const SAVE_KEY = "focus-buddy-island-survival-v1";
const SIZE = 7;
const LAND = [
  "GFGSBGG",
  "GBGGGFG",
  "GGWGGGS",
  "FGGCGGF",
  "GSGGGWG",
  "GFGGBGG",
  "GGSGFGG",
] as const;
type Resource = "wood" | "water" | "food" | "stone";
type Supplies = Record<Resource, number>;
type Save = { x: number; y: number; day: number; energy: number; supplies: Supplies; projects: number; harvested: string[]; steps: number };
type Tile = "F" | "S" | "W" | "B" | "C" | "G";
type Project = { title: string; description: string; need: Partial<Supplies> };
const PROJECTS: readonly Project[] = [
  { title: "Lều ấm áp", description: "Dựng nơi nghỉ chân cho Buddy trong khu vườn.", need: {wood: 4, stone: 2} },
  { title: "Hồ nước nhỏ", description: "Trang trí điểm lấy nước của hòn đảo.", need: {wood: 3, stone: 3, water: 2} },
  { title: "Vườn trái cây", description: "Cùng Buddy tạo góc vườn xanh mát.", need: {wood: 3, stone: 2, food: 2} },
  { title: "Ngọn hải đăng", description: "Hoàn thành chuyến phiêu lưu và thắp sáng hòn đảo.", need: {wood: 5, stone: 5, water: 3, food: 3} },
];
const LABELS: Record<Resource,string> = { wood: "Gỗ", stone: "Đá", water: "Nước", food: "Trái cây" };
const ICONS: Record<Tile,string> = { F:"🌳", S:"🪨", W:"💧", B:"🍓", C:"🏡", G:"🌿" };
const TILE_LABELS: Record<Tile,string> = {F:"Rừng cây",S:"Bãi đá",W:"Suối nước",B:"Bụi trái cây",C:"Trại Buddy",G:"Đồng cỏ"};
const RESOURCES: Partial<Record<Tile,Resource>> = {F:"wood",S:"stone",W:"water",B:"food"};
function initial(): Save {
  return { x: 3, y: 3, day: 1, energy: 12, supplies: {wood: 0, stone: 0, water: 2, food: 2}, projects: 0, harvested: [], steps: 0 };
}
function load(): Save {
  try {
    const source: unknown = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (!source || typeof source !== "object") return initial();
    const obj = source as Partial<Save>;
    const validInt = (v: unknown, max: number) => typeof v === "number" && Number.isSafeInteger(v) && v >= 0 && v <= max;
    if (!validInt(obj.x, SIZE - 1) || !validInt(obj.y, SIZE - 1) ||
        !validInt(obj.day, 999999) || obj.day === 0 || !validInt(obj.energy, 12) ||
        !validInt(obj.projects, PROJECTS.length) || !validInt(obj.steps, 99999999) ||
        !obj.supplies || !Array.isArray(obj.harvested)) return initial();
    const supplies = obj.supplies;
    if (!Object.keys(LABELS).every((name) => validInt(supplies[name as Resource], 9999))) return initial();
    return {
      x: obj.x!, y: obj.y!, day: obj.day!, energy: obj.energy!, projects: obj.projects!,
      steps: obj.steps!, supplies: { ...supplies },
      harvested: obj.harvested.filter((key): key is string => typeof key === "string" && /^[0-6],[0-6]$/.test(key)).slice(0, SIZE * SIZE),
    };
  } catch {return initial();}
}
function tile(x: number, y: number): Tile {return LAND[y][x] as Tile;}
function coord(x: number,y: number) {return `${x},${y}`;}
export default function BuddySurvival({ profile }: { profile: Profile }) {
  const [world, setWorld] = useState<Save>(load);
  const [notice, setNotice] = useState("Chào mừng đến đảo xanh! Hãy thu thập vật liệu và xây dựng từng công trình cùng Buddy.");
  useEffect(() => {
    try {localStorage.setItem(SAVE_KEY, JSON.stringify(world));} catch {/* Local storage may be disabled. */}
  }, [world]);
  const move = useCallback((dx: number,dy: number) => {
    setWorld((previous) => {
      const x = previous.x + dx,y = previous.y + dy;
      if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) {setNotice("Đã đến mép bản đồ rồi.");return previous;}
      if (previous.energy === 0) {setNotice("Buddy cần nghỉ một chút để có thêm năng lượng.");return previous;}
      setNotice(`Bạn đã khám phá: ${TILE_LABELS[tile(x,y)]}. ${x === 3 && y === 3 ? "Đây là trại chính!" : ""}`);
      return {...previous,x,y,energy:previous.energy-1,steps:previous.steps+1};
    });
  }, []);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const element = event.target as HTMLElement | null;
      if (element?.closest("input,textarea,[contenteditable=true]")) return;
      const arrows: Record<string,[number,number]> = {ArrowUp:[0,-1],KeyW:[0,-1],ArrowDown:[0,1],KeyS:[0,1],ArrowLeft:[-1,0],KeyA:[-1,0],ArrowRight:[1,0],KeyD:[1,0]};
      const direction = arrows[event.code];
      if (direction) {event.preventDefault();move(...direction);}
    };
    window.addEventListener("keydown",handler);
    return () => window.removeEventListener("keydown",handler);
  }, [move]);
  const current = tile(world.x,world.y);
  const resource = RESOURCES[current];
  const already = world.harvested.includes(coord(world.x,world.y));
  const nextProject = PROJECTS[world.projects];
  const canBuild = nextProject && Object.entries(nextProject.need).every(([key,value]) => world.supplies[key as Resource] >= (value || 0));
  function gather() {
    if (!resource || already) {setNotice("Khu này chưa có gì mới để thu thập hôm nay.");return;}
    if (world.energy === 0) {setNotice("Buddy cần nghỉ một chút.");return;}
    setWorld((previous) => ({
      ...previous,energy:previous.energy-1,harvested:[...previous.harvested,coord(previous.x,previous.y)],
      supplies:{...previous.supplies,[resource]:previous.supplies[resource]+2},
    }));
    setNotice(`Bạn đã nhặt 2 ${LABELS[resource].toLowerCase()}! Tài nguyên mới xuất hiện vào ngày hôm sau.`);
  }
  function craft() {
    if (current !== "C" || !nextProject || !canBuild) return;
    const costs = nextProject.need;
    setWorld((previous) => ({
      ...previous,projects:previous.projects+1,
      supplies:Object.fromEntries(Object.keys(LABELS).map((name) => [name,previous.supplies[name as Resource]-(costs[name as Resource] || 0)])) as Supplies,
    }));
    setNotice(`Hoàn thành ${nextProject.title}! Buddy đã mở khóa chương ${world.projects+2}.`);
  }
  function rest() {
    const inCamp = current === "C";
    setWorld((previous) => ({
      ...previous,energy:inCamp ? 12 : Math.min(12,previous.energy+5),
      ...(inCamp ? {day:previous.day+1,harvested:[]} : {}),
    }));
    setNotice(inCamp ? "Chào ngày mới! Nguồn tài nguyên đã hồi phục." : "Bạn và Buddy nghỉ ngơi nhanh, lấy lại 5 năng lượng.");
  }
  function reset() {
    if (!window.confirm("Xóa tiến độ Đảo Xanh đã lưu trên thiết bị và chơi lại từ đầu?")) return;
    setWorld(initial());
    setNotice("Cuộc phiêu lưu mới đã bắt đầu!");
  }
  return (
    <div className="survival-page">
      <header className="survival-hero">
        <span><Compass size={18}/> BUDDY SURVIVAL · LƯU TIẾN ĐỘ TRÊN THIẾT BỊ</span>
        <h1>Đảo Xanh phiêu lưu</h1>
        <p>Khám phá, thu thập tài nguyên và xây dựng khu trại ấm áp cùng Buddy. Bốn chương chơi được lưu trên máy, không cần cloud.</p>
      </header>
      <section className="survival-dashboard">
        <span><Sun size={17}/> Ngày <b>{world.day}</b></span>
        <span><Sparkles size={17}/> Chương <b>{Math.min(world.projects+1,PROJECTS.length)}/{PROJECTS.length}</b></span>
        <span><Heart size={17}/> Năng lượng <b>{world.energy}/12</b></span>
        <span><Compass size={17}/> Bước đi <b>{world.steps}</b></span>
      </section>
      <div className="survival-layout">
        <section className="survival-map-panel">
          <h2><Trees size={19}/> Bản đồ hòn đảo</h2>
          <div className="survival-map" role="grid" aria-label="Bản đồ Đảo Xanh">
            {LAND.map((row,y) => [...row].map((land,x) => {
              const code = land as Tile;
              const here = world.x === x && world.y === y;
              const cleared = world.harvested.includes(coord(x,y));
              return <div key={coord(x,y)} role="gridcell" aria-label={`${TILE_LABELS[code]}${here ? ", Buddy ở đây" : ""}`}
                className={`survival-tile tile-${code.toLowerCase()}${here ? " is-buddy" : ""}${cleared ? " was-collected" : ""}`}>
                {here ? <Companion kind={profile.companion} color={profile.color} accessory={profile.accessory} size={62} sprite paused/> : <span aria-hidden="true">{cleared ? "🌱" : ICONS[code]}</span>}
              </div>;
            }))}
          </div>
          <p className="survival-status" role="status">{notice}</p>
          <div className="survival-controls">
            <button aria-label="Lên" onClick={() => move(0,-1)} disabled={world.energy === 0}><ArrowUp/></button>
            <div>
              <button aria-label="Trái" onClick={() => move(-1,0)} disabled={world.energy === 0}><ArrowLeft/></button>
              <button aria-label="Xuống" onClick={() => move(0,1)} disabled={world.energy === 0}><ArrowDown/></button>
              <button aria-label="Phải" onClick={() => move(1,0)} disabled={world.energy === 0}><ArrowRight/></button>
            </div>
            <small>Dùng WASD hoặc phím mũi tên trên máy tính.</small>
          </div>
          <div className="survival-map-actions">
            <button className="button primary" disabled={!resource || already || world.energy === 0} onClick={gather} type="button">
              <Leaf size={17}/> {resource ? already ? "Đã thu thập hôm nay" : `Thu thập ${LABELS[resource].toLowerCase()} (+2)` : "Di chuyển tới điểm tài nguyên"}
            </button>
            <button className="button secondary" onClick={rest} type="button">
              <BedDouble size={17}/> {current === "C" ? "Nghỉ qua ngày" : "Nghỉ nhanh"}
            </button>
          </div>
        </section>
        <aside className="survival-sidebar">
          <section className="survival-box">
            <h2>🎒 Túi đồ của Buddy</h2>
            <div className="survival-supplies">
              {(["wood","stone","water","food"] as const).map((key) => (
                <div key={key}><span>{key === "wood" ? "🪵" : key === "stone" ? "🪨" : key === "water" ? "💧" : "🍓"} {LABELS[key]}</span><b>{world.supplies[key]}</b></div>
              ))}
            </div>
          </section>
          <section className="survival-box">
            <h2><Hammer size={19}/> Dự án tiếp theo</h2>
            {nextProject ? (
              <>
                <h3>Chương {world.projects+1}: {nextProject.title}</h3>
                <p>{nextProject.description}</p>
                <div className="survival-costs">
                  {Object.entries(nextProject.need).map(([key,value]) => (
                    <span key={key} className={world.supplies[key as Resource] >= (value || 0) ? "ready" : ""}>
                      {LABELS[key as Resource]} {world.supplies[key as Resource]}/{value}
                    </span>
                  ))}
                </div>
                <button className="button primary" type="button" disabled={current !== "C" || !canBuild} onClick={craft}>
                  <Hammer size={17}/> {current !== "C" ? "Về trại để xây dựng" : canBuild ? "Xây công trình" : "Chưa đủ vật liệu"}
                </button>
              </>
            ) : <div className="survival-finale"><Sparkles size={29}/><h3>Hoàn thành chuyến phiêu lưu!</h3><p>Đảo Xanh đã phát triển nhờ sự kiên trì của bạn và Buddy. Bạn vẫn có thể tiếp tục khám phá.</p></div>}
          </section>
          <section className="survival-box">
            <h2>📘 Nhật ký khu trại</h2>
            <p>{world.projects} công trình đã hoàn thành · ngày {world.day} · {world.steps} bước khám phá.</p>
            <p>Trò chơi tự lưu sau mỗi hành động vào bộ nhớ của trình duyệt này, không gửi dữ liệu trò chơi lên Supabase.</p>
            <button className="survival-reset" type="button" onClick={reset}><RotateCcw size={15}/> Bắt đầu lại (xóa bản lưu)</button>
          </section>
          <Link className="survival-return" to="/tap-trung">Quay lại giờ tập trung <ArrowRight size={16}/></Link>
        </aside>
      </div>
    </div>
  );
}
