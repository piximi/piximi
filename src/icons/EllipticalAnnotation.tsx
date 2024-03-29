import React from "react";

export const EllipticalAnnotation = ({ color }: { color: string }) => {
  return (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Elliptical selection</title>
      <g
        id="Elliptical-selection"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g id="Group" transform="translate(-0.000000, -0.000000)">
          <path
            d="M18.3640001,5.63604002 C21.8787201,9.15076004 21.8787201,14.8492401 18.3640001,18.3639401 C14.8492801,21.8786601 9.15080004,21.8786601 5.63610002,18.3639401 C2.12138001,14.8492201 2.12138001,9.15074004 5.63610002,5.63604002 C9.15082004,2.12132001 14.8493001,2.12132001 18.3640001,5.63604002"
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
