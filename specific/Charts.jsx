"use client";

import { memo, useMemo } from "react";
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import { lightOrange, lightPurple, orange, purple } from "../constants/color";
import { brand } from "../constants/brand";
import { getLast7Days } from "../lib/features";
import useReducedMotionSafe from "../components/animations/useReducedMotionSafe";

ChartJS.register(
  CategoryScale,
  Tooltip,
  LinearScale,
  LineElement,
  PointElement,
  Filler,
  ArcElement,
  Legend,
);

ChartJS.defaults.font.family = brand.font;
ChartJS.defaults.color = brand.muted;

const LineChartOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: false,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        display: false,
      },
    },
  },
};

const labels = getLast7Days();

export function LineChart({ value = [] }) {
  const reducedMotion = useReducedMotionSafe();
  const options = useMemo(
    () => ({
      ...LineChartOptions,
      animation: reducedMotion
        ? false
        : { duration: 900, easing: "easeOutQuart" },
    }),
    [reducedMotion],
  );
  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          data: value,
          label: "Messages",
          fill: true,
          backgroundColor: lightPurple,
          borderColor: purple,
        },
      ],
    }),
    [value],
  );

  return (
    <Line
      data={data}
      options={options}
      role="img"
      aria-label="Messages over the last seven days"
    />
  );
}

const DoughnutChartOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: false,
    },
  },
  cutout: 80,
};

export function DoughnutChart({ value = [], labels = [] }) {
  const reducedMotion = useReducedMotionSafe();
  const options = useMemo(
    () => ({
      ...DoughnutChartOptions,
      animation: reducedMotion
        ? false
        : {
            duration: 1000,
            easing: "easeOutQuart",
            animateRotate: true,
            animateScale: true,
          },
    }),
    [reducedMotion],
  );
  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          data: value,
          fill: true,
          borderColor: [purple, orange],
          hoverBackgroundColor: [purple, orange],
          backgroundColor: [lightPurple, lightOrange],
          offset: 40,
        },
      ],
    }),
    [labels, value],
  );

  return (
    <Doughnut
      data={data}
      options={options}
      role="img"
      aria-label={`Chat breakdown: ${labels.join(", ")}`}
      style={{ zIndex: 1 }}
    />
  );
}

export const MemoizedLineChart = memo(LineChart);
export const MemoizedDoughnutChart = memo(DoughnutChart);
