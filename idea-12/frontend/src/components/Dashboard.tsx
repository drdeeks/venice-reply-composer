import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
} from '@mui/material';
import { useWeb3 } from '../hooks/useWeb3';

const Dashboard: React.FC = () => {
  const { account, isConnected } = useWeb3();
  const [treasuryState, setTreasuryState] = useState({
    totalDeposited: '0',
    totalShares: '0',
    totalLiquidETH: '0',
    availableLidoShares: '0',
    uniswapPositionCount: '0',
  });
  const [userStats, setUserStats] = useState({
    shares: '0',
    ethValue: '0',
    withdrawableAt: '0',
    lockedAmount: '0',
  });
  const [strategies, setStrategies] = useState([
    { id: 1, name: 'Lido Staking', active: true, allocation: '100%' },
    { id: 2, name: 'Uniswap LP', active: false, allocation: '0%' },
  ]);

  useEffect(() => {
    if (isConnected && account) {
      // Simulate API calls to get treasury state
      const mockTreasuryState = {
        totalDeposited: '12.5',
        totalShares: '1250',
        totalLiquidETH: '3.2',
        availableLidoShares: '9.3',
        uniswapPositionCount: '0',
      };
      setTreasuryState(mockTreasuryState);

      const mockUserStats = {
        shares: '50',
        ethValue: '0.5',
        withdrawableAt: '0',
        lockedAmount: '0',
      };
      setUserStats(mockUserStats);
    }
  }, [isConnected, account]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Treasury Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="Treasury Overview" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="h6">Total Deposited</Typography>
                  <Typography variant="h4" color="primary">
                    {treasuryState.totalDeposited} ETH
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h6">Total Shares</Typography>
                  <Typography variant="h4" color="primary">
                    {treasuryState.totalShares}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h6">Liquid ETH</Typography>
                  <Typography variant="h4" color="success.main">
                    {treasuryState.totalLiquidETH} ETH
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h6">Staked ETH</Typography>
                  <Typography variant="h4" color="secondary">
                    {treasuryState.availableLidoShares} ETH
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Your Position" />
            <CardContent>
              <Typography variant="h6">Shares</Typography>
              <Typography variant="h4" color="primary">
                {userStats.shares}
              </Typography>
              <Typography variant="h6">Value</Typography>
              <Typography variant="h4" color="success.main">
                {userStats.ethValue} ETH
              </Typography>
              {userStats.lockedAmount > 0 && (
                <Typography variant="body2" color="error">
                  {userStats.lockedAmount} ETH locked until {new Date(
                    parseInt(userStats.withdrawableAt) * 1000
                  ).toLocaleString()}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Active Strategies
        </Typography>
        <Grid container spacing={2}>
          {strategies.map((strategy) => (
            <Grid item xs={12} md={6} key={strategy.id}>
              <Card>
                <CardHeader
                  title={strategy.name}
                  action={
                    <Chip
                      label={strategy.allocation}
                      color={strategy.active ? 'primary' : 'default'}
                    />
                  }
                />
                <CardContent>
                  <Typography variant="body2">
                    {strategy.active ? 'Active' : 'Inactive'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {strategy.name} strategy is {strategy.active ? 'currently active' : 'currently inactive'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;