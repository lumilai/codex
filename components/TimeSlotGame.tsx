"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, ChevronRight, CircleStop, CornerDownLeft, Eye, Footprints, PackageSearch, Radio, ScanLine, ShieldAlert, Sparkles, UserRound } from "lucide-react";
import { npcTemplates } from "@/data/npcs";
import { initialNarration, linziWorld } from "@/data/world";
import { askTemporalAi, getAvailableActions, initialPlayerState, randomNpc, resolveFreeAction, resolvePreset, sceneTitles } from "@/game/engine";
import type { ActionOption, GamePhase, Npc, PlayerState, SceneId, StoryEntry } from "@/types/game";

function npcForScene(scene: SceneId): Npc {
  const archetype = scene === "drink-stall" ? "vendor" : scene === "gate-queue" ? "soldier" : scene === "city-street" ? "scholar" : null;
  const template = archetype ? npcTemplates.find((item) => item.archetype === archetype) : undefined;
  return { ...(template ?? randomNpc()), memory: [] };
}

function actionIcon(action: ActionOption) {
  if (/观察|看看/.test(action.label)) return Eye;
  if (/行囊|买|浆水/.test(action.label)) return PackageSearch;
  if (/问|盘问|打听|自称/.test(action.label)) return UserRound;
  return Footprints;
}

