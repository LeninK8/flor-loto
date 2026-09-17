# 🌸 Loto del Pantano 3D (Swamp Lotus)

> Diorama 3D interactivo construido con **Three.js**, **React 19**, **Tailwind CSS** y **Web Audio / YouTube IFrame Player**.  
> Incluye un tocadiscos analógico articulado con física de vinilos, una colección de 16 álbumes de **Cuco**, navegación con cámara de vuelo libre (WASD + Ratón) y ciclo día/noche con efectos atmosféricos.

---

## ✨ Características Principales

### 🌿 Diorama y Entorno 3D Procedural
- **Agua procedural animada**: Ondulación continua y reflejos realistas mediante mallas físicas.
- **Isla orgánica**: Gradientes de suelo húmedo y seco, rocas modeladas, matas de hierba y parches de musgo.
- **Gran Flor de Loto**: Pétalos en capas con curvatura orgánica, estambres dorados, cáliz y semillas centrales.
- **Fauna y detalles místicos**:
  - Gato místico con iris esmeralda y varita tallada en la pata.
  - Vaso de té de boba con perlas de tapioca y plato de makis de salmón.
  - Piedra mágica con núcleo de pulso luminoso verde esmeralda.
  - Enjambre de 12 luciérnagas flotantes con halos y luces dinámicas.
- **Ciclo Día / Noche**: Iluminación lunar fría con niebla densa vs. atmósfera diurna cálida y diáfana.

### 🎶 Tocadiscos Mecánico & 16 Vinilos de Cuco
- **Mecánica física**: Brazo articulado con contrapeso, aguja lectora, botón retroiluminado y plato rotatorio a 33⅓ RPM.
- **16 Discos interactivos**: Distribuidos en dos hileras sobre la hierba junto al tocadiscos, con colores, texturas y número grabado (1 al 16).
- **Animación balística en arco**: Al hacer clic en cualquier vinilo, este vuela en parábola hacia el eje del plato mientras el disco previo regresa a su sitio en la orilla.
- **Avance automático de pistas**: Al terminar una canción, el brazo se levanta, el vinilo se guarda automáticamente y el siguiente disco entra a sonar.
- **Mini panel reproductor**:
  - Reproducir / Pausar (detiene sincronizadamente el audio y el giro del plato).
  - Pista siguiente / Pista anterior.
  - Expulsar disco al suelo.
  - Barra deslizante de progreso y duración con minutos y segundos.
  - Control de volumen y silenciador.
  - Cajón desplegable con la colección completa de los 16 vinilos.

### 🎥 Cámara Libre sin Restricciones & Modo Pantalla Limpia
- **Modo Pantalla Limpia (Zen View)**:
  - Botón **Pantalla limpia** en la barra superior o tecla de acceso rápido **`H`**.
  - Oculta todos los paneles, textos y botones para admirar el diorama 3D a pantalla completa.
  - Botón flotante sutil en la esquina para restaurar la interfaz en cualquier momento.
- **Vuelo libre 3D**:
  - `W` / `S`: Avanzar o retroceder en la dirección hacia donde miras.
  - `A` / `D`: Desplazamiento lateral (strafe).
  - `Espacio` / `E`: Elevar la cámara.
  - `Q` / `Ctrl`: Descender la cámara.
  - `Shift`: Acelerar el vuelo.
- **Control con ratón**:
  - **Clic izquierdo**: Rotar la perspectiva en 360° sin bloqueos angulares.
  - **Clic derecho**: Paneo libre en el espacio.
  - **Rueda / Scroll**: Zoom ultra cercano (desde 0.01) hasta vista panorámica.
- **Panel táctil (D-Pad)**: Control táctil flotante con botones direccionales para dispositivos móviles.
- **Vistas rápidas**: Botones de acceso directo para enfocar el tocadiscos, el loto, el gato o la vista general.

---

## 🌐 Publicación en GitHub Pages (Solución Pantalla en Blanco)

Si la página se mostraba en blanco al publicarla en GitHub Pages, se debía a que Vite por defecto busca los archivos estáticos en la raíz (`/assets/`) en lugar de rutas relativas (`./assets/`). 

