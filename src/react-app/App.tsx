// src/react-app/App.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { VrmEditor } from './components/VrmEditor';

const root = createRoot(document.getElementById('root')!);
root.render(<VrmEditor />);