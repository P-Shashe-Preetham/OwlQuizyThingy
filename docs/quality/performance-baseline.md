# Performance Baseline

Measured primarily via Lighthouse (`@lhci/cli`) and web vitals tracking:
- **Startup**: Vite dev server overhead.
- **Frontend Bundle**: Minimal bundle sizing tracked in CI build.
- **Page Load (LCP)**: Goal < 2.5s.
- **Interaction Latency (INP)**: Goal < 200ms.
- **Socket.IO Latency**: Baseline established via integration tests and network condition emulation.
