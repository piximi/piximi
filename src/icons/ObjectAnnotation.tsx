import React from "react";

export const ObjectAnnotation = ({ color }: { color: string }) => {
  return (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Object selection</title>
      <g
        id="Object-selection"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g id="Group" transform="translate(-0.000000, -0.000000)">
          <g
            transform="translate(2.000000, 3.000000)"
            id="Path"
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          >
            <path d="M16.1970001,12.9320001 L16.1970001,12.9320001 L18.1730001,14.9080001 C18.6090001,15.3440001 18.6090001,16.0520001 18.1730001,16.4880001 L16.9870001,17.6740001 C16.5510001,18.1100001 15.8430001,18.1100001 15.4070001,17.6740001 L13.4310001,15.6980001 L11.9420001,17.1870001 C11.6480001,17.4810001 11.1480001,17.3630001 11.0170001,16.9690001 L8.14500004,8.35200005 C7.99900004,7.91500005 8.41500004,7.50000004 8.85200005,7.64500004 L17.4690001,10.5170001 C17.8630001,10.6480001 17.9810001,11.1480001 17.6870001,11.4420001 L16.1970001,12.9320001"></path>
            <line
              x1="2.78000002"
              y1="7.93000005"
              x2="0.50000001"
              y2="7.93000005"
            ></line>
            <line
              x1="4.44000003"
              y1="3.94000003"
              x2="2.82000002"
              y2="2.32000002"
            ></line>
            <line
              x1="4.40000003"
              y1="11.9600001"
              x2="2.78000002"
              y2="13.5800001"
            ></line>
            <line
              x1="8.43000004"
              y1="2.28000002"
              x2="8.43000004"
              y2="1.25000099e-08"
            ></line>
            <line
              x1="12.4600001"
              y1="3.90000003"
              x2="14.0800001"
              y2="2.28000002"
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
