export const NewAnnotationIcon = ({ color }: { color: string }) => {
  return (
    <svg
      width="24"
      height="24"
      xmlns="http://www.w3.org/200/svg"
      viewBox="0 0 24 24"
    >
      <path
        id="new-annotation"
        d="m 3 3 v 19 h 19 v -19 h -19 v 9.5 h4 v-1.5 h4 v-4 h3 v4 h4 v3 h-4 v4 h-3 v-4 h-4 v-1.5"
        fill={color}
        strokeWidth="1.5"
        stroke={color}
        strokeLinejoin="round"
      />
    </svg>
  );
};
