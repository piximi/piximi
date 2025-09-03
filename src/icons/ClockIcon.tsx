export const CollapsedClockIcon = ({ color }: { color: string }) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/*-- Clock circle -->*/}
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      />

      {/*-- Center dot --*/}
      <circle cx="12" cy="12" r="0.75" fill={color} />

      {/*-- Hour hand (pointing to 10) --*/}
      <line
        x1="12"
        y1="12"
        x2="12"
        y2="6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        transform="rotate(-60 12 12)"
      />

      {/*-- Minute hand (pointing to 12) --*/}
      <line
        x1="12"
        y1="12"
        x2="12"
        y2="5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/*--Left Arrow--*/}
      <line
        x1="2"
        y1="22"
        x2="22"
        y2="2"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const ExpandedClockIcon = ({ color }: { color: string }) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/*-- Clock circle -->*/}
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      />

      {/*-- Center dot --*/}
      <circle cx="12" cy="12" r="0.75" fill={color} />

      {/*-- Hour hand (pointing to 10) --*/}
      <line
        x1="12"
        y1="12"
        x2="12"
        y2="6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        transform="rotate(-60 12 12)"
      />

      {/*-- Minute hand (pointing to 12) --*/}
      <line
        x1="12"
        y1="12"
        x2="12"
        y2="5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};
