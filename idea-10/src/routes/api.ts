import express from 'express';
import { ApiResponse, EmailRecipient, YieldHarvest, BridgeTransaction, EmailDisbursement } from '../types';
import { logger } from '../config/logger';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    timestamp: new Date().toISOString(),
  });
});

router.post('/harvest', async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than zero',
        timestamp: new Date().toISOString(),
      });
    }

    // Trigger manual harvest (in real implementation, this would call the scheduler)
    logger.info(`Manual harvest triggered for amount: ${amount} ETH`);

    res.json({
      success: true,
      data: {
        message: 'Harvest triggered successfully',
        amount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Harvest trigger error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger harvest',
      timestamp: new Date().toISOString(),
    });
  }
});

router.get('/harvests', async (req, res) => {
  try {
    // In real implementation, fetch from database
    const harvests: YieldHarvest[] = [];
    
    res.json({
      success: true,
      data: harvests,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Fetch harvests error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch harvests',
      timestamp: new Date().toISOString(),
    });
  }
});

router.post('/recipients', async (req, res) => {
  try {
    const recipients: EmailRecipient[] = req.body.recipients;
    
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one recipient is required',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate recipients
    for (const recipient of recipients) {
      if (!recipient.email || !recipient.amount || !recipient.currency) {
        return res.status(400).json({
          success: false,
          error: 'Each recipient must have email, amount, and currency',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // In real implementation, save recipients and trigger disbursement
    logger.info(`Received ${recipients.length} recipients for disbursement`);

    res.json({
      success: true,
      data: {
        message: 'Recipients accepted',
        count: recipients.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Add recipients error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add recipients',
      timestamp: new Date().toISOString(),
    });
  }
});

router.get('/bridges', async (req, res) => {
  try {
    // In real implementation, fetch from database
    const bridges: BridgeTransaction[] = [];
    
    res.json({
      success: true,
      data: bridges,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Fetch bridges error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bridges',
      timestamp: new Date().toISOString(),
    });
  }
});

router.get('/emails', async (req, res) => {
  try {
    // In real implementation, fetch from database
    const emails: EmailDisbursement[] = [];
    
    res.json({
      success: true,
      data: emails,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Fetch emails error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch emails',
      timestamp: new Date().toISOString(),
    });
  }
});

router.get('/status', async (req, res) => {
  try {
    // In real implementation, check system health
    const systemHealth = {
      status: 'healthy' as const,
      ethereumConnected: true,
      celoConnected: true,
      ampersendConnected: true,
      lastHarvestAt: null,
      pendingHarvests: 0,
      pendingBridges: 0,
      pendingEmails: 0,
      uptime: process.uptime(),
    };

    res.json({
      success: true,
      data: systemHealth,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('System status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check system status',
      timestamp: new Date().toISOString(),
    });
  }
});

export { router };
