import React from "react";

export const ColorAnnotation = ({ color }: { color: string }) => {
  return (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Color selection</title>
      <g
        id="Color-selection"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g id="Group" transform="translate(-0.000000, -0.000000)">
          <g
            strokeLinecap="round"
            strokeLinejoin="round"
            transform="translate(2.000000, 2.000000)"
            id="Path"
            stroke={color}
            strokeWidth="1.5"
          >
            <path d="M5.25800002,14.4180001 L1.51600001,10.676 C0.689000003,9.84900004 0.689000003,8.50900004 1.51600001,7.68200003 L7.15000003,2.04800001 L13.8860001,8.78400004 L8.25200003,14.4180001 C7.42500003,15.2440001 6.08400003,15.2440001 5.25800002,14.4180001 Z"></path>
            <path d="M16.8830001,11.774 C16.8830001,11.774 14.7660001,14.0710001 14.7660001,15.4790001 C14.7660001,16.6430001 15.7190001,17.5960001 16.8830001,17.5960001 C18.0470001,17.5960001 19.0000001,16.6430001 19.0000001,15.4780001 C19.0000001,14.0710001 16.8830001,11.774 16.8830001,11.774 L16.8830001,11.774 Z"></path>
            <line
              x1="7.15000003"
              y1="2.05000001"
              x2="6.06000003"
              y2="0.940000004"
            ></line>
            <line
              x1="13.8900001"
              y1="8.78000004"
              x2="0.930000004"
              y2="8.78000004"
            ></line>
            <line
              x1="1.42000001"
              y1="19.4400001"
              x2="10"
              y2="19.4400001"
            ></line>
          </g>
          <polygon
            id="Path"
            points="0 0 24.0000001 0 24.0000001 24.0000001 0 24.0000001"
          ></polygon>
        </g>
      </g>
    </svg>
  );
};
