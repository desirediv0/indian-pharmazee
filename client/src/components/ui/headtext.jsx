import React from "react";
import { motion } from "framer-motion";

const Headtext = ({ text, className }) => {
  return (
    <h2
      className={`text-2xl md:text-3xl font-bold tracking-tight ${className}`}
      style={{ color: "#0A2540" }}
    >
      <span className="relative inline-block">
        {text}
        <motion.span
          className="absolute -bottom-2 left-0 h-[3px] rounded-full"
          style={{ background: "linear-gradient(90deg, #005EB8, #16C7D9)", width: 0 }}
          animate={{ width: "100%" }}
          transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
        />
      </span>
    </h2>
  );
};

export default Headtext;
