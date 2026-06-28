import { ParticlesProvider, Particles, useParticlesProvider } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import { useMemo } from 'react'
import type { Engine } from '@tsparticles/engine'

function ParticlesContent() {
  const { loaded } = useParticlesProvider()

  if (!loaded) return null

  return (
    <Particles
      id="tsparticles"
      options={{
        fullScreen: {
          enable: true,
          zIndex: 0,
        },
        fpsLimit: 60,
        background: {
          color: 'transparent',
        },
        particles: {
          number: {
            value: 50,
            density: { enable: true, width: 1920, height: 1080 },
          },
          color: { value: ['#4a7dff', '#00d4ff', '#a855f7', '#ec4899', '#f59e0b'] },
          shape: {
            type: ['circle', 'triangle', 'polygon'],
            options: {
              polygon: { sides: 6 },
            },
          },
          opacity: {
            value: { min: 0.1, max: 0.4 },
            animation: {
              enable: true,
              speed: 0.8,
              sync: false,
            },
          },
          size: {
            value: { min: 1, max: 3 },
            animation: {
              enable: true,
              speed: 2,
              sync: false,
            },
          },
          links: {
            enable: true,
            distance: 140,
            color: '#4a7dff',
            opacity: 0.1,
            width: 1,
          },
          move: {
            enable: true,
            speed: 1.2,
            direction: 'none',
            random: true,
            straight: false,
            outModes: { default: 'out' },
          },
          rotate: {
            value: { min: 0, max: 360 },
            animation: {
              enable: true,
              speed: 8,
              sync: false,
            },
          },
          twinkle: {
            particles: {
              enable: true,
              frequency: 0.05,
              opacity: 1,
            },
          },
        },
        interactivity: {
          detectsOn: 'window',
          events: {
            onHover: {
              enable: true,
              mode: ['grab', 'bubble'],
            },
            onClick: {
              enable: true,
              mode: 'push',
            },
            resize: { enable: true },
          },
          modes: {
            grab: {
              distance: 200,
              links: {
                opacity: 0.5,
                color: '#00d4ff',
              },
            },
            bubble: {
              distance: 200,
              size: 6,
              duration: 0.4,
              opacity: 0.8,
            },
            push: {
              quantity: 4,
            },
          },
        },
        detectRetina: false,
      }}
    />
  )
}

export default function ParticleBackground() {
  const init = useMemo(() => async (engine: Engine) => {
    await loadSlim(engine)
  }, [])

  return (
    <ParticlesProvider init={init}>
      <ParticlesContent />
    </ParticlesProvider>
  )
}
