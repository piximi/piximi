import React from "react";

export const CursorZoom = ({
  width,
  height,
  color,
}: {
  width?: string;
  height?: string;
  color: string;
}) => {
  return (
    <svg
      width={width ? width : "24px"}
      height={height ? height : "24px"}
      viewBox="0 0 24 24"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="Zoom" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g id="Path" transform="translate(-0.000000, -0.000000)">
          <polygon points="0 0 24.0000001 0 24.0000001 24.0000001 0 24.0000001"></polygon>
          <circle
            cx="11"
            cy="11"
            r="9"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></circle>
          <polygon
            id="cursor"
            points="16,6,7,8,10.25,10.25,5.25,15.25,6.75,16.75,12.75,11.75,14,15"
            fill={color}
          />
          <line
            x1="18"
            y1="18"
            x2="24"
            y2="24"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></line>
        </g>
      </g>
    </svg>
  );
};

export const StageZoom = ({
  width,
  height,
  color,
}: {
  width?: string;
  height?: string;
  color: string;
}) => {
  return (
    <svg
      width={width ? width : "24px"}
      height={height ? height : "24px"}
      viewBox="0 0 24 24"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="Zoom" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g id="Path" transform="translate(-0.000000, -0.000000)">
          <polygon points="0 0 24.0000001 0 24.0000001 24.0000001 0 24.0000001"></polygon>
          <circle
            cx="11"
            cy="11"
            r="9"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></circle>

          <polygon
            id="cursor"
            points="6,6,16,6,16,16,6,16"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="11" cy="11" r="1" fill={color}></circle>

          <line
            x1="18"
            y1="18"
            x2="24"
            y2="24"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></line>
        </g>
      </g>
    </svg>
  );
};
