import { ethers } from 'ethers';

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const newRoundOpenedEventInterfaceAbi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint24',
        name: 'roundId',
        type: 'uint24',
      },
      {
        components: [
          {
            internalType: 'string',
            name: 'question',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'encryptedAnswer',
            type: 'string',
          },
          {
            internalType: 'uint24',
            name: 'attendance',
            type: 'uint24',
          },
          {
            internalType: 'string',
            name: 'answer',
            type: 'string',
          },
          {
            internalType: 'uint256',
            name: 'prize',
            type: 'uint256',
          },
          {
            internalType: 'bool',
            name: 'platformFeeTransferred',
            type: 'bool',
          },
        ],
        indexed: false,
        internalType: 'struct DailyPool.RoundInfo',
        name: 'roundInfo',
        type: 'tuple',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'startTimestamp',
        type: 'uint256',
      },
    ],
    name: 'NewRoundOpened',
    type: 'event',
  },
];

export const newRoundOpenedEventInterface = new ethers.utils.Interface(newRoundOpenedEventInterfaceAbi);
export const newRoundOpenedEventTopic = '0xce1a9957d155138ccc730d10951eac4bf1efd837be7e1d422d058a5c39ffdd67';
