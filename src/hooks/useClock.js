import { useEffect, useState } from 'react';
const now = () => new Date().toISOString().slice(11, 19);
export function useClock() {
  const [t, setT] = useState(now);
  useEffect(() => { const id = setInterval(() => setT(now()), 1000); return () => clearInterval(id); }, []);
  return t;
}
