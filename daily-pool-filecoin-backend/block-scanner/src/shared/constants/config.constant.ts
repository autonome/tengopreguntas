import { NodeEnv } from '../../config/config.service';

export const BLOCK_FILTER_LIMIT = 30;

export const RPC_URL = {
  [NodeEnv.DEV]: 'https://api.calibration.node.glif.io/rpc/v1',
  [NodeEnv.PROD]: 'https://api.node.glif.io',
};

export const SCAN_URL = {
  [NodeEnv.DEV]: 'https://calibration.filfox.info/en',
  [NodeEnv.PROD]: 'https://filfox.info/en',
};

export const START_BLOCK_NUMBER = {
  [NodeEnv.DEV]: 944540,
  [NodeEnv.PROD]: 0,
};

export const CONTRACT_ADDRESS = {
  [NodeEnv.DEV]: '0x4A8d39Adb04d8cA9d1BAa8d227D5756740C611a8',
  [NodeEnv.PROD]: '0xe46ED7f5e47E84B2feC94be582728Fd44cF6E22B', //FIXME
};