export function TimeSlotGame() {
  const [phase, setPhase] = useState<GamePhase>("lobby");
  const [progress, setProgress] = useState(0);
  const [npc, setNpc] = useState<Npc | null>(null);
  const [player, setPlayer] = useState<PlayerState>(initialPlayerState);
  const [story, setStory] = useState<StoryEntry[]>([]);
  const [input, setInput] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiMessages, setAiMessages] = useState<string[]>(["神经链路稳定。我会保持静默，除非你呼叫我。历史世界中的人无法察觉我的存在。"]);
  const storyEnd = useRef<HTMLDivElement>(null);

  const availableActions = getAvailableActions(player);

  useEffect(() => {
    storyEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [story]);

  function startTravel() {
    setProgress(0);
    setPlayer(initialPlayerState);
    setPhase("traveling");
    const started = Date.now();
    const timer = window.setInterval(() => {
      const next = Math.min(100, Math.round((Date.now() - started) / 24));
      setProgress(next);
      if (next >= 100) {
        window.clearInterval(timer);
        setNpc(npcForScene("west-road"));
        setStory(initialNarration.map((text, index) => ({ id: index, type: "narration", text })));
        window.setTimeout(() => setPhase("world"), 350);
      }
    }, 50);
  }

  function doPreset(action: ActionOption) {
    if (!npc) return;
    const previousScene = player.scene;
    const result = resolvePreset(action.id, player, npc);
    setStory((items) => [
      ...items,
      { id: Date.now(), type: "player", text: action.label },
      { id: Date.now() + 1, type: "narration", text: result.text },
    ]);
    setPlayer(result.player);
    if (result.player.scene !== previousScene) setNpc(npcForScene(result.player.scene));
  }

  function submitAction() {
    const value = input.trim();
    if (!value || !npc) return;
    const result = resolveFreeAction(value, npc);
    setStory((items) => [
      ...items,
      { id: Date.now(), type: "player", text: value },
      { id: Date.now() + 1, type: "npc", speaker: npc.name, text: result.text },
    ]);
    setPlayer((p) => ({
      ...p,
      turn: p.turn + 1,
      suspicion: Math.min(100, p.suspicion + result.suspicionDelta),
      knownPeople: p.knownPeople.includes(npc.name) ? p.knownPeople : [...p.knownPeople, npc.name],
    }));
    setNpc((current) => current ? { ...current, memory: [...current.memory, result.memory] } : current);
    setInput("");
  }

  function submitAi() {
    if (!npc) return;
    const q = aiQuestion.trim() || "分析当前情况";
    setAiMessages((messages) => [...messages, `你：${q}`, askTemporalAi(q, npc, player)]);
    setAiQuestion("");
  }

  function terminate() {
    setPhase("lobby");
    setStory([]);
    setPlayer(initialPlayerState);
    setNpc(null);
    setAiOpen(false);
    setAiMessages(["神经链路稳定。我会保持静默，除非你呼叫我。历史世界中的人无法察觉我的存在。"]);
  }

  if (phase === "lobby") return <Lobby onStart={startTravel} />;
  if (phase === "traveling") return <Travel progress={progress} />;

  return (
    <main className="world-shell min-h-screen">
      <header className="world-header">
        <div className="brand-mark dark"><span>隙</span></div>
        <div><p className="eyebrow ink">时空投射进行中</p><h1>齐国 · 临淄</h1></div>
        <div className="header-actions">
          <div className="translation"><Radio size={14} /> 古语实时转译：<b>开启</b></div>
          <button className="terminate" onClick={terminate}><CircleStop size={16} />终止穿越</button>
        </div>
      </header>

      <div className="world-layout">
        <aside className="context-panel">
          <p className="section-label">TEMPORAL POSITION</p>
          <div className="date-card"><span>{linziWorld.year}</span><strong>{sceneTitles[player.scene]}</strong><small>{player.time}</small></div>
          <div className="map-orbit"><i className="road r1" /><i className="road r2" /><i className="road r3" /><div className="city">临淄</div><div className="you">你</div></div>
          <div className="state-list">
            <StateRow label="所在位置" value={player.location} />
            <StateRow label="钱财" value={`${player.coins} 枚齐刀币`} />
            <StateRow label="身体状况" value={`${player.health}%`} bar={player.health} />
            <StateRow label="身份可信度" value={`${player.credibility}%`} bar={player.credibility} />
            <StateRow label="受怀疑程度" value={`${player.suspicion}%`} bar={player.suspicion} alert={player.suspicion > 25} />
          </div>
          <details className="world-note"><summary>此时的临淄 <ChevronRight size={14} /></summary><p>{linziWorld.politicalBackground}</p></details>
          <details className="world-note"><summary>你已了解到 <ChevronRight size={14} /></summary><p>{player.discoveries.slice(-5).join("；")}</p></details>
        </aside>

        <section className="story-panel">
          <div className="chapter"><span>第 {player.turn + 1} 刻</span><h2>{sceneTitles[player.scene]}</h2><p>{player.scene === "city-street" ? "城门已经在你身后，真正的临淄开始展开。" : "这个时代不会等待你做完决定才继续向前。"}</p></div>
          <div className="story-stream">
            {story.map((entry) => <StoryBlock key={entry.id} entry={entry} />)}
            {npc && <div className="encounter-card"><div className="npc-seal">{npc.visual}</div><div><p>眼前的人</p><h3>{npc.name}</h3><span>{npc.occupation} · {npc.age}岁 · {npc.origin}</span></div><blockquote>“{npc.greeting}”</blockquote></div>}
            <div ref={storyEnd} />
          </div>
          <div className="actions-wrap">
            <p className="section-label">此刻你可以——</p>
            <div className="preset-grid">
              {availableActions.map((action) => {
                const Icon = actionIcon(action);
                return <button key={action.id} onClick={() => doPreset(action)}><Icon size={17} />{action.label}</button>;
              })}
            </div>
            <div className="free-input"><input aria-label="自由行动" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitAction()} placeholder="或者，自由描述你想对眼前的人说什么……" /><button onClick={submitAction} aria-label="提交行动"><CornerDownLeft size={18} /></button></div>
            <p className="input-hint">行动会改变地点、信息、钱财、可信度与他人的判断；已完成的关键行动不会无限重复。</p>
          </div>
        </section>

        <aside className={`ai-panel ${aiOpen ? "open" : ""}`}>
          <button className="ai-tab" onClick={() => setAiOpen(!aiOpen)}><Sparkles size={18} /><span>询问时空 AI</span></button>
          <div className="ai-head"><div className="ai-core"><Activity /></div><div><p>TEMPORAL AI</p><h3>伴随智能 · 弥</h3></div><button onClick={() => setAiOpen(false)}>×</button></div>
          <div className="ai-status"><span /><b>隐匿信道已连接</b><small>仅你可见</small></div>
          <div className="ai-log">{aiMessages.map((message, i) => <div className={message.startsWith("你：") ? "ai-user" : "ai-message"} key={i}>{!message.startsWith("你：") && <span>弥</span>}<p>{message}</p></div>)}</div>
          <div className="quick-asks"><button onClick={() => setAiQuestion("我该如何解释自己的身份？")}>如何解释身份？</button><button onClick={() => setAiQuestion("这个人可能知道什么？")}>分析眼前的人</button><button onClick={() => setAiQuestion("刀币是什么？")}>解释刀币</button></div>
          <div className="ai-input"><input aria-label="向时空AI提问" value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitAi()} placeholder="低声询问弥……"/><button onClick={submitAi}><CornerDownLeft size={17}/></button></div>
          <p className="ai-rule"><ShieldAlert size={13}/>AI 只能提供信息，不能替你作出选择</p>
        </aside>
      </div>
    </main>
  );
}

