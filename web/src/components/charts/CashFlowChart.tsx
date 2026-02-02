import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type TooltipItem,
} from 'chart.js'
import styled from 'styled-components'
import { theme } from '../../styles'
import type { MonthlyCashFlow } from '../../core/types/report'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface CashFlowChartProps {
  data: MonthlyCashFlow[]
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const chartData = {
    labels: data.map(d => d.month),
    datasets: [
      {
        label: 'Income',
        data: data.map(d => d.income),
        backgroundColor: theme.colors.success,
      },
      {
        label: 'Outgoings',
        data: data.map(d => -d.outgoings), // Negative for visual clarity
        backgroundColor: theme.colors.error,
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
          label: (context: TooltipItem<'bar'>) => {
            const value = Math.abs(context.raw as number)
            return `${context.dataset.label}: €${value.toLocaleString('en', { minimumFractionDigits: 2 })}`
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
      <Bar data={chartData} options={options} />
    </ChartContainer>
  )
}

const ChartContainer = styled.div`
  height: 300px;
  width: 100%;
`
