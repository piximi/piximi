import React from "react";

export const MainContent = ({ color }: { color: string }) => {
  return (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Main Content</title>
      <g
        id="main-content"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <rect x="1" y="1" width="22" height="22" stroke={color} rx="2" ry="2" />
        <rect x="5.5" y="3.5" width="15" height="19.5" fill={color} />
      </g>
    </svg>
  );
};
