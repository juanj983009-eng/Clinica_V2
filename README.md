# Central de Telemetría Médica - Clinica2

Consola médica interactiva de alta densidad analítica diseñada para el monitoreo en tiempo real, administración e ingreso de pacientes en Unidades de Cuidados Intensivos (UCI).

---

## 1. Descripción del Proyecto

El ecosistema **Clinica2** proporciona una central de monitoreo unificada para personal de enfermería y clínicos de alto rendimiento. Su interfaz permite observar de manera síncrona y reactiva las constantes vitales (frecuencia cardíaca, saturación de oxígeno, presión arterial y temperatura), visualizar formas de onda SpO2 (Pleth) dinámicas, admitir nuevos pacientes mediante un panel lateral optimizado e inspeccionar perfiles clínicos de alta densidad informativa con históricos visuales en forma de sparklines vectoriales.

---

## 2. Arquitectura y Principios de Diseño

El sistema está cimentado sobre rigurosos pilares de ingeniería de software para garantizar la mantenibilidad, escalabilidad y tolerancia a fallos:

*   **Desacoplamiento Estricto de Capas (Hexagonal / Clean Architecture):**
    *   **Backend:** Estructura modular dividida en `core` (Domain y Application) e `infrastructure` (adaptadores de entrada/salida). El dominio de negocio permanece 100% puro y agnóstico a cualquier biblioteca o framework persistente o de red.
    *   **Frontend:** Separación nítida entre la gestión de estado de telemetría asíncrona (`TelemetryContext.tsx`) y los componentes de presentación y renderizado de la UI.
*   **Principio de Responsabilidad Única (SRP) mediante DTOs:**
    Las entidades persistentes de base de datos (`PatientJpaEntity`) no se exponen en la interfaz REST. Se implementa un mapeo bidireccional estricto con DTOs de transferencia (`PatientDTO`), aislando los contratos de comunicación de los clientes web frente a los cambios de esquema en el motor de base de datos.
*   **Inmutabilidad Reactiva Pura:**
    El frontend gestiona la telemetría a través de actualizaciones funcionales del estado (`setTracks(prev => ...)`), previniendo cierres obsoletos (*stale closures*) e inyecciones colaterales de datos, lo que evita re-renders redundantes y optimiza el consumo de CPU ante ráfagas rápidas de telemetría.
*   **Transiciones y Operaciones Optimistas:**
    La adición de pacientes se realiza con un mecanismo optimista en el cliente para brindar retroalimentación instantánea, con capacidades automáticas de *rollback* en caso de fallos de red o errores HTTP reportados por el backend.

---

## 3. Stack Tecnológico

El stack del ecosistema está constituido por tecnologías líderes del sector corporativo:

*   **Servicios Backend:** Java 17, Spring Boot, Spring Security (integración JWT con soporte OIDC).
*   **Servicio Web/SPA:** React 19, TypeScript, Vite.
*   **Base de Datos y Caché:** PostgreSQL, Redis.
*   **Infraestructura y Contenedores:** Docker, Docker Compose (con comprobaciones de salud secuenciales deterministas mediante `healthcheck`).
*   **Canal de Tiempo Real (Telemetry Stream):**
    *   Implementación nativa de **Server-Sent Events (SSE)** mediante `SseEmitter` sobre HTTP/1.1 persistente.
    *   **Thread-Safety:** Gestión de conexiones concurrentes a través de colecciones concurrentes seguras (`CopyOnWriteArrayList<SseEmitter>`) y despacho asíncrono gobernado por un pool programado de hilo único (`ScheduledExecutorService`), garantizando la ausencia de colisiones en la memoria del servidor de aplicaciones.

---

## 4. Ecosistema UI/UX y Sistema de Diseño

El diseño de la consola implementa una estética moderna, responsiva y de grado médico orientada a reducir la fatiga cognitiva:

*   **Lienzo de Fondo Blanco Puro (`#ffffff`):**
    El área de visualización del dashboard principal y el contenedor de detalles clínico emplean un lienzo blanco limpio para maximizar la legibilidad en entornos hospitalarios de alta iluminación.
*   **Capas Flotantes con Relieve Tridimensional (3D Contrast):**
    Para crear relieve y separación visual limpia sobre el lienzo blanco:
    *   Las tarjetas de pacientes (`.patient-card`) y paneles de detalle (`.patient-detail-card`) utilizan un fondo gris ultra pálido (`#f8fafc`) con sombras tridimensionales optimizadas (`box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)`).
    *   Los contenedores de métricas internas (`.metric-box`), constantes vitales (`.vital-detail-card`) y fichas de historial médico (`.info-medical-card`) emplean fondos blancos puros (`#ffffff`) y bordes tenues (`#e2e8f0`). Esto genera un elegante efecto multicapa flotante.
*   **Sparklines Vectoriales Reactivos:**
    Los mini-gráficos de tendencias clínicas están dibujados mediante SVG con líneas suavizadas (*splines*) y rellenos degradados translúcidos. Responden dinámicamente según umbrales de alerta médica:
    *   *Valores normales:* Trazo gris azulado suave (`#94a3b8`).
    *   *Valores críticos o de alerta:* Trazo color **Cherry Cola** con gradientes rojos brillantes.
*   **Dinamismo SpO2 (Pleth Waveform) por Hardware:**
    El oscilograma de onda SpO2 calcula dinámicamente su velocidad de animación en el cliente basándose en la frecuencia cardíaca exacta (frecuencia de pulso) enviada por el monitor, inyectando el valor resultante en la variable CSS `--animation-duration`. La traslación se ejecuta por GPU para evitar ralentizaciones. Las morfologías fisiológicas se alternan a nivel de trazado SVG según identificadores para asegurar variabilidad visual real en la central.
*   **Paleta de Colores de Marca y Tokens:**
    *   **Cream Vanilla (`#efe6dd`):** Color secundario de marca, utilizado como soporte de contraste en zonas del sistema.
    *   **Cherry Cola (`#9a0002`):** Token para elementos de llamada a la acción primarios (CTA "Admitir Paciente"), estados de alerta crítica y badges especializados (pulsaciones CODE RED).

---

## 5. Guía de Despliegue de Infraestructura

El proyecto cuenta con un entorno autocontenido para orquestación y despliegue rápido local:

### Requisitos Previos
*   Docker y Docker Compose instalados en la máquina anfitriona.

### Pasos de Despliegue

1.  Navega a la carpeta de infraestructura:
    ```bash
    cd infra
    ```
2.  Levanta los contenedores en segundo plano:
    ```bash
    docker compose up -d --build
    ```
3.  El stack se iniciará secuencialmente siguiendo la cadena de dependencias saludables:
    `PostgreSQL/Redis` -> `Keycloak` -> `Backend (Spring Boot)` -> `Frontend (Vite / React)`.
4.  Accede a la consola web a través del navegador en `http://localhost:3000` (o la dirección de puerto asignada al frontend).
