import "./globals.css";

export const metadata = {
  title: "Kiswahili cha Mtaani — Dataset",
  description: "Ukusanyaji wa dataset ya Kiswahili cha mtaani kwa ajili ya kutrain AI models",
};

export default function RootLayout({ children }) {
  return (
    <html lang="sw">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,600;1,500&family=Work+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
