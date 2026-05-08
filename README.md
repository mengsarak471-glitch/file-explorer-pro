# Windows 11 Desktop Clone

A beautiful Windows 11 desktop clone built with React, Next.js, and Tailwind CSS.

## Features

✨ **Glassmorphism Design** - Mica/Acrylic effect with backdrop blur
🪟 **Draggable Windows** - Move and resize windows like the real OS
📌 **Taskbar** - Centered pinned apps with Start Menu
⏰ **System Tray** - Real-time clock display
🎨 **Smooth Animations** - Framer Motion for fluid interactions
🎯 **Desktop Icons** - Customizable desktop shortcuts

## Tech Stack

- **Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS with custom Glassmorphism
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **State Management**: Zustand

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Desktop.tsx
│   ├── Taskbar.tsx
│   ├── StartMenu.tsx
│   ├── TaskbarIcon.tsx
│   ├── DesktopIcon.tsx
│   ├── WindowManager.tsx
│   └── DraggableWindow.tsx
└── stores/
    ├── windowStore.ts
    └── taskbarStore.ts
```

## How to Use

1. Click the **Windows logo** button in the taskbar to open the Start Menu
2. Click on **desktop icons** to interact with them
3. **Drag windows** by their title bar to move them around
4. Use window control buttons to **minimize, maximize, or close** windows
5. Pin your favorite apps to the taskbar for quick access

## Customization

### Colors

Edit `tailwind.config.js` to customize colors:

```js
colors: {
  'win11-bg': '#0c0c0c',
  'win11-taskbar': '#202020',
  'win11-accent': '#0078d4',
}
```

### Glassmorphism

Adjust blur effect in `src/app/globals.css`:

```css
.mica-bg {
  backdrop-filter: blur(10px); /* Change blur amount */
}
```

## Future Enhancements

- [ ] File Explorer component
- [ ] Settings panel
- [ ] Multiple desktop workspaces
- [ ] Context menus
- [ ] Widget support
- [ ] Custom themes

## License

MIT
