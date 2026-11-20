import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Check, Shirt, Compass, Music2, BookOpen, Footprints,
  Cookie,
  Heart,
  Hand,
  Gamepad2,
  Moon,
  Palette,
  Sparkles,
  Sun,
  WandSparkles,
} from "lucide-react";
import Companion from "./Companion";
import {
  ACCESSORIES,
  COLORS,
  COMPANIONS,
  SCENES,
  THEMES,
  type BuddyAccessory,
  type BuddyScene,
  type CompanionColor,
  type CompanionKind,
} from "../data";
import { buddyActivities } from "../games/club/catalog";
import {dress,useWardrobe,personalities, type Wardrobe} from "../buddy3/wardrobe";
import type {BuddyActivity} from "../buddy3/Layers";
import WardrobePanel from "../buddy3/WardrobePanel";
import "../buddy-studio.css";

export interface BuddyStudioProps {
  profile: {
    companion: CompanionKind;
    color: CompanionColor;
    total_xp?:number;
    buddy_name?: string;
    accessory?: string;
    scene?: string;
    theme?: string;
  };
  paused: boolean;
  onSave: (changes: Record<string, string>) => Promise<unknown>;
}
type Reaction = "idle" | "happy" | "love" | "snack" | "play" | "wave";
export default function BuddyStudio({
  profile,
  paused,
  onSave,
}: BuddyStudioProps) {
  const reduced = useReducedMotion();
  const [reaction, setReaction] = useState<Reaction>("idle");
  const [sleepy, setSleepy] = useState(false);
  const [name, setName] = useState(profile.buddy_name || "");
  const [previewStudy, setPreviewStudy] = useState(false);
  const [tab, setTab] = useState<"friends" | "style" | "closet" | "world">("friends");
  const {look}=useWardrobe();
  const [pose,setPose]=useState<BuddyActivity>("idle"),[playMenu,setPlayMenu]=useState(false);
  const [positioning,setPositioning]=useState(false),[dragDraft,setDragDraft]=useState<{x:number;y:number}|null>(null);
  const drag=useRef<{id:number;clientX:number;clientY:number;x:number;y:number;ratio:number}|null>(null);
  const clicks=useRef(0);
  const movingAccessory=positioning&&tab==="closet"&&!paused;
  function stopPositioning(){drag.current=null;setDragDraft(null);setPositioning(false);}
  function updateDrag(clientX:number,clientY:number){
    const d=drag.current;
    if(!d)return null;
    const clamp=(v:number)=>Math.max(-22,Math.min(22,Math.round(v)));
    return {x:clamp(d.x+(clientX-d.clientX)*d.ratio),y:clamp(d.y+(clientY-d.clientY)*d.ratio)};
  }
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const selected =
    COMPANIONS.find((friend) => friend.id === profile.companion) ||
    COMPANIONS[0];
  const displayName = profile.buddy_name || selected.name;
  const scene = (
    SCENES.some((s) => s.id === profile.scene) ? profile.scene : "garden"
  ) as BuddyScene;
  const accessory = (
    ACCESSORIES.some((a) => a.id === profile.accessory)
      ? profile.accessory
      : "none"
  ) as BuddyAccessory;
  const still = paused || !!reduced;
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => setName(profile.buddy_name || ""), [profile.buddy_name]);
  useEffect(() => {
    if (paused) {
      clearTimeout(timer.current);
      setReaction("idle");setPlayMenu(false);setPose("idle");stopPositioning();
    }
  }, [paused]);
  const save = async (changes: Record<string, string>) => {
    setSaving(true);
    setNotice("");
    try {
      await onSave(changes);
      setNotice("Đã lưu vào góc nhỏ của bạn.");
      return true;
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Chưa lưu được. Bạn thử lại nhé.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  };
  const interact = (next: Reaction,action:BuddyActivity="idle") => {
    if (paused) return;
    clearTimeout(timer.current);
    setSleepy(false);setPose(action);
    setReaction(next);
    timer.current = setTimeout(() => {setReaction("idle");setPose("idle");}, 4200);
  };
  useEffect(()=>{
    if(still||sleepy||reaction!=="idle"||pose!=="idle"||look.motion==="still"||movingAccessory)return;
    const patterns:Record<Wardrobe["personality"],BuddyActivity[]>={calm:["relaxed","studying"],playful:["walking","curious"],sunny:["waving","dancing"],curious:["curious","studying"],coach:["stretching","waving"]};

    const idle=setTimeout(()=>{
      if(document.visibilityState==="hidden"||["off","minimal"].includes(document.documentElement.dataset.motion??""))return;
      const variants=patterns[look.personality];
      setPose(variants[Math.floor(Math.random()*variants.length)]);
    },26000+Math.random()*14000);
    return ()=>{clearTimeout(idle);};
  },[still,sleepy,reaction,pose,look.personality,look.motion,movingAccessory]);
  useEffect(()=>{
    if(pose==="idle"||reaction!=="idle")return;
    const reset=setTimeout(()=>setPose("idle"),3300);
    return ()=>clearTimeout(reset);
  },[pose,reaction]);
  const greeting={calm:"Mình ngồi đây với bạn. Bắt đầu bằng một việc nhỏ nhé.",playful:"Chạm vào mình nhé, mình đang đợi bạn đó!",sunny:"Thấy bạn rồi! Hôm nay mình cùng khám phá nhé.",curious:"Hôm nay bạn muốn tìm hiểu điều gì?",coach:"Chọn một mục tiêu vừa sức. Mình sẽ đi cùng bạn."}[look.personality];
  const poseLine=({dancing:"Một, hai, ba… cùng nhún chân nào!",walking:"Đi vài bước cho giãn chân nhé.",studying:look.studyTool==="book"?"Mình tìm thấy một đoạn sách rất hay.":"Cùng xem lại những gì mình vừa học nhé.",surprised:"Ồ, bạn ở đây từ lúc nào thế?",curious:"Bạn mang theo điều gì thú vị vậy?",celebrating:"Hoan hô! Vỗ tay cùng mình nào.",waking:"Chào bạn, mình tỉnh rồi đây!"} as Partial<Record<BuddyActivity,string>>)[pose];
  const bubble = paused
    ? "Mình sẽ ngồi yên ở đây cùng bạn tập trung."
    : sleepy
      ? "Ngủ một chút, mơ thật nhiều…"
      : reaction === "wave"
        ? "Chào bạn! Mình sẵn sàng học cùng bạn rồi."
        : reaction === "love"
          ? "Một cái ôm cho bạn, một cái ôm cho mình!"
          : reaction === "snack"
            ? "Ngon quá! Mình nạp đầy năng lượng rồi."
            : reaction === "play"
              ? "Bắt được rồi! Đến lượt bạn nè."
              : reaction === "happy"
                ? "Hôm nay được ở bên bạn, vui thật đấy!"
                : poseLine || greeting;
  return (
    <div className={`buddy-studio ${still ? "studio-still" : ""}`}>
      <header className="studio-heading">
        <div>
          <h1>Gặp bạn đồng hành của bạn</h1>
          <p>
            Chọn một người bạn, thêm chút sắc màu và tạo nên góc nhỏ của riêng
            mình.
          </p>
        </div>
        <Link className="studio-games-link" to="/tro-choi">
          <Gamepad2 size={18} />
          Mở bàn trò chơi
        </Link>
      </header>
      <div className="studio-layout">
        <section
          className={`buddy-room room-${scene}`}
          aria-label={`Không gian ${SCENES.find((s) => s.id === scene)?.name}`}
        >
          <div className="room-top">
            <span>
              <span className="room-status-dot" />
              {paused
                ? "Đang cùng bạn tập trung"
                : sleepy
                  ? "Một giấc mơ nhỏ"
                  : "Một ngày thật dễ thương"}
            </span>
            <button
              className="room-sleep"
              aria-label={sleepy ? "Đánh thức nhẹ nhàng" : "Nghỉ ngơi một chút"}
              onClick={() => {
                clearTimeout(timer.current);setPose(sleepy?"waking":"sleeping");setSleepy((v) => !v);
                setReaction("idle");
              }}
              disabled={paused}
            >
              {sleepy ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
          <div className="room-landscape" aria-hidden="true">
            <span className="room-sun" />
            <div className="room-canopy canopy-left">
              <i />
              <i />
              <i />
            </div>
            <div className="room-canopy canopy-right">
              <i />
              <i />
              <i />
            </div>
            <div className="room-grass">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <span className="room-cloud cloud-one" />
            <span className="room-cloud cloud-two" />
            <span className="room-hill hill-one" />
            <span className="room-hill hill-two" />
            <span className="room-spark spark-one">✦</span>
            <span className="room-spark spark-two">✧</span>
            <span className="room-spark spark-three">✦</span>
            <span className="room-flower flower-one">✿</span>
            <span className="room-flower flower-two">✿</span>
          </div>
          <div className="buddy-bubble" role="status">
            <AnimatePresence mode="wait">
              <motion.span
                key={bubble}
                initial={still ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={still ? undefined : { opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {bubble}
              </motion.span>
            </AnimatePresence>
          </div>
          <button
            className={`studio-character ${movingAccessory?"position-accessory":""}`}
            onPointerDown={e=>{if(!movingAccessory||e.button!==0)return;const rect=e.currentTarget.querySelector("svg")?.getBoundingClientRect();if(!rect)return;
              e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);drag.current={id:e.pointerId,clientX:e.clientX,clientY:e.clientY,x:look.x,y:look.y,ratio:1/Math.min(rect.width/320,rect.height/300)};}}
            onPointerMove={e=>{if(drag.current?.id===e.pointerId)setDragDraft(updateDrag(e.clientX,e.clientY));}}
            onPointerUp={e=>{if(drag.current?.id!==e.pointerId)return;const patch=updateDrag(e.clientX,e.clientY);drag.current=null;setDragDraft(null);if(patch)dress(patch);}}
            onPointerCancel={()=>{drag.current=null;setDragDraft(null);}}
            aria-label={movingAccessory?"Kéo để đặt vị trí phụ kiện":`Vuốt ve ${displayName}`}
            onClick={() => {if(movingAccessory)return;const choices:BuddyActivity[]=["excited","surprised","curious","celebrating"];const next=choices[clicks.current++%choices.length];interact(next==="excited"?"happy":"idle",next);}}
            disabled={paused}
          >
            <Companion
              kind={profile.companion}
              color={profile.color}
              accessory={accessory}
              reaction={reaction}
              activity={paused || (tab==="closet" && previewStudy)?"studying":sleepy?"sleeping":pose} night={scene==="space"} offset={dragDraft??undefined}
              paused={paused}
              sleepy={sleepy && !(tab==="closet" && previewStudy)}
              size={340}
            />
          </button>
          <div className="room-name">
            <h2>{displayName}</h2>
            <p>{selected.description}</p>
          </div>
          <div className="buddy-interactions">
            <button disabled={paused} onClick={() => interact("wave","waving")}>
              <Hand size={18} />
              <span>Vẫy tay</span>
            </button>
            <button disabled={paused} onClick={() => interact("love")}>
              <Heart size={18} />
              <span>Ôm một cái</span>
            </button>
            <button disabled={paused} onClick={() => interact("snack")}>
              <Cookie size={18} />
              <span>Mời bánh</span>
            </button>
            <button disabled={paused} aria-expanded={playMenu} aria-controls="buddy-play-choices" onClick={() => {setPlayMenu(!playMenu);interact("play","jumping");}}>
              <Sparkles size={18} />
              <span>Chơi cùng</span>
            </button>
          </div>
          {playMenu&&!paused&&<div className="buddy-play-choices" id="buddy-play-choices">
            <h3>Chơi với {displayName}</h3>
            <div className="buddy-pose-choices"><button onClick={()=>interact("idle","dancing")}><Music2 size={15}/>Nhảy múa</button><button onClick={()=>interact("idle","walking")}><Footprints size={15}/>Đi dạo</button><button onClick={()=>interact("idle","studying")}><BookOpen size={15}/>{look.studyTool==="book"?"Đọc sách":"Cùng học"}</button></div>
            <div className="buddy-activity-links">{buddyActivities.map(g=><Link key={g.slug} to={`/tro-choi/${g.slug}`}>{g.title}</Link>)}</div>
          </div>}
          {paused && (
            <p className="studio-pause-note">
              Bạn nhỏ đang ngồi yên trong phiên tập trung.
            </p>
          )}
        </section>
        <section
          className="studio-customize"
          aria-label="Tùy chỉnh bạn đồng hành"
        >
          <div
            className="studio-tabs"
            role="tablist"
            aria-label="Các kiểu tùy chỉnh"
          >
            {(
              [
                { id: "friends", name: "Bạn nhỏ", icon: Heart },
                { id: "style", name: "Phong cách", icon: Palette },
                { id: "closet", name:"Tủ đồ", icon:Shirt },
                { id: "world", name: "Không gian", icon: WandSparkles },
              ] as const
            ).map(({ id, name, icon: Icon }) => (
              <button
                type="button"
                key={id}
                id={`studio-tab-${id}`}
                role="tab"
                tabIndex={tab === id ? 0 : -1}
                onKeyDown={(event) => {
                  const ids = ["friends", "style", "closet", "world"] as const;
                  const index = ids.indexOf(id);
                  let next: number | undefined;
                  if (event.key === "ArrowRight")
                    next = (index + 1) % ids.length;
                  else if (event.key === "ArrowLeft")
                    next = (index + ids.length - 1) % ids.length;
                  else if (event.key === "Home") next = 0;
                  else if (event.key === "End") next = ids.length - 1;
                  if (next !== undefined) {
                    event.preventDefault();
                    stopPositioning();setTab(ids[next]);
                    document.getElementById(`studio-tab-${ids[next]}`)?.focus();
                  }
                }}
                aria-selected={tab === id}
                aria-controls={`studio-panel-${id}`}
                onClick={() => {stopPositioning();setTab(id);}}
                className={tab === id ? "active" : ""}
              >
                <Icon size={16} />
                {name}
              </button>
            ))}
          </div>
          <div
            className="studio-panel"
            role="tabpanel"
            id={`studio-panel-${tab}`}
            aria-labelledby={`studio-tab-${tab}`}
          >
            {tab === "friends" && (
              <>
                <div className="studio-panel-title">
                  <h2>Bạn muốn đồng hành cùng ai?</h2>
                  <p>Mỗi bạn nhỏ có một nét đáng yêu riêng.</p>
                </div>
                <div className="studio-friends">
                  {COMPANIONS.map((friend) => (
                    <button
                      key={friend.id}
                      disabled={saving}
                      aria-pressed={profile.companion === friend.id}
                      onClick={() => void save({ companion: friend.id })}
                      className={`studio-friend ${profile.companion === friend.id ? "chosen" : ""}`}
                    >
                      <Companion
                        kind={friend.id}
                        color={profile.color}
                        paused
                        size={90}
                      />
                      <strong>{friend.name}</strong>
                      {profile.companion === friend.id && (
                        <span className="studio-check">
                          <Check size={12} />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <label className="wardrobe-field buddy-personality"><span><Compass size={15}/>Tính cách bạn đồng hành</span><select value={look.personality} onChange={e=>dress({personality:e.target.value as Wardrobe["personality"]})}>{Object.entries(personalities).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
                <form
                  className="buddy-name-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void save({ buddy_name: name.trim() });
                  }}
                >
                  <label htmlFor="buddy-name">Đặt một cái tên thật riêng</label>
                  <div>
                    <input
                      id="buddy-name"
                      maxLength={24}
                      placeholder={selected.name}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <button disabled={saving} type="submit">
                      Lưu tên
                    </button>
                  </div>
                  <small>Để trống để dùng tên mặc định của bạn nhỏ.</small>
                </form>
              </>
            )}
            {tab === "style" && (
              <>
                <div className="studio-panel-title">
                  <h2>Một chút màu, một chút cá tính</h2>
                  <p>Thử chiếc khăn mới và một món phụ kiện nhé.</p>
                </div>
                <h3 className="studio-label">MÀU CHIẾC KHĂN</h3>
                <div className="studio-swatches">
                  {COLORS.map((color) => (
                    <button
                      key={color.id}
                      disabled={saving}
                      aria-pressed={profile.color === color.id}
                      onClick={() => void save({ color: color.id })}
                    >
                      <span style={{ background: color.hex }}>
                        {profile.color === color.id && <Check size={20} />}
                      </span>
                      <strong>{color.name}</strong>
                    </button>
                  ))}
                </div>
                <h3 className="studio-label">PHỤ KIỆN XINH XẮN</h3>
                <div className="studio-accessories">
                  {ACCESSORIES.map((item) => (
                    <button
                      key={item.id}
                      disabled={saving}
                      aria-pressed={accessory === item.id}
                      className={accessory === item.id ? "chosen" : ""}
                      onClick={async() => {if(!await save({ accessory:item.id }))return; if(["beret","bow","sprout","crown"].includes(item.id))dress({hat:"none"});else if(item.id==="glasses")dress({glasses:"none"});else if(item.id==="satchel")dress({bag:"none"});}}
                    >
                      <span aria-hidden="true">{item.symbol}</span>
                      <strong>{item.name}</strong>
                      {accessory === item.id && <Check size={13} />}
                    </button>
                  ))}
                </div>
              </>
            )}
            {tab==="closet"&&<WardrobePanel previewStudy={previewStudy} setPreviewStudy={show=>{setPreviewStudy(show);if(show)setSleepy(false);}} base={{companion:profile.companion,color:profile.color,accessory}} xp={profile.total_xp??0} busy={saving} restoreBase={base=>save({...base})} positioning={positioning} togglePosition={()=>setPositioning(v=>!v)}/>}
            {tab === "world" && (
              <>
                <div className="studio-panel-title">
                  <h2>Hôm nay mình đi đâu?</h2>
                  <p>Một khung cảnh mới cho những ý tưởng mới.</p>
                </div>
                <h3 className="studio-label">Chủ đề ứng dụng</h3>
                <div className="theme-choices">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      disabled={saving}
                      aria-pressed={profile.theme === theme.id}
                      onClick={() => void save({ theme: theme.id })}
                    >
                      <span className="theme-strip" aria-hidden="true">
                        {theme.tones.map((color) => (
                          <i key={color} style={{ backgroundColor: color }} />
                        ))}
                      </span>
                      {theme.name}
                    </button>
                  ))}
                </div>
                <h3 className="studio-label">Phông nền của bạn nhỏ</h3>
                <div className="studio-scenes">
                  {SCENES.map((item) => (
                    <button
                      key={item.id}
                      disabled={saving}
                      aria-pressed={scene === item.id}
                      className={`scene-choice scene-${item.id} ${scene === item.id ? "chosen" : ""}`}
                      onClick={() => void save({ scene: item.id })}
                    >
                      <span className="scene-mini" aria-hidden="true">
                        <i />
                        <b />
                        {item.id === "space"
                          ? "✦"
                          : item.id === "garden"
                            ? "✿"
                            : "☀"}
                      </span>
                      <span>
                        <strong>{item.name}</strong>
                        <small>{item.description}</small>
                      </span>
                      {scene === item.id && <Check size={18} />}
                    </button>
                  ))}
                </div>
                <div className="studio-gentle-note">
                  <Moon size={21} />
                  <p>
                    Muốn yên tĩnh một chút? Chạm vào mặt trăng trong khung cảnh
                    để cho bạn nhỏ nghỉ ngơi.
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="studio-save-note" role="status">
            {saving
              ? "Đang lưu lựa chọn…"
              : notice || "Lựa chọn được lưu trên thiết bị này."}
          </div>
        </section>
      </div>
      <div className="studio-bottom-note">
        <Heart size={15} />
        <p>
          Tất cả bạn nhỏ đều sẵn sàng đồng hành từ hôm nay.
        </p>
      </div>
    </div>
  );
}
