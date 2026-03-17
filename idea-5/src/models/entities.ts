import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, JoinColumn, OneToOne } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 254, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  selfVerificationHash!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  selfIssuer?: string;

  @Column({ type: 'varchar', length: 42, nullable: true })
  celoAddress?: string;

  @Column({ type: 'char', length: 2, nullable: true })
  countryCode?: string;

  @Column({ type: 'boolean', default: false })
  ageVerified!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastVerifiedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToOne(() => Transaction, {
    cascade: true,
    lazy: true,
  })
  @JoinColumn({ name: 'active_transaction_id' })
  activeTransaction?: Transaction;
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 254 })
  senderEmail!: string;

  @Column({ type: 'varchar', length: 254 })
  recipientEmail!: string;

  @Column({ type: 'uuid', nullable: true, name: 'recipient_user_id' })
  recipientUserId?: string;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  amount!: number;

  @Column({ type: 'varchar', length: 10 })
  currency!: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status!: string;

  @Column({ type: 'varchar', length: 66, nullable: true })
  senderCeloTxHash?: string;

  @Column({ type: 'varchar', length: 66, nullable: true })
  disbursementTxHash?: string;

  @Column({ type: 'varchar', length: 66, nullable: true })
  lockTxHash?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  ampersendMessageId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  verificationFlowToken?: string;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt!: Date;
}

@Entity('email_verifications')
export class EmailVerification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 254 })
  email!: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  token!: string;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  usedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

@Entity('self_verifications')
export class SelfVerification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'transaction_id' })
  transactionId!: string;

  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  userId?: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  verificationToken!: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'self_verification_id' })
  selfVerificationId?: string;

  @Column({ type: 'text', nullable: true, name: 'self_issuance_proof' })
  selfIssuanceProof?: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status!: string;

  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt?: Date;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

@Entity('email_logs')
export class EmailLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'transaction_id' })
  transactionId!: string;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true, name: 'ampersend_message_id' })
  ampersendMessageId?: string;

  @Column({ type: 'varchar', length: 20 })
  direction!: string;

  @Column({ type: 'text', nullable: true })
  subject?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'email_type' })
  emailType?: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'sent_at' })
  sentAt?: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'delivered_at' })
  deliveredAt?: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'opened_at' })
  openedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'clicked_at' })
  clickedAt?: Date;

  @Column({ type: 'jsonb', nullable: true, name: 'raw_response' })
  rawResponse?: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true, name: 'transaction_id' })
  transactionId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  userId?: string;

  @Column({ type: 'varchar', length: 100 })
  action!: string;

  @Column({ type: 'jsonb' })
  details!: Record<string, any>;

  @Column({ type: 'inet', nullable: true, name: 'ip_address' })
  ipAddress?: string;

  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  userAgent?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}