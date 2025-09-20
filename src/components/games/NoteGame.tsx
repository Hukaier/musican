// 音乐理论平台 - 基础音符游戏组件

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameMode, Card, MatchingCard, GridCell, ConnectionLine } from '../../types';
import { NOTE_DATA } from '../../constants';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import Button from '../ui/Button';
import UICard from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';

const NoteGame: React.FC = () => {
  const [gameMode, setGameMode] = useState<GameMode>('memory');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [combo, setCombo] = useState(0);
  
  // 记忆卡片游戏状态
  const [memoryCards, setMemoryCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<string[]>([]);
  
  // 连连看游戏状态
  const [matchingCards, setMatchingCards] = useState<MatchingCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [connectionLines, setConnectionLines] = useState<ConnectionLine[]>([]);
  const [eliminatingCards, setEliminatingCards] = useState<string[]>([]);
  const [gameGrid, setGameGrid] = useState<GridCell[][]>([]);

  const audioEngine = useAudioEngine();

  // 初始化记忆卡片游戏
  const initMemoryGame = useCallback(() => {
    const cards: Card[] = [];
    NOTE_DATA.forEach((noteData, index) => {
      // 创建音符卡片
      cards.push({
        id: `note-${index}`,
        content: noteData.note,
        type: 'note',
        emoji: noteData.emoji,
        state: 'hidden'
      });
      // 创建唱名卡片
      cards.push({
        id: `solfege-${index}`,
        content: noteData.solfege,
        type: 'solfege',
        emoji: noteData.emoji,
        state: 'hidden'
      });
    });
    
    // 洗牌
    const shuffled = cards.sort(() => Math.random() - 0.5);
    setMemoryCards(shuffled);
  }, []);

  // 初始化连连看游戏
  const initMatchingGame = useCallback(() => {
    const cards: MatchingCard[] = [];
    const gridWidth = 8;
    const gridHeight = 6;
    const totalCells = gridWidth * gridHeight;
    
    // 创建所有位置的数组
    const allPositions: {x: number, y: number}[] = [];
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        allPositions.push({ x, y });
      }
    }
    
    // 打乱位置数组
    const shuffledPositions = allPositions.sort(() => Math.random() - 0.5);
    
    // 计算需要多少对卡片（总共48张，所以24对）
    const totalPairs = totalCells / 2;
    
    // 为了填满网格，需要重复使用音符
    const notePool: typeof NOTE_DATA[0][] = [];
    
    // 添加每个音符3次
    for (let repeat = 0; repeat < 3; repeat++) {
      notePool.push(...NOTE_DATA);
    }
    
    // 再添加前3个音符各1次，凑够24对
    notePool.push(...NOTE_DATA.slice(0, 3));
    
    // 为每对创建两张卡片
    notePool.forEach((noteData, pairIndex) => {
      if (pairIndex >= totalPairs) return;
      
      const pos1 = shuffledPositions[pairIndex * 2];
      const pos2 = shuffledPositions[pairIndex * 2 + 1];
      
      // 创建第一张卡片
      cards.push({
        id: `card-${pairIndex}-1`,
        note: noteData.note,
        solfege: noteData.solfege,
        emoji: noteData.emoji,
        icon: `${noteData.emoji}-${Math.floor(pairIndex / 7)}`,
        x: pos1.x,
        y: pos1.y,
        selected: false,
        matched: false,
        eliminating: false
      });
      
      // 创建第二张卡片
      cards.push({
        id: `card-${pairIndex}-2`,
        note: noteData.note,
        solfege: noteData.solfege,
        emoji: noteData.emoji,
        icon: `${noteData.emoji}-${Math.floor(pairIndex / 7)}`,
        x: pos2.x,
        y: pos2.y,
        selected: false,
        matched: false,
        eliminating: false
      });
    });
    
    setMatchingCards(cards);
    setSelectedCards([]);
    setConnectionLines([]);
    setEliminatingCards([]);
    updateGrid(cards);
  }, []);

  // 更新网格状态
  const updateGrid = useCallback((cards: MatchingCard[]) => {
    const newGrid: GridCell[][] = Array(6).fill(null).map(() => 
      Array(8).fill(null).map(() => ({ card: null, isEmpty: true }))
    );
    
    cards.forEach(card => {
      if (!card.matched) {
        newGrid[card.y][card.x] = { card, isEmpty: false };
      }
    });
    
    setGameGrid(newGrid);
  }, []);

  // 路径检查算法
  const checkPath = useCallback((posA: {x: number, y: number}, posB: {x: number, y: number}, grid: GridCell[][]) => {
    const gridWidth = 8;
    const gridHeight = 6;
    
    // 检查线段是否畅通（不包括起点和终点）
    const isLineClear = (x1: number, y1: number, x2: number, y2: number): boolean => {
      if (x1 === x2) {
        // 垂直线
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        for (let y = minY + 1; y < maxY; y++) {
          if (!grid[y][x1].isEmpty) return false;
        }
      } else if (y1 === y2) {
        // 水平线
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        for (let x = minX + 1; x < maxX; x++) {
          if (!grid[y1][x].isEmpty) return false;
        }
      } else {
        return false; // 不是直线
      }
      return true;
    };

    // 情况一：直线连接（0个拐点）
    if ((posA.x === posB.x || posA.y === posB.y) && isLineClear(posA.x, posA.y, posB.x, posB.y)) {
      return { canConnect: true, path: [posA, posB], turns: 0 };
    }

    // 情况二：一个拐点连接（1个拐点）
    const corner1 = { x: posA.x, y: posB.y };
    if (grid[corner1.y][corner1.x].isEmpty &&
        isLineClear(posA.x, posA.y, corner1.x, corner1.y) &&
        isLineClear(corner1.x, corner1.y, posB.x, posB.y)) {
      return { canConnect: true, path: [posA, corner1, posB], turns: 1 };
    }

    const corner2 = { x: posB.x, y: posA.y };
    if (grid[corner2.y][corner2.x].isEmpty &&
        isLineClear(posA.x, posA.y, corner2.x, corner2.y) &&
        isLineClear(corner2.x, corner2.y, posB.x, posB.y)) {
      return { canConnect: true, path: [posA, corner2, posB], turns: 1 };
    }

    return { canConnect: false, path: [], turns: -1 };
  }, []);

  // 开始游戏
  const startGame = useCallback(async () => {
    try {
      await audioEngine.initialize();
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
    
    setGameStarted(true);
    setGameCompleted(false);
    setScore(0);
    setAttempts(0);
    setCombo(0);
    setFlippedCards([]);
    setSelectedCards([]);
    
    if (gameMode === 'memory') {
      initMemoryGame();
    } else {
      initMatchingGame();
    }
    
    audioEngine.playEffect('success');
  }, [gameMode, initMemoryGame, initMatchingGame, audioEngine]);

  // 记忆卡片点击处理
  const handleCardClick = useCallback((cardId: string) => {
    if (flippedCards.length >= 2) return;
    
    const card = memoryCards.find(c => c.id === cardId);
    if (!card || card.state !== 'hidden') return;

    // 播放对应音符
    audioEngine.playNoteByName(card.content);

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    // 更新卡片状态
    setMemoryCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, state: 'revealed' } : c
    ));

    if (newFlippedCards.length === 2) {
      setAttempts(prev => prev + 1);
      
      setTimeout(() => {
        const [firstId, secondId] = newFlippedCards;
        const firstCard = memoryCards.find(c => c.id === firstId);
        const secondCard = memoryCards.find(c => c.id === secondId);
        
        // 检查是否匹配
        const firstNote = NOTE_DATA.find(n => n.note === firstCard?.content || n.solfege === firstCard?.content);
        const secondNote = NOTE_DATA.find(n => n.note === secondCard?.content || n.solfege === secondCard?.content);
        
        if (firstNote === secondNote && firstCard?.type !== secondCard?.type) {
          // 匹配成功
          setMemoryCards(prev => prev.map(c => 
            (c.id === firstId || c.id === secondId) ? { ...c, state: 'matched' } : c
          ));
          setScore(prev => prev + 10);
          setCombo(prev => prev + 1);
          
          audioEngine.playEffect('success');
          setTimeout(() => {
            audioEngine.playSequence([firstNote.pitch, firstNote.pitch]);
          }, 300);
          
          if (combo >= 2) {
            audioEngine.playEffect('combo');
            setScore(prev => prev + combo * 5);
          }
        } else {
          // 匹配失败
          setMemoryCards(prev => prev.map(c => 
            (c.id === firstId || c.id === secondId) ? { ...c, state: 'hidden' } : c
          ));
          setCombo(0);
          audioEngine.playEffect('error');
        }
        
        setFlippedCards([]);
      }, 1000);
    }
  }, [flippedCards, memoryCards, combo, audioEngine]);

  // 连连看卡片点击处理
  const handleMatchingCardClick = useCallback((cardId: string) => {
    if (selectedCards.length >= 2 || eliminatingCards.length > 0) return;
    
    const card = matchingCards.find(c => c.id === cardId);
    if (!card || card.matched || card.eliminating) return;

    audioEngine.playNoteByName(card.note);

    const newSelectedCards = [...selectedCards, cardId];
    setSelectedCards(newSelectedCards);
    
    setMatchingCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, selected: true } : c
    ));

    if (newSelectedCards.length === 2) {
      setAttempts(prev => prev + 1);
      
      const [firstId, secondId] = newSelectedCards;
      const firstCard = matchingCards.find(c => c.id === firstId);
      const secondCard = matchingCards.find(c => c.id === secondId);
      
      if (firstCard && secondCard) {
        const isSameIcon = firstCard.icon === secondCard.icon;
        
        let pathResult = { canConnect: false, path: [], turns: -1 };
        if (isSameIcon) {
          pathResult = checkPath(
            { x: firstCard.x, y: firstCard.y },
            { x: secondCard.x, y: secondCard.y },
            gameGrid
          );
        }
        
        // 绘制连线路径
        if (pathResult.canConnect && pathResult.path.length > 1) {
          const lines: ConnectionLine[] = [];
          for (let i = 0; i < pathResult.path.length - 1; i++) {
            const from = pathResult.path[i];
            const to = pathResult.path[i + 1];
            lines.push({
              fromId: `path-${i}`,
              toId: `path-${i + 1}`,
              fromX: (from.x + 0.5) * 60 + 10,
              fromY: (from.y + 0.5) * 60 + 10,
              toX: (to.x + 0.5) * 60 + 10,
              toY: (to.y + 0.5) * 60 + 10,
              color: '#28a745'
            });
          }
          setConnectionLines(lines);
        } else {
          const failLine: ConnectionLine = {
            fromId: firstId,
            toId: secondId,
            fromX: (firstCard.x + 0.5) * 60 + 10,
            fromY: (firstCard.y + 0.5) * 60 + 10,
            toX: (secondCard.x + 0.5) * 60 + 10,
            toY: (secondCard.y + 0.5) * 60 + 10,
            color: '#dc3545'
          };
          setConnectionLines([failLine]);
        }
        
        setTimeout(() => {
          if (isSameIcon && pathResult.canConnect) {
            // 匹配成功
            setEliminatingCards([firstId, secondId]);
            
            setTimeout(() => {
              const newCards = matchingCards.map(c => 
                (c.id === firstId || c.id === secondId) ? { ...c, matched: true, eliminating: false } : c
              );
              setMatchingCards(newCards);
              updateGrid(newCards);
              
              setScore(prev => prev + 10);
              setCombo(prev => prev + 1);
              setEliminatingCards([]);
              
              audioEngine.playEffect('success');
              setTimeout(() => {
                const noteData = NOTE_DATA.find(n => n.note === firstCard.note);
                if (noteData) {
                  audioEngine.playSequence([noteData.pitch, noteData.pitch]);
                }
              }, 300);
              
              if (combo >= 2) {
                audioEngine.playEffect('combo');
                setScore(prev => prev + combo * 5);
              }
            }, 800);
          } else {
            setCombo(0);
            audioEngine.playEffect('error');
          }
          
          setMatchingCards(prev => prev.map(c => ({ ...c, selected: false })));
          setSelectedCards([]);
          setConnectionLines([]);
        }, 1200);
      }
    }
  }, [selectedCards, matchingCards, eliminatingCards, combo, gameGrid, checkPath, updateGrid, audioEngine]);

  // 检查游戏是否完成
  useEffect(() => {
    if (!gameStarted) return;
    
    if (gameMode === 'memory') {
      const allMatched = memoryCards.length > 0 && memoryCards.every(card => card.state === 'matched');
      if (allMatched && !gameCompleted) {
        setGameCompleted(true);
        audioEngine.playEffect('complete');
      }
    } else {
      const allMatched = matchingCards.length > 0 && matchingCards.every(card => card.matched);
      if (allMatched && !gameCompleted) {
        setGameCompleted(true);
        audioEngine.playEffect('complete');
      }
    }
  }, [gameStarted, gameMode, memoryCards, matchingCards, gameCompleted, audioEngine]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🎼 基础音符游戏
        </h1>
        <p className="text-gray-600">
          学习 C D E F G A B 与 Do Re Mi Fa Sol La Si 的对应关系
        </p>
      </div>

      {/* 游戏模式选择 */}
      <div className="flex justify-center gap-4 mb-8">
        <Button
          variant={gameMode === 'memory' ? 'primary' : 'secondary'}
          onClick={() => setGameMode('memory')}
        >
          记忆卡片
        </Button>
        <Button
          variant={gameMode === 'matching' ? 'primary' : 'secondary'}
          onClick={() => setGameMode('matching')}
        >
          连连看
        </Button>
      </div>

      {/* 游戏控制 */}
      <div className="text-center mb-8">
        <Button
          variant="success"
          size="lg"
          onClick={startGame}
        >
          {gameStarted ? '重新开始' : '开始游戏'}
        </Button>
      </div>

      {/* 游戏状态 */}
      {gameStarted && (
        <div className="flex justify-center items-center gap-8 mb-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{score}</div>
            <div className="text-sm text-gray-500">得分</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">{attempts}</div>
            <div className="text-sm text-gray-500">尝试次数</div>
          </div>
          {combo > 0 && (
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">🔥 {combo}</div>
              <div className="text-sm text-gray-500">连击</div>
            </div>
          )}
          {gameCompleted && (
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">🎉</div>
              <div className="text-sm text-gray-500">游戏完成</div>
            </div>
          )}
        </div>
      )}

      {/* 记忆卡片游戏 */}
      {gameStarted && gameMode === 'memory' && (
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-6">翻牌配对：找出英文音名与唱名的对应关系</h3>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-4 max-w-4xl mx-auto">
            {memoryCards.map(card => (
              <MemoryCard
                key={card.id}
                card={card}
                onClick={() => handleCardClick(card.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 连连看游戏 */}
      {gameStarted && gameMode === 'matching' && (
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-6">🎯 音符连连看挑战：满格48张卡片等你来消除！</h3>
          <div className="inline-block relative">
            <div className="grid grid-cols-8 gap-1 p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
              {Array.from({ length: 48 }, (_, i) => {
                const x = i % 8;
                const y = Math.floor(i / 8);
                const card = matchingCards.find(c => c.x === x && c.y === y);
                
                if (!card) {
                  return (
                    <div
                      key={`empty-${i}`}
                      className="w-14 h-14 bg-white border border-gray-200 rounded"
                    />
                  );
                }
                
                return (
                  <MatchingCardComponent
                    key={card.id}
                    card={card}
                    onClick={() => handleMatchingCardClick(card.id)}
                  />
                );
              })}
            </div>
            
            {/* 连线SVG覆盖层 */}
            <svg
              className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
            >
              {connectionLines.map((line, index) => (
                <line
                  key={index}
                  x1={line.fromX + 10}
                  y1={line.fromY + 10}
                  x2={line.toX + 10}
                  y2={line.toY + 10}
                  stroke={line.color}
                  strokeWidth="3"
                  strokeDasharray="5,5"
                  opacity="0.8"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    values="0;10"
                    dur="0.5s"
                    repeatCount="indefinite"
                  />
                </line>
              ))}
            </svg>
          </div>
          
          {/* 游戏说明 */}
          <div className="mt-6 text-sm text-gray-600 max-w-2xl mx-auto">
            <p className="font-semibold mb-2">🎯 游戏规则：</p>
            <ul className="text-left space-y-1">
              <li><strong>匹配相同图标</strong>：点击两张完全相同的卡片进行匹配</li>
              <li><strong>路径连通</strong>：两个图标必须能用不超过3条线段（最多2个拐点）连接</li>
              <li><strong>无阻挡</strong>：连接路径上不能有其他卡片阻挡</li>
              <li><strong>全部消除</strong>：消除所有24对卡片（48张）获得胜利！</li>
              <li>连击可获得额外奖励分数！🔥</li>
            </ul>
          </div>
        </div>
      )}

      {/* 口诀提示 */}
      {!gameStarted && (
        <UICard className="mt-8 bg-blue-50 border-blue-200">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-blue-800 mb-2">🏅 记忆口诀</h3>
            <p className="text-lg font-bold text-blue-600 mb-2">
              "猫多睡觉，发现老鼠"
            </p>
            <p className="text-gray-600">
              （C-Do, D-Re, E-Mi, F-Fa, G-Sol, A-La, B-Si）
            </p>
          </div>
        </UICard>
      )}
    </div>
  );
};

// 记忆卡片组件
interface MemoryCardProps {
  card: Card;
  onClick: () => void;
}

const MemoryCard: React.FC<MemoryCardProps> = ({ card, onClick }) => {
  return (
    <motion.div
      className={`w-20 h-24 border-2 rounded-lg cursor-pointer flex flex-col items-center justify-center text-sm font-bold transition-all duration-300 ${
        card.state === 'matched' 
          ? 'bg-green-100 border-green-500' 
          : card.state === 'revealed' 
          ? 'bg-yellow-100 border-yellow-500' 
          : 'bg-gray-100 border-gray-300 hover:border-gray-400'
      }`}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        scale: card.state === 'revealed' || card.state === 'matched' ? 1.05 : 1
      }}
    >
      {card.state !== 'hidden' && (
        <>
          <div className="text-2xl mb-1">{card.emoji}</div>
          <div>{card.content}</div>
        </>
      )}
      {card.state === 'hidden' && (
        <div className="text-3xl">❓</div>
      )}
    </motion.div>
  );
};

// 连连看卡片组件
interface MatchingCardComponentProps {
  card: MatchingCard;
  onClick: () => void;
}

const MatchingCardComponent: React.FC<MatchingCardComponentProps> = ({ card, onClick }) => {
  return (
    <motion.div
      className={`w-14 h-14 border rounded-lg cursor-pointer flex flex-col items-center justify-center text-xs font-bold transition-all duration-300 ${
        card.matched 
          ? 'bg-transparent border-transparent' 
          : card.selected 
          ? 'bg-yellow-100 border-yellow-500' 
          : card.eliminating
          ? 'bg-red-100 border-red-500'
          : 'bg-white border-gray-300 hover:border-gray-400'
      }`}
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      animate={{
        scale: card.selected ? 1.1 : card.eliminating ? 0.8 : 1,
        opacity: card.matched ? 0 : card.eliminating ? 0.5 : 1
      }}
    >
      {!card.matched && (
        <>
          <div className="text-lg mb-0.5">{card.emoji}</div>
          <div className="text-xs text-gray-600">{card.note}</div>
        </>
      )}
    </motion.div>
  );
};

export default NoteGame;
