"use client";

import { CircularProgress, Grid, Skeleton, Stack, Typography } from "@mui/material";
import { BouncingSkeleton } from "../styles/StyledComponents";

export function LayoutLoader() {
  return (
    <Grid
      container
      height={"calc(100vh - 6rem)"}
      spacing={"1rem"}
      sx={{
        padding: "1rem",
      }}
    >
      <Grid
        size={{ sm: 4, md: 3 }}
        sx={{ display: { xs: "none", sm: "block" } }}
        height={"100%"}
      >
        <Skeleton
          variant="rounded"
          height={"100vh"}
          sx={{
            padding: "2rem",
          }}
        />
      </Grid>
      <Grid size={{ sm: 8, md: 5, lg: 6, xs: 12 }} height={"100%"} spacing={1}>
        <Stack spacing={"1rem"}>
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} variant="rounded" height={95} />
          ))}
        </Stack>
      </Grid>
      <Grid
        size={{ md: 4, lg: 3 }}
        sx={{
          display: { xs: "none", md: "block" },
        }}
        height={"100%"}
      >
        <Skeleton
          variant="rounded"
          height={"100vh"}
          sx={{
            padding: "2rem",
          }}
        />
      </Grid>
    </Grid>
  );
}

export function TypingLoader({ username }) {
  return (
    <Stack
      spacing={"0.5rem"}
      direction={"row"}
      alignItems={"center"}
      justifyContent={"flex-start"}
      padding={"0.5rem"}
    >
      <Typography
        variant="body2"
        fontSize={"0.8rem"}
        color={"#888"}
        fontWeight={500}
        sx={{
          fontFamily: "Poppins",
        }}
      >
        {username} typing
      </Typography>
      <BouncingSkeleton
        variant="circular"
        width={10}
        height={10}
        style={{
          animationDelay: "0.1s",
          background: "linear-gradient(45deg, #f3ec78, #af4261)",
        }}
      />
      <BouncingSkeleton
        variant="circular"
        width={10}
        height={10}
        style={{
          animationDelay: "0.2s",
          background: "linear-gradient(45deg, #f3ec78, #af4261)",
        }}
      />
      <BouncingSkeleton
        variant="circular"
        width={10}
        height={10}
        style={{
          animationDelay: "0.4s",
          background: "linear-gradient(45deg, #f3ec78, #af4261)",
        }}
      />
      <BouncingSkeleton
        variant="circular"
        width={10}
        height={10}
        style={{
          animationDelay: "0.6s",
          background: "linear-gradient(45deg, #f3ec78, #af4261)",
        }}
      />
    </Stack>
  );
}

export function FullPageLoader({ message = "Loading...", minHeight = "100vh" }) {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={1.5}
      sx={{ minHeight, width: "100%" }}
    >
      <CircularProgress color="inherit" />
      <Typography variant="body2" color="inherit">
        {message}
      </Typography>
    </Stack>
  );
}
