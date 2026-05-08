import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Windows 11 Desktop Clone',
  description: 'A beautiful Windows 11 desktop clone built with React and Tailwind CSS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="m-0 p-0 overflow-hidden">
        {children}
      </body>
    </html>
  );
}
