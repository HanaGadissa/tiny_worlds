import { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Line, Text, Transformer , Group} from 'react-konva';
import Konva from 'konva';
import { api, Item, Obj, Room, Challenge, RoomSummary } from './api';
import { THEMES, WALLPAPERS, FLOORS, PATTERNS } from './themes';
import Furniture from './furniture';
const W = 800, H = 520, WALL = 280;
const blank = (): Room => ({ name: 'My tiny room', theme: 'lavender', wallpaper: THEMES.lavender.wallpaper, floorColor: THEMES.lavender.floorColor, floorPattern: 'planks', challengeId: null, objects: [] });

function Floor({ pattern }: { pattern: string }) {
  const els: JSX.Element[] = [];
  if (pattern === 'planks') for (let y = WALL + 40; y < H; y += 40) els.push(<Line key={y} points={[0, y, W, y]} stroke="rgba(0,0,0,.12)" listening={false} />);
  if (pattern === 'checker') for (let i = 0; i < W / 40; i++) for (let j = 0; j < (H - WALL) / 40; j++)
    if ((i + j) % 2) els.push(<Rect key={`${i}-${j}`} x={i * 40} y={WALL + j * 40} width={40} height={40} fill="rgba(255,255,255,.4)" listening={false} />);
  return <>{els}</>;
}

