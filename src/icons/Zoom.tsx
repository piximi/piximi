import React from "react";

export const Zoom = ({ color }: { color: string }) => {
  return (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Zoom</title>
      <g id="Zoom" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g id="Path" transform="translate(-0.000000, -0.000000)">
          <polygon points="0 0 24.0000001 0 24.0000001 24.0000001 0 24.0000001"></polygon>
          <path
            d="M14.1931001,5.58187002 C16.5249201,7.91369003 16.5249201,11.69432 14.1931001,14.0261401 C11.86128,16.3579601 8.08065003,16.3579601 5.74883002,14.0261401 C3.41701001,11.69432 3.41701001,7.91369003 5.74883002,5.58187002 C8.08065003,3.25005001 11.86128,3.25005001 14.1931001,5.58187002"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
          <line
            x1="14.1500001"
            y1="14.0600001"
            x2="20.0000001"
            y2="19.9900001"
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

export const CursorZoom = ({ color }: { color: string }) => {
  return (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>cursor-zoom</title>
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

export const StageZoom = ({ color }: { color: string }) => {
  return (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>stage-zoom</title>
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