function StateRow({ label, value, bar, alert }: { label: string; value: string; bar?: number; alert?: boolean }) {
  return <div className="state-row"><div><span>{label}</span><b className={alert ? "alert" : ""}>{value}</b></div>{bar !== undefined && <i><em style={{ width: `${bar}%` }} className={alert ? "alertbar" : ""} /></i>}</div>;
}

function StoryBlock({ entry }: { entry: StoryEntry }) {
  if (entry.type === "player") return <div className="player-action"><span>你的行动</span><p>{entry.text}</p></div>;
  if (entry.type === "npc") return <div className="npc-response"><span>{entry.speaker}</span><p>“{entry.text}”</p></div>;
  return <p className="narration">{entry.text}</p>;
}

function Lobby({ onStart }: { onStart: () => void }) {
  return <main className="lobby-shell">
    <div className="grid-plane"/><div className="scanline"/><div className="glitch g1"/><div className="glitch g2"/>
    <header className="lobby-header"><div className="brand"><div className="brand-mark"><span>隙</span></div><div><b>时隙</b><small>TIMESLIT / TEMPORAL PROTOCOL</small></div></div><div className="system-online"><i/> SYSTEM ONLINE <span>β 0.2</span></div></header>
    <section className="lobby-content">
      <div className="lobby-copy"><p className="eyebrow">TEMPORAL NAVIGATION TERMINAL</p><h1>在时间的缝隙里，<br/><em>成为一个普通人。</em></h1><p className="intro">这不是历史的旁观席。你将拥有气味、饥饿、误解与选择。<br/>记住：你可以抵达过去，但不能置身事外。</p><div className="notice"><ScanLine size={18}/><p><b>未公开实验协议 // TS-07</b><span>因果扰动监测已启用。请勿暴露未来身份。</span></p></div></div>
      <div className="coordinate-card"><div className="card-top"><span>唯一可用坐标</span><i>COORDINATE LOCKED</i></div><div className="orb"><div className="orb-ring r-a"/><div className="orb-ring r-b"/><div className="orb-core"><small>目标年代</small><strong>公元前<br/><b>305</b> 年</strong></div><div className="tick t1"/><div className="tick t2"/><div className="tick t3"/></div><div className="destination"><span>战国中期</span><h2>齐国 <i>/</i> 临淄</h2><p>36.8°N &nbsp;·&nbsp; 118.3°E</p></div><div className="metrics"><div><small>投射稳定率</small><b>98.7%</b></div><div><small>时间偏差</small><b>± 3 年</b></div><div><small>因果风险</small><b className="low">低</b></div></div><button className="jump-button" onClick={onStart}><span>启动时空迁跃</span><ChevronRight/><i/></button><p className="jump-hint">点击即代表你知悉时空投射风险</p></div>
    </section>
    <footer className="lobby-footer"><span>NEURAL LINK <b>READY</b></span><span>古语语义转译模块 <b>待命</b></span><span>历史坐标库 <b>1 / 2048</b></span></footer>
  </main>;
}

function Travel({ progress }: { progress: number }) {
  return <main className="travel-shell"><div className="tunnel">{Array.from({ length: 14 }).map((_, i) => <i key={i} style={{ animationDelay: `${i * -.11}s` }}/>)}</div><div className="travel-ui"><div className="brand-mark"><span>隙</span></div><p>CONSCIOUSNESS TRANSFER IN PROGRESS</p><h2>{progress < 38 ? "脱离当前时间锚点" : progress < 76 ? "穿越历史数据层" : "正在建立感官映射"}</h2><div className="progress"><i style={{ width: `${progress}%` }}/></div><strong>{String(progress).padStart(3,"0")}<small>%</small></strong><span>请保持呼吸。不要尝试回忆尚未发生的事。</span></div></main>;
}
