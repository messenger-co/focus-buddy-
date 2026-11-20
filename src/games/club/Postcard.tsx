import {
  Armchair,
  BookOpen,
  Cat,
  Flower2,
  LampDesk,
  Leaf,
  Map as MapIcon,
  Music2,
  Paintbrush,
  Palette,
  Pencil,
  Shirt,
  Sparkles,
  Sprout,
} from "lucide-react";
import type { ClubEntry, ClubId } from "./catalog";

const ink = "var(--card-ink)",
  color = "var(--card-color)",
  warm = "#ffd979",
  paper = "#fffaf0";
const art = {
  "duong-ray": (
    <>
      <path
        d="M5 65q33-28 73-13t93-5"
        stroke={paper}
        strokeWidth="9"
        fill="none"
      />
      <path
        d="M5 65q33-28 73-13t93-5"
        stroke={ink}
        strokeWidth="4"
        strokeDasharray="2 5"
        fill="none"
      />
      <g className="card-actor" transform="translate(73 7) rotate(-5 20 20)">
        <g stroke={ink} strokeWidth="1.7">
          <path d="M-3 15h19v21H-3z" fill={color}/><path d="M-6 15h25l-2-4H-3z" fill={warm}/>
          <rect x="1" y="18" width="10" height="9" rx="2" fill={paper}/>
          <path d="M16 24h14q7 0 7 6v5H16z" fill={color}/><path d="M24 24v-9h7v9" fill={ink}/>
          <path d="M-5 35h44" /><circle cx="3" cy="37" r="5" fill={warm}/><circle cx="25" cy="37" r="5" fill={warm}/>
          <path d="M3 37h22" fill="none"/>
        </g><path d="M27 10q-6-4-1-6m-7 4q-6-3-1-6" stroke={ink} opacity=".5" fill="none"/>
      </g>
      <path d="M130 43V20h9" stroke={ink} fill="none" />
      <circle cx="139" cy="24" r="4" fill={warm} stroke={ink} />
    </>
  ),
  "duong-chay": (
    <>
      <circle cx="123" cy="21" r="13" fill={warm} />
      <path
        d="M7 53h50m-30 5h28m51-8h53"
        stroke={ink}
        opacity=".5"
        strokeWidth="2"
      />
      <g className="card-actor" transform="translate(62 12) rotate(-10 20 16)">
        <Cat size="34" fill="#f4ba85" /><path d="m14 23 3 2 3-2" stroke={ink} fill="none"/>
      </g>
      <path d="m100 58 8-14 10 14z" fill={color} stroke={ink} />
      <path d="m63 38-8 2m9-7-13 1" stroke={ink} strokeWidth="2" />
    </>
  ),
  "hung-sao": (
    <>
      <path
        d="M62 46h45l-6 14H69z"
        fill={color}
        stroke={ink}
        strokeWidth="2.5"
      />
      <path
        d="M70 46q12-25 28 0m-23 2 3 10m7-10v11m8-10-2 10"
        fill="none"
        stroke={ink}
        strokeWidth="2"
      />
      <g className="card-actor" fill={warm} stroke={ink}>
        <path d="m88 9 3 7 8 1-6 5 2 8-7-4-7 4 1-8-6-5 8-1z" />
        <path d="m126 27 2 4 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1z" />
      </g>
    </>
  ),
  "vu-dieu": (
    <>
      <path
        d="M34 48q30-22 57-8t55-10m-110 24q30-22 57-8t55-10"
        stroke={ink}
        strokeWidth="1.3"
        opacity=".45"
        fill="none"
      />
      <g className="card-actor" transform="translate(67 8) rotate(-12 18 18)">
        <Music2 size="40" fill={color} />
      </g>
      <Music2 x="103" y="16" size="20" fill={warm} />
    </>
  ),
  "ran-vuon": (
    <>
      <path
        d="M28 45h26V28h26v18h26V26h13"
        stroke={ink}
        strokeWidth="12"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M28 45h26V28h26v18h26V26h13"
        stroke={color}
        strokeWidth="8"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="120" cy="24" r="1.6" fill={ink} />
      <circle
        className="card-actor"
        cx="140"
        cy="27"
        r="6"
        fill="#ef9078"
        stroke={ink}
      />
      <Leaf x="137" y="14" size="10" fill={color} />
    </>
  ),
  "xep-khoi": (
    <>
      {[
        [47, 39],
        [61, 39],
        [61, 25],
        [75, 39],
        [89, 39],
        [103, 39],
        [103, 25],
        [103, 11],
      ].map(([x, y], i) => (
        <rect
          key={i}
          x={x}
          y={y}
          width="13"
          height="13"
          rx="3"
          stroke={ink}
          fill={i < 4 ? color : warm}
        />
      ))}
      <path d="M35 56h99" stroke={ink} strokeWidth="2" />
      <rect
        className="card-actor"
        x="75"
        y="16"
        width="13"
        height="13"
        rx="3"
        fill={paper}
        stroke={ink}
      />
    </>
  ),
  "go-phim": (
    <>
      <g className="card-actor" transform="rotate(-6 85 34)">
        <rect
          x="45"
          y="18"
          width="85"
          height="35"
          rx="6"
          fill={color}
          stroke={ink}
          strokeWidth="2"
        />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <g key={i} fill={paper}>
            <rect x={51 + i * 10} y="23" width="7" height="6" rx="1" />
            <rect x={54 + i * 10} y="32" width="7" height="6" rx="1" />
          </g>
        ))}
        <rect x="68" y="42" width="35" height="5" rx="2" fill={warm} />
      </g>
    </>
  ),
  "chop-sang": (
    <>
      <rect
        x="67"
        y="18"
        width="41"
        height="39"
        rx="10"
        fill={paper}
        fillOpacity=".65"
        stroke={ink}
        strokeWidth="2"
      />
      <rect
        x="69"
        y="13"
        width="37"
        height="7"
        rx="3"
        fill={color}
        stroke={ink}
      />
      <g className="card-actor">
        <circle cx="87" cy="39" r="10" fill={warm} opacity=".65" />
        <circle cx="87" cy="39" r="3" fill={ink} />
        <path d="m86 36-5-4m8 4 5-4" stroke={ink} />
      </g>
      <Sparkles x="111" y="24" size="18" fill={warm} />
    </>
  ),
  "thu-vien-do": (
    <>
      <BookOpen x="53" y="13" size="49" fill={paper} strokeWidth={1.5} />
      <g className="card-actor" transform="rotate(-9 116 29)">
        <Pencil x="99" y="10" size="34" fill={warm} />
      </g>
      <path d="m62 31 12 2m-12 3 11 2m9-5 11-2" stroke={ink} />
    </>
  ),
  "pha-mau": (
    <>
      <Palette x="56" y="10" size="48" fill={paper} strokeWidth={1.5} />
      <circle cx="69" cy="33" r="3" fill="#80a6c0"/><circle cx="76" cy="23" r="3" fill="#efa07e"/><circle cx="87" cy="25" r="3" fill="#8fbe97"/>
      <g className="card-actor">
        <Paintbrush x="96" y="13" size="37" fill={color} />
      </g>
      <circle cx="52" cy="50" r="5" fill={color} />
      <circle cx="115" cy="50" r="4" fill={warm} />
    </>
  ),
  "thoi-trang": (
    <>
      <path
        d="M57 54h61M67 54V14h40"
        stroke={ink}
        strokeWidth="2"
        fill="none"
      />
      <g className="card-actor">
        <Shirt x="73" y="15" size="39" fill={color} />
      </g>
      <Sparkles x="115" y="18" size="17" fill={warm} />
    </>
  ),
  "san-kho-bau": (
    <>
      <MapIcon x="58" y="6" size="54" fill={paper} strokeWidth={1.2} />
      <path
        d="M49 45q11-16 24-7t22-8"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeDasharray="3 3"
      />
      <path
        className="card-actor"
        d="m99 22 8 8m0-8-8 8"
        stroke={ink}
        strokeWidth="3"
      />
    </>
  ),
  "xuong-ve": (
    <>
      <g transform="rotate(-7 85 36)">
        <rect
          x="54"
          y="12"
          width="56"
          height="43"
          rx="3"
          fill={paper}
          stroke={ink}
          strokeWidth="2"
        />
        <path
          d="m60 45 12-12 8 6 8-14 14 18"
          stroke={color}
          strokeWidth="3"
          fill="none"
        />
        <circle cx="68" cy="24" r="4" fill={warm} />
      </g>
      <g className="card-actor">
        <Pencil x="101" y="16" size="33" fill={color} />
      </g>
    </>
  ),
  "vuon-nho": (
    <>
      <path d="M42 55q38-8 89 0" stroke={ink} strokeWidth="2" fill="none" />
      <Sprout x="45" y="32" size="27" fill={color} />
      <g className="card-actor">
        <Flower2 x="71" y="10" size="34" fill={warm} />
      </g>
      <path d="M88 41v12" stroke={ink} strokeWidth="2" />
      <Sprout x="108" y="27" size="28" fill={color} />
    </>
  ),
  "phong-nho": (
    <>
      <path d="M39 56h94" stroke={ink} strokeWidth="2" />
      <rect
        x="78"
        y="10"
        width="23"
        height="20"
        rx="2"
        fill={paper}
        stroke={ink}
      />
      <path d="m81 26 6-7 5 4 5-6" stroke={color} strokeWidth="2" fill="none" />
      <Armchair x="49" y="24" size="37" fill={color} />
      <g className="card-actor">
        <LampDesk x="99" y="22" size="30" fill={warm} />
      </g>
    </>
  ),
} satisfies Record<ClubId, React.ReactNode>;

export default function Postcard({ game }: { game: ClubEntry }) {
  return (
    <svg
      className="club-postcard"
      data-tone={game.tone}
      viewBox="0 0 176 66"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M0 48Q28 25 57 42t67-1q29-15 52-1v26H0z"
        fill="var(--card-color)"
        opacity=".18"
      />
      <path
        d="M0 58q28-17 54-4t62-2q34-11 60 1v13H0z"
        fill="var(--card-color)"
        opacity=".24"
      />
      <g fill={ink} opacity=".25">
        <circle cx="17" cy="20" r="1.5" />
        <circle cx="31" cy="12" r="1" />
        <circle cx="148" cy="13" r="1.3" />
        <circle cx="160" cy="33" r="1" />
      </g>
      <g strokeLinecap="round" strokeLinejoin="round">
        {art[game.slug]}
      </g>
    </svg>
  );
}
