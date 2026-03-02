# CARSIL - Guía de Diseño UI

## Estilo: Linear / Notion — Minimalista y Profesional

---

> [!IMPORTANT]
> **Reglas obligatorias de diseño:**
> - No usar emojis en ninguna interfaz. Usar iconos de Bootstrap Icons en su lugar.
> - Tono 100% profesional. Sin lenguaje informal ni decoraciones innecesarias.
> - Usar la fuente Inter (Google Fonts) en toda la aplicación.
> - Priorizar espacio en blanco, bordes finos, y colores neutros con acentos estratégicos.

---

## Paleta de Colores

| Token                | Valor       | Uso                                     |
|----------------------|-------------|------------------------------------------|
| `--primary`          | `#3B49DF`   | Botones, links activos, acentos          |
| `--primary-dark`     | `#2d38b0`   | Hover de botones, sidebar activo         |
| `--primary-light`    | `#eef0fd`   | Fondos sutiles, badges, hover de items   |
| `--bg-page`          | `#F7F7F8`   | Fondo general de la página               |
| `--bg-card`          | `#FFFFFF`   | Fondo de tarjetas y contenedores         |
| `--bg-sidebar`       | `#FFFFFF`   | Fondo del sidebar (estilo Notion)        |
| `--border`           | `#E5E5E5`   | Bordes de tarjetas, divisores            |
| `--border-light`     | `#F0F0F0`   | Bordes secundarios, hover sutil          |
| `--text-primary`     | `#1A1A2E`   | Títulos, texto principal                 |
| `--text-secondary`   | `#6B7280`   | Descripciones, labels, subtítulos        |
| `--text-muted`       | `#9CA3AF`   | Placeholders, texto terciario            |
| `--success`          | `#10B981`   | Indicadores positivos, activos           |
| `--success-light`    | `#ECFDF5`   | Fondo badge éxito                        |
| `--warning`          | `#F59E0B`   | Alertas, en proceso                      |
| `--warning-light`    | `#FFFBEB`   | Fondo badge advertencia                  |
| `--danger`           | `#EF4444`   | Errores, eliminar, cerrar sesión         |
| `--danger-light`     | `#FEF2F2`   | Fondo badge peligro                      |
| `--purple`           | `#8B5CF6`   | Acento alternativo (proformas)           |
| `--purple-light`     | `#F5F3FF`   | Fondo badge proformas                    |

---

## Tipografía

- **Font principal**: `'Inter', sans-serif` (Google Fonts)
- **Pesos**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Tamaños**:
  - Heading principal: `1.5rem` (24px), weight 700
  - Subtítulo: `0.875rem` (14px), weight 500, color `--text-secondary`
  - Body: `0.875rem` (14px), weight 400
  - Small/Labels: `0.75rem` (12px), weight 500, uppercase, letter-spacing 0.3px
  - Stat numbers: `1.5rem` (24px), weight 700

---

## Sidebar (estilo Notion / Linear)

- **Ancho**: `260px`
- **Fondo**: `#FFFFFF` con borde derecho `1px solid var(--border)`
- **Logo/Marca**: Icono SVG + nombre + subtítulo, con toggle button a la derecha
- **Secciones**: Labels uppercase (`MENÚ`, `RECURSOS HUMANOS`, `ADMINISTRACIÓN`)
- **Items del menú**:
  - Padding: `8px 12px`, border-radius: `6px`
  - Inactivo: color `--text-secondary`
  - Hover: fondo `--primary-light`, color `--primary`
  - Activo: fondo `--primary`, color `#FFFFFF`
  - Iconos: `18px`, mismos colores que el texto
- **Footer**: Separador fino + "Cerrar Sesión" en `--danger`
- **Responsive**: Oculto en mobile, toggle para mostrar/ocultar

---

## Dashboard Cards

- **Fondo**: `#FFFFFF`
- **Borde**: `1px solid var(--border)`
- **Border-radius**: `14px`
- **Padding**: `20px-24px`
- **Hover**: Sombra sutil `0 4px 16px rgba(0,0,0,0.06)`
- **Layout**: Grid de 4 columnas (stats), 3 columnas (contenido principal)

---

## Componentes

### Botones
- Border-radius: `8px`
- Padding: `8px 16px`
- Font-weight: `500`
- **Primary**: Fondo `--primary`, color blanco, hover `--primary-dark`
- **Outline**: Borde `--border`, hover fondo `--primary-light`

### Quick Action Items
- Borde `1px solid var(--border)`, border-radius `10px`
- Hover: borde `--primary`, fondo `--primary-light`
- Icono a la izquierda, texto principal + subtitulo, chevron a la derecha
- Al hacer hover el icono cambia a fondo `--primary` con color blanco

### Stat Cards (Top Row)
- 4 columnas en desktop
- Muestran: label (0.75rem), valor grande (1.5rem bold), visual (barras o icono)
- Último card puede tener fondo `--primary` como highlight

---

## Reglas de Diseño

1. **Sin emojis** — Usar iconos de Bootstrap Icons exclusivamente
2. **Tono profesional** — Sin lenguaje informal ni decoraciones innecesarias
3. **Espacio blanco generoso** — No saturar la interfaz
4. **Colores neutros con acentos** — Usar `--primary` solo estratégicamente
5. **Sin gradientes pesados** — Fondos sólidos y bordes finos
6. **Bordes en lugar de sombras** — Sombras solo en hover, muy sutiles
7. **Micro-animaciones suaves** — Transiciones de 150ms-200ms, ease
8. **Iconografía consistente** — Bootstrap Icons, tamaño uniforme
9. **Jerarquía visual clara** — Usar tamaño, peso, y color para distinguir niveles
10. **CSS centralizado** — Usar `/publico/css/layout.css` para sidebar y layout, no duplicar en cada vista
