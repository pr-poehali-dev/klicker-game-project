import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface Achievement {
  id: string;
  title: string;
  description: string;
  requirement: number;
  unlocked: boolean;
  icon: string;
  reward: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
}

const Index = () => {
  const [clicks, setClicks] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [clicksPerSecond, setClicksPerSecond] = useState(0);
  const [recentClicks, setRecentClicks] = useState<number[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: '1', title: 'Первый клик', description: 'Сделай свой первый клик', requirement: 1, unlocked: false, icon: 'MousePointer', reward: 10 },
    { id: '2', title: 'Новичок', description: 'Набери 50 очков', requirement: 50, unlocked: false, icon: 'Star', reward: 25 },
    { id: '3', title: 'Энтузиаст', description: 'Набери 200 очков', requirement: 200, unlocked: false, icon: 'Zap', reward: 50 },
    { id: '4', title: 'Профессионал', description: 'Набери 500 очков', requirement: 500, unlocked: false, icon: 'Award', reward: 100 },
    { id: '5', title: 'Мастер кликов', description: 'Набери 1000 очков', requirement: 1000, unlocked: false, icon: 'Trophy', reward: 250 },
    { id: '6', title: 'Легенда', description: 'Набери 2500 очков', requirement: 2500, unlocked: false, icon: 'Crown', reward: 500 },
    { id: '7', title: 'Быстрые пальцы', description: 'Достигни 5 кликов в секунду', requirement: 5, unlocked: false, icon: 'Rocket', reward: 75 },
    { id: '8', title: 'Марафонец', description: 'Сделай 500 кликов', requirement: 500, unlocked: false, icon: 'Activity', reward: 150 },
  ]);

  useEffect(() => {
    const now = Date.now();
    const updatedClicks = [...recentClicks, now].filter(time => now - time < 1000);
    setRecentClicks(updatedClicks);
    setClicksPerSecond(updatedClicks.length);
  }, [totalClicks]);

  useEffect(() => {
    achievements.forEach(achievement => {
      if (!achievement.unlocked) {
        const isUnlocked = 
          (achievement.id === '7' && clicksPerSecond >= achievement.requirement) ||
          (achievement.id === '8' && totalClicks >= achievement.requirement) ||
          (achievement.id !== '7' && achievement.id !== '8' && clicks >= achievement.requirement);

        if (isUnlocked) {
          setAchievements(prev =>
            prev.map(a =>
              a.id === achievement.id ? { ...a, unlocked: true } : a
            )
          );
          setClicks(prev => prev + achievement.reward);
          toast.success(`🎉 Достижение: ${achievement.title}`, {
            description: `+${achievement.reward} очков!`,
          });
        }
      }
    });
  }, [clicks, totalClicks, clicksPerSecond]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setClicks(prev => prev + 1);
    setTotalClicks(prev => prev + 1);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newParticle = {
      id: Date.now(),
      x,
      y,
    };

    setParticles(prev => [...prev, newParticle]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== newParticle.id));
    }, 600);
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalAchievements = achievements.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#1e1b3d] to-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">
            КЛИКЕР
          </h1>
          <p className="text-muted-foreground text-lg">Кликай и получай награды!</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-2 border-primary/20">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/20">
                <Icon name="Coins" className="text-primary" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Очки</p>
                <p className="text-3xl font-bold">{clicks.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur-sm border-2 border-secondary/20">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-secondary/20">
                <Icon name="Zap" className="text-secondary" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Клики/сек</p>
                <p className="text-3xl font-bold">{clicksPerSecond}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur-sm border-2 border-accent/20">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-accent/20">
                <Icon name="MousePointer" className="text-accent" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Всего кликов</p>
                <p className="text-3xl font-bold">{totalClicks.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex justify-center">
          <div className="relative">
            <button
              onClick={handleClick}
              className={`w-64 h-64 rounded-full bg-gradient-to-br from-primary via-secondary to-primary text-white text-2xl font-black shadow-2xl shadow-primary/50 hover:shadow-primary/70 transition-all relative overflow-hidden ${
                isAnimating ? 'animate-bounce-click' : 'animate-pulse-scale'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer bg-[length:200%_auto]" />
              <span className="relative z-10 drop-shadow-lg">КЛИК!</span>
            </button>

            {particles.map(particle => (
              <div
                key={particle.id}
                className="absolute text-4xl font-bold animate-particle-burst pointer-events-none"
                style={{
                  left: particle.x,
                  top: particle.y,
                  color: Math.random() > 0.5 ? '#8B5CF6' : '#D946EF',
                }}
              >
                +1
              </div>
            ))}
          </div>
        </div>

        <Card className="p-6 bg-card/50 backdrop-blur-sm border-2 border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Icon name="Award" className="text-primary" size={28} />
              Достижения
            </h2>
            <Badge variant="secondary" className="text-lg px-4 py-1">
              {unlockedCount} / {totalAchievements}
            </Badge>
          </div>

          <div className="mb-6">
            <Progress value={(unlockedCount / totalAchievements) * 100} className="h-3" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {achievements.map(achievement => (
              <Card
                key={achievement.id}
                className={`p-4 transition-all ${
                  achievement.unlocked
                    ? 'bg-gradient-to-r from-primary/20 to-secondary/20 border-2 border-primary/50'
                    : 'bg-muted/30 border-muted/50 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-3 rounded-xl ${
                      achievement.unlocked ? 'bg-primary/30' : 'bg-muted/50'
                    }`}
                  >
                    <Icon
                      name={achievement.icon as any}
                      className={achievement.unlocked ? 'text-primary' : 'text-muted-foreground'}
                      size={24}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold">{achievement.title}</h3>
                      {achievement.unlocked && (
                        <Icon name="CheckCircle2" className="text-primary" size={16} />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {achievement.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Награда: +{achievement.reward} очков
                      </span>
                      {!achievement.unlocked && (
                        <span className="text-xs text-primary font-semibold">
                          {achievement.id === '7'
                            ? `${clicksPerSecond}/${achievement.requirement}`
                            : achievement.id === '8'
                            ? `${totalClicks}/${achievement.requirement}`
                            : `${clicks}/${achievement.requirement}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;
