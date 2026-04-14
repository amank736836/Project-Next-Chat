"use client";

import { FileOpen as FileOpenIcon } from "@mui/icons-material";
import { transformImageUrl } from "../../lib/features";

export default function RenderAttachment(fileType, url) {
  switch (fileType) {
    case "video":
      return (
        <video src={url} controls style={{ width: "100%" }} preload="auto" />
      );
    case "image":
      return (
        <img
          src={transformImageUrl(url, 200)}
          alt="attachment"
          width={"200px"}
          height={"150px"}
          style={{ objectFit: "contain" }}
        />
      );
    case "audio":
      return <audio src={url} controls preload="auto" />;
    default:
      return <FileOpenIcon />;
  }
}