### ¿Qué se ha configurado para solucionarlo?
1. **Rutas relativas**: Se ha añadido `base: './'` en `vite.config.ts` para que todos los scripts y hojas de estilo funcionen bajo cualquier subdirectorio de GitHub Pages (`https://usuario.github.io/repositorio/`).
2. **Despliegue automático con GitHub Actions**: Se ha añadido el archivo `.github/workflows/deploy.yml`.

### Pasos para activar GitHub Pages:
1. En tu repositorio de GitHub, ve a **Settings** (Configuración).
2. En la barra lateral izquierda, entra en **Pages**.
3. En **Build and deployment** > **Source**, selecciona **GitHub Actions**.
4. ¡Listo! En cada `git push` a la rama `main`, GitHub compilará y publicará la web automáticamente sin errores de pantalla en blanco.

---

## 🎵 Lista de Canciones (Cuco)

| # | Título | Artista |
|---|--------|---------|
| 1 | Bossa No Sé | Cuco ft. Jean Carter |
| 2 | Hydrocodone | Cuco |
| 3 | Keeping Tabs | Cuco ft. Suscat0 |
| 4 | Lover Is a Day | Cuco |
| 5 | Amor de Siempre | Cuco |
| 6 | We Had to End It | Cuco |
| 7 | Sunnyside | Cuco |
| 8 | First of the Year | Cuco |
| 9 | Summertime Hightime | Cuco ft. J-Kwe$t |
| 10 | Neon Baby | Cuco |
| 11 | Feelings | Cuco |
| 12 | Winter's Ballad | Cuco |
| 13 | Lucy | Cuco ft. J-Kwe$t |
| 14 | Far Away From Home | Cuco |
| 15 | Lava Lamp | Cuco |
| 16 | Dontmakemefallinlove | Cuco |

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Gráficos 3D**: [Three.js](https://threejs.org/)
- **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Iconos**: [Lucide React](https://lucide.dev/)
- **Audio**: Web Audio API (paisajes procedurales) + YouTube IFrame Player API
- **Build Tool**: [Vite](https://vitejs.dev/)

---

## 🚀 Instalación y Ejecución Local

### Prerrequisitos
- [Node.js](https://nodejs.org/) v18 o superior
- `npm` o `yarn` / `pnpm`

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/TU_USUARIO/loto-del-pantano-3d.git
   cd loto-del-pantano-3d
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

4. **Compilar para producción:**
   ```bash
   npm run build
   ```

5. **Previsualizar la compilación de producción:**
   ```bash
   npm run preview
   ```

6. **Comprobar tipos y sintaxis (Lint):**
   ```bash
   npm run lint
   ```

---

## 📂 Estructura del Proyecto

```
├── index.html                   # Punto de entrada HTML con metadatos y fuentes tipográficas
├── metadata.json                # Configuración de metadatos de la aplicación
├── package.json                 # Dependencias y scripts de construcción
├── tsconfig.json                # Configuración de TypeScript
├── vite.config.ts               # Configuración del empaquetador Vite
├── src/
│   ├── main.tsx                 # Montaje principal de React
│   ├── App.tsx                  # Componente raíz y gestión de estado
│   ├── index.css                # Estilos globales y variables de tema (Tailwind CSS v4)
│   ├── types.ts                 # Interfaces TypeScript globales
│   ├── audio/
│   │   ├── synthAudio.ts        # Motor de síntesis procedural con Web Audio API
│   │   └── youtubeAudio.ts      # Integración con la API oficial de YouTube IFrame
│   └── components/
│       ├── DioramaCanvas.tsx    # Escena Three.js, render loop, luces y raycasting
│       ├── MiniMusicPlayer.tsx  # Panel reproductor de música y selector de pistas
│       ├── FreeCameraHUD.tsx    # HUD de cámara libre, atajos y control táctil D-Pad
│       └── diorama/
│           ├── mathUtils.ts        # Fórmulas de ruido, curvas y geometría
│           ├── environmentModels.ts # Modelos 3D de terreno, agua y vegetación
│           ├── creatureModels.ts   # Modelos 3D de loto, gato y objetos del pantano
│           ├── turntableModels.ts  # Modelos 3D de tocadiscos, aguja, vinilos y luciérnagas
│           └── TurntableManager.ts # Máquina de estados y cinemática del tocadiscos
```

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
