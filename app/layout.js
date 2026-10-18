import './globals.css';

export const metadata = {
  title: 'Public Service Request System',
  description: 'Report streetlights, water issues, garbage and more to your county.',
};

export default function RootLayout({ children }) {
  return (<html lang="en"><body>{children}</body></html>);
}
