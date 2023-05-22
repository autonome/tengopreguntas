import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { constants, createPrivateKey, sign } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AnswerEntity } from './database/entities/answer.entity';
import { ILike, Not, Repository } from 'typeorm';
import { RoundEntity } from './database/entities/round.entity';
import { ethers, Wallet } from 'ethers';
import { Config, ConfigService } from './config/config.service';

enum RANK {
  TopOne,
  TopFive,
  OTHERS,
}

@Injectable()
export class AppService {
  private privateKeyPath = join(__dirname, '../../keys/');
  private readonly config: Config;
  private adminWallet: Wallet;

  constructor(
    @InjectRepository(AnswerEntity)
    private answerRepository: Repository<AnswerEntity>,
    @InjectRepository(RoundEntity)
    private roundRepository: Repository<RoundEntity>,
    private readonly configService: ConfigService,
  ) {
    this.config = this.configService.getConfig();
    this.adminWallet = new Wallet(this.config.PK);
  }

  async getEncryptedAnswer(answer: string, roundId: number, userAddress: string): Promise<string> {
    const answerInfo = await this.answerRepository.findOneBy({ roundId, userAddress });
    if (answerInfo && answerInfo.isConfirmed) {
      throw new BadRequestException('Already answered for this round');
    }
    const privateKeyFromFile = readFileSync(this.privateKeyPath + roundId + '-privateKey.pem', 'utf-8');
    const privateKeyRead = createPrivateKey(privateKeyFromFile);

    const encryptedAnswer = sign('sha256', Buffer.from(answer), {
      key: privateKeyRead,
      padding: constants.RSA_PKCS1_PSS_PADDING,
    });
    await this.answerRepository.upsert(
      {
        roundId,
        userAddress,
        answer,
        encryptedAnswer: encryptedAnswer.toString('base64'),
      },
      ['roundId', 'userAddress'],
    );
    return encryptedAnswer.toString('base64');
  }

  async getUserInfo(roundId: number, userAddress: string) {
    const currentAnswer = await this.answerRepository.findOneBy({ roundId, userAddress: ILike(userAddress) });
    let prevRound: RoundEntity;
    let prevAnswer: AnswerEntity;
    if (roundId > 0) {
      prevRound = await this.roundRepository.findOneBy({ roundId: roundId - 1 });
      prevAnswer = await this.answerRepository.findOneBy({
        roundId: roundId - 1,
        userAddress: ILike(userAddress),
      });
    }
    return [
      currentAnswer?.answer || '',
      [prevAnswer?.answer || '', prevRound?.answer || ''],
      prevAnswer.rank,
    ];
  }

  async getClaimSignature(roundId: number, userAddress: string): Promise<[string, number, number]> {
    const player = await this.answerRepository.findOne({ where: { roundId, userAddress, rank: Not(0) } });
    if (!player) {
      throw new NotFoundException('Not found user');
    }
    let rank: RANK;
    if ((player.rank = 1)) {
      rank = RANK.TopOne;
    } else if (player.rank < 7) {
      rank = RANK.TopFive;
    } else {
      rank = RANK.OTHERS;
    }
    const hash = ethers.utils.solidityKeccak256(['uint8', 'address'], [rank, userAddress]);
    const signature = await this.adminWallet.signMessage(ethers.utils.arrayify(hash));
    const players = await this.answerRepository.count({ where: { rank: Not(0) } });
    return [signature, rank, players];
  }
}
