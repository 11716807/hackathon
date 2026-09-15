"use client";

import { motion } from "motion/react";

interface PolaroidFanProps {
  items: { src: string; caption: string }[];
}

export function PolaroidFan({ items }: PolaroidFanProps) {
  const mid = Math.max(items.length - 1, 0) / 2;
  const step = items.length <= 1 ? 0 : Math.min(32, 150 / items.length);

  return (
    <div className="gf-fan relative mx-auto">
      {items.map((item, index) => {
        const offset = (index - mid) * step;
        const rotate = (index - mid) * (items.length > 6 ? 5 : 8);
        const float = index % 2 === 0 ? -8 : 6;
        const dealDelay = 0.05 + index * 0.08;

        return (
          <div
            key={`${item.src}-${item.caption}-${index}`}
            className="absolute top-[8%] left-1/2 w-[58%] -translate-x-1/2"
            style={{ zIndex: index + 1 }}
          >
            <motion.div
              className="origin-bottom"
              initial={{ x: 0, y: 42, rotate: 0, scale: 0.82 }}
              animate={{
                x: offset,
                y: [0, float, 0],
                rotate,
                scale: 1,
              }}
              transition={{
                x: {
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: dealDelay,
                },
                rotate: {
                  type: "spring",
                  stiffness: 200,
                  damping: 16,
                  delay: dealDelay,
                },
                scale: { duration: 0.38, delay: dealDelay },
                y: {
                  duration: 5.2 + index * 0.35,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.6 + index * 0.08,
                },
              }}
            >
              <figure className="gf-print">
                <img src={item.src} alt="" />
                <figcaption>{item.caption}</figcaption>
              </figure>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
