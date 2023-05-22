import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { constants, sign, generateKeyPairSync } from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { AnswerEntity } from './database/entities/answer.entity';
import { Repository } from 'typeorm';
import { Config, ConfigService } from './config/config.service';
import { BigNumber, ethers } from 'ethers';
import { CONTRACT_ADDRESS, RPC_URL } from './constants/config.constant';
import { DailyPoolABI } from './abi';
import { correctAnswers } from './constants/answers';
import { questions } from './constants/questions';
import { RoundEntity } from './database/entities/round.entity';
import { newRoundOpenedEventInterface, newRoundOpenedEventTopic, sleep } from './utils';

@Injectable()
export class AppService {
  private keyPath = join(__dirname, '../../keys/');
  private provider: ethers.providers.JsonRpcProvider;
  private config: Config;
  private dailyPoolContract: ethers.Contract;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(AnswerEntity)
    private answerRepo: Repository<AnswerEntity>,
    @InjectRepository(RoundEntity)
    private roundRepo: Repository<RoundEntity>,
  ) {
    this.config = this.configService.getConfig();
    this.provider = new ethers.providers.JsonRpcProvider(RPC_URL[this.config.NODE_ENV]);
    const signer = new ethers.Wallet(this.config.PK, this.provider);
    this.dailyPoolContract = new ethers.Contract(
      CONTRACT_ADDRESS[this.config.NODE_ENV],
      DailyPoolABI,
      signer,
    );
    mkdirSync(join(__dirname, '../../keys'), { recursive: true });
    this.finishRound();
  }

  async finishRound() {
    const lastRound = await this.roundRepo.findOne({ where: { isEnded: false }, order: { roundId: 'DESC' } });
    if (!lastRound) {
      console.log('Not found round to finish');
      await sleep(2000);
      this.finishRound();
    }
    console.log(`RoundId to finish: ${lastRound.roundId}`);
    try {
      await this.executeNewRound(lastRound.roundId);
      await this.setWinners(lastRound.roundId);
      await sleep(24 * 60 * 60 * 1000 - 4000);
      this.finishRound();
    } catch (error) {
      console.log(error);
      console.log(`Failed to finish round ${lastRound.roundId}`);
      await sleep(2000);
      this.finishRound();
    }
  }

  private async setWinners(roundId: number) {
    const correctAnswer = correctAnswers[roundId];
    const players = await this.answerRepo.find({
      where: { roundId, answer: correctAnswer, isConfirmed: true },
      order: {
        updatedAt: 'ASC',
      },
    });
    // Read the public key from the PEM file
    let rank = 1;
    for (const player of players) {
      player.rank = rank;
      await this.answerRepo.save(player);
      console.log('Rank:', rank, 'saved');
      rank++;
    }
  }

  private async executeNewRound(roundId: number) {
    const nextQuestion = questions[roundId + 1];
    const correctAnswer = correctAnswers[roundId + 1];
    const prevCorrectAnswer = correctAnswers[roundId];

    // generate keys
    const keyPair = generateKeyPairSync('rsa', { modulusLength: 2048 });
    writeFileSync(
      this.keyPath + (roundId + 1) + '-publicKey.pem',
      keyPair.publicKey.export({ type: 'spki', format: 'pem' }),
    );
    writeFileSync(
      this.keyPath + (roundId + 1) + '-privateKey.pem',
      keyPair.privateKey.export({ type: 'pkcs8', format: 'pem' }),
    );

    // sign with private key
    const encryptedCorrectAnswer = sign('sha256', Buffer.from(correctAnswer), {
      key: keyPair.privateKey,
      padding: constants.RSA_PKCS1_PSS_PADDING,
    });
    // estimate gas
    let gasLimit: BigNumber;
    try {
      gasLimit = await this.dailyPoolContract.estimateGas.executeRound(
        nextQuestion,
        encryptedCorrectAnswer.toString('base64'),
        prevCorrectAnswer,
      );
    } catch (e) {
      gasLimit = BigNumber.from(58244390);
    }
    console.log(`execute new round gasLimit: ${gasLimit.mul(2).toString()}`);

    // Call executeRound function
    try {
      const tx = await this.dailyPoolContract.executeRound(
        nextQuestion,
        encryptedCorrectAnswer.toString('base64'),
        prevCorrectAnswer,
        {
          gasLimit: gasLimit.mul(2),
        },
      );
      const receipt = await tx.wait();
      const log = receipt.logs.find((log: any) => (log.topics[0] = newRoundOpenedEventTopic));
      try {
        const event = newRoundOpenedEventInterface.parseLog({
          data: log.data,
          topics: log.topics,
        });
        console.log(event);
        console.log('Delayed round for 1 more day');
      } catch (error) {
        console.log(error);
        await this.roundRepo.update({ roundId }, { isEnded: true });
        await this.roundRepo.save({ roundId: roundId + 1, question: nextQuestion, answer: correctAnswer });
        console.log('New round started');
      }
    } catch (e) {
      console.error(`executeNewRound failed, ${e.stack}`);
    }
  }
}
