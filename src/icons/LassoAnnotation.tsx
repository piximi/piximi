import React from "react";

export const LassoAnnotation = ({ color }: { color: string }) => {
  return (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Lasso selection</title>
      <g
        id="Lasso-selection"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g id="Group" transform="translate(-0.000000, -0.000000)">
          <g
            strokeLinecap="round"
            strokeLinejoin="round"
            id="Path"
            stroke={color}
          >
            <path
              d="M18.9200215,5.20050274 C22.7422808,7.79423331 22.7422808,11.9995035 18.9200215,14.593244 C15.0977622,17.1869746 8.90062147,17.1869746 5.07841219,14.593244 C1.25615292,11.9995135 1.25615292,7.79424331 5.07841219,5.20050274 C8.90067146,2.60677217 15.0978122,2.60677217 18.9200215,5.20050274"
              strokeWidth="1.49992515"
              transform="translate(11.999217, 9.896873) rotate(-14.928464) translate(-11.999217, -9.896873) "
            ></path>
            <path
              d="M13.7110001,16.3150001 C9.54400004,17.4260001 4.30200002,16.4030001 4.30200002,12.9560001"
              strokeWidth="1.5"
            ></path>
            <path
              d="M10.048,14.1050001 C10.048,16.3230001 8.89900004,19.8510001 4.30200002,21.0000001"
              strokeWidth="1.5"
            ></path>
            <path
              d="M4.30200002,12.9560001 C4.30200002,9.50900004 10.048,9.50900004 10.048,14.1050001"
              strokeWidth="1.5"
            ></path>
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
