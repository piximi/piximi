import React from "react";

export const QuickAnnotation = ({ color }: { color: string }) => {
  return (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Quick selection</title>
      <g
        id="Quick-selection"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g id="Group" transform="translate(-0.000000, -0.000000)">
          <g
            transform="translate(3.000000, 3.000000)"
            id="Path"
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          >
            <polyline points="2.54200002 13.2190001 0.225000013 15.5370001 1.58200002 17.1480001 4.22900003 17.1480001 5.36900003 16.0500001"></polyline>
            <path d="M8.00300005,14.8300001 L7.29600004,15.5370001 C6.51500004,16.3180001 5.24900003,16.3180001 4.46800003,15.5370001 L3.05400003,14.1230001 C2.27300002,13.3420001 2.27300002,12.0760001 3.05400003,11.2950001 L3.76100003,10.5880001"></path>
            <path d="M17.9940001,3.60700003 L14.9830001,0.596000015 C14.2380001,-0.148999988 13.0440001,-0.187999988 12.2520001,0.505000015 L3.95500003,7.76500004 C3.08400003,8.52700005 3.04000003,9.86600005 3.85800003,10.6840001 L7.90600005,14.7320001 C8.72400005,15.5500001 10.0640001,15.5050001 10.8250001,14.6350001 L18.0850001,6.33800004 C18.7780001,5.54600004 18.7380001,4.35200003 17.9940001,3.60700003 Z"></path>
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
