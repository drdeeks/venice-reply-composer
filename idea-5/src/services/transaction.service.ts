import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Transaction } from '../models/entities';
import { InjectRepository } from '@nestjs/typeorm';
import { CeloService } from './celo.service';
import { EmailService } from './email.service';
import { SelfVerificationService } from './selfVerification.service';
import { Config } from '../config';
import { TransactionStatus, ApiResponse, VerificationStatus } from '../types';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private celoService: CeloService,
    private emailService: EmailService,
    private selfVerificationService: SelfVerificationService,
    private config: Config,
  ) {}

  async createTransaction(
    senderEmail: string,
    recipientEmail: string,
    amount: number,
    currency: string,
  ): Promise<ApiResponse<TransactionStatus>> {
    try {
      // Validate input
      if (!senderEmail || !recipientEmail) {
        throw new Error('Sender and recipient emails are required');
      }

      if (amount <= 0) {
        throw new Error('Amount must be greater than zero');
      }

      // Check if sender has enough balance (TODO: implement wallet balance check)

      // Create transaction
      const transaction = this.transactionRepository.create({
        senderEmail,
        recipientEmail,
        amount,
        currency,
        status: 'pending',
        expiresAt: new Date(Date.now() + this.config.transactionTimeout),
      });

      await this.transactionRepository.save(transaction);

      // Send claim email to recipient
      await this.emailService.sendClaimEmail(recipientEmail, transaction.id);

      // Log audit
      await this.logAudit('transaction.create', { transactionId: transaction.id });

      return {
        success: true,
        data: {
          id: transaction.id,
          senderEmail,
          recipientEmail,
          amount,
          currency,
          status: 'pending' as const,
          expiresAt: transaction.expiresAt,
          createdAt: transaction.createdAt,
          verificationStatus: 'pending' as const,
        } as TransactionStatus,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TRANSACTION_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create transaction',
          details: error,
        },
        timestamp: new Date(),
      };
    }
  }

  async getTransactionStatus(id: string): Promise<ApiResponse<TransactionStatus>> {
    try {
      const transaction = await this.transactionRepository.findOne({
        where: { id },
        relations: ['recipientUser'],
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      const status: TransactionStatus = {
        id: transaction.id,
        senderEmail: transaction.senderEmail,
        recipientEmail: transaction.recipientEmail,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status as any,
        celoTxHash: transaction.senderCeloTxHash,
        disbursementTxHash: transaction.disbursementTxHash,
        verificationStatus: transaction.status === 'verified' ? 'verified' : 'pending',
        expiresAt: transaction.expiresAt,
        completedAt: transaction.completedAt,
        createdAt: transaction.createdAt,
      };

      return {
        success: true,
        data: status,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TRANSACTION_STATUS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get transaction status',
          details: error,
        },
        timestamp: new Date(),
      };
    }
  }

  async processTransactionVerification(
    transactionId: string,
    selfVerificationId: string,
  ): Promise<ApiResponse<VerificationStatus>> {
    try {
      const transaction = await this.transactionRepository.findOne({
        where: { id: transactionId },
        relations: ['recipientUser'],
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status !== 'pending') {
        throw new Error('Transaction is not in pending state');
      }

      if (new Date() > transaction.expiresAt) {
        throw new Error('Transaction has expired');
      }

      // Verify Self proof
      const verificationResult = await this.selfVerificationService.verifySelfProof(
        selfVerificationId,
      );

      if (!verificationResult.verified) {
        throw new Error('Self verification failed');
      }

      // Update transaction status
      transaction.status = 'verified';
      await this.transactionRepository.save(transaction);

      // Fund recipient's Celo wallet
      const disbursementResult = await this.celoService.disburseFunds(
        transaction.recipientEmail,
        transaction.amount,
        transaction.currency,
      );

      if (!disbursementResult.success) {
        throw new Error('Failed to disburse funds');
      }

      transaction.disbursementTxHash = disbursementResult.data?.txHash;
      transaction.status = 'completed';
      transaction.completedAt = new Date();
      await this.transactionRepository.save(transaction);

      // Send completion email
      await this.emailService.sendCompletionEmail(
        transaction.recipientEmail,
        transaction.amount,
        transaction.currency,
        disbursementResult.data?.txHash,
      );

      // Log audit
      await this.logAudit('transaction.verify', {
        transactionId: transaction.id,
        selfVerificationId,
      });

      return {
        success: true,
        data: {
          id: transaction.id,
          transactionId: transaction.id,
          status: 'verified' as const,
          selfVerificationId,
          verifiedAt: new Date(),
          expiresAt: transaction.expiresAt,
        } as VerificationStatus,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TRANSACTION_VERIFY_ERROR',
          message: error instanceof Error ? error.message : 'Failed to verify transaction',
          details: error,
        },
        timestamp: new Date(),
      };
    }
  }

  private async logAudit(action: string, details: Record<string, any>): Promise<void> {
    // Implementation for audit logging
    console.log('AUDIT:', { action, details, timestamp: new Date() });
  }
}