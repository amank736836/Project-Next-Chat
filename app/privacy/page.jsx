import { Box, Paper, Stack, Typography } from "@mui/material";

export const metadata = {
  title: "Privacy Policy | Chat Champ",
};

export default function PrivacyPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "var(--champ-canvas)",
        py: { xs: 3, md: 6 },
        px: { xs: 2, md: 4 },
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Paper
        elevation={2}
        sx={{
          width: "100%",
          maxWidth: 900,
          p: { xs: 2.5, md: 5 },
          borderRadius: 3,
        }}
      >
        <Stack spacing={2.5}>
          <Typography variant="h4" fontWeight={700}>
            Privacy Policy
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last updated: April 22, 2026
          </Typography>

          <Typography variant="body1">
            This Privacy Policy explains what information Chat Champ collects, how it is used, and your choices.
          </Typography>

          <Typography variant="h6" fontWeight={600}>1. Information We Collect</Typography>
          <Typography variant="body1">
            We collect account information such as name, username, email, and profile image, plus content you
            submit in chats and messages.
          </Typography>

          <Typography variant="h6" fontWeight={600}>2. How We Use Information</Typography>
          <Typography variant="body1">
            We use your information to provide messaging features, maintain account security, operate and improve
            the app, and troubleshoot issues.
          </Typography>

          <Typography variant="h6" fontWeight={600}>3. Cookies and Sessions</Typography>
          <Typography variant="body1">
            We use session and authentication cookies to keep you signed in and secure your account access.
          </Typography>

          <Typography variant="h6" fontWeight={600}>4. Data Sharing</Typography>
          <Typography variant="body1">
            We do not sell personal data. Information may be shared only when required for service operation,
            legal compliance, or security enforcement.
          </Typography>

          <Typography variant="h6" fontWeight={600}>5. Data Retention</Typography>
          <Typography variant="body1">
            We retain data for as long as needed to provide the service and comply with legal obligations.
          </Typography>

          <Typography variant="h6" fontWeight={600}>6. Your Rights</Typography>
          <Typography variant="body1">
            You can request account updates or deletion through the app administrator, subject to technical and
            legal requirements.
          </Typography>

          <Typography variant="h6" fontWeight={600}>7. Security</Typography>
          <Typography variant="body1">
            We use reasonable safeguards to protect data, but no system is completely secure.
          </Typography>

          <Typography variant="h6" fontWeight={600}>8. Policy Updates</Typography>
          <Typography variant="body1">
            We may update this policy over time. Continued use after updates means you accept the revised policy.
          </Typography>

          <Typography variant="body2" color="text.secondary">
            For privacy-related questions, contact the app administrator.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
