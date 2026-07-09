"use client";

import { useEffect, useState } from "react";

const targetTime = new Date("2026-07-21T23:59:59+05:30").getTime();

function format(value: number) {
  return value < 10 ? `0${value}` : String(value);
}

export function Countdown() {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    const updateTimeLeft = () => {
      setTimeLeft(Math.max(targetTime - Date.now(), 0));
    };

    updateTimeLeft();

    const timer = window.setInterval(() => {
      updateTimeLeft();
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  if (timeLeft === null) {
    return (
      <div className="grid grid-cols-4 gap-2 sm:gap-3" aria-label="Countdown loading">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl bg-slate-900 px-2 py-4 text-center text-white dark:bg-slate-800">
            <div className="text-2xl font-bold leading-none text-white sm:text-3xl">--</div>
            <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-300">
              {index === 0 ? "Days" : index === 1 ? "Hrs" : index === 2 ? "Min" : "Sec"}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (timeLeft <= 0) {
    return (
      <div className="rounded-2xl bg-slate-900 px-4 py-5 text-center text-white dark:bg-slate-800">
        <div className="text-sm font-semibold">Registration window closed</div>
        <div className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-300">Focus on Prelims &amp; Mains prep</div>
      </div>
    );
  }

  const totalSeconds = Math.floor(timeLeft / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const items = [
    { label: "Days", value: String(days) },
    { label: "Hrs", value: format(hours) },
    { label: "Min", value: format(minutes) },
    { label: "Sec", value: format(seconds) },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl bg-slate-900 px-2 py-4 text-center text-white dark:bg-slate-800">
          <div className="text-2xl font-bold leading-none text-white sm:text-3xl">{item.value}</div>
          <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-300">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
