import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useWeb3 } from '../hooks/useWeb3';

const Deposit: React.FC = () => {
  const { account, isConnected } = useWeb3();
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState('ETH');
  const [loading, setLoading] = useState(false);

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // Simulate deposit
      console.log('Depositing', amount, token, 'from', account);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert('Deposit successful!');
    } catch (error) {
      console.error('Deposit failed:', error);
      alert('Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Deposit Funds
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Deposit ETH" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Token</InputLabel>
                    <Select
                      value={token}
                      onChange={(e) => setToken(e.target.value as string)}
                    >
                      <MenuItem value="ETH">ETH</MenuItem>
                      <MenuItem value="USDC">USDC</MenuItem>
                      <MenuItem value="DAI">DAI</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    onClick={handleDeposit}
                    disabled={!isConnected || loading}
                    fullWidth
                    size="large"
                  >
                    {loading ? 'Depositing...' : 'Deposit'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Deposit Info" />
            <CardContent>
              <Typography variant="body2" gutterBottom>
                Current treasury balance: 12.5 ETH
              </Typography>
              <Typography variant="body2" gutterBottom>
                Current shares per ETH: 100 shares
              </Typography>
              <Typography variant="body2" gutterBottom>
                Available for withdrawal: 3.2 ETH
              </Typography>
              <Typography variant="body2" gutterBottom>
                Locked for staking: 9.3 ETH
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Deposit;