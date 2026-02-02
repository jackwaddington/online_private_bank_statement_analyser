import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type TooltipItem,
} from 'chart.js'
import styled from 'styled-components'
import { theme } from '../../styles'

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend)

interface SpendingChartProps {
  data: Map<string, number>
}

export function SpendingChart({ data }: SpendingChartProps) {
  const sortedEntries = Array.from(data.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10) // Top 10 categories

  const chartData = {
    labels: sortedEntries.map(([category]) => category),
    datasets: [
      {
        data: sortedEntries.map(([, amount]) => amount),
        backgroundColor: theme.colors.chart,
        borderWidth: 0,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 12,
          padding: 8,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'doughnut'>) => {
            const total = sortedEntries.reduce((sum, [, amt]) => sum + amt, 0)
            const value = context.raw as number
            const percent = ((value / total) * 100).toFixed(1)
            return `${context.label}: €${value.toLocaleString('en', { minimumFractionDigits: 2 })} (${percent}%)`
          },
        },
      },
    },
  }

  return (
    <ChartContainer>
      <Doughnut data={chartData} options={options} />
    </ChartContainer>
  )
}

const ChartContainer = styled.div`
  height: 300px;
  width: 100%;
`
