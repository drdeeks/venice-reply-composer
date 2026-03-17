const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const axios = require('axios');
const winston = require('winston');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'job-board-backend' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Talent Protocol API integration
app.get('/api/talent/profile/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const response = await axios.get(
      `https://api.talentprotocol.com/profile/${address}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.TALENT_PROTOCOL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    logger.error('Talent Protocol API error:', error);
    res.status(500).json({ error: 'Failed to fetch Talent Protocol profile' });
  }
});

// Merit Systems API integration
app.get('/api/merit/verify/:skillId', async (req, res) => {
  try {
    const { skillId } = req.params;
    const response = await axios.get(
      `https://api.merits.xyz/verify/${skillId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.MERIT_SYSTEMS_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    logger.error('Merit Systems API error:', error);
    res.status(500).json({ error: 'Failed to verify Merit attestation' });
  }
});

// Job board endpoints
app.post('/api/jobs', async (req, res) => {
  try {
    const { title, description, requirements, salaryMin, salaryMax, deadline, requiredSkills } = req.body;
    
    // Validate input
    if (!title || !description || !salaryMin || !salaryMax || !deadline) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // TODO: Save job to database
    const jobId = Date.now(); // Temporary ID

    res.json({
      success: true,
      jobId,
      message: 'Job posted successfully'
    });
  } catch (error) {
    logger.error('Job posting error:', error);
    res.status(500).json({ error: 'Failed to post job' });
  }
});

// Application endpoints
app.post('/api/applications', async (req, res) => {
  try {
    const { jobId, candidateAddress, coverLetter, resumeData } = req.body;
    
    // Verify candidate profile
    const talentResponse = await axios.get(
      `https://api.talentprotocol.com/profile/${candidateAddress}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.TALENT_PROTOCOL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Verify required skills
    const job = await getJobById(jobId); // TODO: Implement
    const verificationResults = await Promise.all(
      job.requiredSkills.map(skill => 
        axios.get(`https://api.merits.xyz/verify/${skill}`, {
          headers: {
            'Authorization': `Bearer ${process.env.MERIT_SYSTEMS_API_KEY}`,
            'Content-Type': 'application/json'
          }
        })
      )
    );

    // TODO: Save application to database
    const applicationId = Date.now(); // Temporary ID

    res.json({
      success: true,
      applicationId,
      verificationResults,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    logger.error('Application error:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
});

// Helper functions
async function getJobById(jobId) {
  // TODO: Implement database query
  return {
    id: jobId,
    title: 'Sample Job',
    description: 'Sample Description',
    salaryMin: 80000,
    salaryMax: 120000,
    deadline: Date.now() + 30 * 24 * 60 * 60 * 1000,
    requiredSkills: ['solidity', 'smart-contracts', 'web3']
  };
}

module.exports = app;