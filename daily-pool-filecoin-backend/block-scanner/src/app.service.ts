import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import {
  BLOCK_FILTER_LIMIT,
  CONTRACT_ADDRESS,
  RPC_URL,
  START_BLOCK_NUMBER,
} from './shared/constants/config.constant';
import { Config, ConfigService } from './config/config.service';
import { EventType } from './shared/enums/base.enum';
import { ABI, TOPIC } from './shared/abi';
import { retryRPCPromise, sleep } from './utils';
import { InjectRepository } from '@nestjs/typeorm';
import { AnswerEntity } from './database/entities/answer.entity';
import { ILike, Repository } from 'typeorm';
import { readFileSync } from 'fs';
import { constants, createPublicKey } from 'crypto';
import { join } from 'path';
import { verify } from 'crypto';

@Injectable()
export class AppService {
  private keyPath = join(__dirname, '../../keys/');
  private startBlockNumber: number;
  private provider: ethers.providers.JsonRpcProvider;
  private config: Config;
  private readonly logger: Logger;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(AnswerEntity)
    private answerRepository: Repository<AnswerEntity>,
  ) {
    this.logger = new Logger(AppService.name);
    this.config = this.configService.getConfig();
    this.provider = new ethers.providers.JsonRpcProvider(RPC_URL[this.config.NODE_ENV]);
    this.queryEvents();
  }

  private queryEvents = async () => {
    this.startBlockNumber = START_BLOCK_NUMBER[this.config.NODE_ENV];
    await this.getAllTxs();
  };

  private getAllTxs = async () => {
    const lastBlockNumber = await this.provider.getBlockNumber();

    let fromBlockNumber: number = this.startBlockNumber;
    if (lastBlockNumber > fromBlockNumber) {
      while (lastBlockNumber >= fromBlockNumber) {
        const toBlockNumber =
          lastBlockNumber > fromBlockNumber + BLOCK_FILTER_LIMIT
            ? fromBlockNumber + BLOCK_FILTER_LIMIT
            : lastBlockNumber;

        await this.filterEvents(fromBlockNumber, toBlockNumber);
        this.logger.verbose(`Block filtered from ${fromBlockNumber} to ${toBlockNumber}`);
        fromBlockNumber += BLOCK_FILTER_LIMIT + 1;
      }
      this.startBlockNumber = lastBlockNumber + 1;
      this.getAllTxs();
    } else {
      await sleep(3000);
      this.getAllTxs();
    }
  };

  private async filterEvents(fromBlock: number, toBlock: number): Promise<void> {
    // Filter AnswerSubmitted events and save
    const transferInterface = new ethers.utils.Interface([ABI[EventType.AnswerSubmitted]]);
    const getTransferLogs = () =>
      this.provider.getLogs({
        address: CONTRACT_ADDRESS[this.config.NODE_ENV],
        fromBlock,
        toBlock,
        topics: [[TOPIC[EventType.AnswerSubmitted]]],
      });
    const logs: ethers.providers.Log[] = await retryRPCPromise(getTransferLogs, 5);
    for (const log of logs) {
      const event = transferInterface.parseLog(log);
      const isValidAnswer = await this.verifyAnswer(event.args[0], event.args[1], event.args[2]);
      if (isValidAnswer) {
        await this.updateIsConfirmed(event.args[0], event.args[1], event.args[2]);
        this.logger.log(`Successfully fetched ${logs.length} AnswerSubmitted events`);
      } else {
        this.logger.warn(`Invalid answer detected from user ${event.args[1]}`);
      }
    }
  }

  async updateIsConfirmed(roundId: number, userAddress: string, encryptedAnswer: string): Promise<void> {
    await this.answerRepository.update(
      { roundId, userAddress: ILike(userAddress) },
      { encryptedAnswer, isConfirmed: true },
    );
  }

  private async verifyAnswer(
    roundId: number,
    userAddress: string,
    encryptedAnswer: string,
  ): Promise<boolean> {
    // Read the public key from the PEM file
    const publicKeyFromFile = readFileSync(this.keyPath + roundId + '-publicKey.pem', 'utf-8');
    const publicKeyRead = createPublicKey(publicKeyFromFile);
    const { answer } = await this.answerRepository.findOneBy({ roundId, userAddress });
    return verify(
      'sha256',
      Buffer.from(answer),
      {
        key: publicKeyRead,
        padding: constants.RSA_PKCS1_PSS_PADDING,
      },
      Buffer.from(encryptedAnswer, 'base64'),
    );
  }
}
