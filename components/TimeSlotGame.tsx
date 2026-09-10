"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, ArrowLeft, ChevronRight, CircleStop, CornerDownLeft, Eye, Footprints, Gauge, PackageSearch, Radio, ScanLine, ShieldAlert, Sparkles, UserRound } from "lucide-react";
import { initialNarration, linziWorld } from "@/data/world";
import { askTemporalAi, initialPlayerState, randomNpc, resolveFreeAction, resolvePreset } from "@/game/engine";
import type { GamePhase, Npc, PlayerState, StoryEntry } from "@/types/game";

const presetActions = [
  { id: "observe", label: "观察四周", icon: Eye },
  { id: "follow", label: "跟随队伍", icon: Footprints },
  { id: "inspect", label: "检查行囊", icon: PackageSearch },
  { id: "talk", label: "与陌生人交谈", icon: UserRound },
];

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

  useEffect(() => storyEnd.current?.scrollIntoView({ behavior: "smooth" }), [story]);

  function startTravel() {
    setProgress(0);
    setPhase("traveling");
    const started = Date.now();
    const timer = window.setInterval(() => {
      const next = Math.min(100, Math.round((Date.now() - started) / 24));
      setProgress(next);
      if (next >= 100) {
        window.clearInterval(timer);
        const encountered = randomNpc();
        setNpc(encountered);
        setStory(initialNarration.map((text, index) => ({ id: index, type: "narration", text })));
        window.setTimeout(() => setPhase("world"), 350);
      }
    }, 50);
  }

  function doPreset(id: string) {
    if (!npc) return;
    setStory((items) => [...items, { id: Date.now(), type: "player", text: presetActions.find((a) => a.id === id)?.label ?? id }, { id: Date.now() + 1, type: "narration", text: resolvePreset(id, npc) }]);
  }

  function submitAction() {
    const value = input.trim();
    if (!value || !npc) return;
    const result = resolveFreeAction(value, npc);
    setStory((items) => [...items, { id: Date.now(), type: "player", text: value }, { id: Date.now() + 1, type: "npc", speaker: npc.name, text: result.text }]);
    setPlayer((p) => ({ ...p, suspicion: Math.min(100, p.suspicion + result.suspicionDelta), knownPeople: p.knownPeople.includes(npc.name) ? p.knownPeople : [...p.knownPeople, npc.name] }));
    setInput("");
  }

  function submitAi() {
    if (!npc) return;
    const q = aiQuestion.trim() || "分析当前情况";
    setAiMessages((messages) => [...messages, `你：${q}`, askTemporalAi(q, npc)]);
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
          <div className="date-card"><span>{linziWorld.year}</span><strong>临淄城外</strong><small>{player.time}</small></div>
          <div className="map-orbit"><i className="road r1" /><i className="road r2" /><i className="road r3" /><div className="city">临淄</div><div className="you">你</div></div>
          <div className="state-list">
            <StateRow label="所在位置" value={player.location} />
            <StateRow label="钱财" value={player.money} />
            <StateRow label="身体状况" value={`${player.health}%`} bar={player.health} />
            <StateRow label="身份可信度" value={`${player.credibility}%`} bar={player.credibility} />
            <StateRow label="受怀疑程度" value={`${player.suspicion}%`} bar={player.suspicion} alert={player.suspicion > 25} />
          </div>
          <details className="world-note"><summary>此时的临淄 <ChevronRight size={14} /></summary><p>{linziWorld.politicalBackground}</p></details>
        </aside>

        <section className="story-panel">
          <div className="chapter"><span>第一刻</span><h2>城门之外</h2><p>风从西边来，卷起车辙里细小的尘土。</p></div>
          <div className="story-stream">
            {story.map((entry) => <StoryBlock key={entry.id} entry={entry} />)}
            {npc && <div className="encounter-card"><div className="npc-seal">{npc.visual}</div><div><p>你遇见了</p><h3>{npc.name}</h3><span>{npc.occupation} · {npc.age}岁 · {npc.origin}</span></div><blockquote>“{npc.greeting}”</blockquote></div>}
            <div ref={storyEnd} />
          </div>
          <div className="actions-wrap">
            <p className="section-label">你准备如何行动？</p>
            <div className="preset-grid">{presetActions.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => doPreset(id)}><Icon size={17} />{label}</button>)}</div>
            <div className="free-input"><input aria-label="自由行动" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitAction()} placeholder="或者，自由描述你的行动……" /><button onClick={submitAction} aria-label="提交行动"><CornerDownLeft size={18} /></button></div>
            <p className="input-hint">你的言行会影响身份可信度与他人的判断</p>
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
    <header className="lobby-header"><div className="brand"><div className="brand-mark"><span>隙</span></div><div><b>时隙</b><small>TIMESLIT / TEMPORAL PROTOCOL</small></div></div><div className="system-online"><i/> SYSTEM ONLINE <span>β 0.1</span></div></header>
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
