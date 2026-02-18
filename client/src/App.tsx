import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { ScrollWorld } from './components/ScrollWorld';
import { Dashboard } from './components/Dashboard';
import './styles/global.css';

function WorldPage() {
  const navigate = useNavigate();

  return (
    <ScrollWorld
      onComplete={() => navigate('/app')}
      onProgress={(p) => {
        document.documentElement.style.setProperty(
          '--scroll-progress',
          p.toString()
        );
      }}
    />
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WorldPage />} />
        <Route path="/app" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
