import React, { useCallback, useMemo, useRef, useState } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useAudioEngine } from '../../hooks/useAudioEngine';

type Degree = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface ScaleDef {
  name: string;
  tonic: string; // e.g. C4
  degrees: { degree: Degree; note: string; label: string }[]; // 1..8
  steps: ('W' | 'H')[]; // between degrees: length 7
}

const C_MAJOR: ScaleDef = {
  name: 'C 大调 (Ionian)',
  tonic: 'C4',
  degrees: [
    { degree: 1, note: 'C4', label: '1 (Do)' },
    { degree: 2, note: 'D4', label: '2 (Re)' },
    { degree: 3, note: 'E4', label: '3 (Mi)' },
    { degree: 4, note: 'F4', label: '4 (Fa)' },
    { degree: 5, note: 'G4', label: '5 (Sol)' },
    { degree: 6, note: 'A4', label: '6 (La)' },
    { degree: 7, note: 'B4', label: '7 (Ti)' },
    { degree: 8, note: 'C5', label: '8 (Do\' )' },
  ],
  steps: ['W', 'W', 'H', 'W', 'W', 'W', 'H'],
};

const ScaleAdventure: React.FC = () => {
  const audio = useAudioEngine();
  const [scale] = useState<ScaleDef>(C_MAJOR);
  const [quizMode, setQuizMode] = useState<'off' | 'next-degree' | 'ear-training'>('off');
  const [currentIdx, setCurrentIdx] = useState<number>(0); // 0..7 index for UI highlight
  const [targetIdx, setTargetIdx] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const playingRef = useRef<boolean>(false);
  const [wrongIdx, setWrongIdx] = useState<number | null>(null);

  const nodes = scale.degrees;
  const bridges = scale.steps; // length 7

  const playNote = useCallback(async (idx: number) => {
    try {
      await audio.initialize();
      audio.playNote(nodes[idx].note);
    } catch (e) {
      console.warn('audio init failed:', e);
    }
  }, [audio, nodes]);

  const playAscending = useCallback(async () => {
    if (playingRef.current) return;
    playingRef.current = true;
    try {
      await audio.initialize();
      const bpm = 100;
      audio.setBPM(bpm);
      for (let i = 0; i < nodes.length; i++) {
        setCurrentIdx(i);
        audio.playNote(nodes[i].note, '8n');
        await new Promise(r => setTimeout(r, 300));
      }
    } finally {
      playingRef.current = false;
    }
  }, [audio, nodes]);

  const playDescending = useCallback(async () => {
    if (playingRef.current) return;
    playingRef.current = true;
    try {
      await audio.initialize();
      const bpm = 100;
      audio.setBPM(bpm);
      for (let i = nodes.length - 1; i >= 0; i--) {
        setCurrentIdx(i);
        audio.playNote(nodes[i].note, '8n');
        await new Promise(r => setTimeout(r, 300));
      }
    } finally {
      playingRef.current = false;
    }
  }, [audio, nodes]);

  const startNextDegreeQuiz = useCallback(async () => {
    setQuizMode('next-degree');
    setScore({ correct: 0, total: 0 });
    setCurrentIdx(0);
    setTargetIdx(1);
    await playNote(0);
  }, [playNote]);

  const startEarTraining = useCallback(async () => {
    setQuizMode('ear-training');
    setScore({ correct: 0, total: 0 });
    const idx = Math.floor(Math.random() * nodes.length);
    setTargetIdx(idx);
    await playNote(idx);
  }, [nodes.length, playNote]);

  const replayTarget = useCallback(async () => {
    if (quizMode !== 'ear-training' || targetIdx == null) return;
    await playNote(targetIdx);
  }, [quizMode, targetIdx, playNote]);

  const handleNodeClick = useCallback(async (idx: number) => {
    await playNote(idx);
    if (quizMode === 'off') {
      setCurrentIdx(idx);
      return;
    }
    if (targetIdx === null) return;
    const isCorrect = idx === targetIdx;
    setScore(prev => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }));
    if (!isCorrect) {
      // 高亮错误与正确
      setWrongIdx(idx);
      setCurrentIdx(targetIdx);
      // 播放正确答案
      setTimeout(() => { playNote(targetIdx); }, 400);
      // 进入下一题
      setTimeout(() => {
        setWrongIdx(null);
        const next = Math.floor(Math.random() * nodes.length);
        setTargetIdx(next);
        playNote(next);
      }, 1000);
      return;
    }
    // 正确反馈
    setCurrentIdx(idx);
    if (quizMode === 'next-degree') {
      // 目标是当前 index 的下一度
      const nextTarget = Math.min((idx + 1), nodes.length - 1);
      setTargetIdx(nextTarget);
    } else if (quizMode === 'ear-training') {
      // 重新抽题
      const next = Math.floor(Math.random() * nodes.length);
      setTargetIdx(next);
      await playNote(next);
    }
  }, [quizMode, targetIdx, nodes.length, playNote]);

  const stepColor = useCallback((s: 'W' | 'H') => s === 'W' ? 'bg-green-400' : 'bg-red-400', []);

  const Legend = useMemo(() => (
    <div className="flex items-center gap-3 text-xs text-gray-600">
      <div className="flex items-center gap-1"><span className="w-3 h-1 inline-block bg-green-400"/>全音 (W)</div>
      <div className="flex items-center gap-1"><span className="w-3 h-1 inline-block bg-red-400"/>半音 (H)</div>
    </div>
  ), []);

  return (
    <div className="space-y-4">
      {/* 顶部信息与控制 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">🎹 音阶探险 · {scale.name}</h2>
          <p className="text-gray-600 text-sm">目标：记忆全/半音公式与音级位置</p>
        </div>
          <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={playAscending}>上行</Button>
          <Button variant="secondary" onClick={playDescending}>下行</Button>
          <Button variant={quizMode === 'next-degree' ? 'primary' : 'secondary'} onClick={startNextDegreeQuiz}>下一音级练习</Button>
          <Button variant={quizMode === 'ear-training' ? 'primary' : 'secondary'} onClick={startEarTraining}>听辨练习</Button>
          {quizMode === 'ear-training' && (
            <Button variant="secondary" onClick={replayTarget}>重放</Button>
          )}
          <Button variant="secondary" onClick={() => setQuizMode('off')}>自由模式</Button>
        </div>
      </div>

      {/* 地图与操作区：两栏 */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-600">C 大调全半音公式：W – W – H – W – W – W – H</div>
            {Legend}
          </div>
          {/* 横向阶梯图 */}
          <div className="relative">
            <div className="flex items-center justify-center">
              {nodes.map((n, i) => (
                <div key={n.degree} className="flex items-center">
                  <button
                    onClick={() => handleNodeClick(i)}
                    className={`w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-150 mx-0.5 md:mx-1 ${
                      (quizMode === 'ear-training' && targetIdx === i && wrongIdx !== null) ? 'bg-green-100 text-green-700 border-green-400' :
                      (quizMode === 'ear-training' && wrongIdx === i) ? 'bg-red-100 text-red-700 border-red-400' :
                      i === currentIdx ? 'bg-blue-500 text-white border-blue-500 scale-110' : 'bg-white text-gray-800 border-gray-300 hover:border-blue-400'
                    }`}
                    aria-label={`degree-${n.degree}`}
                  >
                    <div className="text-sm md:text-base">{n.degree}</div>
                    <div className="text-[9px] md:text-[10px] opacity-70">{n.note.replace(/[0-9]/g,'')}</div>
                  </button>
                  {i < bridges.length && (
                    <div className={`h-1.5 md:h-2 ${stepColor(bridges[i])} rounded mx-0.5 md:mx-1`} style={{ width: 24 }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* 统计与说明 */}
        <div className="space-y-3">
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-green-600">{score.correct}</div>
                <div className="text-xs text-gray-600">答对</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">{score.total}</div>
                <div className="text-xs text-gray-600">总题数</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 text-sm text-gray-700 space-y-1">
            <div>• 点击圆点可试音并选择答案</div>
            <div>• 绿色桥=全音 (W)，红色桥=半音 (H)</div>
            <div>• 下一音级练习：从当前音级依次上行</div>
            <div>• 听辨练习：听音后点对应音级</div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ScaleAdventure;


