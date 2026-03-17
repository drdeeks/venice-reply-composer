import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';
import { injected } from '../connectors';

const Web3Context = createContext(null);

export const useWeb3 = () => {
  return useContext(Web3Context);
};

export const Web3Provider: React.FC = ({ children }) => {
  const { active, account, activate, deactivate } = useWeb3React();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsConnected(active && !!account);
  }, [active, account]);

  const connect = async () => {
    try {
      await activate(injected);
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const disconnect = () => {
    deactivate();
  };

  return (
    <Web3Context.Provider value={{ account, connect, disconnect, isConnected }}>
      {children}
    </Web3Context.Provider>
  );
};