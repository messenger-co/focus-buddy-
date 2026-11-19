import type { Profile } from "../../state";
export interface PlayProps {
  level: number;
  profile: Profile;
  active: boolean;
  finish: (points: number, won?: boolean) => void;
  tone: (good?: boolean) => void;
}
