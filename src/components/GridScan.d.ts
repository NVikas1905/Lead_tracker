declare module '../components/GridScan' {
  import React from 'react';
  interface GridScanProps {
    sensitivity?: number;
    lineThickness?: number;
    linesColor?: string;
    gridScale?: number;
    scanColor?: string;
    scanOpacity?: number;
    enablePost?: boolean;
    bloomIntensity?: number;
    chromaticAberration?: number;
    noiseIntensity?: number;
    style?: React.CSSProperties;
    [key: string]: any;
  }
  const GridScan: React.FC<GridScanProps>;
  export default GridScan;
}
