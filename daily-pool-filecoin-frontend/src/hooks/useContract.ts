import { contracts } from "../constants/contracts";
import { DailyPoolABI, USDTABI } from "../utils/abis";

export const usePoolContractConfig = (chainId: number) => {
  const contractConfig = {
    address: contracts?.[chainId]?.DailyPool as any,
    abi: DailyPoolABI,
  };
  return contractConfig;
};

export const useUSDTContractConfig = (chainId: number) => {
  const contractConfig = {
    address: contracts?.[chainId]?.Usdt as any,
    abi: USDTABI,
  };
  return contractConfig;
};
