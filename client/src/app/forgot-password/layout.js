// Private / transactional page — keep it out of Google's index.
export const metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function Layout({ children }) {
  return children;
}
