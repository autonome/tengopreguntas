import { useContractRead, useContractReads } from "wagmi";
import { usePoolContractConfig, useUSDTContractConfig } from "./useContract";
import { contracts } from "../constants/contracts";
import { useCallback } from "react";
import { writeContract, waitForTransaction } from "@wagmi/core";
import { APIServer } from "../utils/api";

export const usePoolStates = (chainId: number) => {
  const contractConfig = usePoolContractConfig(chainId);
  let callData: any = [];

  callData.push({
    ...contractConfig,
    functionName: "startTimestamp",
  });
  callData.push({
    ...contractConfig,
    functionName: "depositAmount",
  });
  callData.push({
    ...contractConfig,
    functionName: "currentRoundId",
  });

  const {
    data,
    isError,
    isLoading,
    refetch: refetchStatus,
  } = useContractReads({
    contracts: callData,
    cacheOnBlock: true,
  });

  return {
    startTimeStamp: parseInt(data?.[0].result as string),
    depositAmount: parseInt(data?.[1].result as string),
    currentRoundId: parseInt(data?.[2].result as string),
    isError,
    isLoading,
    refetchStatus,
  };
};

export const useRoundInfo = (roundId: number, chainId: number, address: `0x${string}` | undefined) => {
  const contractConfig = usePoolContractConfig(chainId);

  let callData: any = [];

  callData.push({
    ...contractConfig,
    functionName: "roundInfos",
    args: [roundId],
  });
  callData.push({
    ...contractConfig,
    functionName: "roundInfos",
    args: [roundId - 1],
  });
  callData.push({
    ...contractConfig,
    functionName: "roundUserInfos",
    args: [roundId, address],
  });
  callData.push({
    ...contractConfig,
    functionName: "roundUserInfos",
    args: [roundId - 1, address],
  });

  const { data, isError, isLoading } = useContractReads({
    contracts: callData,
    cacheOnBlock: true,
    enabled: address !== undefined,
  });
  return {
    currentRoundInfo: data?.[0].result as any,
    prevRoundInfo: data?.[1].result as any,
    currentRoundUserInfo: data?.[2].result as any,
    prevRoundUserInfo: data?.[3].result as any,
    isError,
    isLoading,
  };
};

export const usePoolActions = (
  address: `0x${string}` | undefined,
  depositAmount: number,
  chainId: number
) => {
  const usdtContractConfig = useUSDTContractConfig(chainId);
  const poolContractConfig = usePoolContractConfig(chainId);
  const { data: allowance, refetch: refetchAllowance } = useContractRead({
    ...usdtContractConfig,
    functionName: "allowance",
    args: [address, contracts?.[chainId]?.DailyPool],
    enabled: address !== undefined,
    cacheOnBlock: true,
  });

  const approve = useCallback(async () => {
    const { hash } = await writeContract({
      ...usdtContractConfig,
      functionName: "approve",
      args: [contracts?.[chainId]?.DailyPool, depositAmount],
    });
    const data = await waitForTransaction({ hash });
    return data;
  }, [chainId, depositAmount, usdtContractConfig]);

  const submitAnswer = useCallback(
    async (answer: string, roundId: number) => {
      try {
        if (!address) throw new Error("Undefined address");
        const { data: encryptedAnswer } = await APIServer.get(
          `/encrypt?answer=${answer}&roundId=${roundId}&userAddress=${address}`
        );
        const { hash } = await writeContract({
          ...poolContractConfig,
          functionName: "submitAnswer",
          args: [encryptedAnswer],
        });
        await waitForTransaction({ hash });
        window.alert("Successfully submitted!");
      } catch (error) {
        console.error(error);
      }
    },
    [address, poolContractConfig]
  );

  const claim = useCallback(
    async (roundId: number) => {
      try {
        if (!address) throw new Error("Undefined address");
        const { data } = await APIServer.get(`/signature?roundId=${roundId}&userAddress=${address}`);
        const { hash } = await writeContract({
          ...poolContractConfig,
          functionName: "claimPrize",
          args: [...data],
        });
        await waitForTransaction({ hash });
        window.alert("Successfully claimed!");
      } catch (error) {
        console.error(error);
      }
    },
    [address, poolContractConfig]
  );

  return { allowance: parseInt(allowance as string), approve, submitAnswer, refetchAllowance, claim };
};
