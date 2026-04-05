import './globals.css';

export const metadata = {
  title: 'Local Lens | Hyperlocal NeighborEye',
  description: 'A Next.js hyperlocal community alert platform with frontend pages and backend APIs.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
