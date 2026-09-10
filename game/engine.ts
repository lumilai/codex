import { npcTemplates } from "@/data/npcs";
import type { Npc, PlayerState } from "@/types/game";

export const initialPlayerState: PlayerState = {
  location: "临淄城外 · 西门道",
  time: "巳时初 · 上午",
  money: "齐刀币 × 3",
  credibility: 42,
  suspicion: 0,
  health: 100,
  knownPeople: [],
  inventory: ["粗布行囊", "陶制水囊", "身份拟态凭证"],
  discoveries: ["临淄西门的位置"],
};

export function randomNpc(): Npc {
  return { ...npcTemplates[Math.floor(Math.random() * npcTemplates.length)], memory: [] };
}

const actionResponses: Record<string, string> = {
  observe: "你退到路边细看：入城者大多低着头赶路，木车载着陶器、柴束和粮袋。守门士卒偶尔拦下独行的生人问话。城墙下有商贩在兜售浆水。",
  follow: "你不远不近地跟上入城队伍。前方的人熟练地取出几枚刀形铜币，队伍也随之缓慢向城门挪动。",
  inspect: "你摸了摸腰间。粗布衣袍下挂着一只旧行囊，里面有水囊和三枚齐刀币。拟态系统没有为你编造完整身份——这部分得由你自己决定。",
};

export function resolvePreset(action: string, npc: Npc) {
  if (action === "talk") return `${npc.name}看向你，等着你开口。你察觉到对方还没有完全放下戒心。`;
  return actionResponses[action] ?? "你稍作停留，周围的人群仍不断向城门移动。";
}

export function resolveFreeAction(input: string, npc: Npc): { text: string; suspicionDelta: number } {
  const suspicious = /手机|电脑|穿越|未来|汽车|飞机|总统|心理/.test(input);
  const asking = /哪里|何处|地方|问|请教/.test(input);
  if (suspicious) return { text: `${npc.name}皱起眉头，显然没有听懂你的词。他后退半步：“你说的是什么怪话？”`, suspicionDelta: 14 };
  if (asking) return { text: `${npc.name}打量了你的衣着，答道：“这里自然是齐国临淄。看你风尘仆仆，是从外邑来的吧？”`, suspicionDelta: 2 };
  return { text: `${npc.name}听完你的话，略一思量：“异乡人，你的言辞有些特别。不过临淄见惯了各国来客，倒也不算稀奇。”`, suspicionDelta: 4 };
}

export function askTemporalAi(question: string, npc: Npc): string {
  if (/身份|来历/.test(question)) return "建议使用简单且难以核验的身份：例如从即墨附近来临淄投亲的庶人。避免自称士族；礼仪与口音会暴露你。最终如何回答由你决定。";
  if (/钱|刀币|货币/.test(question)) return "你携带的是系统仿制的齐刀币。战国各国货币形制不一，齐地以刀币著称。三枚只够应付眼前的小额交易。";
  if (/士|庶人|卿|大夫|邑/.test(question)) return "这些是当时常见的身份与行政称谓。“士”可指有一定学识或身份的人；“庶人”泛指平民；卿、大夫为贵族或官僚等级；“邑”是城邑或封地。";
  if (/他|她|这个人|对方/.test(question)) return `${npc.name}是一名${npc.occupation}。依据其衣着、口音和行为判断，对方最熟悉的领域可能是：${npc.knowledge.join("、")}。此判断并非读心。`;
  return "当前风险较低。你位于临淄城外，陌生人的口音与来历会受注意。先观察称谓与入城规则，比贸然谈论后世知识更安全。我可以解释，但不会替你选择行动。";
}
