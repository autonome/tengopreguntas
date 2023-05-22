import { ethers } from 'ethers';

import * as ERC20ABI from './erc20.json';
import * as DailyPoolABI from './daily-pool.json';
import { EventType } from '../enums/base.enum';

export { ERC20ABI, DailyPoolABI };

export const ABI = {
  [EventType.AnswerSubmitted]:
    'event AnswerSubmitted(uint24 indexed roundId, address indexed respondent, string answer)',
  [EventType.NewRoundOpened]:
    'event NewRoundOpened(uint24 indexed roundId, RoundInfo roundInfo, uint256 indexed startTimestamp)',
};

export const TOPIC = {
  [EventType.AnswerSubmitted]: ethers.utils.id('AnswerSubmitted(uint24,address,string)'),
  [EventType.NewRoundOpened]: ethers.utils.id('NewRoundOpened(uint24,RoundInfo,uint256)'),
};
