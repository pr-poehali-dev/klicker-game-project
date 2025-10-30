import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

type GameMode = 'menu' | 'classic' | 'defuse' | 'deathmatch';
type WeaponType = 'pistol' | 'rifle' | 'sniper';

interface Weapon {
  name: string;
  type: WeaponType;
  damage: number;
  ammo: number;
  maxAmmo: number;
  reloadTime: number;
  fireRate: number;
  icon: string;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  isDead: boolean;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
}

const WEAPONS: Record<WeaponType, Weapon> = {
  pistol: { name: 'USP-S', type: 'pistol', damage: 30, ammo: 12, maxAmmo: 12, reloadTime: 1500, fireRate: 300, icon: 'Crosshair' },
  rifle: { name: 'AK-47', type: 'rifle', damage: 50, ammo: 30, maxAmmo: 30, reloadTime: 2500, fireRate: 150, icon: 'Target' },
  sniper: { name: 'AWP', type: 'sniper', damage: 100, ammo: 5, maxAmmo: 5, reloadTime: 3000, fireRate: 1000, icon: 'Crosshair' },
};

const Index = () => {
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [currentWeapon, setCurrentWeapon] = useState<WeaponType>('pistol');
  const [weapon, setWeapon] = useState<Weapon>({ ...WEAPONS.pistol });
  const [playerHealth, setPlayerHealth] = useState(100);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [score, setScore] = useState(0);
  const [kills, setKills] = useState(0);
  const [isReloading, setIsReloading] = useState(false);
  const [canShoot, setCanShoot] = useState(true);
  const [crosshairPos, setCrosshairPos] = useState({ x: 50, y: 50 });
  const gameAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gameMode !== 'menu') {
      spawnEnemies();
      const interval = setInterval(() => {
        if (enemies.length < 5) {
          spawnEnemies();
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [gameMode]);

  useEffect(() => {
    if (gameMode === 'menu') return;

    const moveEnemies = setInterval(() => {
      setEnemies(prev =>
        prev.map(enemy => {
          if (enemy.isDead) return enemy;
          const newY = enemy.y + enemy.speed;
          if (newY > 95) {
            setPlayerHealth(h => Math.max(0, h - 10));
            toast.error('Враг прорвался! -10 HP');
            return { ...enemy, isDead: true };
          }
          return { ...enemy, y: newY };
        }).filter(e => !e.isDead || e.y < 100)
      );
    }, 50);

    return () => clearInterval(moveEnemies);
  }, [gameMode]);

  useEffect(() => {
    if (gameMode === 'menu') return;

    const moveBullets = setInterval(() => {
      setBullets(prev => {
        const updated = prev.map(bullet => ({
          ...bullet,
          x: bullet.x + bullet.velocityX,
          y: bullet.y + bullet.velocityY,
        })).filter(b => b.y > -5 && b.y < 105 && b.x > -5 && b.x < 105);

        updated.forEach(bullet => {
          setEnemies(prevEnemies =>
            prevEnemies.map(enemy => {
              if (
                !enemy.isDead &&
                Math.abs(bullet.x - enemy.x) < 3 &&
                Math.abs(bullet.y - enemy.y) < 3
              ) {
                const newHealth = enemy.health - weapon.damage;
                if (newHealth <= 0) {
                  setScore(s => s + 100);
                  setKills(k => k + 1);
                  toast.success(`+100 очков! Убийство!`);
                  return { ...enemy, health: 0, isDead: true };
                }
                return { ...enemy, health: newHealth };
              }
              return enemy;
            })
          );
        });

        return updated;
      });
    }, 30);

    return () => clearInterval(moveBullets);
  }, [gameMode, weapon.damage]);

  useEffect(() => {
    if (gameMode === 'menu') return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R' || e.key === 'к' || e.key === 'К') {
        reload();
      }
      if (e.key === '1') switchWeapon('pistol');
      if (e.key === '2') switchWeapon('rifle');
      if (e.key === '3') switchWeapon('sniper');
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameMode, isReloading, weapon]);

  const spawnEnemies = () => {
    const newEnemies: Enemy[] = [];
    const count = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < count; i++) {
      newEnemies.push({
        id: Date.now() + i,
        x: Math.random() * 80 + 10,
        y: Math.random() * 20 - 10,
        health: 100,
        maxHealth: 100,
        speed: 0.3 + Math.random() * 0.3,
        isDead: false,
      });
    }
    setEnemies(prev => [...prev, ...newEnemies]);
  };

  const handleShoot = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canShoot || isReloading || weapon.ammo === 0 || gameMode === 'menu') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const angle = Math.atan2(y - 95, x - 50);
    const speed = 3;

    setBullets(prev => [
      ...prev,
      {
        id: Date.now(),
        x: 50,
        y: 95,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
      },
    ]);

    setWeapon(prev => ({ ...prev, ammo: prev.ammo - 1 }));
    setCanShoot(false);
    setTimeout(() => setCanShoot(true), weapon.fireRate);

    if (weapon.ammo - 1 === 0) {
      reload();
    }
  };

  const reload = () => {
    if (isReloading || weapon.ammo === weapon.maxAmmo) return;
    setIsReloading(true);
    toast.info('Перезарядка...');
    setTimeout(() => {
      setWeapon(prev => ({ ...prev, ammo: prev.maxAmmo }));
      setIsReloading(false);
      toast.success('Перезарядка завершена!');
    }, weapon.reloadTime);
  };

  const switchWeapon = (type: WeaponType) => {
    if (isReloading) return;
    setCurrentWeapon(type);
    setWeapon({ ...WEAPONS[type] });
  };

  const startGame = (mode: GameMode) => {
    setGameMode(mode);
    setPlayerHealth(100);
    setScore(0);
    setKills(0);
    setEnemies([]);
    setBullets([]);
    setWeapon({ ...WEAPONS.pistol });
    setCurrentWeapon('pistol');
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (gameMode === 'menu') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCrosshairPos({ x, y });
  };

  if (gameMode === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-[#0d1117] to-background flex items-center justify-center p-4">
        <div className="max-w-4xl w-full space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              TACTICAL OPS
            </h1>
            <p className="text-xl text-muted-foreground">Выбери режим боя</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-8 bg-card/80 backdrop-blur-sm border-2 border-primary/30 hover:border-primary hover:scale-105 transition-all cursor-pointer group" onClick={() => startGame('classic')}>
              <div className="text-center space-y-4">
                <div className="p-6 rounded-2xl bg-primary/20 mx-auto w-fit group-hover:bg-primary/30 transition-all">
                  <Icon name="Target" className="text-primary" size={48} />
                </div>
                <h3 className="text-2xl font-bold">Классика</h3>
                <p className="text-muted-foreground">Защити базу от врагов</p>
              </div>
            </Card>

            <Card className="p-8 bg-card/80 backdrop-blur-sm border-2 border-secondary/30 hover:border-secondary hover:scale-105 transition-all cursor-pointer group" onClick={() => startGame('defuse')}>
              <div className="text-center space-y-4">
                <div className="p-6 rounded-2xl bg-secondary/20 mx-auto w-fit group-hover:bg-secondary/30 transition-all">
                  <Icon name="Bomb" className="text-secondary" size={48} />
                </div>
                <h3 className="text-2xl font-bold">Дефьюз</h3>
                <p className="text-muted-foreground">Обезвредь бомбу</p>
              </div>
            </Card>

            <Card className="p-8 bg-card/80 backdrop-blur-sm border-2 border-accent/30 hover:border-accent hover:scale-105 transition-all cursor-pointer group" onClick={() => startGame('deathmatch')}>
              <div className="text-center space-y-4">
                <div className="p-6 rounded-2xl bg-accent/20 mx-auto w-fit group-hover:bg-accent/30 transition-all">
                  <Icon name="Crosshair" className="text-accent" size={48} />
                </div>
                <h3 className="text-2xl font-bold">Дезматч</h3>
                <p className="text-muted-foreground">Максимум фрагов</p>
              </div>
            </Card>
          </div>

          <Card className="p-6 bg-card/50 backdrop-blur-sm border-2 border-primary/20">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Icon name="Info" className="text-primary" size={24} />
              Управление
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline">ЛКМ</Badge>
                <span className="text-muted-foreground">Стрельба</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">R</Badge>
                <span className="text-muted-foreground">Перезарядка</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">1-3</Badge>
                <span className="text-muted-foreground">Смена оружия</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-2">
      <div className="flex flex-col gap-2 h-screen max-h-screen">
        <div className="flex items-center justify-between px-4 py-2 bg-card/80 backdrop-blur-sm rounded-lg border border-primary/30">
          <div className="flex items-center gap-6">
            <Button variant="outline" size="sm" onClick={() => setGameMode('menu')}>
              <Icon name="Home" size={16} />
            </Button>
            <div className="flex items-center gap-2">
              <Icon name="Heart" className="text-destructive" size={20} />
              <Progress value={playerHealth} className="w-32 h-3" />
              <span className="text-sm font-bold min-w-12">{playerHealth} HP</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="Target" className="text-primary" size={20} />
              <span className="text-sm font-bold">{kills} Убийств</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="Trophy" className="text-secondary" size={20} />
              <span className="text-sm font-bold">{score}</span>
            </div>
          </div>

          <Badge variant="secondary" className="text-lg px-4 py-1">
            {gameMode === 'classic' ? 'Классика' : gameMode === 'defuse' ? 'Дефьюз' : 'Дезматч'}
          </Badge>
        </div>

        <div className="flex-1 relative" ref={gameAreaRef}>
          <div
            className="w-full h-full bg-gradient-to-b from-muted/30 via-muted/10 to-muted/30 rounded-lg border-2 border-primary/30 relative overflow-hidden cursor-crosshair"
            onClick={handleShoot}
            onMouseMove={handleMouseMove}
          >
            <div className="absolute inset-0" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(255,255,255,0.03) 50px, rgba(255,255,255,0.03) 51px)',
              backgroundSize: '100% 51px'
            }} />

            {enemies.map(enemy => (
              <div
                key={enemy.id}
                className="absolute w-12 h-12 transition-all"
                style={{
                  left: `${enemy.x}%`,
                  top: `${enemy.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="relative w-full h-full">
                  <div className="w-12 h-12 rounded-lg bg-destructive/80 border-2 border-destructive flex items-center justify-center">
                    <Icon name="User" className="text-white" size={24} />
                  </div>
                  {enemy.health < enemy.maxHealth && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16">
                      <Progress value={(enemy.health / enemy.maxHealth) * 100} className="h-1" />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {bullets.map(bullet => (
              <div
                key={bullet.id}
                className="absolute w-2 h-2 bg-secondary rounded-full shadow-lg shadow-secondary/50"
                style={{
                  left: `${bullet.x}%`,
                  top: `${bullet.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}

            <div
              className="absolute w-8 h-8 pointer-events-none"
              style={{
                left: `${crosshairPos.x}%`,
                top: `${crosshairPos.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="relative w-full h-full">
                <div className="absolute top-1/2 left-0 w-2 h-0.5 bg-primary -translate-y-1/2" />
                <div className="absolute top-1/2 right-0 w-2 h-0.5 bg-primary -translate-y-1/2" />
                <div className="absolute left-1/2 top-0 w-0.5 h-2 bg-primary -translate-x-1/2" />
                <div className="absolute left-1/2 bottom-0 w-0.5 h-2 bg-primary -translate-x-1/2" />
              </div>
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-primary/20 rounded-full border-2 border-primary flex items-center justify-center">
              <Icon name="User" className="text-primary" size={32} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur-sm rounded-lg border border-primary/30">
          <div className="flex items-center gap-4">
            {(['pistol', 'rifle', 'sniper'] as WeaponType[]).map((type, idx) => (
              <Button
                key={type}
                variant={currentWeapon === type ? 'default' : 'outline'}
                size="lg"
                onClick={() => switchWeapon(type)}
                className="relative"
              >
                <Icon name={WEAPONS[type].icon as any} size={20} className="mr-2" />
                {WEAPONS[type].name}
                <Badge variant="secondary" className="ml-2">{idx + 1}</Badge>
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-6">
            <Button variant="outline" size="lg" onClick={reload} disabled={isReloading || weapon.ammo === weapon.maxAmmo}>
              <Icon name="RotateCw" size={20} className={isReloading ? 'animate-spin' : ''} />
            </Button>
            <div className="flex items-center gap-3">
              <Icon name="Crosshair" className="text-secondary" size={24} />
              <div className="text-right">
                <p className="text-3xl font-black">{weapon.ammo}</p>
                <p className="text-xs text-muted-foreground">/ {weapon.maxAmmo}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
