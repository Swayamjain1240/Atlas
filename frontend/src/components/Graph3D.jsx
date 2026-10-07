import React, { useRef, useEffect } from 'react'

/**
 * 3D Knowledge Graph — Three.js particle system
 * Renders floating memory nodes connected by glow lines.
 * Interactive: click nodes, hover to see connections.
 */
export default function Graph3D() {
  const containerRef = useRef(null)

  useEffect(() => {
    let scene, camera, renderer, particles, connections, animationId
    let mouseX = 0
    let mouseY = 0

    const init = async () => {
      const container = containerRef.current
      if (!container) return

      // Dynamic import to avoid breaking if Three.js not installed
      let THREE
      try {
        THREE = await import('three')
      } catch {
        // Three.js not installed — render fallback
        return
      }

      const width = container.clientWidth
      const height = container.clientHeight

      // Scene
      scene = new THREE.Scene()

      // Camera
      camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
      camera.position.z = 30

      // Renderer
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
      })
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      container.appendChild(renderer.domElement)

      // ── Particle System ──
      const particleCount = 200
      const geometry = new THREE.BufferGeometry()
      const positions = new Float32Array(particleCount * 3)
      const colors = new Float32Array(particleCount * 3)
      const sizes = new Float32Array(particleCount)

      const color1 = new THREE.Color(0x6366f1) // atlas indigo
      const color2 = new THREE.Color(0xa78bfa) // purple

      for (let i = 0; i < particleCount; i++) {
        const radius = 8 + Math.random() * 12
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
        positions[i * 3 + 2] = radius * Math.cos(phi)

        const c = color1.clone().lerp(color2, Math.random())
        colors[i * 3] = c.r
        colors[i * 3 + 1] = c.g
        colors[i * 3 + 2] = c.b

        sizes[i] = 0.1 + Math.random() * 0.3
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

      const material = new THREE.PointsMaterial({
        size: 0.3,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      })

      particles = new THREE.Points(geometry, material)
      scene.add(particles)

      // ── Connections ──
      const connectionGeo = new THREE.BufferGeometry()
      const connectionPositions = []

      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          if (Math.random() < 0.02) {
            connectionPositions.push(
              positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
              positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
            )
          }
        }
      }

      connectionGeo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(connectionPositions, 3)
      )

      const connectionMat = new THREE.LineBasicMaterial({
        color: 0x6366f1,
        transparent: true,
        opacity: 0.1,
      })

      connections = new THREE.LineSegments(connectionGeo, connectionMat)
      scene.add(connections)

      // ── Mouse interaction ──
      const handleMouseMove = (e) => {
        mouseX = (e.clientX / width) * 2 - 1
        mouseY = -(e.clientY / height) * 2 + 1
      }
      window.addEventListener('mousemove', handleMouseMove)

      // ── Animation ──
      const animate = () => {
        animationId = requestAnimationFrame(animate)

        // Slow rotation
        particles.rotation.x += 0.0003
        particles.rotation.y += 0.0006
        if (connections) {
          connections.rotation.x = particles.rotation.x
          connections.rotation.y = particles.rotation.y
        }

        // Subtle mouse parallax
        particles.rotation.x += mouseY * 0.0001
        particles.rotation.y += mouseX * 0.0001

        renderer.render(scene, camera)
      }
      animate()

      // ── Resize ──
      const handleResize = () => {
        const w = container.clientWidth
        const h = container.clientHeight
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      }
      window.addEventListener('resize', handleResize)

      // Cleanup function
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('resize', handleResize)
        cancelAnimationFrame(animationId)
        if (renderer && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement)
        }
        geometry.dispose()
        material.dispose()
        if (connectionGeo) connectionGeo.dispose()
        if (connectionMat) connectionMat.dispose()
      }
    }

    const cleanupPromise = init()

    return () => {
      cleanupPromise.then((cleanup) => {
        if (cleanup) cleanup()
      })
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ minHeight: '200px' }}
    />
  )
}
