import { Box, Paper, Stack, Typography } from "@mui/material";

export const metadata = {
  title: "Terms of Service | Chat Champ",
};

export default function TermsPage() {
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
            Terms of Service
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last updated: April 22, 2026
          </Typography>

          <Typography variant="body1">
            These Terms of Service govern your use of Chat Champ. By creating an account or using the service,
            you agree to these terms.
          </Typography>

          <Typography variant="h6" fontWeight={600}>1. Eligibility and Account</Typography>
          <Typography variant="body1">
            You must provide accurate account details and keep your login credentials secure. You are responsible
            for activity under your account.
          </Typography>

          <Typography variant="h6" fontWeight={600}>2. Acceptable Use</Typography>
          <Typography variant="body1">
            You agree not to misuse the platform, including spam, harassment, unauthorized access attempts,
            malware distribution, or violating applicable laws.
          </Typography>

          <Typography variant="h6" fontWeight={600}>3. User Content</Typography>
          <Typography variant="body1">
            You retain ownership of messages and content you submit. By using the service, you grant Chat Champ
            permission to store and process this content for delivering core app functionality.
          </Typography>

          <Typography variant="h6" fontWeight={600}>4. Service Availability</Typography>
          <Typography variant="body1">
            We may update, suspend, or discontinue features at any time. We aim for reliability but do not
            guarantee uninterrupted availability.
          </Typography>

          <Typography variant="h6" fontWeight={600}>5. Termination</Typography>
          <Typography variant="body1">
            We may suspend or terminate accounts that violate these terms or create security or legal risks.
          </Typography>

          <Typography variant="h6" fontWeight={600}>6. Limitation of Liability</Typography>
          <Typography variant="body1">
            To the maximum extent permitted by law, Chat Champ is not liable for indirect or consequential losses
            arising from use of the service.
          </Typography>

          <Typography variant="h6" fontWeight={600}>7. Changes to Terms</Typography>
          <Typography variant="body1">
            We may revise these terms from time to time. Continued use after updates means you accept the revised
            terms.
          </Typography>

          <Typography variant="body2" color="text.secondary">
            For policy questions, contact the app administrator.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
