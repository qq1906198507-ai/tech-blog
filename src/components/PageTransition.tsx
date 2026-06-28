import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [transitionStage, setTransitionStage] = useState('enter')

  useEffect(() => {
    // Immediately swap content and trigger enter animation
    setDisplayChildren(children)
    setTransitionStage('exit')
    // Use requestAnimationFrame to ensure the exit state is painted first
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransitionStage('enter')
      })
    })
    return () => cancelAnimationFrame(raf)
  }, [location.pathname])

  useEffect(() => {
    setDisplayChildren(children)
  }, [children])

  return (
    <div style={{
      opacity: transitionStage === 'enter' ? 1 : 0,
      transform: transitionStage === 'enter' ? 'translateY(0)' : 'translateY(6px)',
      transition: 'opacity 0.2s ease, transform 0.2s ease',
    }}>
      {displayChildren}
    </div>
  )
}
