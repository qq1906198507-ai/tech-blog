interface BarChartProps {
  data: { label: string; value: number; color: string }[]
  maxValue?: number
  height?: number
}

export default function BarChart({ data, maxValue: maxProp, height = 160 }: BarChartProps) {
  const maxValue = maxProp || Math.max(...data.map(d => d.value), 1)

  return (
    <div style={{
      padding: '20px',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '12px',
        height: `${height}px`,
      }}>
        {data.map((item, i) => {
          const barHeight = maxValue > 0 ? (item.value / maxValue) * 100 : 0
          return (
            <div key={i} style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              height: '100%',
              gap: '8px',
            }}>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: item.color,
                fontFamily: 'var(--font-mono)',
              }}>
                {item.value}
              </span>
              <div style={{
                width: '100%',
                maxWidth: '40px',
                height: `${Math.max(barHeight, 2)}%`,
                minHeight: '4px',
                borderRadius: '4px 4px 0 0',
                background: `linear-gradient(180deg, ${item.color}, ${item.color}aa)`,
                transition: 'height 0.5s ease',
                position: 'relative',
                boxShadow: '0 0 12px rgba(0, 0, 0, 0.08)',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '4px 4px 0 0',
                  background: `linear-gradient(180deg, rgba(255,255,255,0.25), transparent)`,
                }} />
              </div>
              <span style={{
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                lineHeight: 1.2,
              }}>
                {item.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
