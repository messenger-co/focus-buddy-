import { dyes, type Wardrobe } from "./wardrobe";

export type BuddyActivity =
  | "idle"
  | "studying"
  | "dancing"
  | "celebrating"
  | "walking"
  | "jumping"
  | "curious"
  | "surprised"
  | "relaxed"
  | "excited"
  | "sleeping"
  | "waking"
  | "stretching"
  | "waving"
  | "study"
  | "stretch"
  | "celebrate";
export function Garment({ look }: { look: Wardrobe }) {
  const { garment, dye } = look,
    [color, seam] = dyes[dye];
  if (garment === "plain") return null;
  return (
    <g data-garment={garment} strokeLinejoin="round">
      {look.bag === "pack" && (
        <g fill={seam} stroke="#4f4f50" strokeWidth="2">
          <rect x="97" y="198" width="20" height="47" rx="9" />
          <rect x="202" y="197" width="23" height="48" rx="9" />
        </g>
      )}
      <path
        d="M132 186Q145 192 160 192Q176 192 187 186Q202 189 209 202L204 220L197 218L201 245Q166 262 118 244L123 216L115 221L109 203Q117 191 132 186Z"
        fill={color}
        stroke={seam}
        strokeWidth="2.4"
      />
      <path
        d="M120 240Q156 251 200 240"
        fill="none"
        stroke={seam}
        strokeWidth="2"
      />
      {garment === "hoodie" && (
        <g>
          <path
            d="M127 190Q120 180 132 176Q160 194 188 176Q201 182 193 192Q177 204 160 201Q141 201 127 190Z"
            fill={seam}
          />
          <path
            d="M150 201l-1 18m22-18 1 18M145 228l-7 10q21 6 44 0l-7-10"
            fill="none"
            stroke="#fff2cf"
            strokeWidth="2.75"
            strokeLinecap="round"
          />
        </g>
      )}
      {garment === "sweater" && (
        <path
          d="m124 216 9 6 9-6 9 6 9-6 9 6 9-6 9 6 9-6m-71 12h67"
          stroke="#fff0d9"
          strokeWidth="3"
          strokeDasharray="6 1"
          fill="none"
        />
      )}
      {garment === "school" && (
        <g>
          <path
            d="M131 187l29 11-14 14-18-16m60-9-28 11 14 14 18-16"
            fill="#fff5df"
          />
          <path d="m160 198 6 8-3 5 5 16-8 8-7-8 5-16-4-5Z" fill={seam} />
          <path d="M179 216h13v8l-7 4-6-4Z" fill="#f4d991" />
        </g>
      )}
      {garment === "jacket" && (
        <g stroke={seam} fill="none" strokeWidth="3">
          <path d="M158 196v52m-18-55-7 13 10 9m36-22 7 13-10 9m-45 15 10 4m38 0 10-4" />
          <circle cx="164" cy="221" r="1" />
          <circle cx="164" cy="235" r="1" />
        </g>
      )}
      {garment === "pajamas" && (
        <g fill="#fbe9bc">
          <path d="M141 210q-7 12 8 12-18 10-17-6Z" />
          <path d="m174 224 3-6 2 6 6 1-5 4 1 5-5-3-4 3 1-5-4-4Z" />
          <circle cx="150" cy="239" r="2" />
        </g>
      )}
      {garment === "sport" && (
        <g fill="#fff5da">
          <path d="m117 199 11 5-2 5-12-5m78-6 10-2 3 5-11 4" />
          <path d="m148 215 9-2v21h-5v-15l-4 1Zm15-1h14v4l-8 16h-5l8-16h-9Z" />
        </g>
      )}
      {garment === "overalls" && (
        <g>
          <path
            d="m129 187 10 2 4 20h33l5-20 9-2-6 25 7 33q-32 11-64-1l6-31Z"
            fill={seam}
          />
          <rect x="147" y="216" width="25" height="18" rx="5" fill={color} />
          <path d="M157 228q-7-13 6-14 2 9-6 14" fill="#eff4bd" />
          <g fill="#ffdc89">
            <circle cx="139" cy="208" r="2.8" />
            <circle cx="181" cy="208" r="2.8" />
          </g>
        </g>
      )}
      {garment === "smock" && (
        <g>
          <path
            d="M134 190q26 20 51 0l-3 15 12 38q-33 12-65 0l10-39Z"
            fill="#f4e0b8"
            stroke={seam}
            strokeWidth="2"
          />
          <path d="m149 219 3-13m6 14 5-18" stroke="#7e6751" strokeWidth="3" />
          <path d="m151 208 1-7 3 5m5-2 5-7 1 7" fill="#476e79" />
          <path d="M139 218h32l-2 14q-12 9-28-1Z" fill={color} />
          <g fill="#cb7459">
            <circle cx="177" cy="211" r="3" />
            <circle cx="182" cy="215" r="1.5" />
          </g>
          <circle cx="175" cy="237" r="3" fill="#77a79a" />
        </g>
      )}
      {garment === "sailor" && (
        <g>
          <path
            d="M130 187q29 11 60 0l-13 20-17 8-17-8Z"
            fill="#ffefd6"
            stroke={seam}
            strokeWidth="2"
          />
          <path
            d="m136 191 13 12 11 5 13-5 12-12"
            fill="none"
            stroke={seam}
            strokeWidth="2"
          />
          <path d="m160 208 5 5-4 5 7 13-8-2-7 3 5-15-4-4Z" fill="#c76e5e" />
          <path
            d="m121 237 14 3m51 1 12-3"
            fill="none"
            stroke="#f7e7cf"
            strokeWidth="3"
          />
        </g>
      )}
      {garment === "astronaut" && (
        <g>
          <path
            d="M132 192q27 17 57 0"
            stroke="#e3eced"
            strokeWidth="8"
            fill="none"
          />
          <rect x="140" y="211" width="39" height="20" rx="4" fill="#f0eee8" />
          <rect x="144" y="215" width="16" height="6" rx="2" fill="#698d9f" />
          <circle cx="171" cy="218" r="3" fill="#cf8476" />
          <path d="M145 226h11" stroke={seam} strokeWidth="2" />
        </g>
      )}
    </g>
  );
}
export function Headwear({ look }: { look: Wardrobe }) {
  const [color, seam] = dyes[look.dye];
  return (
    <g data-hat={look.hat} strokeLinecap="round" strokeLinejoin="round">
      {look.hat === "straw" && (
        <g transform="rotate(-6 159 86)">
          <path
            d="M113 86q5-36 35-37l22 1q26 2 35 36"
            fill="#e5b871"
            stroke="#9c7548"
            strokeWidth="2"
          />
          <path d="M115 76q48-7 86 1l3 9q-49-8-92 2Z" fill={seam} />
          <ellipse
            cx="159"
            cy="90"
            rx="64"
            ry="10"
            fill="#f0cc87"
            stroke="#a48050"
            strokeWidth="2"
          />
          <path
            d="M107 91q46-9 104 0m-78-27q13-8 26-8"
            fill="none"
            stroke="#c5995a"
            strokeWidth="2"
            strokeDasharray="3 4"
          />
        </g>
      )}
      {look.hat === "painter" && (
        <g transform="rotate(-12 157 79)">
          <path
            d="M106 87q-13-19 19-32 26-8 48-3 36 3 43 21 7 14-19 17Z"
            fill={color}
            stroke={seam}
            strokeWidth="2.5"
          />
          <path d="M113 84q43-11 86 2l-4 8q-37-8-79-1Z" fill={seam} />
          <path
            d="M155 53q-3-9 3-13"
            fill="none"
            stroke={seam}
            strokeWidth="5"
          />
          <path
            d="M120 70q9-9 21-10"
            stroke="#fff1d7"
            fill="none"
            strokeWidth="3"
          />
        </g>
      )}
      {look.hat === "mariner" && (
        <g transform="rotate(6 159 82)">
          <path
            d="M109 79q-7-15 14-18 37-25 73-1 23 2 14 19l-9 8h-78Z"
            fill="#fff1d7"
            stroke={seam}
            strokeWidth="2.5"
          />
          <path d="M117 78q40-8 87 0l-3 12q-43-5-80 1Z" fill={seam} />
          <path d="M131 88q30-6 60-1-7 12-30 12-18 1-30-11Z" fill="#4b647c" />
          <g stroke="#e7bc6a" fill="none" strokeWidth="2">
            <circle cx="159" cy="75" r="6" />
            <path d="M159 71v8m-4-3q4 5 8 0" />
          </g>
        </g>
      )}
      {look.hat === "cap" && (
        <g transform="rotate(-7 159 86)">
          <path
            d="M109 94q2-45 53-45 36 4 43 40Z"
            fill={color}
            stroke={seam}
            strokeWidth="2.3"
          />
          <path d="M111 90q43-13 92-4 28 0 30 10-45-3-63 4Z" fill={seam} />
          <path
            d="M163 54q16 7 16 29"
            stroke="#ffefcf"
            strokeWidth="2"
            strokeDasharray="3 4"
            fill="none"
          />
          <circle cx="161" cy="50" r="4" fill={seam} />
        </g>
      )}
      {(look.hat === "wool" || look.hat === "winter") && (
        <g>
          <path
            d="M109 94Q119 46 159 50Q213 47 211 94Z"
            fill={look.hat === "winter" ? "#d58182" : color}
            stroke={seam}
            strokeWidth="2.5"
          />
          <circle cx="157" cy="45" r="12" fill="#fff1d9" />
          <path
            d="M110 85Q160 73 211 86l-2 13q-48-10-99 1Z"
            fill={look.hat === "winter" ? "#f7eee4" : seam}
          />
          <path
            d="M121 88l1 7m9-9 1 7m9-9 1 7m9-8 1 7m9-7v7m9-6v6m9-6v7m9-5v6"
            stroke="#f3dabc"
            strokeWidth="2"
          />
        </g>
      )}
      {look.hat === "headband" && (
        <g>
          <path
            d="M94 115Q111 60 166 67q44 4 59 46"
            stroke={color}
            strokeWidth="10"
            fill="none"
          />
          <path
            d="M186 76q-3-24 9-21t0 22q19-15 24-6-1 12-23 14Z"
            fill={seam}
          />
        </g>
      )}
      {look.hat === "blossom" && (
        <g transform="translate(205 92) rotate(18)">
          <path
            d="M-9 5Q-23 5-22-8q12-4 17 7m7 8q8 12 18 3-3-8-13-7"
            fill="#72a686"
          />
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse
              key={a}
              rx="6"
              ry="10"
              cy="-7"
              transform={`rotate(${a})`}
              fill="#fac4c2"
              stroke="#d78f99"
              strokeWidth="1.3"
            />
          ))}
          <circle r="4.5" fill="#ffdd80" />
        </g>
      )}
      {look.hat === "laurels" && (
        <g fill="#d9b955" stroke="#b08d47" strokeWidth="1.2">
          {[-1, 1].map((k) => (
            <g
              key={k}
              transform={k === -1 ? "translate(320) scale(-1 1)" : undefined}
            >
              <path d="M105 85q13 12 55 4" fill="none" strokeWidth="3" />
              {[0, 1, 2, 3].map((i) => (
                <ellipse
                  key={i}
                  cx={111 + i * 12}
                  cy={84 + Math.sin(i) * 5}
                  rx="5"
                  ry="11"
                  transform={`rotate(-38 ${111 + i * 12} ${84 + Math.sin(i) * 5})`}
                />
              ))}
            </g>
          ))}
        </g>
      )}
    </g>
  );
}
export function Finishing({ look }: { look: Wardrobe }) {
  const [color, seam] = dyes[look.dye];
  return (
    <g data-glasses={look.glasses} strokeLinecap="round" strokeLinejoin="round">
      {look.glasses !== "none" && (
        <g
          transform={`translate(${look.x} ${look.y})`}
          stroke={seam}
          strokeWidth="3"
          fill={look.glasses === "shades" ? "#424960" : "#cf7f9488"}
        >
          <path d="M103 131l7 2m42 2q8-7 16 0m41-2 8-3" fill="none" />
          {[129, 191].map((x) => (
            <g key={x} transform={`translate(${x} 138)`}>
              <path
                d={
                  look.glasses === "shades"
                    ? "M-21-8q18-5 40-1 1 22-18 23-19 0-22-22Z"
                    : "M0 15C-31-1-13-25 0-11 16-24 30-1 0 15Z"
                }
              />
              <path d="m-13-3 7-3" stroke="#fff6dfb3" strokeWidth="2" />
            </g>
          ))}
        </g>
      )}
      {look.bag === "satchel" && (
        <g stroke={seam} strokeWidth="3">
          <path d="M126 187q28 37 66 42" fill="none" />
          <rect x="170" y="220" width="37" height="26" rx="6" fill={color} />
          <path d="M172 227q17 12 32-1" stroke="#ffe8bd" fill="none" />
        </g>
      )}
      {look.bag === "pack" && (
        <g fill="none" stroke={seam} strokeWidth="5">
          <path d="M131 188q-12 18-6 35m62-35q13 19 9 34" />
        </g>
      )}
    </g>
  );
}
export function StudyDeskItem({
  night,
  tool,
}: {
  night: boolean;
  tool: Wardrobe["studyTool"];
}) {
  return (
    <g className="buddy-book" data-study-tool={tool}>
      <ellipse cx="161" cy="245" rx="53" ry="6" fill="#584f5026" />
      {tool === "book" && (
        <g>
          <path
            d="M111 210q23-3 48 9 27-14 52-10l-2 30q-26 0-49 13-24-12-46-10Z"
            fill="#497e79"
            stroke="#456568"
            strokeWidth="2"
          />
          <path
            d="M117 206q21-2 43 10 22-13 45-12l-2 29q-19 0-43 12-21-10-42-9Z"
            fill="#fff0ce"
          />
          <path
            d="m159 218 1 25m-36-28 22 6m-21 2 22 6m28-7 21-7m-22 15 20-7"
            fill="none"
            stroke="#c6ad8c"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
        </g>
      )}
      {tool === "journal" && (
        <g transform="rotate(-8 160 226)" strokeLinejoin="round">
          <rect
            x="126"
            y="200"
            width="64"
            height="47"
            rx="4"
            fill="#527d6c"
            stroke="#46665b"
            strokeWidth="2"
          />
          <rect x="131" y="199" width="55" height="43" rx="3" fill="#ffedcb" />
          <path
            d="M147 232q6-18 24-24m-13 12q-13 0-11-11 12 0 11 11m2-2q0-13 12-13 2 10-12 13m-7 10q8-10 17-5-3 9-17 5"
            stroke="#73895b"
            fill="#a6bf79"
            strokeWidth="1.5"
          />
          <path d="M132 203v34" stroke="#b9a282" strokeDasharray="2 3" />
        </g>
      )}
      {tool === "sketchpad" && (
        <g transform="rotate(-7 160 227)" strokeLinecap="round">
          <rect
            x="124"
            y="200"
            width="71"
            height="47"
            rx="4"
            fill="#f4d8ad"
            stroke="#907a65"
            strokeWidth="2"
          />
          <rect x="128" y="202" width="63" height="39" rx="2" fill="#fff4da" />
          <path d="m133 235 14-13 9 8 11-15 17 20Z" fill="#a8c7b3" />
          <circle cx="143" cy="214" r="4" fill="#efae73" />
          <path
            d="m134 201 1 4m7-5 1 4m7-5 1 4m7-5 1 4m7-5 1 4m7-5 1 4"
            stroke="#816f68"
            strokeWidth="2"
          />
          <path
            d="m171 232 22-24 4 4-23 23-6 2Z"
            fill="#e7a658"
            stroke="#8c7059"
            strokeWidth="1.25"
          />
        </g>
      )}
      {tool === "chart" && (
        <g strokeLinejoin="round">
          <path
            d="m115 210 30-5 28 6 31-7 3 33-30 8-29-6-30 5Z"
            fill="#435b79"
            stroke="#354660"
            strokeWidth="2"
          />
          <path d="m145 206 3 32m25-26 4 32" fill="none" stroke="#768aa0" />
          <path
            d="m126 229 11-11 17 6 12-8 18 8 11-10"
            stroke="#f6d89a"
            fill="none"
          />
          {[
            [126, 229],
            [137, 218],
            [154, 224],
            [166, 216],
            [184, 224],
            [195, 214],
          ].map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r="2.4" fill="#fff0bb" />
          ))}
        </g>
      )}
      {night && (
        <g>
          <path
            d="m235 251 9-5-5-38 9-6"
            stroke="#755f65"
            strokeWidth="4"
            fill="none"
          />
          <path d="m236 208 17-16 10 24Z" fill="#e9bb77" />
          <path d="m235 211-15 31 46 1-5-26Z" fill="#ffde9f55" />
        </g>
      )}
    </g>
  );
}
export function Glints({ effect }: { effect: Wardrobe["effect"] }) {
  if (effect === "none" || effect === "glow") return null;
  return (
    <g className="wardrobe-glints" aria-hidden="true">
      {[
        [66, 147, 1],
        [244, 202, 0.68],
        [227, 68, 0.8],
        [96, 61, 0.65],
      ].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <g className={`glint glint-${i}`}>
            {effect === "hearts" ? (
              <path d="M0 8C-20-3-10-17 0-8 11-18 18-1 0 8Z" fill="#df8f9d" />
            ) : effect === "stars" ? (
              <path
                d="m0-11 3 7 8 1-6 5 2 8-7-4-7 4 1-8-5-5 8-1Z"
                fill="#efd17d"
                stroke="#c7a562"
              />
            ) : (
              <>
                <circle r="10" fill="#e9d08e44" />
                <circle r="4" fill="#ffe7a4" />
              </>
            )}
          </g>
        </g>
      ))}
    </g>
  );
}
