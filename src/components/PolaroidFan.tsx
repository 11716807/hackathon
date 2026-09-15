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
        return (
        <motion.div
          key={`${item.caption}-${index}`}
          className="absolute top-[8%] left-1/2 w-[58%] origin-bottom"
          initial={false}
          animate={{
            x: `calc(-50% + ${offset}px)`,
            y: [0, index % 2 === 0 ? -8 : 6, 0],
            rotate,
          }}
          transition={{
            x: { duration: 0.6, delay: index * 0.07 },
            rotate: { duration: 0.6, delay: index * 0.07 },
            y: {
              duration: 5.2 + index * 0.35,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.18,
            },
          }}
          style={{
            zIndex: index + 1,
            transform: `translateX(calc(-50% + ${offset}px)) rotate(${rotate}deg)`,
          }}
        >
          <figure className="gf-print">
            <img src={item.src} alt="" />
            <figcaption>{item.caption}</figcaption>
          </figure>
        </motion.div>
        );
      })}
    </div>
  );
}
