import { NodeEnv } from '../config/config.service';

export const RPC_URL = {
  [NodeEnv.DEV]: 'https://api.calibration.node.glif.io/rpc/v1',
  [NodeEnv.PROD]: 'https://api.node.glif.io',
};

export const CONTRACT_ADDRESS = {
  [NodeEnv.DEV]: '0x4A8d39Adb04d8cA9d1BAa8d227D5756740C611a8',
  [NodeEnv.PROD]: '0xe46ED7f5e47E84B2feC94be582728Fd44cF6E22B', //FIXME
};
