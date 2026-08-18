import { useGameStore } from './game/state/store';
import { MainMenu } from './components/MainMenu';
import { LevelSelect } from './components/LevelSelect';
import { GameplayScreen } from './components/GameplayScreen';

function App() {
  const screen = useGameStore((s) => s.screen);

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden">
      {screen === 'menu' && <MainMenu />}
      {screen === 'levelSelect' && <LevelSelect />}
      {screen === 'game' && <GameplayScreen />}
    </div>
  );
}

export default App;
