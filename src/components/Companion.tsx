import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { CompanionColor, CompanionKind } from "../data";

export interface CompanionProps {
  kind: CompanionKind;
  color: CompanionColor;
  paused?: boolean;
  sleepy?: boolean;
  size?: number;
  className?: string;
}

const accents = {
  mint: { light: "#C5DFC9", dark: "#79A88B", glow: "#E8F0E5" },
  lavender: { light: "#D5C8E7", dark: "#9E86BE", glow: "#F0EBF6" },
  peach: { light: "#F6C8B5", dark: "#D79079", glow: "#FCF0E8" },
};

const names = { fox: "Cáo Mây", owl: "Cú Mơ", cat: "Mèo Mít" };

/** Nhân vật SVG gốc; không tải ảnh hoặc dịch vụ hoạt ảnh bên ngoài. */
export default function Companion({
  kind,
  color,
  paused = false,
  sleepy = false,
  size = 300,
  className,
}: CompanionProps) {
  const uid = useId().replace(/:/g, "");
  const reduceMotion = useReducedMotion();
  const animate = !paused && !reduceMotion;
  const accent = accents[color];
  const bodyId = `companion-body-${uid}`;
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
        rx="11"
        ry="6"
        fill="#EBA498"
        opacity=".58"
      />
      <ellipse
        cx={160 + eyeX + 12}
        cy={eyeY + 19}
        rx="11"
        ry="6"
        fill="#EBA498"
        opacity=".58"
      />
      {sleepy ? (
        <g fill="none" stroke="#55463F" strokeWidth="4" strokeLinecap="round">
          <path d={`M ${150 - eyeX} ${eyeY} q 10 10 20 0`} />
          <path d={`M ${150 + eyeX} ${eyeY} q 10 10 20 0`} />
        </g>
      ) : (
        <motion.g
          animate={animate ? { scaleY: [1, 1, 0.12, 1, 1] } : { scaleY: 1 }}
          transition={{
            duration: 5.3,
            times: [0, 0.72, 0.74, 0.76, 1],
            repeat: animate ? Infinity : 0,
          }}
          style={{ originX: "160px", originY: `${eyeY}px` }}
        >
          <ellipse cx={160 - eyeX} cy={eyeY} rx="6.5" ry="9" fill="#55463F" />
          <ellipse cx={160 + eyeX} cy={eyeY} rx="6.5" ry="9" fill="#55463F" />
          <circle cx={158 - eyeX} cy={eyeY - 3} r="2.1" fill="#FFFCF4" />
          <circle cx={158 + eyeX} cy={eyeY - 3} r="2.1" fill="#FFFCF4" />
        </motion.g>
      )}
      {kind === "owl" ? (
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
      viewBox="0 0 320 300"
      className={className}
      role="img"
      aria-labelledby={titleId}
      style={{ maxWidth: "100%", overflow: "visible" }}
    >
      <title id={titleId}>
        {names[kind]}
        {sleepy
          ? " đang nghỉ ngơi"
          : paused
            ? " cùng bạn tập trung"
            : " đang đồng hành cùng bạn"}
      </title>
      <defs>
        <linearGradient
          id={bodyId}
          x1=".2"
          y1="0"
          x2=".85"
          y2="1"
          gradientUnits="objectBoundingBox"
        >
          <stop
            stopColor={
              kind === "fox"
                ? "#EDBD8D"
                : kind === "owl"
                  ? "#C9B69B"
                  : "#DACFC3"
            }
          />
          <stop
            offset="1"
            stopColor={
              kind === "fox"
                ? "#DA9A66"
                : kind === "owl"
                  ? "#A99072"
                  : "#BCAE9E"
            }
          />
        </linearGradient>
        <linearGradient id={scarfId} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={accent.light} />
          <stop offset="1" stopColor={accent.dark} />
        </linearGradient>
      </defs>
      <circle cx="160" cy="147" r="113" fill={accent.glow} />
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
      <motion.g
        animate={
          animate ? { y: [0, -7, 0], rotate: [0, -1, 0] } : { y: 0, rotate: 0 }
        }
        transition={{
          duration: 4,
          repeat: animate ? Infinity : 0,
          ease: "easeInOut",
        }}
        style={{ originX: "160px", originY: "230px" }}
      >
        {kind === "fox" && (
          <>
            <path
              d="M214 241 C273 247 290 184 250 157 C262 191 225 193 205 214Z"
              fill={`url(#${bodyId})`}
            />
            <path
              d="M250 157 C270 171 277 192 267 214 C252 216 238 207 235 195 C250 188 256 174 250 157Z"
              fill="#FFF1DA"
            />
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
        <path
          d="M130 183 Q160 193 190 183 L190 196 Q160 208 130 196Z"
          fill={`url(#${scarfId})`}
        />
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
        <ellipse
          cx="134"
          cy="254"
          rx="18"
          ry="11"
          fill={
            kind === "fox" ? "#D99B6C" : kind === "owl" ? "#DFA46F" : "#BAAC9B"
          }
        />
        <ellipse
          cx="186"
          cy="254"
          rx="18"
          ry="11"
          fill={
            kind === "fox" ? "#D99B6C" : kind === "owl" ? "#DFA46F" : "#BAAC9B"
          }
        />
        {kind !== "owl" && (
          <>
            <path
              d="M115 211 q-8 16 2 20 q11 4 14-11"
              fill={`url(#${bodyId})`}
            />
            <path
              d="M205 211 q8 16-2 20 q-11 4-14-11"
              fill={`url(#${bodyId})`}
            />
          </>
        )}
      </motion.g>
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
      {sleepy && (
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
