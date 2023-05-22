import React from "react";
import { useWeb3Modal } from "@web3modal/react";
import Button from "@mui/material/Button";
import { AppBar, Box, Grid, Stack, TextField, Toolbar, Typography } from "@mui/material";
import { useAccount, useChainId } from "wagmi";
import Countdown from "react-countdown";
import { usePoolActions, usePoolStates, useRoundInfo } from "./hooks/usePoolContract";
import { formatUnits } from "viem";
import { useUserInfo } from "./hooks/useUserInfo";

function App() {
  const { open } = useWeb3Modal();
  const chainId = useChainId();
  const { isConnected, address } = useAccount();
  const { startTimeStamp, depositAmount, currentRoundId, refetchStatus } = usePoolStates(chainId);
  const { answer, setAnswer, prevRoundData, rank } = useUserInfo(currentRoundId, address);
  const { currentRoundInfo, prevRoundInfo, currentRoundUserInfo, prevRoundUserInfo } = useRoundInfo(
    currentRoundId,
    chainId,
    address
  );
  const { allowance, approve, submitAnswer, refetchAllowance, claim } = usePoolActions(
    address,
    depositAmount,
    chainId
  );
  const handleConnect = async () => {
    await open();
  };
  const handleSubmit = async () => {
    if (isConnected) {
      if (allowance < depositAmount) {
        await approve();
        refetchAllowance();
      }
      await submitAnswer(answer, currentRoundId);
      refetchStatus();
    } else {
      await open();
    }
  };

  const handleClaim = async () => {
    if (isConnected) {
      await claim(currentRoundId - 1);
    }
  };
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Daily Pool
          </Typography>
          <Button color="primary" variant="contained" onClick={handleConnect}>
            {isConnected ? "My Wallet" : "Connect Wallet"}
          </Button>
        </Toolbar>
      </AppBar>
      <Grid container spacing={5}>
        {prevRoundInfo !== undefined && (
          <Stack gap={3} margin={10}>
            <Typography sx={{ fontSize: 32 }}>Previous Round</Typography>
            <Stack useFlexGap gap={10} direction={"row"}>
              <Typography>Round Id :</Typography>
              <Typography>{currentRoundId - 1}</Typography>
            </Stack>
            <Stack useFlexGap gap={10} direction={"row"}>
              <Typography>Prize :</Typography>
              <Typography>{formatUnits(prevRoundInfo?.[4], 9)} USDT</Typography>
            </Stack>
            <Stack useFlexGap gap={10} direction={"row"}>
              <Typography>Question :</Typography>
              <Typography>{prevRoundInfo?.[0]}</Typography>
            </Stack>
            <Stack useFlexGap gap={10} direction={"row"}>
              <Typography>Correct answer :</Typography>
              <Typography>{prevRoundInfo?.[3]}</Typography>
            </Stack>
            <Stack useFlexGap gap={10} direction={"row"} alignItems={"center"}>
              <Typography>Your answer :</Typography>
              <Typography>{prevRoundData?.[0]}</Typography>
            </Stack>
            <Stack useFlexGap gap={10} direction={"row"}>
              {prevRoundInfo?.[3] === prevRoundData?.[0] ? (
                <>
                  <Typography color={"lightgreen"}>Win - Rank: {rank}</Typography>
                  <Button
                    color="success"
                    variant="outlined"
                    disabled={prevRoundUserInfo?.[2] ? true : false}
                    onClick={handleClaim}
                  >
                    {prevRoundUserInfo?.[2] ? "Claimed" : "Claim prize"}
                  </Button>
                </>
              ) : (
                <Typography color={"red"}>Loss</Typography>
              )}
            </Stack>
          </Stack>
        )}
        {currentRoundInfo !== undefined && (
          <Stack gap={3} margin={10}>
            <Typography sx={{ fontSize: 32 }}>Current Round</Typography>
            <Stack useFlexGap gap={10} direction={"row"}>
              <Typography>Round Id :</Typography>
              <Typography>{currentRoundId}</Typography>
            </Stack>
            <Stack useFlexGap gap={10} direction={"row"}>
              <Typography>Question :</Typography>
              <Typography>{currentRoundInfo?.[0]}</Typography>
            </Stack>
            <Stack useFlexGap gap={10} direction={"row"}>
              <Typography>Attendance :</Typography>
              <Typography>{currentRoundInfo?.[2]} players</Typography>
            </Stack>
            <Stack useFlexGap gap={10} direction={"row"}>
              <Typography>Prize :</Typography>
              <Typography>{formatUnits(currentRoundInfo?.[4], 9)} USDT</Typography>
            </Stack>
            <Stack useFlexGap gap={10} direction={"row"}>
              <Typography>Next round :</Typography>
              {startTimeStamp && <Countdown date={(startTimeStamp + 60 * 60 * 24) * 1000} />}
            </Stack>
            <Stack useFlexGap gap={10} direction={"row"}>
              <Typography>Answer time :</Typography>
              {startTimeStamp && <Countdown date={(startTimeStamp + 60 * 60 * 24 - 120) * 1000} />}
            </Stack>
            {currentRoundUserInfo?.[0] === true ? (
              <Stack useFlexGap gap={10} direction={"row"}>
                <Typography>Your answer :</Typography>
                {answer}
              </Stack>
            ) : (
              <>
                <Stack useFlexGap gap={10} direction={"row"}>
                  <Typography color={"red"}>You can only answer within the last one minute</Typography>
                </Stack>
                <Stack direction={"row"} gap={4}>
                  <TextField
                    id="outlined-multiline-flexible"
                    label="Your answer"
                    multiline
                    maxRows={4}
                    value={answer}
                    onChange={(e) => {
                      setAnswer(e.target.value);
                    }}
                  />
                  <Button color="primary" variant="contained" onClick={handleSubmit}>
                    {isConnected ? "Submit" : "Connect wallet"}
                  </Button>
                </Stack>
              </>
            )}
          </Stack>
        )}
      </Grid>
    </Box>
  );
}

export default App;
