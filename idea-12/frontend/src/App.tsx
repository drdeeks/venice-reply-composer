import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container } from '@mui/material';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Deposit from './components/Deposit';
import Withdraw from './components/Withdraw';
import Governance from './components/Governance';
import Positions from './components/Positions';
import { useWeb3 } from './hooks/useWeb3';
import './App.css';

function App() {
  const { account, connect, disconnect, isConnected } = useWeb3();

  return (
    <div className="App">
      <Header
        account={account}
        isConnected={isConnected}
        onConnect={connect}
        onDisconnect={disconnect}
      />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/governance" element={<Governance />} />
          <Route path="/positions" element={<Positions />} />
        </Routes>
      </Container>
    </div>
  );
}

export default App;