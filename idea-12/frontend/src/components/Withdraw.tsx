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
  Chip,
} from '@mui/material';
import { useWeb3 } from '../hooks/useWeb3';

interface WithdrawProps {}

const Withdraw: React.FC<WithdrawProps> = () => {
  const { account, isConnected } = useWeb3();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [canWithdraw, setCanWithdraw] = useState(true);
  const [userShares, setUserShares] = useState('50');
  const [userValue, setUserValue] = useState('0.5');

  const maxShares = parseFloat(userShares);

  const handleMax = () => {
    setWithdrawAmount(userShares);
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!canWithdraw) {
      alert('Withdrawal is locked');
      return;
    }

    try {
      // Simulate withdrawal
      console.log('Withdrawing shares:', withdrawAmount);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert('Withdrawal queued for execution after lock period');
    } catch (error) {
      console.error('Withdraw failed:', error);
      alert('Withdraw failed');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Withdraw Funds
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Queue Withdrawal" />
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Withdrawals are subject to a 7-day lock period to ensure liquidity.
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={canWithdraw ? 'Ready to Withdraw' : 'Withdrawal Locked'}
                  color={canWithdraw ? 'success' : 'error'}
                  sx={{ mb: 2 }}
                />
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2">
                    Your Shares: {userShares}
                  </Typography>
                  <Typography variant="body2">
                    Withdrawable ETH: {userValue}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Shares to Withdraw"
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <Button onClick={handleMax} size="small">
                          MAX
                        </Button>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    onClick={handleWithdraw}
                    disabled={!isConnected || !canWithdraw}
                    fullWidth
                    size="large"
                  >
                    Queue Withdrawal
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Withdrawal Status" />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6">Your Withdrawals</Typography>
                <Typography variant="body2" color="text.secondary">
                  None pending
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="h6">How Withdrawals Work</Typography>
                <Typography variant="body2" paragraph>
                  1. Queue withdrawal: Shares are burned immediately.
                </Typography>
                <Typography variant="body2" paragraph>
                  2. Lock period: 7 days to ensure treasury liquidity.
                </Typography>
                <Typography variant="body2" paragraph>
                  3. Execute: After lock period, withdraw ETH anytime.
                </Typography>
                <Typography variant="body2">
                  Note: The ETH value of shares may change during lock period
                  based on treasury performance.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Withdraw;