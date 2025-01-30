export const CombineAnnotationsIcon = ({ color }: { color: string }) => {
  return (
    <svg
      width="24"
      height="24"
      xmlns="http://www.w3.org/200/svg"
      viewBox="0 0 24 24"
    >
      <path
        d="m2 8 h 14 v 14 h -14 v -14 h 1"
        stroke={color}
        fill={color}
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="m8 2 h 14 v 14 h -14 v -14 h 1"
        stroke={color}
        fill={color}
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
};
