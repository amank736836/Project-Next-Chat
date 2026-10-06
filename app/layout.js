import { CssBaseline } from "@mui/material";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Providers } from "../components/Providers";
import NoContextMenu from "../components/NoContextMenu";
import UserInitializer from "../components/UserInitializer";
import { brandCssVariables } from "../constants/brand";
import "./globals.css";
import "./welcome.css";

export const metadata = {
  title: "Chat Champ",
  description: "A modern chat application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={brandCssVariables}>
      <body>
        <Providers>
          <CssBaseline />
          <Analytics />
          <SpeedInsights />
          <UserInitializer />
          <NoContextMenu>{children}</NoContextMenu>
        </Providers>
      </body>
    </html>
  );
}
