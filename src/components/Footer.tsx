export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="container-page">
        <p>© {year} FlyMacro</p>
      </div>
    </footer>
  )
}
