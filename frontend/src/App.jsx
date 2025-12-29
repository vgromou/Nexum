import { Home, Settings, User, Bell, Search } from 'lucide-react';
import ColorCard from './components/ColorPalette/ColorCard';
import IconShowcase from './components/Icons/IconShowcase';
import './App.css';

const COLORS = [
  { name: 'Highlight Purple', var: '--color-highlight-purple-text' },
  { name: 'Highlight Orange', var: '--color-highlight-orange-text' },
  { name: 'Highlight Red', var: '--color-highlight-red-text' },
  { name: 'Accent Light', var: '--color-accent-light' },
  { name: 'Text Muted', var: '--color-text-muted' },
  { name: 'Text Tertiary', var: '--color-text-tertiary' },
  { name: 'Border Light', var: '--color-border-light' },
  { name: 'Bg Gradient Start', var: '--color-bg-gradient-start' },
];

const ICONS = [
  { icon: Home, name: 'Home', color: 'var(--color-highlight-purple-text)' },
  { icon: Settings, name: 'Settings', color: 'var(--color-highlight-orange-text)' },
  { icon: User, name: 'User', color: 'var(--color-highlight-red-text)' },
  { icon: Bell, name: 'Bell', color: undefined },
  { icon: Search, name: 'Search', color: 'var(--color-text-tertiary)' },
];

function App() {
  return (
    <div className="container">
      {/* Typography Demo */}
      <h1 className="page-title">Project3876 Design System</h1>

      <section className="section">
        <h2 className="section-title">Typography</h2>

        <div className="typography-item">
          <div className="heading-1">Heading 1</div>
          <small>Inter Bold 32px</small>
        </div>

        <div className="typography-item">
          <div className="heading-2">Heading 2</div>
          <small>Inter SemiBold 24px</small>
        </div>

        <div className="typography-item">
          <div className="heading-3">Heading 3</div>
          <small>Inter SemiBold 20px</small>
        </div>

        <div className="typography-item">
          <p className="body-text">
            Body Regular text. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            Nullam quis risus eget urna mollis ornare vel eu leo.
          </p>
          <small>Inter Regular 16px</small>
        </div>
      </section>

      {/* Colors Demo */}
      <section className="section">
        <h2 className="section-title">Colors</h2>
        <div className="color-grid">
          {COLORS.map((color) => (
            <ColorCard key={color.name} name={color.name} cssVar={color.var} />
          ))}
        </div>
      </section>

      {/* Icons Demo */}
      <section className="section">
        <h2 className="section-title">Icons (Lucide React)</h2>
        <div className="icons-grid">
          {ICONS.map((item) => (
            <IconShowcase
              key={item.name}
              icon={item.icon}
              name={item.name}
              color={item.color}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;
