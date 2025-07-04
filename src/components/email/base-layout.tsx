import React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Hr,
  Text,
  Link,
} from '@react-email/components';

interface BaseEmailLayoutProps {
  previewText: string;
  children: React.ReactNode;
}

export const BaseEmailLayout = ({
  previewText,
  children,
}: BaseEmailLayoutProps) => {
  const appName = 'Kuanalu';
  const currentYear = new Date().getFullYear();

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Text style={styles.logo}>{appName}</Text>
          </Section>
          
          <Section style={styles.content}>
            {children}
          </Section>
          
          <Hr style={styles.divider} />
          
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              © {currentYear} {appName}. All rights reserved.
            </Text>
            <Text style={styles.footerText}>
              <Link href="#" style={styles.link}>Privacy Policy</Link> • <Link href="#" style={styles.link}>Terms of Service</Link>
            </Text>
            <Text style={styles.footerText}>
              This email was sent to you because you are a user of {appName}.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const styles = {
  body: {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    margin: 0,
    padding: 0,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    margin: '40px auto',
    maxWidth: '600px',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#4f46e5', // Indigo color for header
    padding: '20px',
  },
  logo: {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0',
    textAlign: 'center' as const,
  },
  content: {
    padding: '20px 30px',
  },
  divider: {
    borderColor: '#e6ebf1',
    margin: '20px 0',
  },
  footer: {
    padding: '0 30px 30px',
  },
  footerText: {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '16px',
    textAlign: 'center' as const,
    margin: '4px 0',
  },
  link: {
    color: '#556cd6',
    textDecoration: 'underline',
  },
}; 