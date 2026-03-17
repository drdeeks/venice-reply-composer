import { AbstractConnector } from '@web3-react/abstract-connector';

export const injected = {
  getProvider: () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return window.ethereum;
    }
    if (typeof window !== 'undefined' && window.web3 && window.web3.currentProvider) {
      return window.web3.currentProvider;
    }
    return null;
  },
};