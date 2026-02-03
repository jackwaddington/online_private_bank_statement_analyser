import { Chart } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  LineController,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js'
import styled from 'styled-components'
import { theme } from '../../styles'
import type { MonthlyCashFlow } from '../../core/types/report'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, BarController, LineElement, LineController, PointElement, Tooltip, Legend)

interface CashFlowChartProps {
  data: MonthlyCashFlow[]
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const chartData = {
    labels: data.map(d => d.month),
    datasets: [
      {
        type: 'bar' as const,
        label: 'Income',
        data: data.map(d => d.income),
        backgroundColor: theme.colors.success,
        order: 2,
      },
      {
        type: 'bar' as const,
        label: 'Outgoings',
        data: data.map(d => -d.outgoings), // Negative for visual clarity
        backgroundColor: theme.colors.error,
        order: 2,
      },
      {
        type: 'line' as const,
        label: 'Balance',
        data: data.map(d => d.cumulativeBalance),
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryLight,
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: theme.colors.primary,
        tension: 0.1,
        order: 1,
        yAxisID: 'y',
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: { raw: unknown; dataset: { label?: string } }) => {
            const value = context.raw as number
            const absValue = Math.abs(value)
            const formattedValue = `€${absValue.toLocaleString('en', { minimumFractionDigits: 2 })}`
            if (context.dataset.label === 'Balance') {
              return `${context.dataset.label}: ${value >= 0 ? '' : '-'}${formattedValue}`
            }
            return `${context.dataset.label}: ${formattedValue}`
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          color: theme.colors.border,
        },
        ticks: {
          callback: (value: number | string) => {
            const num = typeof value === 'number' ? value : parseFloat(value)
            return `€${Math.abs(num).toLocaleString('en')}`
          },
        },
      },
    },
  }

  return (
    <ChartContainer>
      <Chart type="bar" data={chartData} options={options} />
    </ChartContainer>
  )
}

const ChartContainer = styled.div`
  height: 300px;
  width: 100%;
`
