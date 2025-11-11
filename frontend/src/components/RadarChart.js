// frontend/src/components/RadarChart.js
import React from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

// 레이더 차트에 필요한 요소 등록
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

function RadarChart({ result }) {
  if (!result) return null;

  const labels = [
    '의사소통',
    '책임감',
    '문제해결',
    '성장성',
    '스트레스 내성',
    '적응력',
  ];

  const scores = [
    Number(result.communication),
    Number(result.responsibility),
    Number(result.problem_solving),
    Number(result.growth),
    Number(result.stress),
    Number(result.adaptation),
  ];

  const data = {
    labels,
    datasets: [
      {
        label: '역량 점수',
        data: scores,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        suggestedMin: 1,
        suggestedMax: 5,
        ticks: { stepSize: 1 },
      },
    },
  };

  return (
    <div className="radar-chart-wrapper" style={{ width: '100%', height: '260px' }}>
      <Radar data={data} options={options} />
    </div>
  );
}

export default RadarChart;
