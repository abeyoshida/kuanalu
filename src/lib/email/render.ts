import { render } from '@react-email/render';
import React from 'react';

/**
 * Renders a React component to HTML for email sending
 * 
 * @param component The React component to render
 * @returns HTML string representation of the component
 */
export async function renderEmail(component: React.ReactElement): Promise<string> {
  return render(component);
}

/**
 * Renders a React component to plain text for email sending
 * 
 * @param component The React component to render
 * @returns Plain text representation of the component
 */
export async function renderEmailText(component: React.ReactElement): Promise<string> {
  return render(component, { plainText: true });
} 