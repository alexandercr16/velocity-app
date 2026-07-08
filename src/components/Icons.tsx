import React from "react";
import Svg, { Circle, Path, Polygon, Rect } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

export function ChevronLeftIcon({ size = 18, color = "#191B20" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function UploadIcon({ size = 20, color = "#4B4EDB" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 16V4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 10l6-6 6 6" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 18v2h16v-2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ReadAloudGlyph({ size = 22, color = "#6E727B" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 9v6h4l5 4V5L8 9H4z" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16.5 8.5a4 4 0 010 7" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M19 6a7 7 0 010 12" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" opacity={0.55} />
    </Svg>
  );
}

export function GuidedPaceGlyph({ size = 22, color = "#6E727B" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 7h16" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Rect x={3} y={10.5} width={13} height={4} rx={2} fill={color} stroke="none" />
      <Path d="M4 18h11" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

export function SprintGlyph({ size = 22, color = "#6E727B" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v3.5M12 17.5V21M3 12h3.5M17.5 12H21"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={12} r={3} fill={color} stroke="none" />
    </Svg>
  );
}

export function RestartIcon({ size = 16, color = "#191B20" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 3v6h6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.5 9a9 9 0 1 1-.5 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function Back10Icon({ size = 16, color = "#191B20" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Polygon points="11 19 2 12 11 5 11 19" />
      <Polygon points="22 19 13 12 22 5 22 19" />
    </Svg>
  );
}

export function Fwd10Icon({ size = 16, color = "#191B20" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Polygon points="13 19 22 12 13 5 13 19" />
      <Polygon points="2 19 11 12 2 5 2 19" />
    </Svg>
  );
}

export function PlayIcon({ size = 22, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Polygon points="7 4 20 12 7 20 7 4" />
    </Svg>
  );
}

export function PauseIcon({ size = 22, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Rect x={6} y={4} width={4} height={16} rx={1} />
      <Rect x={14} y={4} width={4} height={16} rx={1} />
    </Svg>
  );
}
