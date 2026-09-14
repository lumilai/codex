import { npcTemplates } from "@/data/npcs";
import type { ActionOption, ActionResult, Npc, PlayerState, SceneId } from "@/types/game";

export const initialPlayerState: PlayerState = {
  scene: "west-road",
  location: "临淄城外 · 西门道",
  time: "巳时初 · 上午",
  coins: 3,
  credibility: 42,
  suspicion: 0,
  health: 100,
  turn: 0,
  knownPeople: [],
  inventory: ["粗布行囊", "陶制水囊", "身份拟态凭证"],
  discoveries: ["临淄西门的位置"],
  completedActions: [],
};

export const sceneTitles: Record<SceneId, string> = {
  "west-road": "临淄城外",
  "drink-stall": "城墙下 · 浆水摊",
  "gate-queue": "临淄西门 · 入城队列",
  "city-street": "临淄城内 · 西市街口",
};

export function randomNpc(): Npc {
  return { ...npcTemplates[Math.floor(Math.random() * npcTemplates.length)], memory: [] };
}

function has(player: PlayerState, discovery: string) {
  return player.discoveries.includes(discovery);
}

function done(player: PlayerState, action: string) {
  return player.completedActions.includes(action);
}

function addUnique(items: string[], value: string) {
  return items.includes(value) ? items : [...items, value];
}

function advance(player: PlayerState, patch: Partial<PlayerState>, action: string): PlayerState {
  return {
    ...player,
    ...patch,
    turn: player.turn + 1,
    completedActions: addUnique(player.completedActions, action),
  };
}

export function getAvailableActions(player: PlayerState): ActionOption[] {
  if (player.scene === "west-road") {
    const actions: ActionOption[] = [];
    if (!done(player, "observe-road")) actions.push({ id: "observe-road", label: "观察四周" });
    if (!done(player, "inspect-bag")) actions.push({ id: "inspect-bag", label: "检查行囊" });
    if (has(player, "城墙下的浆水摊")) actions.push({ id: "go-stall", label: "走向浆水摊" });
    if (has(player, "入城队伍与守门士卒")) actions.push({ id: "join-queue", label: "排队入城" });
    if (actions.length === 0) actions.push({ id: "observe-again", label: "再观察片刻" });
    return actions;
  }

  if (player.scene === "drink-stall") {
    return [
      ...(player.coins > 0 && !done(player, "buy-drink") ? [{ id: "buy-drink", label: "买一碗浆水" }] : []),
      ...(!done(player, "ask-stall") ? [{ id: "ask-stall", label: "向摊主打听入城规矩" }] : []),
      { id: "return-road", label: "回到城门大道" },
    ];
  }

  if (player.scene === "gate-queue") {
    if (!done(player, "hear-question")) {
      return [{ id: "hear-question", label: "上前接受盘问" }];
    }
    return [
      { id: "claim-relative", label: "自称来临淄投亲" },
      { id: "claim-trader", label: "自称替家中采买货物" },
      { id: "step-aside", label: "先退到一旁观察别人如何回答" },
    ];
  }

  return [
    ...(!done(player, "observe-city") ? [{ id: "observe-city", label: "观察城内街市" }] : []),
    ...(!done(player, "ask-jixia") ? [{ id: "ask-jixia", label: "打听稷下学宫" }] : []),
    { id: "wander-city", label: "沿街继续走走" },
  ];
}

