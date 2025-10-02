import React, { useState, useRef, useEffect } from "react";

const useOutsideClick = (ref, callback) => {
  useEffect(() => {
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [ref, callback]);
};

// Time dropdown for days, hours, minutes
export const TimeDropdown = ({ value, setValue, max, unit }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useOutsideClick(ref, () => setOpen(false));

  const options = [...Array(max + 1).keys()]; // 0 to max

  return (
    <div className="relative w-24" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full border rounded px-2 py-1 text-left focus:outline-none focus:ring-1 focus:ring-indigo-200"
      >
        {value} {unit}{value === 1 ? "" : "s"}
      </button>

      {open && (
        <ul className="absolute left-0 mt-1 w-full max-h-40 overflow-auto bg-white border rounded shadow-lg z-10">
          {options.map((opt) => (
            <li
              key={opt}
              onClick={() => {
                setValue(opt);
                setOpen(false);
              }}
              className="px-2 py-1 hover:bg-indigo-100 cursor-pointer"
            >
              {opt} {unit}{opt === 1 ? "" : "s"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
