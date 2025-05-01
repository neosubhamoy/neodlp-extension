import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/entrypoints/popup/App.tsx';
import '@/entrypoints/popup/style.css';
import { HashRouter, Routes, Route } from "react-router-dom";
import RootLayout from '@/pages/layout/root';
import HomePage from '@/pages/home';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App>
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<HomePage />} />
          </Route>
        </Routes>
      </App>
    </HashRouter>
  </React.StrictMode>,
);
