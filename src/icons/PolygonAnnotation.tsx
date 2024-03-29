import React from "react";

export const PolygonAnnotation = ({ color }: { color: string }) => {
  return (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Polygonal selection</title>
      <g
        id="Polygonal-selection"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g id="Group" transform="translate(-0.000000, -0.000000)">
          <path
            d="M10.922,3.63000002 L3.68100002,8.89100004 C3.03800001,9.35800004 2.77000001,10.185 3.01500001,10.941 L5.78100002,19.4540001 C6.02600003,20.2090001 6.73000003,20.7210001 7.52500003,20.7210001 L16.4760001,20.7210001 C17.2700001,20.7210001 17.9740001,20.2100001 18.2200001,19.4540001 L20.9860001,10.941 C21.2310001,10.186 20.9630001,9.35800004 20.3200001,8.89100004 L13.0780001,3.63000002 C12.4350001,3.16300001 11.565,3.16300001 10.922,3.63000002 L10.922,3.63000002 Z"
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