export function resolvePreset(action: string, player: PlayerState, npc: Npc): ActionResult {
  switch (action) {
    case "observe-road": {
      const discoveries = addUnique(addUnique(player.discoveries, "城墙下的浆水摊"), "入城队伍与守门士卒");
      return {
        text: "你退到路边细看。城墙下有人支着陶缸卖浆水，另一边的入城队伍正缓慢向前。守门士卒偶尔拦下独行的生人，问籍贯与来意。你意识到，直接进城之前，最好先弄清规矩。",
        player: advance(player, { discoveries }, action),
      };
    }
    case "observe-again":
      return {
        text: "你又看了一阵。队伍比方才更长了，日头也升高了些。没有新的异常，只是城门口的盘问似乎变得更仔细。",
        player: advance(player, { suspicion: Math.min(100, player.suspicion + 1) }, action),
      };
    case "inspect-bag":
      return {
        text: `你检查行囊：一只陶制水囊、几件粗布用品，以及 ${player.coins} 枚系统仿制的齐刀币。最麻烦的是“身份拟态凭证”只替你改了衣着和口音，却没有替你编出能经得起追问的家世。`,
        player: advance(player, { discoveries: addUnique(player.discoveries, "自己缺少完整身份说辞") }, action),
      };
    case "go-stall":
      return {
        text: "你绕开木车，来到城墙根下的浆水摊。陶缸上盖着粗布，摊主一边舀水，一边留神城门方向。这里的人说话更松弛，似乎比守门卒更适合打听消息。",
        player: advance(player, { scene: "drink-stall", location: "城墙下 · 浆水摊" }, action),
      };
    case "buy-drink":
      return {
        text: "你递出一枚刀币。摊主在手里掂了掂，给你盛了一碗带着微酸气味的浆水。你喝下去，喉咙舒服了些，也顺便看清周围人如何付钱。",
        player: advance(player, { coins: Math.max(0, player.coins - 1), credibility: Math.min(100, player.credibility + 2), discoveries: addUnique(player.discoveries, "齐刀币的日常使用方式") }, action),
      };
    case "ask-stall":
      return {
        text: "摊主压低声音告诉你：外乡人只要能说清从哪来、进城做什么，通常不会被为难；最忌讳支支吾吾，或把籍贯说得前后不一。你记住了这句话。",
        player: advance(player, { discoveries: addUnique(player.discoveries, "城门盘查重点：籍贯与来意") }, action),
      };
    case "return-road":
      return {
        text: "你离开浆水摊，再次回到西门大道。城门就在前方，队伍正一点点缩短。",
        player: advance(player, { scene: "west-road", location: "临淄城外 · 西门道" }, action),
      };
    case "join-queue":
      return {
        text: "你跟在一辆载陶器的木车后面排进队伍。越靠近城门，谈笑声越少。前面的士卒正逐个打量行人，你很快就要轮到了。",
        player: advance(player, { scene: "gate-queue", location: "临淄西门 · 入城队列" }, action),
      };
    case "hear-question":
      return {
        text: "轮到你时，守门卒抬手拦住去路。他扫了一眼你的衣着，问：‘哪一邑来的？进临淄做什么？’你有一瞬间非常清楚地意识到——这是你抵达这个时代后，第一个真正需要承担后果的回答。",
        player: advance(player, { discoveries: addUnique(player.discoveries, "守门卒正在核验你的身份") }, action),
      };
    case "claim-relative": {
      const prepared = has(player, "城门盘查重点：籍贯与来意");
      const credibility = Math.min(100, player.credibility + (prepared ? 14 : 8));
      const suspicion = Math.max(0, player.suspicion + (prepared ? -2 : 2));
      return {
        text: prepared
          ? "你照刚才打听到的规矩回答：从即墨附近来，进城投奔远亲。士卒又问了两句，你没有多说，只保持说法简单一致。他盯了你片刻，最终摆手放行。"
          : "你说自己从即墨附近来投亲。士卒追问亲族住处，你含糊带过。好在城门正忙，他皱了皱眉，仍然让你通过，只是多看了你一眼。",
        player: advance(player, { scene: "city-street", location: "临淄城内 · 西市街口", credibility, suspicion, discoveries: addUnique(player.discoveries, "成功进入临淄城") }, action),
      };
    }
    case "claim-trader":
      return {
        text: "你说自己替家中来采买货物。士卒扫了眼你空荡荡的行囊，显然不太相信。你补充说货物尚未购置，他才不耐烦地挥手放行。你进了城，但这套说辞并不算漂亮。",
        player: advance(player, { scene: "city-street", location: "临淄城内 · 西市街口", credibility: Math.min(100, player.credibility + 5), suspicion: Math.min(100, player.suspicion + 6), discoveries: addUnique(player.discoveries, "成功进入临淄城") }, action),
      };
    case "step-aside":
      return {
        text: "你装作整理衣带，先退到路边。前面一个商贩被问了籍贯、货物和落脚处，回答都很简短。你听明白了套路，再回到队伍里时，心里已有了底。",
        player: advance(player, { discoveries: addUnique(player.discoveries, "盘查回答宜简短、具体、前后一致"), credibility: Math.min(100, player.credibility + 4) }, action),
      };
    case "observe-city":
      return {
        text: "城内比你想象得更嘈杂。木车、牲畜、叫卖声和人群挤在一处，店肆与作坊沿街展开。你没有看到‘古代’这两个字——只看到很多人正在认真过自己的今天。",
        player: advance(player, { discoveries: addUnique(player.discoveries, "临淄西市的日常景象") }, action),
      };
    case "ask-jixia":
      return {
        text: "你向路旁一名识字的年轻人打听‘稷下’。他指向城东南方向，说那里常有各国士人聚集议论，想听新奇言说的人尽可以去，只是‘别把每个会说话的人都当先生’。一个新的目的地在你脑中亮了起来。",
        player: advance(player, { discoveries: addUnique(player.discoveries, "稷下学宫方向") }, action),
      };
    case "wander-city":
      return {
        text: "你随着人流继续向前。临街传来锤打金属的声音，另一侧有人围着一名游士听他说话。你第一次意识到：临淄不是一个等待你触发的布景，它在你来之前就已经运转了很久。",
        player: advance(player, { time: player.turn > 8 ? "巳时末 · 近午" : player.time }, action),
      };
    default:
      return {
        text: `${npc.name}看了你一眼。周围的人群依旧向前流动，似乎没有谁会因为你的迟疑而停下来。`,
        player: advance(player, {}, action),
      };
  }
}

