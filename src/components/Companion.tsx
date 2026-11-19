import { useId, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { BuddyAccessory, CompanionColor, CompanionKind } from "../data";

import { useWardrobe, bodies } from "../buddy3/wardrobe";
import { Garment, Headwear, Finishing, StudyBook, Glints, type BuddyActivity } from "../buddy3/Layers";
import "../buddy3/character.css";

const trackMotion=(notify:()=>void)=>{window.addEventListener("focus-buddy-appearance",notify);return ()=>window.removeEventListener("focus-buddy-appearance",notify);};
export interface CompanionProps {
  kind: CompanionKind;
  color: CompanionColor;
  paused?: boolean;
  sleepy?: boolean;
  size?: number;
  className?: string;
  sprite?: boolean;
  activity?: BuddyActivity;
  offset?:{x:number;y:number};
  night?: boolean;
  accessory?: BuddyAccessory;
  reaction?: "idle" | "happy" | "love" | "snack" | "play" | "wave";
}

const accents = {
  mint: { light: "#C5DFC9", dark: "#79A88B", glow: "#E8F0E5" },
  lavender: { light: "#D5C8E7", dark: "#9E86BE", glow: "#F0EBF6" },
  peach: { light: "#F6C8B5", dark: "#D79079", glow: "#FCF0E8" },
  sky: { light: "#C3E0F5", dark: "#77A8D0", glow: "#EAF3FB" },
  sunshine: { light: "#F4E1A0", dark: "#C8A14C", glow: "#FBF5DE" },
  rose: { light: "#F3CDD9", dark: "#C87CA2", glow: "#FBEDF4" },
};

const names = {
  fox: "Cáo Mây",
  owl: "Cú Mơ",
  cat: "Mèo Mít",
  rabbit: "Thỏ Bông",
  panda: "Gấu Trúc",
  dragon: "Rồng Đậu",
  axolotl: "Kỳ giông Đào",
  penguin: "Cánh Cụt Băng",
};

/** Nhân vật SVG gốc; không tải ảnh hoặc dịch vụ hoạt ảnh bên ngoài. */
export default function Companion({
  kind,
  color,
  paused = false,
  sleepy = false,
  size = 300,
  className,
  sprite = false,
  accessory = "none",
  reaction = "idle",
  activity = "idle", night = false, offset,
}: CompanionProps) {
  const uid = useId().replace(/:/g, "");
  const reduceMotion = useReducedMotion();
  const {look:storedLook}=useWardrobe();
  const look=offset?{...storedLook,...offset}:storedLook;
  const intensity=useSyncExternalStore(trackMotion,()=>document.documentElement.dataset.motion??"normal",()=>"normal");
  const pose=sleepy?"sleeping":activity==="study"?"studying":activity==="stretch"?"stretching":activity==="celebrate"?"celebrating":activity;
  const animate=!sprite&&!paused&&!reduceMotion&&look.motion!=="still"&&intensity!=="off"&&intensity!=="minimal";
  const face=pose==="sleeping"?"sleepy":reaction==="love"||reaction==="happy"?"happy":pose==="idle"?look.face:pose;
  const leap=pose==="jumping"||pose==="celebrating"||reaction==="play";
  const dancing=pose==="dancing"||pose==="celebrating";
  const waving=pose==="waving"||pose==="waking"||reaction==="wave";
  const eyesClosed=face==="sleepy"||face==="happy"||face==="relaxed"||look.eyes==="crescent";
  const primaryHat=["beret","bow","sprout","crown"].includes(accessory);
  const showAccessory=!(primaryHat&&look.hat!=="none" || accessory==="glasses"&&look.glasses!=="none" || accessory==="satchel"&&look.bag!=="none");
  const hasBody=look.body!=="original";
  const accent = accents[color];
  const bodyColors = bodies[look.body].shades ?? {
    fox: ["#f7c48b", "#cb8455"],
    owl: ["#C9B69B", "#A99072"],
    cat: ["#DACFC3", "#BCAE9E"],
    rabbit: ["#FFF4E9", "#EEDFD9"],
    panda: ["#65746B", "#44534D"],
    dragon: ["#B7DDC0", "#76A591"],
    axolotl: ["#ffded1", "#db939a"],
    penguin: ["#83aebe", "#3c6476"],
  }[kind];
  const bodyId = `companion-body-${uid}`;
  const blushId = `companion-blush-${uid}`;
  const scarfId = `companion-scarf-${uid}`;
  const titleId = `companion-title-${uid}`;

  const renderFace = ({
    eyeY = 139,
    eyeX = 31,
  }: { eyeY?: number; eyeX?: number } = {}) => (
    <g>
      <ellipse
        cx={160 - eyeX - 12}
        cy={eyeY + 19}
        rx="14"
        ry="8"
        fill={`url(#${blushId})`}
      />
      <ellipse
        cx={160 + eyeX + 12}
        cy={eyeY + 19}
        rx="14"
        ry="8"
        fill={`url(#${blushId})`}
      />
      <g
        fill="none"
        stroke="#995f51"
        opacity=".48"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        <path
          d={`M${145 - eyeX} ${eyeY + 21}l2-4m2 5 2-4m${2 * eyeX + 15} 3 2-4m2 5 2-4`}
        />
      </g>
      <g className="buddy-face-detail">
        {look.texture==="freckles"&&[0,1,2,3,4,5].map(i=><g key={i} fill={bodyColors[1]}>{[-1,1].map(k=><circle key={k} cx={160+k*(eyeX+6+i%3*4)} cy={eyeY+14+Math.floor(i/3)*4} r="1.65"/>)}</g>)}
        {look.texture==="stitch"&&<path d={`M115 ${eyeY+16}q6 10 18 14m54 0q12-3 18-14`} fill="none" stroke={bodyColors[1]} strokeWidth="2.2" strokeDasharray="3 3"/>}
        {eyesClosed?<g fill="none" stroke="#574447" strokeWidth="4" strokeLinecap="round">{[-1,1].map(k=><path key={k} d={`M${150+k*eyeX} ${eyeY+1}q10 ${face==="happy"?-12:10} 20 0`}/>)}</g>:<motion.g
          animate={animate?{scaleY:[1,1,.09,1,1]}:{scaleY:1}}
          transition={{duration:5.1,times:[0,.69,.71,.735,1],repeat:animate?Infinity:0}}
          style={{originX:"160px",originY:`${eyeY}px`}}>
          {[-1,1].map(k=>{
            const x=160+k*eyeX+(face==="curious"?3:0),y=eyeY+(face==="studying"?4:0)+(face==="curious"&&k===1?-2:0);
            if(k===1&&waving)return <path key={k} d={`M${x-9} ${y+1}q9-10 18 0`} fill="none" stroke="#574447" strokeWidth="3.5" strokeLinecap="round"/>;
            const large=face==="surprised"||face==="excited"||face==="celebrating";
            return <g key={k}>
              <ellipse cx={x} cy={y} rx={large?12:10} ry={large?15:12} fill={`url(#iris-${uid})`}/>
              {look.eyes==="button"?<path d={`m${x-4} ${y-4} 8 8m-8 0 8-8`} stroke="#e8c5a4" strokeWidth="1.8"/>:
              <><path d={`M${x-6} ${y+5}q5 8 12-1`} fill="none" stroke="#c09a76" strokeWidth="2.1"/>
              {look.eyes==="star"||face==="excited"||face==="celebrating"?<path d={`m${x-2} ${y-10} 2 4 4 1-4 2-1 4-2-4-4-2 4-1Z`} fill="#fff5de"/>:<ellipse cx={x-3} cy={y-5} rx="3.5" ry="3" fill="#fff5e6"/>}
              <circle cx={x+4} cy={y+2} r="1.4" fill="#fff8e8"/></>}
            </g>;
          })}
        </motion.g>}
        {(face==="surprised"||face==="curious")&&<path d={`M${151-eyeX} ${eyeY-17}q8-7 15-3m${2*eyeX-14} -2q8-7 15-2`} stroke="#81685e" strokeWidth="2.7" fill="none" strokeLinecap="round"/>}
      </g>
      {face==="surprised"||face==="excited"?<ellipse cx="160" cy={eyeY+25} rx="5.5" ry={face==="surprised"?7:4} fill="#845c58"/>:kind === "axolotl" ? (
        <g fill="#976465">
          <circle cx="153" cy="153" r="1.4" />
          <circle cx="167" cy="153" r="1.4" />
          <path
            d="M148 160q12 12 24 0"
            fill="none"
            stroke="#976465"
            strokeWidth="2.7"
            strokeLinecap="round"
          />
        </g>
      ) : kind === "owl" || kind === "penguin" ? (
        <path
          d={`M152 ${eyeY + 17} Q160 ${eyeY + 12} 168 ${eyeY + 17} L160 ${eyeY + 28}Z`}
          fill="#DFA46F"
        />
      ) : (
        <>
          <path
            d={`M155 ${eyeY + 18} Q160 ${eyeY + 15} 165 ${eyeY + 18} Q164 ${eyeY + 24} 160 ${eyeY + 24} Q156 ${eyeY + 23} 155 ${eyeY + 18}`}
            fill="#655044"
          />
          <path
            d={`M160 ${eyeY + 24} v4 m-8 0 q4 7 8 0 q4 7 8 0`}
            fill="none"
            stroke="#655044"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
    </g>
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox={sprite ? "42 -5 236 270" : "0 0 320 300"}
      className={`companion-art ${className || ""} ${animate ? "buddy-moving" : ""} reaction-${reaction}`}
      data-pose={pose} data-expression={face} data-effect={look.effect} data-eye={look.eyes} data-body={look.body}
      role="img"
      aria-labelledby={titleId}
      style={{ maxWidth: "100%", overflow: "visible" }}
    >
      <title id={titleId}>
        {names[kind]}
        {sprite
          ? " đang phiêu lưu"
          : sleepy
            ? " đang nghỉ ngơi"
            : paused
              ? " cùng bạn tập trung"
              : " đang đồng hành cùng bạn"}
      </title>
      <defs>
        <linearGradient id={`iris-${uid}`} x2=".2" y2="1"><stop stopColor="#302d39"/><stop offset=".62" stopColor="#554146"/><stop offset="1" stopColor="#896a56"/></linearGradient>
        <radialGradient id={bodyId} cx="36%" cy="23%" r="85%">
          <stop stopColor={bodyColors[0]} />
          <stop offset=".52" stopColor={bodyColors[0]} />
          <stop offset="1" stopColor={bodyColors[1]} />
        </radialGradient>
        <radialGradient id={blushId}>
          <stop stopColor="#e59a94" stopOpacity=".88" />
          <stop offset=".62" stopColor="#efaea1" stopOpacity=".64" />
          <stop offset="1" stopColor="#efa996" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={scarfId} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={accent.light} />
          <stop offset="1" stopColor={accent.dark} />
        </linearGradient>
      </defs>
      {!sprite && (
        <>
          <circle
            className="buddy-halo"
            cx="160"
            cy="147"
            r="113"
            fill={accent.glow}
          />
          <circle
            className="buddy-halo"
            cx="160"
            cy="147"
            r="106"
            fill="none"
            stroke={accent.dark}
            strokeWidth="1.2"
            strokeDasharray="2 7"
            opacity=".42"
          />
          <circle cx="81" cy="214" r="17" fill={accent.glow} />
          <circle cx="245" cy="65" r="9" fill={accent.glow} />
          <motion.ellipse
            cx="160"
            cy="268"
            rx="64"
            ry="9"
            fill="#766A52"
            opacity=".1"
            animate={
              animate
                ? { scaleX: [1, 0.88, 1], opacity: [0.1, 0.07, 0.1] }
                : { scaleX: 1, opacity: 0.1 }
            }
            transition={{
              duration: 4,
              repeat: animate ? Infinity : 0,
              ease: "easeInOut",
            }}
          />
        </>
      )}
      <motion.g
        animate={
          animate
            ? {
                y: leap ? [0,-26,0,-13,0] : dancing ? [0,-5,0,-8,0] : [0,pose==="studying"||pose==="sleeping"?-1:-4,0],
                x: pose==="walking"?[-6,2,7,-2,-6]:[0,0,0],
                scaleY: pose==="stretching"?[1,1.065,1]:[1,1.012,1],
                rotate:dancing?[-5,6,-5,6,-5]:pose==="curious"?[0,7,7,0]:[0,-1,0],
              }
            : { y: 0, rotate: 0 }
        }
        transition={{
          duration:dancing?1.45:leap?2:look.motion==="lively"||pose==="walking"?2.15:4.6,
          repeat: animate ? Infinity : 0,
          ease: "easeInOut",
        }}
        style={{ originX: "160px", originY: "230px" }}
      >
        {kind === "fox" && (
          <>
            <g className="plush-tail">
              {" "}
              <path
                d="M214 241 C273 247 290 184 250 157 C262 191 225 193 205 214Z"
                fill={`url(#${bodyId})`}
              />
              <path
                d="M250 157 C270 171 277 192 267 214 C252 216 238 207 235 195 C250 188 256 174 250 157Z"
                fill="#FFF1DA"
              />
              <path
                d="M231 227q19-6 24-19"
                stroke="#a76d48"
                opacity=".46"
                strokeWidth="1.7"
                fill="none"
                strokeDasharray="3 4"
                strokeLinecap="round"
              />
            </g>
            <ellipse
              cx="160"
              cy="213"
              rx="50"
              ry="48"
              fill={`url(#${bodyId})`}
            />
            <ellipse cx="160" cy="218" rx="31" ry="33" fill="#FFF1DA" />
            <path
              d="M119 108 C99 92 96 57 99 40 C122 43 144 61 150 82Z"
              fill={`url(#${bodyId})`}
            />
            <path
              d="M201 108 C221 92 224 57 221 40 C198 43 176 61 170 82Z"
              fill={`url(#${bodyId})`}
            />
            <path
              d="M116 89 C107 76 106 62 107 54 C122 61 131 72 134 84Z"
              fill="#B87258"
            />
            <path
              d="M204 89 C213 76 214 62 213 54 C198 61 189 72 186 84Z"
              fill="#B87258"
            />
            <path
              d="M87 131 C87 94 116 76 160 78 C204 76 233 94 233 131 C233 177 201 192 160 192 C119 192 87 177 87 131Z"
              fill={`url(#${bodyId})`}
            />
            <path
              d="M87 135 C108 132 133 141 160 164 C187 141 212 132 233 135 C231 176 198 192 160 192 C122 192 89 176 87 135Z"
              fill="#FFF1DA"
            />
            <path d="M145 81 Q152 67 163 75 Q168 68 179 79" fill="#EDBD8D" />
            <g
              fill="none"
              stroke="#a76745"
              strokeWidth="2.3"
              strokeLinecap="round"
              opacity=".65"
            >
              <path d="M122 119q5-4 10-3m54 0q6-1 11 3" />
            </g>
            <g fill="#ba7550" opacity=".65">
              <circle cx="110" cy="153" r="1.8" />
              <circle cx="116" cy="155" r="1.3" />
              <circle cx="210" cy="153" r="1.8" />
              <circle cx="204" cy="155" r="1.3" />
            </g>
            {renderFace()}
          </>
        )}
        {kind === "owl" && (
          <>
            <ellipse
              cx="160"
              cy="200"
              rx="62"
              ry="61"
              fill={`url(#${bodyId})`}
            />
            <ellipse cx="160" cy="207" rx="39" ry="43" fill="#F6EBD9" />
            <path
              d="M111 178 C80 182 82 224 109 237 C103 215 117 202 111 178Z"
              fill="#A99072"
            />
            <path
              d="M209 178 C240 182 238 224 211 237 C217 215 203 202 209 178Z"
              fill="#A99072"
            />
            <path
              d="M97 110 L96 63 Q124 65 141 83 Q160 77 179 83 Q196 65 224 63 L223 110 C246 156 213 192 160 194 C107 192 74 156 97 110Z"
              fill={`url(#${bodyId})`}
            />
            <path
              d="M160 115 C126 84 94 107 100 140 C102 171 134 180 160 173 C186 180 218 171 220 140 C226 107 194 84 160 115Z"
              fill="#F8EFDF"
            />
            <path
              d="M146 201 l4 5 4-5 m12 0 l4 5 4-5 m-20 17 4 5 4-5"
              fill="none"
              stroke="#C5B297"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {renderFace({ eyeY: 137, eyeX: 29 })}
          </>
        )}
        {kind === "cat" && (
          <>
            <path
              d="M204 242 C262 253 271 203 248 196"
              fill="none"
              stroke="#BCAE9E"
              strokeWidth="20"
              strokeLinecap="round"
            />
            <path
              d="M253 232 l-8-7 m12-8-10-2"
              fill="none"
              stroke="#9F8F7E"
              strokeWidth="8"
            />
            <ellipse
              cx="160"
              cy="213"
              rx="49"
              ry="48"
              fill={`url(#${bodyId})`}
            />
            <ellipse cx="160" cy="218" rx="30" ry="32" fill="#F6F0E4" />
            <path
              d="M100 111 L102 53 Q122 55 144 81 Q160 78 177 81 Q197 55 218 53 L220 111 C243 155 218 191 160 193 C102 191 77 155 100 111Z"
              fill={`url(#${bodyId})`}
            />
            <path
              d="M112 91 L113 68 L134 85Z M186 85 L207 68 L208 91Z"
              fill="#D9AA9E"
            />
            <path
              d="M149 83 L151 99 M171 83 L169 99"
              fill="none"
              stroke="#AC9C89"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <ellipse cx="160" cy="162" rx="26" ry="20" fill="#F6F0E4" />
            <path
              d="M103 151 l-22-4 m23 13-21 3 m134-12 22-4 m-23 13 21 3"
              fill="none"
              stroke="#9C8A79"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {renderFace()}
          </>
        )}
        {kind === "rabbit" && (
          <>
            <ellipse cx="160" cy="216" rx="49" ry="44" fill={hasBody?bodyColors[0]:"#EEDFD9"} />
            <ellipse cx="238" cy="221" rx="20" ry="20" fill="#FFF7EF" />
            <ellipse
              cx="126"
              cy="73"
              rx="20"
              ry="62"
              fill={hasBody?bodyColors[0]:"#EFE1DA"}
              transform="rotate(-12 126 73)"
            />
            <ellipse
              cx="194"
              cy="73"
              rx="20"
              ry="62"
              fill={hasBody?bodyColors[0]:"#EFE1DA"}
              transform="rotate(12 194 73)"
            />
            <ellipse
              cx="126"
              cy="66"
              rx="10"
              ry="42"
              fill="#E8B7BA"
              transform="rotate(-12 126 73)"
            />
            <ellipse
              cx="194"
              cy="66"
              rx="10"
              ry="42"
              fill="#E8B7BA"
              transform="rotate(12 194 73)"
            />
            <ellipse cx="160" cy="138" rx="69" ry="59" fill={hasBody?bodyColors[0]:"#FFF4E9"} />
            <ellipse cx="160" cy="219" rx="28" ry="32" fill="#FFF7F1" />
            {renderFace()}
          </>
        )}
        {kind === "panda" && (
          <>
            <ellipse cx="160" cy="216" rx="55" ry="46" fill="#44534D" />
            <ellipse cx="160" cy="214" rx="37" ry="37" fill="#FFFAEA" />
            <circle cx="111" cy="85" r="25" fill="#44534D" />
            <circle cx="209" cy="85" r="25" fill="#44534D" />
            <ellipse cx="160" cy="135" rx="74" ry="62" fill={hasBody?bodyColors[0]:"#FFF9EB"} />
            <ellipse
              cx="129"
              cy="137"
              rx="20"
              ry="25"
              fill="#65746B"
              transform="rotate(22 129 137)"
            />
            <ellipse
              cx="191"
              cy="137"
              rx="20"
              ry="25"
              fill="#65746B"
              transform="rotate(-22 191 137)"
            />
            {renderFace()}
          </>
        )}
        {kind === "dragon" && (
          <>
            <path
              d="M202 230Q281 246 263 182Q245 207 220 204Z"
              fill="#79A595"
            />
            <path
              d="M112 195Q63 152 58 199L84 197L79 222Z M208 195Q257 152 262 199L236 197L241 222Z"
              fill="#BDD7BE"
              stroke="#7EA58A"
              strokeWidth="3"
            />
            <ellipse cx="160" cy="214" rx="52" ry="48" fill={hasBody?bodyColors[0]:"#8CBAA4"} />
            <ellipse cx="160" cy="218" rx="31" ry="35" fill="#E5EAC6" />
            <path
              d="M113 102L108 58L133 86 M187 86L212 58L207 102"
              fill="#DCC698"
            />
            <ellipse cx="160" cy="137" rx="70" ry="61" fill={hasBody?bodyColors[0]:"#A6CDB5"} />
            <path
              d="M148 79L161 57L174 79 M153 64L160 47L169 64"
              fill="#77A18B"
            />
            <ellipse cx="160" cy="165" rx="36" ry="22" fill="#CBE0BC" />
            {renderFace()}
          </>
        )}
        {kind === "axolotl" && (
          <>
            <path
              d="M192 243Q227 221 224 198Q245 202 240 221Q258 214 259 194Q273 257 192 253Z"
              fill="#e89da3"
              stroke="#c97e88"
              strokeWidth="2"
            />
            <ellipse
              cx="160"
              cy="213"
              rx="52"
              ry="46"
              fill={`url(#${bodyId})`}
            />
            <ellipse cx="160" cy="220" rx="31" ry="30" fill="#fff2dc" />
            {[false, true].map((mirror) => (
              <g
                key={String(mirror)}
                transform={mirror ? "translate(320 0) scale(-1 1)" : undefined}
              >
                <g
                  className="coral-gills"
                  stroke="#ce8389"
                  strokeWidth="2"
                  strokeLinejoin="round"
                >
                  <path
                    d="M101 129Q67 115 65 82Q91 87 106 113Q82 81 88 63Q113 82 115 116Z"
                    fill="#eaa0a2"
                  />
                  <path
                    d="M102 132Q76 112 55 119Q61 141 99 148Z"
                    fill="#f3b6ac"
                  />
                  <path
                    d="M99 149Q77 142 63 156Q78 170 106 159Z"
                    fill="#eaa0a2"
                  />
                  <path
                    d="M76 99l22 22m-29 7 27 10m-20 17 22-3"
                    fill="none"
                    stroke="#fff0db"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </g>
              </g>
            ))}
            <path
              d="M84 140Q85 93 133 86Q162 77 188 86Q237 95 236 140Q239 190 161 196Q80 192 84 140Z"
              fill={`url(#${bodyId})`}
            />
            <path
              d="M137 93q12-3 18-1"
              fill="none"
              stroke="#fff2de"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {renderFace()}
          </>
        )}
        {kind === "penguin" && (
          <>
            <ellipse
              cx="160"
              cy="212"
              rx="54"
              ry="49"
              fill={`url(#${bodyId})`}
            />
            <ellipse cx="160" cy="216" rx="36" ry="39" fill="#fff4df" />
            <path
              d="M116 182Q87 185 91 219Q102 232 120 202M204 182Q232 186 231 219Q218 232 200 201"
              fill="#507b89"
            />
            <path
              d="M87 137Q87 85 146 76Q143 67 151 60Q157 72 163 73Q166 61 178 63L173 76Q231 82 233 138Q234 191 161 194Q87 192 87 137Z"
              fill={`url(#${bodyId})`}
            />
            <path
              d="M160 123Q139 98 116 114Q92 132 108 163Q119 188 160 188Q201 188 213 161Q226 129 204 114Q181 98 160 123Z"
              fill="#fff6e7"
            />
            {renderFace({ eyeY: 138, eyeX: 29 })}
          </>
        )}
        <Garment look={look}/>
        <g transform={`translate(${look.x} ${look.y})`}>
        {showAccessory && <g>
        {accessory === "flower" && (
          <g transform="translate(160 76)">
            {[-54, -27, 0, 27, 54].map((x, i) => (
              <g key={i} transform={`translate(${x} ${x === 0 ? -13 : Math.abs(x) === 54 ? 5 : -5})`}>
                <circle r="10" fill={i % 2 ? "#f2a9b8" : "#ffe4b5"}/>
                <circle cx="-9" cy="0" r="7" fill="#ffd8e6"/>
                <circle cx="9" cy="0" r="7" fill="#ffd8e6"/>
                <circle cx="0" cy="-9" r="7" fill="#ffd8e6"/>
                <circle cx="0" cy="9" r="7" fill="#ffd8e6"/>
                <circle r="5" fill="#f5b84b"/>
              </g>
            ))}
          </g>
        )}
        {accessory === "beanie" && (
          <g transform="translate(160 67)">
            <path d="M-53 30Q-49-39 0-48Q49-39 53 30Z" fill={accent.dark} stroke="#425e55" strokeWidth="2.5"/>
            <rect x="-56" y="18" width="112" height="22" rx="10" fill={accent.light} stroke="#425e55" strokeWidth="2.3"/>
            <circle cy="-50" r="15" fill={accent.light}/>
          </g>
        )}
        {accessory === "star" && (
          <g transform="translate(204 83) rotate(15)">
            <path d="M0-30L8-9L31-9L13 6L19 29L0 16L-19 29L-13 6L-31-9L-8-9Z" fill="#f9d478" stroke="#b48739" strokeWidth="3"/>
            <circle cx="-5" cy="-5" r="3" fill="#fff4bf"/>
          </g>
        )}
        {accessory === "wizard" && (
          <g transform="translate(160 79) rotate(-8)">
            <path d="M-49 8L-12-72Q0-84 10-72L39 8Z" fill="#7866ab" stroke="#524378" strokeWidth="3"/>
            <ellipse cy="10" rx="62" ry="13" fill="#5d5195"/>
            <path d="M-23-12L-9-4L0-16L9-4L22-12" fill="none" stroke="#f7dc98" strokeWidth="6"/>
            <circle cx="0" cy="-46" r="5" fill="#ffe7a0"/>
          </g>
        )}
        {accessory === "beret" && (
          <g transform="rotate(-11 155 83)">
            <path
              d="M105 83Q99 68 118 61Q136 47 151 52Q187 47 199 67Q207 80 185 84Z"
              fill="#b65f50"
              stroke="#89493c"
              strokeWidth="2.5"
            />
            <path
              d="M115 81Q145 85 189 77L187 85Q145 96 117 88Z"
              fill="#783f39"
            />
            <path
              d="M152 56q-7-10 2-14"
              fill="none"
              stroke="#78413b"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M117 72q13-11 27-12"
              fill="none"
              stroke="#e99777"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </g>
        )}
        {accessory === "headphones" && (
          <g fill={accent.dark} stroke="#455856" strokeWidth="3.5">
            <path
              d="M92 136C81 59 232 55 228 136"
              fill="none"
              strokeWidth="10"
            />
            <path
              d="M92 115C94 66 209 65 225 112"
              fill="none"
              stroke={accent.light}
              strokeWidth="4"
            />
            <rect
              x="85"
              y="117"
              width="20"
              height="43"
              rx="9"
              transform="rotate(-8 95 139)"
            />
            <rect
              x="215"
              y="117"
              width="20"
              height="43"
              rx="9"
              transform="rotate(8 225 139)"
            />
          </g>
        )}
        {accessory === "sprout" && (
          <g transform="translate(191 84) rotate(12)">
            <path
              d="M-2 2Q2-11 3-22"
              fill="none"
              stroke="#487e58"
              strokeWidth="4"
            />
            <path d="M2-14Q-18-9-23-29Q-1-32 2-14" fill="#91b873" />
            <path d="M3-19Q5-38 24-40Q25-19 3-19" fill="#568c62" />
            <rect
              x="-12"
              y="-1"
              width="24"
              height="7"
              rx="3.5"
              fill="#d6a15f"
            />
          </g>
        )}
        {accessory === "glasses" && (
          <g fill="none" stroke="#846B65" strokeWidth="3.5">
            <circle cx="129" cy="138" r="20" />
            <circle cx="191" cy="138" r="20" />
            <path d="M149 137Q160 130 171 137M108 134L98 129M212 134L222 129" />
          </g>
        )}
        {accessory === "bow" && (
          <g transform="translate(194 89) rotate(18)">
            <path
              d="M0 0Q-29-25-26 0Q-29 25 0 0Q29-25 26 0Q29 25 0 0"
              fill={accent.dark}
            />
            <circle r="7" fill={accent.light} />
          </g>
        )}
        {accessory === "crown" && (
          <g transform="translate(160 76) rotate(-8)">
            <path
              d="M-31 0L-38-34L-15-21L0-44L15-21L38-34L31 0Z"
              fill="#E6C36E"
              stroke="#CDA44E"
              strokeWidth="2"
            />
            <path d="M-25-6H25" stroke="#F8E4AA" strokeWidth="4" />
            <circle cy="-19" r="5" fill={accent.dark} />
          </g>
        )}
        </g>}
        <Headwear look={look}/>
        </g>
        <path
          d="M130 183 Q160 193 190 183 L190 196 Q160 208 130 196Z"
          fill={`url(#${scarfId})`}
        />
        <g className={sprite ? "sprite-scarf" : undefined}>
          <path
            d="M178 196 L195 195 L201 225 Q191 231 180 225Z"
            fill={`url(#${scarfId})`}
          />
          <path
            d="M184 216 l12-1"
            stroke={accent.light}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
        <ellipse
          className={sprite ? "sprite-foot-left" : "buddy-foot-left"}
          cx="134"
          cy="254"
          rx="18"
          ry="11"
          fill={
            kind === "owl" || kind === "penguin" ? "#DFA46F" : bodyColors[1]
          }
        />
        <ellipse
          className={sprite ? "sprite-foot-right" : "buddy-foot-right"}
          cx="186"
          cy="254"
          rx="18"
          ry="11"
          fill={
            kind === "owl" || kind === "penguin" ? "#DFA46F" : bodyColors[1]
          }
        />
        <g transform="translate(178 195) rotate(-12)">
          <circle r="7" fill="#a7804f" />
          <circle cy="-1" r="5.5" fill="#f4d399" />
          <path
            d="M0-4l1.1 2.5 2.6.3-2 1.8.6 2.7L0 1.9l-2.3 1.4.6-2.7-2-1.8 2.6-.3Z"
            fill="#a97848"
          />
        </g>
        <path
          d="M134 192Q162 200 184 190"
          fill="none"
          stroke="#fff8dd"
          opacity=".82"
          strokeWidth="1.7"
          strokeDasharray="3 4"
        />
        {showAccessory && accessory === "satchel" && (
          <g stroke="#745640" strokeWidth="2.4" strokeLinejoin="round">
            <path d="M127 187Q155 218 197 231" fill="none" strokeWidth="7" />
            <g transform="rotate(-9 191 233)">
              <rect
                x="171"
                y="219"
                width="42"
                height="30"
                rx="7"
                fill="#bc8960"
              />
              <path d="M171 222Q193 242 213 222V218H171Z" fill="#d7ad76" />
              <rect
                x="189"
                y="228"
                width="7"
                height="6"
                rx="1.5"
                fill="#ffe0a1"
              />
            </g>
          </g>
        )}
        {waving && (kind === "owl" || kind === "penguin") && (
          <path
            className="waving-paw"
            d="M205 202Q225 197 228 173Q207 174 200 191Z"
            fill={bodyColors[1]}
          />
        )}
        {kind !== "owl" && kind !== "penguin" && (
          <>
            <path
              className="buddy-left-paw"
              d="M115 211 q-8 16 2 20 q11 4 14-11"
              fill={`url(#${bodyId})`}
            />
            <path
              className="waving-paw"
              d={
                waving
                  ? "M192 215Q204 186 216 191Q226 201 205 220Z"
                  : "M205 211 q8 16-2 20 q-11 4-14-11"
              }
              fill={`url(#${bodyId})`}
            />
          </>
        )}
        <Finishing look={look}/>
        {pose==="studying"&&<StudyBook night={night}/>}
      </motion.g>
      {!sprite && (
        <>
          <motion.g
            initial={{ y: 0, opacity: 0.7 }}
            animate={
              animate
                ? { y: [0, -5, 0], opacity: [0.6, 1, 0.6] }
                : { y: 0, opacity: 0.7 }
            }
            transition={{
              duration: 3,
              repeat: animate ? Infinity : 0,
              ease: "easeInOut",
            }}
          >
            <path
              d="M62 111 l3-10 3 10 10 3-10 3-3 10-3-10-10-3Z"
              fill={accent.dark}
            />
            <path d="M251 139 l2-7 2 7 7 2-7 2-2 7-2-7-7-2Z" fill="#D9B76D" />
          </motion.g>
          <motion.g
            initial={{ y: 0, opacity: 0.8 }}
            animate={
              animate
                ? { y: [0, 4, 0], opacity: [1, 0.5, 1] }
                : { y: 0, opacity: 0.8 }
            }
            transition={{
              duration: 4.5,
              repeat: animate ? Infinity : 0,
              ease: "easeInOut",
            }}
          >
            <circle cx="72" cy="181" r="3.5" fill="#D9B76D" />
            <circle cx="244" cy="99" r="3" fill={accent.dark} />
            <path
              d="M180 35 l2-6 2 6 6 2-6 2-2 6-2-6-6-2Z"
              fill="#D9B76D"
              opacity=".7"
            />
          </motion.g>
        </>
      )}
      <Glints effect={look.effect}/>
      {reaction === "love" && (
        <g className="buddy-hearts" fill="#D791AD" aria-hidden="true">
          <path d="M78 77C57 57 45 84 78 102C111 84 99 57 78 77Z" />
          <path d="M250 158C238 144 225 165 250 177C275 165 262 144 250 158Z" />
        </g>
      )}
      {reaction === "snack" && (
        <g transform="translate(246 217) rotate(15)" aria-hidden="true">
          <circle r="22" fill="#DDA66C" />
          <circle cx="-6" cy="-7" r="3" fill="#89674C" />
          <circle cx="10" cy="-4" r="3" fill="#89674C" />
          <circle cx="2" cy="10" r="3" fill="#89674C" />
        </g>
      )}
      {reaction === "play" && (
        <g
          className="buddy-ball"
          transform="translate(69 238)"
          aria-hidden="true"
        >
          <circle r="18" fill={accent.dark} />
          <path
            d="M-16-8L14 10M-8 16L8-16"
            stroke={accent.light}
            strokeWidth="4"
          />
        </g>
      )}
      {pose==="sleeping" && (
        <g
          fill={accent.dark}
          fontFamily="sans-serif"
          fontWeight="600"
          aria-hidden="true"
        >
          <text x="233" y="73" fontSize="17">
            z
          </text>
          <text x="250" y="53" fontSize="23">
            z
          </text>
        </g>
      )}
    </svg>
  );
}
