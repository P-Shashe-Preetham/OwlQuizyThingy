# Deployment Architecture

## Overview

The **Deployment Architecture** illustrates how OwlQuizyThingy containers map to physical or virtual infrastructure.

## Deployment Diagram

```mermaid
C4Deployment
    title Deployment diagram for OwlQuizyThingy

    Deployment_Node(userDevice, "User Device", "Web Browser") {
        Container(webApp, "Web Application", "React SPA")
    }

    Deployment_Node(dockerHost, "Docker Host", "Linux Server / Cloud VM") {
        Deployment_Node(dockerContainer, "Docker Engine") {
            Container(socketServer, "Socket Server", "Node.js (port 3000)")
            Container(nginxProxy, "Reverse Proxy", "Nginx (Optional)")
        }
    }

    Deployment_Node(firebaseCloud, "Google Cloud Platform") {
        System_Ext(firestore, "Firebase Firestore", "Database")
    }

    Rel(userDevice, nginxProxy, "HTTPS / WSS")
    Rel(nginxProxy, socketServer, "WSS / HTTP")
    Rel(userDevice, socketServer, "Direct WSS fallback", "WSS")
    Rel(socketServer, firestore, "HTTPS", "Service Account")
```

## Deployment Considerations

### Docker

The primary deployment mechanism is via Docker and Docker Compose.
The provided `compose.yml` spins up the Node.js backend. The frontend can either be statically built and served via a CDN or routed through a containerized reverse proxy.

### Stateful Backend

The `Socket Server` currently holds game state completely in memory. It cannot be horizontally scaled (multiple instances) without introducing a distributed pub/sub system (e.g., Redis) and sticky sessions for Socket.IO. As such, the platform must be configured to run as a **single instance**.

### Reverse Proxy & WebSockets

Any reverse proxy (like Nginx, HAProxy, or cloud load balancers) fronting the Socket Server must be explicitly configured to support WebSocket upgrades (HTTP 101 Switching Protocols) and handle long-lived connections without aggressive timeouts.