export function resolveFreeAction(input: string, npc: Npc): { text: string; suspicionDelta: number; memory: string } {
  const suspicious = /手机|电脑|穿越|未来|汽车|飞机|总统|心理|人工智能|AI/.test(input);
  const asking = /哪里|何处|地方|问|请教|怎么|如何|为何/.test(input);
  if (suspicious) return { text: `${npc.name}皱起眉头，显然没有听懂你的词。他后退半步：“你说的是什么怪话？”`, suspicionDelta: 14, memory: `你说过难以理解的词：${input}` };
  if (asking) return { text: `${npc.name}打量了你的衣着，答道：“这里自然是齐国临淄。看你风尘仆仆，是从外邑来的吧？”`, suspicionDelta: 2, memory: `你向其打听过事情：${input}` };
  return { text: `${npc.name}听完你的话，略一思量：“异乡人，你的言辞有些特别。不过临淄见惯了各国来客，倒也不算稀奇。”`, suspicionDelta: 4, memory: `你曾对其说：${input}` };
}

export function askTemporalAi(question: string, npc: Npc, player?: PlayerState): string {
  if (/身份|来历/.test(question)) return "建议使用简单且难以核验的身份：例如从即墨附近来临淄投亲的庶人。避免自称士族；礼仪与口音会暴露你。最终如何回答由你决定。";
  if (/钱|刀币|货币/.test(question)) return `你目前携带 ${player?.coins ?? 0} 枚系统仿制的齐刀币。战国各国货币形制不一，齐地以刀币著称。`;
  if (/士|庶人|卿|大夫|邑/.test(question)) return "这些是当时常见的身份与行政称谓。“士”可指有一定学识或身份的人；“庶人”泛指平民；卿、大夫为贵族或官僚等级；“邑”是城邑或封地。";
  if (/他|她|这个人|对方/.test(question)) return `${npc.name}是一名${npc.occupation}。依据其衣着、口音和行为判断，对方最熟悉的领域可能是：${npc.knowledge.join("、")}。他/她目前已记住与你相关的 ${npc.memory.length} 件事。`;
  return "你正在一个持续运转的历史环境里。先观察规则，再决定是否冒险。世界不会因为你停下来而暂停，我可以解释信息，但不会替你选择行动。";
}
