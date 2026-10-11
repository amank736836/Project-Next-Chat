import { CssBaseline } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Providers } from "../components/Providers";
import NoContextMenu from "../components/NoContextMenu";
import UserInitializer from "../components/UserInitializer";
import { brandCssVariables } from "../constants/brand";
import "./globals.css";
import "./welcome.css";

export const metadata = {
  // Each route sets its own `title`; the template keeps the brand suffix.
  title: { default: "Chat Champ", template: "%s | Chat Champ" },
  description: "A modern chat application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={brandCssVariables}>
      <body>
        {/* Collects Emotion's SSR styles into <head>; without it the inline
            <style> tags land inside <body> and break hydration (React #418). */}
        <AppRouterCacheProvider>
          <Providers>
            <CssBaseline />
            <Analytics />
            <SpeedInsights />
            <UserInitializer />
            <NoContextMenu>{children}</NoContextMenu>
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
