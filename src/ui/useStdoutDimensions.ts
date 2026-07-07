import { useEffect, useState } from 'react';

export function useStdoutDimensions() {
  const [dimensions, setDimensions] = useState([
    process.stdout.columns || 80,
    process.stdout.rows || 24
  ]);

  useEffect(() => {
    const onResize = () => {
      setDimensions([process.stdout.columns, process.stdout.rows]);
    };
    process.stdout.on('resize', onResize);
    return () => { process.stdout.off('resize', onResize); };
  }, []);

  return dimensions;
}
