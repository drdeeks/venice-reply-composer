import React, { useState } from 'react';

interface BankrTradeModalProps {
  tokens: string[];
  onConfirm: (token: string, amount: number) => void;
  onCancel: () => void;
}

export const BankrTradeModal: React.FC<BankrTradeModalProps> = ({
  tokens,
  onConfirm,
  onCancel
}) => {
  const [selectedToken, setSelectedToken] = useState<string>(tokens[0] || 'BTC');
  const [amount, setAmount] = useState<string>('0.1');

  const presetAmounts = ['0.01', '0.1', '0.5', '1.0'];

  const handleConfirm = () => {
    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }
    onConfirm(selectedToken, parsedAmount);
  };

  return (
    <div className="bankr-modal-overlay">
      <div className="bankr-modal">
        <div className="bankr-modal-header">
          <h3>🏦 Bankr Trade</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>
        
        <div className="bankr-modal-body">
          <div className="form-group">
            <label>Select Token to Trade:</label>
            <select 
              value={selectedToken} 
              onChange={(e) => setSelectedToken(e.target.value)}
              className="token-select"
            >
              {tokens.map(token => (
                <option key={token} value={token}>{token}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Amount in ETH:</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0.01"
              className="amount-input"
            />
          </div>

          <div className="preset-amounts">
            {presetAmounts.map(preset => (
              <button
                key={preset}
                className={`preset-btn ${amount === preset ? 'active' : ''}`}
                onClick={() => setAmount(preset)}
              >
                {preset} ETH
              </button>
            ))}
          </div>
        </div>

        <div className="bankr-modal-footer">
          <button className="cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="confirm-btn" onClick={handleConfirm}>
            Open Bankr Trade →
          </button>
        </div>
      </div>
    </div>
  );
};
