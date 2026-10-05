"use client";

import { Avatar, Box } from "@mui/material";
import { transformImageUrl } from "../../lib/features";

export default function AvatarCard({ avatar = [], max = 3 }) {
  const images = avatar.slice(0, max);
  return (
    <Box
      sx={{
        position: "relative",
        width: 44 + Math.max(0, images.length - 1) * 12,
        height: 44,
        flexShrink: 0,
      }}
    >
      {images.length ? (
        images.map((src, index) => (
          <Avatar
            key={index}
            src={transformImageUrl(src)}
            alt=""
            sx={{
              width: 44,
              height: 44,
              position: "absolute",
              left: index * 12,
              border: "2px solid white",
              bgcolor: "#e5eafa",
              color: "#4361d8",
            }}
          />
        ))
      ) : (
        <Avatar
          sx={{ width: 44, height: 44, bgcolor: "#e5eafa", color: "#4361d8" }}
        />
      )}
    </Box>
  );
}
