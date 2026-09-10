export type GamePhase = "lobby" | "traveling" | "world";

export type NpcArchetype = "farmer" | "vendor" | "soldier" | "scholar" | "retainer";

export interface Npc {
  id: string;
  archetype: NpcArchetype;
  name: string;
  gender: "男" | "女";
  age: number;
  socialClass: string;
  occupation: string;
  origin: string;
  personality: string[];
  wealth: string;
  education: string;
  goal: string;
  attitude: number;
  knowledge: string[];
  memory: string[];
  visual: string;
  greeting: string;
}

export interface PlayerState {
  location: string;
  time: string;
  money: string;
  credibility: number;
  suspicion: number;
  health: number;
  knownPeople: string[];
  inventory: string[];
  discoveries: string[];
}

export interface StoryEntry {
  id: number;
  type: "narration" | "player" | "npc" | "system";
  speaker?: string;
  text: string;
}
