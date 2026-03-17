import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondary,
  ListItemAvatar,
  Avatar,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useWeb3 } from '../hooks/useWeb3';

interface Proposal {
  id: number;
  proposer: string;
  description: string;
  executionTime: string;
  status: 'active' | 'passed' | 'executed' | 'rejected';
  yeaVotes: number;
  nayVotes: number;
  hasVoted: boolean;
}

const Governance: React.FC = () => {
  const { account, isConnected } = useWeb3();
  const [proposals, setProposals] = useState<Proposal[]>([
    {
      id: 1,
      proposer: '0x1234...5678',
      description: 'Add USDC-WETH LP strategy with 30% allocation',
      executionTime: '2024-01-15 15:00 UTC',
      status: 'active',
      yeaVotes: 120.5,
      nayVotes: 10.2,
      hasVoted: false,
    },
    {
      id: 2,
      proposer: '0xabcd...ef01',
      description: 'Withdraw 5 ETH to pay for gas fees',
      executionTime: '2024-01-10 12:00 UTC',
      status: 'executed',
      yeaVotes: 150.0,
      nayVotes: 5.0,
      hasVoted: true,
    },
  ]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newDescription, setNewDescription] = useState('');
  const [newQuorum, setNewQuorum] = useState('10');
  const [newYeaThreshold, setNewYeaThreshold] = useState('60');

  const handleVote = (proposalId: number, vote: boolean) => {
    if (!isConnected) {
      alert('Please connect wallet first');
      return;
    }
    // Simulate voting
    const updated = proposals.map((p) => {
      if (p.id === proposalId) {
        return {
          ...p,
          hasVoted: true,
          yeaVotes: vote ? p.yeaVotes + 10 : p.yeaVotes,
          nayVotes: !vote ? p.nayVotes + 10 : p.nayVotes,
        };
      }
      return p;
    });
    setProposals(updated);
  };

  const handleCreateProposal = () => {
    if (!newDescription) {
      alert('Please enter a description');
      return;
    }
    const proposal: Proposal = {
      id: proposals.length + 1,
      proposer: account || '0x0000',
      description: newDescription,
      executionTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      yeaVotes: 0,
      nayVotes: 0,
      hasVoted: false,
    };
    setProposals([...proposals, proposal]);
    setCreateDialogOpen(false);
    setNewDescription('');
    setNewQuorum('10');
    setNewYeaThreshold('60');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Governance</Typography>
        <Button
          variant="contained"
          onClick={() => setCreateDialogOpen(true)}
          disabled={!isConnected}
        >
          Create Proposal
        </Button>
      </Box>

      <List>
        {proposals.map((proposal) => (
          <React.Fragment key={proposal.id}>
            <Card sx={{ mb: 2 }}>
              <CardHeader
                title={`Proposal #${proposal.id}`}
                subheader={`Proposer: ${proposal.proposer}`}
                action={
                  <Chip
                    label={proposal.status.toUpperCase()}
                    color={
                      proposal.status === 'active'
                        ? 'primary'
                        : proposal.status === 'passed' || proposal.status === 'executed'
                        ? 'success'
                        : 'error'
                    }
                  />
                }
              />
              <CardContent>
                <Typography variant="body1" gutterBottom>
                  {proposal.description}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Execution Time: {proposal.executionTime}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Chip label={`Yea: ${proposal.yeaVotes.toFixed(1)}`} color="success" />
                  <Chip label={`Nay: ${proposal.nayVotes.toFixed(1)}`} color="error" />
                </Box>
                {proposal.status === 'active' && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => handleVote(proposal.id, true)}
                      disabled={proposal.hasVoted || !isConnected}
                      sx={{ mr: 1 }}
                    >
                      Vote Yea
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleVote(proposal.id, false)}
                      disabled={proposal.hasVoted || !isConnected}
                    >
                      Vote Nay
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
            <Divider />
          </React.Fragment>
        ))}
      </List>

      {/* Create Proposal Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Proposal</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Proposal Description"
            fullWidth
            multiline
            rows={3}
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Proposals execute automatically if:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            1. Quorum met: at least {newQuorum}% of total shares vote
          </Typography>
          <Typography variant="body2" color="text.secondary">
            2. Majority in favor: {newYeaThreshold}%+ yea votes
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateProposal} variant="contained">
            Create Proposal
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Governance;