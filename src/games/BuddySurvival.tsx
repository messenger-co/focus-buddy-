import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BedDouble, Compass,
  Hammer, Heart, Leaf, Map as MapIcon, RotateCcw, Save, Sparkles, Trees,
  VolumeX, X,
} from "lucide-react";
import { Link } from "react-router-dom";
import Companion from "../components/Companion";
import type { Profile } from "../state";
import {
  HOME, PROJECTS, RESOURCE_ICONS, RESOURCE_LABELS,
  WORLD_SIZE, buildWorld, canBuild, gatherWorld, initialWorld, isBlocked,
  loadWorld, resourceAt, restWorld, stepWorld, storeWorld, tileAt,
  type Resource, type WorldSave,
} from "./survival/world";
import { drawIsland, drawMiniMap, isoPoint, tileFromScreen } from "./survival/paint";
import "./buddy-survival-world.css";

type Direction = [number, number];
const DIRECTIONS: Record<string, Direction> = {
  ArrowUp: [0, -1], KeyW: [0, -1],
  ArrowDown: [0, 1], KeyS: [0, 1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0],
  ArrowRight: [1, 0], KeyD: [1, 0],
};
const MAX_FPS = 32;

/** Full canvas sandbox world; localStorage is the ONLY progress persistence. */
export default function BuddySurvival({ profile }: { profile: Profile }) {
  const [world, setWorld] = useState<WorldSave>(loadWorld);
  const latest = useRef(world);
  const surface = useRef<HTMLCanvasElement>(null);
  const mini = useRef<HTMLCanvasElement>(null);
  const actor = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const camera = useRef({ x: world.x, y: world.y });
  const playerAnimation = useRef({ x: world.x, y: world.y });
  const facing = useRef<Direction>([0, 1]);
  const [selected, setSelected] = useState<{ x: number; y: number } | null>(null);
  const [message, setMessage] = useState("Bước vào thế giới của Buddy! WASD để đi, E để thu thập, B để xây dựng.");
  const [pickup, setPickup] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [effects, setEffects] = useState(() => {
    try { return localStorage.getItem("focus-buddy-rich-effects-v1") !== "off"; }
    catch { return true; }
  });
  const lastStep = useRef(0);
  const effectsRef = useRef(effects);
  useEffect(() => { effectsRef.current = effects; }, [effects]);
  const update = useCallback((next: WorldSave) => {
    latest.current = next;
    setWorld(next);
  }, []);
  useEffect(() => {
    const timeout = window.setTimeout(() => storeWorld(world), 180);
    return () => window.clearTimeout(timeout);
  }, [world]);
  useEffect(() => {
    const preserve = () => storeWorld(latest.current);
    window.addEventListener("pagehide", preserve);
    return () => {
      preserve();
      window.removeEventListener("pagehide", preserve);
    };
  }, []);
  useEffect(() => {
    try { localStorage.setItem("focus-buddy-rich-effects-v1", effects ? "on" : "off"); }
    catch { /* Reduced-effects preference is optional. */ }
  }, [effects]);

  const move = useCallback((dx: number, dy: number) => {
    const now = performance.now();
    if (now - lastStep.current < 105) return;
    lastStep.current = now;
    facing.current = [dx, dy];
    const before = latest.current;
    const moved = stepWorld(before, dx, dy);
    if (moved) {
      update(moved);
      setSelected(null);
    } else if (before.energy < 1) setMessage("Buddy cần nghỉ để hồi sức. Nhấn R hoặc chọn Nghỉ ngơi.");
    else if (isBlocked(before, before.x + dx, before.y + dy))
      setMessage("Có nước hoặc vật cản phía trước. Thu thập tài nguyên (E), hoặc đi đường khác.");
  }, [update]);

  const gather = useCallback((target?: { x: number; y: number }) => {
    const current = latest.current;
    const options = target ? [target] : [
      ...(selected ? [selected] : []),
      { x: current.x + facing.current[0], y: current.y + facing.current[1] },
      { x: current.x, y: current.y },
      { x: current.x, y: current.y - 1 },
      { x: current.x + 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x - 1, y: current.y },
    ];
    for (const pos of options) {
      const next = gatherWorld(current, pos.x, pos.y);
      if (next) {
        const kind = resourceAt(pos.x, pos.y);
        update(next);
        setPickup((kind ? RESOURCE_ICONS[kind] : "✨") + " + " + (kind === "water" ? "3" : "2"));
        setMessage("Đã lấy " + (kind ? RESOURCE_LABELS[kind].toLowerCase() : "tài nguyên") +
          "! Mỗi ngày mới, tài nguyên có thể xuất hiện trở lại.");
        setSelected(null);
        return;
      }
    }
    setMessage(current.energy < 3
      ? "Buddy cần ít nhất 3 năng lượng để thu thập. Hãy nghỉ một chút."
      : "Đứng cạnh cây, đá, bụi quả hoặc nước rồi nhấn E để lấy tài nguyên.");
  }, [selected, update]);

  const build = useCallback(() => {
    const current = latest.current;
    if (!canBuild(current)) {
      setMessage(Math.abs(current.x - HOME) + Math.abs(current.y - HOME) > 3
        ? "Hãy quay về gần trại để xây công trình."
        : "Bạn cần thu thập thêm vật liệu cho công trình này.");
      return;
    }
    const project = PROJECTS[current.projects];
    const next = buildWorld(current);
    if (next && project) {
      update(next);
      setMessage("Công trình " + project.name + " đã xuất hiện trong thế giới! Hãy khám phá quanh trại.");
      setPickup("🏡 Xây dựng xong!");
    }
  }, [update]);
  const rest = useCallback(() => {
    const next = restWorld(latest.current);
    const atHome = next.day > latest.current.day;
    update(next);
    setMessage(atHome
      ? "Một ngày mới! Cây và đá đã hồi phục, Buddy lại sẵn sàng."
      : "Bạn đã nghỉ ngơi và lấy lại 35 năng lượng.");
  }, [update]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true], button")) return;
      const direction = DIRECTIONS[event.code];
      if (direction) { event.preventDefault(); move(...direction); }
      else if (event.code === "KeyE") { event.preventDefault(); gather(); }
      else if (event.code === "KeyB") { event.preventDefault(); build(); }
      else if (event.code === "KeyR") { event.preventDefault(); rest(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [move, gather, build, rest]);

  // All scenery and movement animation happen in one Canvas loop; React does not
  // render a JSX element for each terrain tile, tree, water block or frame.
  useEffect(() => {
    const canvas = surface.current;
    const avatar = actor.current;
    if (!canvas || !avatar) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let width = 800, height = 540;
    let last = 0;
    let dpr = 1;
    function resize() {
      if (!canvas) return;
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(300, bounds.width);
      height = Math.max(300, bounds.height);
      dpr = Math.min(window.devicePixelRatio || 1, width < 650 ? 1.25 : 1.65);
      const pixelWidth = Math.round(width * dpr), pixelHeight = Math.round(height * dpr);
      if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
      if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    }
    resize();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    if (observer) observer.observe(canvas);
    else window.addEventListener("resize", resize);
    function frame(now: number) {
      raf = window.requestAnimationFrame(frame);
      if (document.visibilityState === "hidden" || now - last < 1000 / MAX_FPS) return;
      const elapsed = Math.min(now - last || 33, 75);
      last = now;
      if (!ctx || !avatar) return;
      const goal = latest.current;
      // Frame-independent smoothing gives a sense of motion and camera weight.
      const follow = 1 - Math.exp(-elapsed / 85);
      const cameraFollow = 1 - Math.exp(-elapsed / 260);
      const player = playerAnimation.current, cam = camera.current;
      player.x += (goal.x - player.x) * follow;
      player.y += (goal.y - player.y) * follow;
      cam.x += (player.x - cam.x) * cameraFollow;
      cam.y += (player.y - cam.y) * cameraFollow;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawIsland(ctx, width, height, cam.x, cam.y, goal, now / 1000, effectsRef.current);
      const pos = isoPoint(player.x, player.y, cam.x, cam.y, width, height);
      const elevation = tileAt(goal.x, goal.y).elevation * 9;
      avatar.style.left = String(pos.x) + "px";
      avatar.style.top = String(pos.y - elevation + 6) + "px";
      avatar.style.setProperty("--wander", Math.abs(goal.x - player.x) + Math.abs(goal.y - player.y) > .06 ? "1" : "0");
    }
    raf = window.requestAnimationFrame(frame);
    return () => {
      window.cancelAnimationFrame(raf);
      observer?.disconnect();
      if (!observer) window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    const canvas = mini.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) drawMiniMap(ctx, canvas.width, canvas.height, world);
  }, [world]);

  useEffect(() => {
    if (!pickup) return;
    const timeout = window.setTimeout(() => setPickup(""), 1300);
    return () => window.clearTimeout(timeout);
  }, [pickup]);

  const interactWithMap = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0 || !surface.current) return;
    const bounds = surface.current.getBoundingClientRect();
    const pos = tileFromScreen(event.clientX - bounds.left, event.clientY - bounds.top,
      camera.current.x, camera.current.y, bounds.width, bounds.height);
    if (pos.x < 0 || pos.y < 0 || pos.x >= WORLD_SIZE || pos.y >= WORLD_SIZE) return;
    const worldNow = latest.current;
    const distance = Math.abs(pos.x - worldNow.x) + Math.abs(pos.y - worldNow.y);
    if (distance === 1) {
      if (!isBlocked(worldNow, pos.x, pos.y)) move(pos.x - worldNow.x, pos.y - worldNow.y);
      else gather(pos);
    } else if (distance === 0) gather(pos);
    else {
      setSelected(pos);
      const resource = resourceAt(pos.x, pos.y);
      setMessage(resource
        ? "Đã chọn " + RESOURCE_LABELS[resource].toLowerCase() + ". Hãy đến gần để thu thập."
        : "Bạn đã chọn một vị trí. Chạm ô bên cạnh hoặc dùng WASD để đi tới đó.");
    }
  };

  const next = PROJECTS[world.projects];
  const mayBuild = canBuild(world);
  const atCamp = Math.abs(world.x - HOME) + Math.abs(world.y - HOME) <= 3;
  const progress = Math.round(world.projects / PROJECTS.length * 100);
  return (
    <div className="survival-world">
      <header className="voxel-heading">
        <div>
          <span className="voxel-eyebrow"><Trees size={16}/> BUDDY SURVIVAL · THẾ GIỚI KHỐI 2.5D</span>
          <h1>Đảo Xanh: Thế giới khám phá</h1>
          <p>Đi giữa những cánh rừng, tìm hồ nước, thu thập vật liệu và dựng một ngôi làng thật sự cùng Buddy.</p>
        </div>
        <div className="voxel-heading-actions">
          <button className="voxel-small-button" type="button" onClick={() => setEffects((value) => !value)}
            aria-pressed={!effects}><VolumeX size={16}/>{effects ? "Giảm hiệu ứng" : "Hiệu ứng nhẹ"}</button>
          <button className="voxel-small-button" type="button" onClick={() => setShowHelp((value) => !value)}>
            <Compass size={16}/> Hướng dẫn
          </button>
        </div>
      </header>

      <div className="voxel-viewport" ref={viewport}>
        <canvas
          ref={surface}
          className="voxel-canvas"
          aria-label="Thế giới sinh tồn với địa hình, rừng, sông hồ, cây, đá và các công trình"
          onPointerDown={interactWithMap}
        />
        <div ref={actor} className="voxel-buddy" aria-hidden="true">
          <Companion kind={profile.companion} color={profile.color}
            accessory={profile.accessory} size={82} sprite paused />
        </div>
        <div className="voxel-world-brand"><Sparkles size={14}/> Đảo Xanh · World 01</div>

        <div className="voxel-top-hud">
          <div className="voxel-hud-chip">☀️ Ngày <b>{world.day}</b></div>
          <div className="voxel-hud-chip">🏡 Công trình <b>{world.projects}/{PROJECTS.length}</b></div>
          <div className="voxel-hud-chip voxel-energy">
            <Heart size={15}/><b>{world.energy}%</b>
            <span className="voxel-energy-track"><i style={{ width: String(world.energy) + "%" }}/></span>
          </div>
        </div>
        <div className="voxel-mini-map" aria-label="Bản đồ nhỏ của hòn đảo">
          <span><MapIcon size={14}/> BẢN ĐỒ</span>
          <canvas ref={mini} width={128} height={128} aria-label="Bản đồ nhỏ, chấm đỏ là Buddy" role="img"/>
        </div>
        <div className="voxel-viewport-bottom">
          <p className="voxel-notice" role="status">{message}</p>
          {pickup && <div className="voxel-pickup" role="status">{pickup}</div>}
          <div className="voxel-hotbar" aria-label="Túi đồ Buddy">
            {(Object.keys(RESOURCE_LABELS) as Resource[]).map((resource) => (
              <div key={resource} className="voxel-inventory-slot" title={RESOURCE_LABELS[resource]}>
                <span aria-hidden="true">{RESOURCE_ICONS[resource]}</span>
                <b>{world.supplies[resource]}</b>
              </div>
            ))}
            <button className="voxel-inventory-slot voxel-gather" type="button"
              onClick={() => gather()} title="Thu thập (E)">
              <Leaf size={25}/><small>E</small>
            </button>
          </div>
        </div>
        {showHelp && (
          <div className="voxel-help" role="dialog" aria-label="Hướng dẫn sinh tồn">
            <button className="voxel-help-close" type="button" aria-label="Đóng hướng dẫn" onClick={() => setShowHelp(false)}><X size={18}/></button>
            <h2>Đi vào thế giới của Buddy</h2>
            <p><strong>WASD / phím mũi tên:</strong> Di chuyển qua rừng và đồng cỏ.</p>
            <p><strong>E:</strong> Chặt cây, lấy đá, hái quả hoặc lấy nước khi đứng cạnh.</p>
            <p><strong>B:</strong> Xây công trình khi ở gần trại và đủ vật liệu.</p>
            <p><strong>R:</strong> Nghỉ để hồi sức. Nghỉ tại trại mở ngày mới.</p>
            <p><strong>Chạm bản đồ:</strong> Đi sang ô kề bên, chạm vật cản kề bên để thu thập.</p>
            <p>Tiến độ lưu tự động trên thiết bị. Không cần tài khoản.</p>
            <button className="voxel-action primary" onClick={() => setShowHelp(false)}>Bắt đầu khám phá</button>
          </div>
        )}
      </div>

      <div className="voxel-controls">
        <div className="voxel-dpad" aria-label="Điều khiển Buddy">
          <button style={{ gridArea: "up" }} aria-label="Đi lên" onClick={() => move(0,-1)}><ArrowUp/></button>
          <button style={{ gridArea: "left" }} aria-label="Đi trái" onClick={() => move(-1,0)}><ArrowLeft/></button>
          <button style={{ gridArea: "down" }} aria-label="Đi xuống" onClick={() => move(0,1)}><ArrowDown/></button>
          <button style={{ gridArea: "right" }} aria-label="Đi phải" onClick={() => move(1,0)}><ArrowRight/></button>
        </div>
        <div className="voxel-control-main">
          <div className="voxel-control-title"><span>🧭 Vị trí {world.x}, {world.y}</span><span><Save size={14}/> Tự lưu trên thiết bị</span></div>
          <div className="voxel-action-row">
            <button className="voxel-action primary" type="button" onClick={() => gather()}><Leaf size={17}/> Thu thập <kbd>E</kbd></button>
            <button className="voxel-action" type="button" onClick={rest}><BedDouble size={17}/> Nghỉ ngơi <kbd>R</kbd></button>
            <button className="voxel-action" type="button" onClick={build} disabled={!next}><Hammer size={17}/> Xây dựng <kbd>B</kbd></button>
          </div>
          <p className="voxel-control-tip">WASD hoặc phím mũi tên để di chuyển. Tìm cây, đá, quả và nước trên đảo, rồi xây làng quanh trại lửa.</p>
        </div>
      </div>

      <div className="voxel-quest" aria-label="Nhiệm vụ xây dựng">
        <div className="voxel-quest-icon" aria-hidden="true">🏗️</div>
        <div className="voxel-quest-content">
          <span className="voxel-quest-kicker">HÀNH TRÌNH XÂY LÀNG · {world.projects}/{PROJECTS.length}</span>
          <h2>{next ? next.name : "Ngôi làng đã hoàn thành!"}</h2>
          <p>{next ? next.hint : "Cả hòn đảo đã phát triển. Bạn có thể tiếp tục khám phá và thu thập."}</p>
          <div className="voxel-project-progress"><i style={{width:String(progress)+"%"}}/></div>
          {next && <div className="voxel-project-costs">{(Object.entries(next.costs) as [Resource,number][]).map(([kind,amount]) =>
            <span key={kind} className={world.supplies[kind] >= amount ? "enough" : ""}>
              {RESOURCE_ICONS[kind]} {world.supplies[kind]}/{amount}
            </span>)}</div>}
        </div>
        {next && <button className="voxel-action primary" disabled={!mayBuild} type="button" onClick={build}>
          <Hammer size={16}/>{!atCamp ? "Về trại để xây" : mayBuild ? "Xây ngay" : "Thiếu vật liệu"}
        </button>}
      </div>

      <footer className="voxel-footer">
        <span><Save size={15}/> Chỉ lưu trên máy · Tệp cũ được tự động nâng cấp</span>
        <span>{world.steps} bước · Chương {Math.min(PROJECTS.length,world.projects+1)}/{PROJECTS.length}</span>
        <div className="voxel-footer-actions">
          <Link to="/tap-trung">Trở lại tập trung</Link>
          <button type="button" onClick={() => {
            if (!window.confirm("Bắt đầu lại thế giới? Tiến độ sinh tồn đã lưu trên thiết bị sẽ bị thay thế.")) return;
            const fresh = initialWorld();
            update(fresh); storeWorld(fresh); camera.current = {x:fresh.x,y:fresh.y};
            playerAnimation.current = {x:fresh.x,y:fresh.y};
            setMessage("Thế giới mới đã bắt đầu. Chúc Buddy phiêu lưu vui!");
          }}><RotateCcw size={15}/> Chơi lại</button>
        </div>
      </footer>
    </div>
  );
}
