import React, { useCallback, useMemo, useRef, useState } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useAudioEngine } from '../../hooks/useAudioEngine';

type Quality = 'major' | 'minor';
type Instrument = 'piano' | 'guitar' | 'bass';

const ROOTS = ['C4','C#4','D4','D#4','E4','F4','F#4','G4','G#4','A4','A#4','B4'];

const toChord = (root: string, quality: Quality): string[] => {
  // simple semitone map
  const notes = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const pitch = parseInt(root.replace(/^[A-G]#?/, ''), 10) || 4;
  const rootName = root.replace(/[0-9]/g, '');
  const i = notes.indexOf(rootName);
  const third = (i + (quality === 'major' ? 4 : 3)) % 12;
  const fifth = (i + 7) % 12;
  const n = (idx: number) => `${notes[idx]}${pitch + (i > idx ? 1 : 0)}`;
  return [root, n(third), n(fifth)];
};

const labelNote = (note: string) => note.replace(/[0-9]/g,'');
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const noteToPc = (note: string): number => NOTE_NAMES.indexOf(note.replace(/[0-9]/g,''));

const ChordMagic: React.FC = () => {
  const audio = useAudioEngine();
  const [mode, setMode] = useState<'ear' | 'build'>('ear');
  const [targetRoot, setTargetRoot] = useState<string>('C4');
  const [targetQuality, setTargetQuality] = useState<Quality>('major');
  const [choicesShown, setChoicesShown] = useState<boolean>(false);
  const [buildRoot, setBuildRoot] = useState<string>('C4');
  const [buildQuality, setBuildQuality] = useState<Quality>('major');
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const busyRef = useRef(false);
  const [instrument, setInstrument] = useState<Instrument>('piano');
  // 耳朵友好选项
  const [earSlow, setEarSlow] = useState<boolean>(true);      // 慢速
  const [earArp, setEarArp] = useState<boolean>(true);        // 分解播放
  const [earRepeat, setEarRepeat] = useState<boolean>(false); // 重复一次
  const [earAB, setEarAB] = useState<boolean>(false);         // 大/小 A-B 对比
  const [showChordInfo, setShowChordInfo] = useState<boolean>(false); // 显示题目质地

  const randomTarget = useCallback(() => {
    const r = ROOTS[Math.floor(Math.random()*ROOTS.length)];
    const q: Quality = Math.random() < 0.5 ? 'major' : 'minor';
    setTargetRoot(r);
    setTargetQuality(q);
  }, []);

  const playChordOnce = useCallback(async (root: string, quality: Quality) => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      await audio.initialize();
      const notes = toChord(root, quality);
      audio.playChord(notes, '1n');
    } finally {
      setTimeout(()=>{ busyRef.current = false; }, 300);
    }
  }, [audio]);

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const playChordWithOptions = useCallback(async (root: string, quality: Quality) => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      await audio.initialize();
      const notes = toChord(root, quality);
      const gap = earSlow ? 550 : 250; // 毫秒
      if (earArp) {
        // 分解播放（可选重复）
        const run = async () => {
          for (const n of notes) { audio.playNote(n, '8n'); await sleep(gap); }
        };
        await run();
        if (earRepeat) { await sleep(gap); await run(); }
      } else {
        // 和弦整体播放（可选重复）
        audio.playChord(notes, earSlow ? '2n' : '1n');
        if (earRepeat) { await sleep(gap + 300); audio.playChord(notes, earSlow ? '2n' : '1n'); }
      }
      // A/B 对比（同根音的大/小交替）
      if (earAB) {
        const other: Quality = quality === 'major' ? 'minor' : 'major';
        await sleep(gap + 200);
        const otherNotes = toChord(root, other);
        if (earArp) {
          for (const n of otherNotes) { audio.playNote(n, '8n'); await sleep(gap); }
        } else {
          audio.playChord(otherNotes, earSlow ? '2n' : '1n');
        }
      }
    } finally {
      setTimeout(()=>{ busyRef.current = false; }, 200);
    }
  }, [audio, earArp, earSlow, earRepeat, earAB]);

  const startEarQuestion = useCallback(async () => {
    // 生成并立即播放（避免状态延迟导致的播放目标不一致）
    const r = ROOTS[Math.floor(Math.random()*ROOTS.length)];
    const q: Quality = Math.random() < 0.5 ? 'major' : 'minor';
    setTargetRoot(r);
    setTargetQuality(q);
    setChoicesShown(true);
    await playChordWithOptions(r, q);
  }, [playChordWithOptions]);

  const answerEar = useCallback(async (quality: Quality) => {
    if (!choicesShown) return;
    const correct = (quality === targetQuality);
    setScore(prev => ({ correct: prev.correct + (correct?1:0), total: prev.total + 1 }));
    // 回放正确答案
    await playChordWithOptions(targetRoot, targetQuality);
    // 下一题
    setTimeout(() => { startEarQuestion(); }, 500);
  }, [choicesShown, targetQuality, targetRoot, playChordWithOptions, startEarQuestion]);

  const playBuiltChord = useCallback(async () => {
    await playChordWithOptions(buildRoot, buildQuality);
  }, [playChordWithOptions, buildRoot, buildQuality]);

  const highlightPcs = useMemo(() => {
    const [r, q] = mode === 'ear' ? [targetRoot, targetQuality] : [buildRoot, buildQuality];
    return new Set(toChord(r, q).map(noteToPc));
  }, [mode, targetRoot, targetQuality, buildRoot, buildQuality]);

  const PianoKeyboard: React.FC<{ pcs: Set<number> }> = ({ pcs }) => {
    const isBlack = (pc: number) => [1,3,6,8,10].includes(pc%12);
    const whites: number[] = [];
    const blacks: number[] = [];
    for (let pc = 0; pc < 12; pc++) (isBlack(pc)?blacks:whites).push(pc);
    return (
      <div className="relative w-full max-w-3xl mx-auto select-none mt-3">
        <div className="flex">
          {Array.from({length: 14}, (_,i)=>i).map((o)=> (
            whites.map((pc, idx)=>(
              <div key={`w-${o}-${idx}`} className={`relative h-28 md:h-32 w-8 md:w-10 border border-gray-300 ${pcs.has(pc)?'bg-blue-200':'bg-white'}`} />
            ))
          ))}
        </div>
        <div className="absolute top-0 left-0 flex">
          {Array.from({length: 14}, (_,o)=>o).map((o)=> (
            blacks.map((pc, idx)=>(
              <div key={`b-${o}-${idx}`} className={`h-16 md:h-20 w-5 md:w-6 -ml-2.5 md:-ml-3 ${pcs.has(pc)?'bg-blue-500':'bg-black'} border border-gray-800`} />
            ))
          ))}
        </div>
      </div>
    );
  };

  const Fretboard: React.FC<{ strings: number[]; frets?: number; pcs: Set<number>; invertBottom?: boolean }>
    = ({ strings, frets=5, pcs, invertBottom=true }) => {
    const renderStrings = invertBottom ? [...strings].slice().reverse() : strings;
    return (
      <div className="overflow-x-auto mt-3">
        <div className="inline-block">
          {renderStrings.map((openPc, sIdx)=> (
            <div key={sIdx} className="flex items-center">
              {Array.from({length: frets+1}, (_,f)=>{
                const pc = (openPc + f) % 12;
                const active = pcs.has(pc);
                return <div key={f} className={`w-10 h-8 md:w-12 md:h-10 border border-gray-300 flex items-center justify-center ${active?'bg-blue-200':'bg-white'}`}><span className="text-[10px] text-gray-600">{NOTE_NAMES[pc]}</span></div>;
              })}
            </div>
          ))}
          <div className="flex text-[10px] text-gray-500 mt-1">
            {Array.from({length: frets+1},(_,f)=>(<div key={f} className="w-10 md:w-12 text-center">{f}</div>))}
          </div>
        </div>
      </div>
    );
  };

  const guitarOpenPcs = useMemo(()=>['E','A','D','G','B','E'].map(n=>NOTE_NAMES.indexOf(n)), []);
  const bassOpenPcs = useMemo(()=>['E','A','D','G'].map(n=>NOTE_NAMES.indexOf(n)), []);

  const Tips = useMemo(() => (
    <Card className="p-4 text-sm text-gray-700 space-y-2">
      <div className="font-semibold text-gray-900">🎯 小技巧（大小三和弦）</div>
      <ul className="list-disc pl-5 space-y-1">
        <li>大三和弦：明亮稳定（大三度间距较“开”）。</li>
        <li>小三和弦：偏柔和/忧郁（小三度更“近”）。</li>
        <li>先只听质地（大/小），不关心根音；多做 A/B 对比。</li>
        <li>构建练习：根音→三度→五度，先确定三度性质（大3=4半音，小3=3半音）。</li>
      </ul>
    </Card>
  ), []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">🔀 和弦魔法 · 大/小三和弦</h2>
          <p className="text-gray-600 text-sm">听辨大小三和弦与构建练习</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={mode==='ear'?'primary':'secondary'} onClick={()=>setMode('ear')}>听辨</Button>
          <Button variant={mode==='build'?'primary':'secondary'} onClick={()=>setMode('build')}>构建</Button>
        </div>
      </div>

      {mode==='ear' ? (
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="md:col-span-2 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Button variant="secondary" onClick={startEarQuestion}>播放题目</Button>
              <Button variant="secondary" onClick={()=>playChordWithOptions(targetRoot, targetQuality)}>重放</Button>
              <div className="flex items-center gap-1 text-xs text-gray-600 ml-2">
                <Button variant={earSlow?'primary':'secondary'} onClick={()=>setEarSlow(s=>!s)}>{earSlow?'慢速':'常速'}</Button>
                <Button variant={earArp?'primary':'secondary'} onClick={()=>setEarArp(a=>!a)}>{earArp?'分解':'整体'}</Button>
                <Button variant={earRepeat?'primary':'secondary'} onClick={()=>setEarRepeat(r=>!r)}>{earRepeat?'重复×2':'单次'}</Button>
                <Button variant={earAB?'primary':'secondary'} onClick={()=>setEarAB(b=>!b)}>{earAB?'A/B对比✓':'A/B对比'}</Button>
                <Button variant={showChordInfo?'primary':'secondary'} onClick={()=>setShowChordInfo(v=>!v)}>{showChordInfo?'显示质地✓':'显示质地'}</Button>
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-2">
              当前题目：根音 <span className="font-semibold">{labelNote(targetRoot)}</span>
              {showChordInfo ? (
                <> • <span className="font-semibold">{targetQuality==='major'?'大三和弦':'小三和弦'}</span></>
              ) : ' • 质地隐藏'}
              {showChordInfo && (
                <> • 音名 {toChord(targetRoot, targetQuality).map(labelNote).join('-')}</>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="primary" onClick={()=>answerEar('major')}>大三和弦</Button>
              <Button variant="primary" onClick={()=>answerEar('minor')}>小三和弦</Button>
            </div>
            <div className="mt-4">
              {instrument==='piano' && <PianoKeyboard pcs={highlightPcs} />}
              {instrument==='guitar' && <Fretboard strings={guitarOpenPcs} pcs={highlightPcs} invertBottom />}
              {instrument==='bass' && <Fretboard strings={bassOpenPcs} pcs={highlightPcs} invertBottom />}
            </div>
          </Card>
          <div className="space-y-3">
            <Card className="p-4 text-center">
              <div className="text-lg font-bold text-blue-600">{score.correct}</div>
              <div className="text-xs text-gray-600">答对 / 总题数：{score.correct} / {score.total}</div>
            </Card>
            {Tips}
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="md:col-span-2 p-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">选择根音：</span>
              <div className="flex flex-wrap gap-1">
                {ROOTS.map(r => (
                  <Button key={r} variant={r===buildRoot?'primary':'secondary'} onClick={()=>setBuildRoot(r)}>{labelNote(r)}</Button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">和弦种类：</span>
              <Button variant={buildQuality==='major'?'primary':'secondary'} onClick={()=>setBuildQuality('major')}>大三和弦</Button>
              <Button variant={buildQuality==='minor'?'primary':'secondary'} onClick={()=>setBuildQuality('minor')}>小三和弦</Button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="secondary" onClick={playBuiltChord}>试听和弦</Button>
              <div className="text-sm text-gray-600">
                当前构建：根音 <span className="font-semibold">{labelNote(buildRoot)}</span>
                {showChordInfo ? (
                  <> • <span className="font-semibold">{buildQuality==='major'?'大三和弦':'小三和弦'}</span> • 音名 {toChord(buildRoot, buildQuality).map(labelNote).join('-')}</>
                ) : ' • 质地隐藏'}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Button variant={earSlow?'primary':'secondary'} onClick={()=>setEarSlow(s=>!s)}>{earSlow?'慢速':'常速'}</Button>
                <Button variant={earArp?'primary':'secondary'} onClick={()=>setEarArp(a=>!a)}>{earArp?'分解':'整体'}</Button>
                <Button variant={earRepeat?'primary':'secondary'} onClick={()=>setEarRepeat(r=>!r)}>{earRepeat?'重复×2':'单次'}</Button>
                <Button variant={showChordInfo?'primary':'secondary'} onClick={()=>setShowChordInfo(v=>!v)}>{showChordInfo?'显示质地✓':'显示质地'}</Button>
              </div>
            </div>
            <div className="mt-2">
              {instrument==='piano' && <PianoKeyboard pcs={highlightPcs} />}
              {instrument==='guitar' && <Fretboard strings={guitarOpenPcs} pcs={highlightPcs} invertBottom />}
              {instrument==='bass' && <Fretboard strings={bassOpenPcs} pcs={highlightPcs} invertBottom />}
            </div>
          </Card>
          <div className="space-y-3">
            {Tips}
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">乐器视图：</span>
        <Button variant={instrument==='piano'?'primary':'secondary'} onClick={()=>setInstrument('piano')}>钢琴</Button>
        <Button variant={instrument==='guitar'?'primary':'secondary'} onClick={()=>setInstrument('guitar')}>吉他</Button>
        <Button variant={instrument==='bass'?'primary':'secondary'} onClick={()=>setInstrument('bass')}>贝斯</Button>
      </div>
    </div>
  );
};

export default ChordMagic;


