import { useState } from 'react';
import { create } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from 'next-swc';
import { Web3ReactProvider } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector';
import { Web3Provider } from '@ethersproject/providers';

const injected = new InjectedConnector({
  supportedChainIds: [1, 3, 4, 5, 42, 100], // Add Base chain ID
});

function getLibrary(provider) {
  const library = new Web3Provider(provider);
  library.pollingInterval = 12000;
  return library;
}

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  const connectWallet = async () => {
    try {
      await injected.activate();
      const provider = new Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setConnected(true);
      setWalletAddress(address);
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Verifiable Job Board</h1>
            <div className="flex items-center space-x-4">
              {connected ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
                  </span>
                  <button
                    onClick={() => {
                      setConnected(false);
                      setWalletAddress('');
                    }}
                    className="bg-gray-800 text-white px-3 py-1 rounded-md text-sm hover:bg-gray-700"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Verifiable On-Chain Job Board
          </h2>
          <p className="text-lg text-gray-600">
            Every skill is Merit-attested. Every profile anchored to Talent builder score.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Active Jobs</h3>
            <p className="text-gray-600 mb-4">
              {connected ? "Connected” : "Connect wallet to see jobs”}
            </p>
            <div className="space-y-3">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium mb-2">Web3 Developer</h4>
                <p className="text-sm text-gray-600">Merit Skills: Solidity, Smart Contracts</p>
                <p className="text-sm text-gray-900">$80k - $120k</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Create Profile</h3>
            <p className="text-gray-600 mb-4">
              Connect your Talent Protocol and Merit Systems credentials
            </p>
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Create Profile
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Post a Job</h3>
            <p className="text-gray-600 mb-4">
              Employers can post jobs with verified skill requirements
            </p>
            <button className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
              Post Job
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export async function generateStaticParams() {
  return [];
}

export const revalidate = 3600;