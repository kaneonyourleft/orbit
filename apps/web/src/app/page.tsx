import dynamic from 'next/dynamic';

const OrbitApp = dynamic(() => import('../components/OrbitApp'), { ssr: false });

export default function Home() {
  return <OrbitApp />;
}
