// src/App.tsx
import { StrictMode } from 'react';
import DynamicPDFGenerator from './components/DynamicPDFGenerator';
import './App.css';

function App() {
  return (
    <StrictMode>
      <DynamicPDFGenerator />
    </StrictMode>
  );
}

export default App;