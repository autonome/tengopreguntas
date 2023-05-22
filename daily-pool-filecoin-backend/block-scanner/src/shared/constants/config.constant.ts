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
  [NodeEnv.DEV]: 581371,
  [NodeEnv.PROD]: 0,
};

export const CONTRACT_ADDRESS = {
  [NodeEnv.DEV]: '0xba02ACCE5A28c3C3C41eDCB5be7f5f7AC7f1859a',
  [NodeEnv.PROD]: '0xe46ED7f5e47E84B2feC94be582728Fd44cF6E22B', //FIXME
};
