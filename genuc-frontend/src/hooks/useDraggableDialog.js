// src/hooks/useDraggableDialog.js
// Rend une boîte de dialogue déplaçable : on presse la poignée (en-tête) sans
// relâcher puis on bouge la souris pour déplacer le panneau. La position est
// un état local au composant, donc remise à zéro à chaque montage (chaque
// dialogue de l'app est démonté/remonté à la fermeture).
import { useCallback, useEffect, useRef, useState } from 'react';

export default function useDraggableDialog() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragState = useRef(null);

  const onPointerMove = useCallback((e) => {
    if (!dragState.current) return;
    const { startX, startY, originX, originY } = dragState.current;
    setPosition({ x: originX + (e.clientX - startX), y: originY + (e.clientY - startY) });
  }, []);

  const stopDrag = useCallback(() => {
    dragState.current = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', stopDrag);
  }, [onPointerMove]);

  const onPointerDown = useCallback((e) => {
    // Ignore le drag s'il démarre sur un contrôle interactif de l'en-tête (ex. bouton fermer).
    if (e.target.closest('button, a, input, select, textarea')) return;
    // Au doigt, ce geste entre en conflit avec le défilement de la page : le
    // `preventDefault` ci-dessous bloquerait le scroll dès que le doigt part de
    // l'en-tête, et l'utilisateur pouvait pousser le panneau hors de l'écran
    // sans aucun moyen de le ramener. Le déplacement reste donc réservé aux
    // pointeurs fins (souris, stylet).
    if (e.pointerType === 'touch' || window.matchMedia('(pointer: coarse)').matches) return;
    e.preventDefault();
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: position.x,
      originY: position.y,
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', stopDrag);
  }, [position, onPointerMove, stopDrag]);

  useEffect(() => () => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', stopDrag);
  }, [onPointerMove, stopDrag]);

  return {
    panelStyle: { transform: `translate(${position.x}px, ${position.y}px)` },
    // Ne renvoie pas de className : le composant appelant l'ajoute lui-même
    // à côté de ses propres classes (sinon un spread après className="..."
    // écraserait cette dernière au lieu de la compléter).
    dragHandleProps: { onPointerDown },
  };
}
