import { useState, useEffect } from "react";
import { APIServer } from "../utils/api";

export const useUserInfo = (roundId: number, userAddress: `0x${string}` | undefined) => {
  const [answer, setAnswer] = useState("");
  const [prevRoundData, setPrevRoundData] = useState<string[]>();
  const [rank, setRank] = useState(0);

  useEffect(() => {
    (async () => {
      if (userAddress && roundId > -1) {
        const { data } = await APIServer.get(`/info?roundId=${roundId}&userAddress=${userAddress}`);
        setAnswer(data[0]);
        setPrevRoundData(data[1]);
        setRank(data[2]);
      }
    })();
  }, [userAddress, roundId]);

  return { answer, setAnswer, prevRoundData, rank };
};
