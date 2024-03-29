import React from "react";

export const RectangleAnnotation = ({ color }: { color: string }) => {
  return (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Rectangular selection</title>
      <g
        id="Rectangular-selection"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g id="Group" transform="translate(-0.000000, -0.000000)">
          <path
            d="M18.4170001,20.25 L5.58300002,20.25 C4.57000002,20.25 3.75000002,19.4290001 3.75000002,18.4170001 L3.75000002,5.58300002 C3.75000002,4.57000002 4.57100002,3.75000002 5.58300002,3.75000002 L18.4160001,3.75000002 C19.4290001,3.75000002 20.249001,4.57100002 20.249001,5.58300002 L20.249001,18.4160001 C20.25,19.4290001 19.4290001,20.25 18.4170001,20.25 Z"
            id="Path"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
          <polygon
            id="Path"
            points="0 0 24.0000001 0 24.0000001 24.0000001 0 24.0000001"
          ></polygon>
        </g>
      </g>
    </svg>
  );
};
