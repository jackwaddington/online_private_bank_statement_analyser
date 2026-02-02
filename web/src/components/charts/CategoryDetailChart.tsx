import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type TooltipItem,
  type Plugin,
} from 'chart.js'
import styled from 'styled-components'
import { theme } from '../../styles'
import type { MonthlySpending } from '../../core/types/report'
import { getCategoryStats } from '../../core/calculations/spending'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface CategoryDetailChartProps {
  category: string
  monthlySpending: MonthlySpending[]
}

export function CategoryDetailChart({ category, monthlySpending }: CategoryDetailChartProps) {
  // Filter to this category and get last 12 months
  const allMonths = [...new Set(monthlySpending.map(s => s.month))].sort()
  const last12Months = allMonths.slice(-12)

  const categoryData = monthlySpending
    .filter(s => s.category === category && last12Months.includes(s.month))
    .sort((a, b) => a.month.localeCompare(b.month))

  // Fill in missing months with zeros
  const filledData = last12Months.map(month => {
    const existing = categoryData.find(d => d.month === month)
    return existing || { month, category, amount: 0, count: 0 }
  })

  // Get stats for last 12 months only
  const stats = getCategoryStats(filledData, category)

  const chartData = {
    labels: filledData.map(d => d.month),
    datasets: [
      {
        label: category,
        data: filledData.map(d => d.amount),
        backgroundColor: theme.colors.primary,
      },
    ],
  }

  // Custom plugin to draw count labels above bars
  const countLabelsPlugin: Plugin<'bar'> = {
    id: 'countLabels',
    afterDatasetsDraw(chart) {
      const { ctx } = chart
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex)
        meta.data.forEach((bar, index) => {
          const count = filledData[index].count
          if (count > 0) {
            ctx.save()
            ctx.textAlign = 'center'
            ctx.textBaseline = 'bottom'
            ctx.fillStyle = theme.colors.textSecondary
            ctx.font = '10px sans-serif'
            ctx.fillText(String(count), bar.x, bar.y - 4)
            ctx.restore()
          }
        })
      })
    },
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 20, // Space for count labels
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            const value = context.raw as number
            const idx = context.dataIndex
            const count = filledData[idx].count
            return [
              `Amount: €${value.toLocaleString('en', { minimumFractionDigits: 2 })}`,
              `Transactions: ${count}`,
            ]
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: theme.colors.border,
        },
        ticks: {
          callback: (value: number | string) => {
            const num = typeof value === 'number' ? value : parseFloat(value)
            return `€${num.toLocaleString('en')}`
          },
        },
      },
    },
  }

  const formatCurrency = (amount: number) =>
    `€${Math.round(amount).toLocaleString('en')}`

  return (
    <Container>
      <Title>{category}</Title>
      <StatsLine>
        High: {stats.highest.month} ({formatCurrency(stats.highest.amount)}) |{' '}
        Low: {stats.lowest.month} ({formatCurrency(stats.lowest.amount)}) |{' '}
        Avg: {formatCurrency(stats.average)} |{' '}
        SD: {formatCurrency(stats.standardDeviation)}
      </StatsLine>
      <ChartContainer>
        <Bar data={chartData} options={options} plugins={[countLabelsPlugin]} />
      </ChartContainer>
    </Container>
  )
}

const Container = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const Title = styled.h3`
  font-size: ${({ theme }) => theme.fontSize.lg};
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`

const StatsLine = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const ChartContainer = styled.div`
  height: 200px;
  width: 100%;
`
