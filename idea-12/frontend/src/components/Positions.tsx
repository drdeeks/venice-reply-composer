import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material';

const Positions: React.FC = () => {
  const [positions, setPositions] = React.useState([
    {
      id: 1,
      name: 'Lido Staking',
      value: '9.3 ETH',
      status: 'Active',
      apy: '4.2%',
      rewards: '0.038 ETH',
    },
    {
      id: 2,
      name: 'USDC-WETH LP',
      value: '3.2 ETH',
      status: 'Active',
      apy: '7.8%',
      rewards: '0.025 ETH',
    },
  ]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        DeFi Positions
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Treasury Overview"
              subheader="Total Value: 12.5 ETH"
            />
            <CardContent>
              <List>
                {positions.map((position) => (
                  <React.Fragment key={position.id}>
                    <ListItem>
                      <ListItemText
                        primary={position.name}
                        secondary={`APY: ${position.apy} | Rewards: ${position.rewards}`}
                      />
                      <Chip
                        label={position.value}
                        color="primary"
                        sx={{ mr: 2 }}
                      />
                      <Chip
                        label={position.status}
                        color={position.status === 'Active' ? 'success' : 'default'}
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Positions;