import useReveal from '../hooks/useReveal'

export default function Reveal({ children, delay = 0, from = 'up', className = '' }) {
  const [ref, visible] = useReveal()

  const hidden =
    from === 'left'
      ? 'opacity-0 -translate-x-10'
      : from === 'right'
        ? 'opacity-0 translate-x-10'
        : from === 'scale'
          ? 'opacity-0 scale-90'
          : 'opacity-0 translate-y-10'

  const shown =
    from === 'scale'
      ? 'opacity-100 scale-100'
      : 'opacity-100 translate-x-0 translate-y-0'

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out will-change-transform ${visible ? shown : hidden} ${className}`}
    >
      {children}
    </div>
  )
}