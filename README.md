# SERVIML - Sistema de Auditoría y Gestión de Taller

**SERVIML** es una Aplicación Web Progresiva (PWA) diseñada para modernizar la gestión operativa y financiera de un taller mecánico automotriz. El sistema reemplaza los flujos manuales basados en Excel por una solución centralizada en la nube, permitiendo auditoría interna, control de inventario y generación de informes técnicos.

---

## 📄 Contexto del Proyecto

El taller operaba mediante registros informales (WhatsApp/Excel), lo que generaba dos problemas críticos:
1.  **Pérdida de Trazabilidad:** Dificultad para acceder a historiales de reparaciones anteriores.
2.  **Descuadre Financiero:** Imposibilidad de auditar eficientemente los ingresos por servicios versus los gastos en repuestos a fin de mes.

**Solución:** Se desarrolló una plataforma *Mobile-First* que permite a los mecánicos gestionar órdenes de trabajo en terreno, registrar evidencia fotográfica y generar documentación formal para el cliente, todo bajo una arquitectura de bajo costo operativo.

---

## 🛠 Tech Stack

El proyecto utiliza una arquitectura **Serverless** para minimizar costos de infraestructura y maximizar la escalabilidad.

* **Frontend:** Vue.js 3 (Composition API) + Vite.
* **Estilos:** CSS nativo y Tailwind (Diseño Responsivo / Mobile First).
* **Base de Datos & Auth:** Supabase (PostgreSQL).
* **Almacenamiento:** Cloudflare R2 (Optimizado para costos de egreso en imágenes).
* **Hosting:** Cloudflare Pages.
* **Generación de Documentos:** `html2pdf.js` (Renderizado Client-side para evitar sobrecarga de servidor).

---

## ✨ Funcionalidades Clave

* **Búsqueda Prioritaria:** Indexación y filtrado rápido de vehículos por Patente.
* **Gestión de Estados:** Flujo de trabajo controlado (Ingresado -> En Reparación -> Estacionamiento -> Finalizado).
* **Cierre Atómico:** Bloqueo automático de edición de presupuestos tras 2 semanas para integridad contable.
* **Cálculo de Estacionamiento:** Lógica automática para el cobro de días de estadía post-reparación.
* **Auditoría Interna:** Registro de "Caja Negra" para cambios críticos en montos y presupuestos.
* **Reportes PDF:** Generación instantánea de informes técnicos con evidencia fotográfica directamente en el dispositivo del usuario.

---

