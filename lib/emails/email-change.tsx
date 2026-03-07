import { Html, Head, Preview, Body, Container, Section, Text, Button, Link } from "@react-email/components"

interface EmailChangeTemplateProps {
  magicLink: string
  userName: string
}

export const EmailChangeTemplate = ({ magicLink, userName }: EmailChangeTemplateProps) => {
  return (
    <Html>
      <Head />
      <Preview>Verify your new flyteLog email address</Preview>
      <Body style={{ backgroundColor: "#f6f9fc", padding: "40px 0", fontFamily: "sans-serif" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "40px", borderRadius: "8px", maxWidth: "600px", margin: "0 auto", border: "1px solid #e2e8f0" }}>
          <Section style={{ textAlign: "center", marginBottom: "32px" }}>
            <Text style={{ fontSize: "24px", fontWeight: "bold", color: "#0ea5e9", margin: "0" }}>
              flyteLog
            </Text>
          </Section>

          <Text style={{ fontSize: "16px", color: "#334155", marginBottom: "24px" }}>
            Hi {userName},
          </Text>

          <Text style={{ fontSize: "16px", color: "#334155", marginBottom: "32px", lineHeight: "1.5" }}>
            You recently requested to change the email address associated with your flyteLog account.
            Click the button below to verify this new email address. This link is valid for 1 hour.
          </Text>

          <Section style={{ textAlign: "center", marginBottom: "32px" }}>
            <Button
              href={magicLink}
              style={{
                backgroundColor: "#0ea5e9",
                color: "#ffffff",
                padding: "12px 24px",
                borderRadius: "6px",
                fontSize: "16px",
                fontWeight: "500",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Verify Email Address
            </Button>
          </Section>

          <Text style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>
            If the button doesn't work, you can copy and paste this link into your browser:
          </Text>
          <Text style={{ fontSize: "14px", color: "#0ea5e9", wordBreak: "break-all" }}>
            <Link href={magicLink} style={{ color: "#0ea5e9" }}>{magicLink}</Link>
          </Text>

          <Text style={{ fontSize: "14px", color: "#94a3b8", marginTop: "48px", textAlign: "center" }}>
            If you did not request this change, please ignore this email and your account will remain associated with your current email address.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
