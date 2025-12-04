import { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as fs from 'fs';
import { BotConfig } from '../config/config';

export class SolanaClient {
  private connection: Connection;
  private wallet: Keypair;

  constructor(config: BotConfig) {
    this.connection = new Connection(config.rpcUrl, 'confirmed');
    this.wallet = this.loadWallet(config);
  }

  private loadWallet(config: BotConfig): Keypair {
    if (config.privateKey) {
      const secretKey = JSON.parse(config.privateKey);
      return Keypair.fromSecretKey(new Uint8Array(secretKey));
    }

    if (config.walletPath) {
      const walletData = fs.readFileSync(config.walletPath, 'utf-8');
      const secretKey = JSON.parse(walletData);
      return Keypair.fromSecretKey(new Uint8Array(secretKey));
    }

    throw new Error('No wallet path or private key provided in config');
  }

  getWallet(): Keypair {
    return this.wallet;
  }

  getConnection(): Connection {
    return this.connection;
  }

  getWalletAddress(): PublicKey {
    return this.wallet.publicKey;
  }

  async getBalance(): Promise<number> {
    const balance = await this.connection.getBalance(this.wallet.publicKey);
    return balance / LAMPORTS_PER_SOL;
  }

  async sendTransaction(transaction: Transaction): Promise<string> {
    transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
    transaction.feePayer = this.wallet.publicKey;
    transaction.sign(this.wallet);

    const signature = await this.connection.sendRawTransaction(transaction.serialize());
    await this.connection.confirmTransaction(signature, 'confirmed');
    
    return signature;
  }

  async getTransactionStatus(signature: string): Promise<boolean> {
    const status = await this.connection.getSignatureStatus(signature);
    return status.value?.err === null;
  }
}

