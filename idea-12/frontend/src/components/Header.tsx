import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Chip,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

interface HeaderProps {
  account: string | null;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

const Header: React.FC<HeaderProps> = ({
  account,
  isConnected,
  onConnect,
  onDisconnect,
}) => {
  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <AccountBalanceWalletIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Group DeFi Savings Chat
        </Typography>
        {isConnected && account && (
          <Chip
            label={`${account.slice(0, 6)}...${account.slice(-4)}`}
            sx={{ mr: 2, bgcolor: 'primary.dark' }}
          />
        )}
        <Button
          color="inherit"
          onClick={isConnected ? onDisconnect : onConnect}
        >
          {isConnected ? 'Disconnect' : 'Connect Wallet'}
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Header;