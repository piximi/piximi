import React from "react";

export const TopBar = ({ color }: { color: string }) => {
  return (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Top Bar</title>
      <g
        id="top-bar"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <rect x="1" y="1" width="22" height="22" stroke={color} rx="2" ry="2" />
        <rect x="1.5" y="1.5" width="21.5" height="3" fill={color} />
      </g>
    </svg>
  );
};