export default function Editor({ username, onLogout }: { username: string; onLogout: () => void }) {
  const [catalog, setCatalog] = useState<Item[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [room, setRoom] = useState<Room>(blank());
  const [sel, setSel] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const items = useMemo(() => Object.fromEntries(catalog.map((i) => [i.key, i])), [catalog]);

  const refresh = () => api.rooms().then(setRooms).catch(() => {});
  useEffect(() => { api.catalog().then(setCatalog); api.challenges().then(setChallenges); refresh(); }, []);
  useEffect(() => {
    const node = sel ? stageRef.current?.findOne('#' + sel) : null;
    trRef.current?.nodes(node ? [node] : []);
    trRef.current?.getLayer()?.batchDraw();
  }, [sel, room.objects]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (sel && (e.key === 'Delete' || e.key === 'Backspace') && !(e.target instanceof HTMLInputElement)) remove(); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  });

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2500); };
  const patch = (p: Partial<Room>) => setRoom((r) => ({ ...r, ...p }));
  const setObj = (id: string, p: Partial<Obj>) => setRoom((r) => ({ ...r, objects: r.objects.map((o) => (o.id === id ? { ...o, ...p } : o)) }));
  const add = (it: Item) => { const id = crypto.randomUUID(); patch({ objects: [...room.objects, { id, key: it.key, x: 150 + Math.random() * 500, y: 200 + Math.random() * 250, rotation: 0, scale: 1 }] }); setSel(id); };
  const remove = () => { patch({ objects: room.objects.filter((o) => o.id !== sel) }); setSel(null); };
  const rotate = () => sel && setObj(sel, { rotation: ((room.objects.find((o) => o.id === sel)?.rotation || 0) + 15) % 360 });
  const theme = (k: keyof typeof THEMES) => patch({ theme: k, wallpaper: THEMES[k].wallpaper, floorColor: THEMES[k].floorColor, floorPattern: THEMES[k].floorPattern });

  const spent = room.objects.reduce((s, o) => s + (items[o.key]?.price || 0), 0);
  const ch = challenges.find((c) => c.id === room.challengeId);
  const have = (tag: string) => room.objects.filter((o) => items[o.key]?.tag === tag).length;
  const done = ch && Object.entries(ch.required).every(([t, n]) => have(t) >= n) && spent <= ch.budget;

  const save = async () => {
    try {
      const saved = room.id ? await api.update(room.id, room) : await api.create(room);
      setRoom((r) => ({ ...r, id: saved.id })); refresh(); flash('Saved ✨');
    } catch (e: any) { flash(e.message); }
  };
  const load = async (id: number) => { try { setRoom(await api.room(id)); setSel(null); } catch (e: any) { flash(e.message); } };
  const del = async () => { if (room.id && confirm('Delete this room?')) { await api.remove(room.id); setRoom(blank()); refresh(); } };

  return (
    <div className="app">
      <header>
        <h1>🏡 Tiny Worlds</h1>
        <input value={room.name} onChange={(e) => patch({ name: e.target.value })} />
        <button onClick={save}>💾 Save</button>
        <button onClick={() => { setRoom(blank()); setSel(null); }}>New</button>
        {room.id && <button className="ghost" onClick={del}>🗑 Delete</button>}
        <span className="msg">{msg}</span>
        <span className="spacer" />
        <span>{username}</span><button className="ghost" onClick={onLogout}>Log out</button>
      </header>
      <div className="layout">
        <aside>
          <h3>Catalog</h3>
          {[...new Set(catalog.map((i) => i.category))].map((cat) => (
            <div key={cat}><h4>{cat}</h4><div className="grid">
              {catalog.filter((i) => i.category === cat).map((i) => (
                <button key={i.key} className="item" title={i.name} onClick={() => add(i)}><span>{i.emoji}</span><small>${i.price}</small></button>))}
            </div></div>))}
        </aside>
        <main>
          <Stage ref={stageRef} width={W} height={H} className="stage"
            onMouseDown={(e) => e.target.name() === 'bg' && setSel(null)} onTouchStart={(e) => e.target.name() === 'bg' && setSel(null)}>
            <Layer>
              <Rect name="bg" width={W} height={WALL} fill={room.wallpaper} />
              <Rect name="bg" y={WALL} width={W} height={H - WALL} fill={room.floorColor} />
              <Floor pattern={room.floorPattern} />
              <Rect y={WALL - 6} width={W} height={6} fill="rgba(0,0,0,.1)" listening={false} />
              {room.objects.map((o) => (
                 <Group
  key={o.id}
  id={o.id}
  x={o.x}
  y={o.y}
  rotation={o.rotation}
  scaleX={o.scale}
  scaleY={o.scale}
  draggable
  onClick={() => setSel(o.id)}
  onTap={() => setSel(o.id)}
  onDragStart={() => setSel(o.id)}
  dragBoundFunc={(p) => ({
    x: Math.min(W, Math.max(0, p.x)),
    y: Math.min(H, Math.max(0, p.y)),
  })}
  onDragEnd={(e) =>
    setObj(o.id, { x: e.target.x(), y: e.target.y() })
  }
  onTransformEnd={(e) => {
    const n = e.target;
    setObj(o.id, {
      rotation: n.rotation(),
      scale: n.scaleX(),
      x: n.x(),
      y: n.y(),
    });
  }}
>
  <Furniture itemKey={o.key} size={80} />
</Group>))}
              <Transformer ref={trRef} keepRatio enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']} />
            </Layer>
          </Stage>
          <div className="toolbar">
            <button disabled={!sel} onClick={rotate}>⟳ Rotate</button>
            <button disabled={!sel} onClick={remove}>✕ Remove</button>
            <small>Click an item to add · drag to move · corner handles resize/rotate · Delete key removes</small>
          </div>
        </main>
        <aside>
          <h3>Style</h3>
          <select value={THEMES[room.theme as keyof typeof THEMES] ? room.theme : ''} onChange={(e) => e.target.value && theme(e.target.value as keyof typeof THEMES)}>
            <option value="">Custom</option>{Object.entries(THEMES).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}</select>
          <h4>Wallpaper</h4><div className="swatches">{WALLPAPERS.map((c) => <i key={c} style={{ background: c }} className={c === room.wallpaper ? 'on' : ''} onClick={() => patch({ wallpaper: c, theme: 'custom' })} />)}</div>
          <h4>Floor</h4><div className="swatches">{FLOORS.map((c) => <i key={c} style={{ background: c }} className={c === room.floorColor ? 'on' : ''} onClick={() => patch({ floorColor: c, theme: 'custom' })} />)}</div>
          <select value={room.floorPattern} onChange={(e) => patch({ floorPattern: e.target.value })}>{PATTERNS.map((p) => <option key={p}>{p}</option>)}</select>

          <h3>Design challenge</h3>
          <select value={room.challengeId ?? ''} onChange={(e) => patch({ challengeId: e.target.value ? Number(e.target.value) : null })}>
            <option value="">Free decorating</option>{challenges.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
          {ch && <div className="challenge">
            <p>{ch.description}</p>
            <p className={spent > ch.budget ? 'bad' : ''}>💰 ${spent} / ${ch.budget}</p>
            <ul>{Object.entries(ch.required).map(([t, n]) => <li key={t} className={have(t) >= n ? 'ok' : ''}>{have(t) >= n ? '✅' : '⬜'} {t} ({Math.min(have(t), n)}/{n})</li>)}</ul>
            {done && <strong>🎉 Challenge complete!</strong>}
          </div>}

          <h3>My rooms</h3>
          <ul className="rooms">{rooms.map((r) => <li key={r.id} className={r.id === room.id ? 'on' : ''} onClick={() => load(r.id)}>{r.name}</li>)}
            {!rooms.length && <small>No saved rooms yet.</small>}</ul>
        </aside>
      </div>
    </div>
  );
}
