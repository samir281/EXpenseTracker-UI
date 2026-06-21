import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

const THEMES = [
  { gold: "#C8A951", dim: "rgba(200,169,81,0.12)",  text: "#E8D48B" }, // gold (original)
  { gold: "#8B5CF6", dim: "rgba(139,92,246,0.12)",   text: "#C4B5FD" }, // violet
  { gold: "#3B82F6", dim: "rgba(59,130,246,0.12)",   text: "#93C5FD" }, // blue
  { gold: "#10B981", dim: "rgba(16,185,129,0.12)",   text: "#6EE7B7" }, // emerald
  { gold: "#F59E0B", dim: "rgba(245,158,11,0.12)",   text: "#FDE68A" }, // amber
  { gold: "#EC4899", dim: "rgba(236,72,153,0.12)",   text: "#F9A8D4" }, // pink
  { gold: "#06B6D4", dim: "rgba(6,182,212,0.12)",    text: "#67E8F9" }, // cyan
  { gold: "#F97316", dim: "rgba(249,115,22,0.12)",   text: "#FDBA74" }, // orange
  { gold: "#A855F7", dim: "rgba(168,85,247,0.12)",   text: "#D8B4FE" }, // purple
  { gold: "#14B8A6", dim: "rgba(20,184,166,0.12)",   text: "#5EEAD4" }, // teal
];

const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
const root = document.documentElement;
root.style.setProperty('--gold', theme.gold);
root.style.setProperty('--gold-dim', theme.dim);
root.style.setProperty('--gold-text', theme.text);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
