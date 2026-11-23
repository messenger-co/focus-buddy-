import type { ReactNode } from "react";
export default function StudyNook({ children }: { children: ReactNode }) {
  return (
    <div className="study-nook" aria-hidden="true">
      <div className="nook-stage">
        <svg viewBox="0 0 310 234" className="nook-room">
          <path d="M15 212V96C15-4 289-19 294 100v112Z" fill="#f2d9ac" />
          <path d="M50 150V76a89 66 0 0 1 178 0v74Z" fill="#866f56" />
          <path
            d="M57 144V77a82 60 0 0 1 164 0v67Z"
            fill="#9cced3"
            className="window-sky"
          />
          <circle className="window-sun" cx="177" cy="52" r="14" fill="#ffe8a6" />
          <path
            d="M58 120q25-43 54-11 35-42 70-12 19-19 38-8v54H58Z"
            fill="#9bb8a1"
          />
          <path d="M57 133q40-42 83-8 34-36 81-13v32H57Z" fill="#77988b" />
          <path d="M134 18v126M59 85h161" stroke="#f7e5c6" strokeWidth="5" />
          <path d="M40 150h197v8H40Z" fill="#bfa177" />
          <path
            d="M253 163q-10-36-2-60m-1 35q-21-6-24-20 21-2 24 20m2-14q5-26 18-28 6 17-18 28m-2-10q-19-13-13-29 17 8 13 29"
            fill="#627f5c"
            stroke="#637853"
            strokeWidth="2"
          />
          <path d="M236 146h29l-5 24h-20Z" fill="#c48267" />
          <path d="M232 144h36v6h-36Z" fill="#dc9878" />
        </svg>
        <div className="nook-buddy">{children}</div>
        <svg viewBox="0 0 310 234" className="nook-desk">
          <path d="M12 176 243 167 300 183 63 197Z" fill="#d3a77a" />
          <path d="M12 176 63 194 300 181v9L62 204 12 185Z" fill="#aa7958" />
          <path d="m43 195 9 3-3 33-7-2Zm224-4 7-1-1 31-7 2Z" fill="#94694d" />
          <path
            d="m110 177 31-6 18 4 29-5 19 5-43 9-23-3-20 2Z"
            fill="#fff5d9"
            stroke="#a38e79"
          />
          <path d="m158 175 5 9m-40-7 14-3m36 1 13-3" stroke="#a6af94" />
          <path d="m28 169 50-5 17 4-50 7Z" fill="#b4c6a4" />
          <path d="m28 169 17 6v6l-17-6Z" fill="#73927b" />
          <path d="m45 175 50-7v6l-50 7Z" fill="#849e86" />
          <path d="m32 163 45-5 13 4-44 7Z" fill="#c58c72" />
          <path d="m32 163 14 6 44-7v4l-44 7-14-6Z" fill="#efc39b" />
        </svg>
      </div>
    </div>
  );
}
