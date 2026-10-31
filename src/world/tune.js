// @ts-nocheck — панель настройки мира (spec v0.11, по совету дизайнера). Открывается по ?tune в адресе.
// Можно: двигать камеру у планет (DIVE), точки посадки автора, любой предмет мира (клик по нему).
// Кнопка «Скопировать изменения» кладёт JSON в буфер — его присылают Claude, он переносит значения в код.
// В режиме ?tune склейка сцены (bake.js) выключена, иначе склеенные предметы не сдвинуть.
import GUI from 'lil-gui';
import { THREE } from './core.js';

export function startTune({ P, DIVE, STATIONS, camera, canvas, renderer }) {
  const gui = new GUI({ title: 'Настройка мира (?tune)', width: 300 });
  gui.domElement.style.zIndex = 60;
  const changes = { camera: {}, stations: {}, objects: {} };

  // камера: смещение «нырка» у каждой планеты
  const fc = gui.addFolder('Камера у планет (x, y, z)');
  Object.entries(DIVE).forEach(([k, v]) => {
    const f = fc.addFolder(k); f.close();
    ['x', 'y', 'z'].forEach((ax, i) => f.add(v, i, -20, 30, 0.1).name(ax).onChange(() => { changes.camera[k] = [...v]; }));
  });

  // автор: точки посадки
  const fs = gui.addFolder('Автор: точки посадки'); fs.close();
  STATIONS.forEach((s) => {
    if (!s.pos.v) return;
    const f = fs.addFolder(`${s.say} · p ${s.p}`); f.close();
    ['x', 'y', 'z'].forEach((ax, i) => f.add(s.pos.v, i, -6, 12, 0.05).name(ax).onChange(() => { changes.stations[s.p] = [...s.pos.v]; }));
  });

  // предмет: клик по миру выбирает предмет (ближайший к острову родитель), ползунки двигают его
  const fo = gui.addFolder('Предмет (кликните по миру)');
  const sel = { name: '—', planet: '', path: '' };
  fo.add(sel, 'name').name('выбран').listen().disable();
  let ctrls = [];
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  const pathOf = (o, isl) => { const p = []; for (let x = o; x && x !== isl; x = x.parent) p.unshift(x.parent ? x.parent.children.indexOf(x) : 0); return p.join('/'); };
  const select = (o, k) => {
    ctrls.forEach((c) => c.destroy()); ctrls = [];
    const isl = P[k].island; const key = `${k}:${pathOf(o, isl)}`;
    sel.name = `${k} · ${o.name || o.type} #${pathOf(o, isl)}`; sel.planet = k; sel.path = key;
    const save = () => { changes.objects[key] = { planet: k, path: pathOf(o, isl), type: o.type, position: o.position.toArray().map((v) => +v.toFixed(3)), rotationY: +o.rotation.y.toFixed(3), scale: +o.scale.x.toFixed(3) }; };
    ['x', 'y', 'z'].forEach((ax) => ctrls.push(fo.add(o.position, ax, o.position[ax] - 4, o.position[ax] + 4, 0.02).name(`позиция ${ax}`).onChange(save)));
    ctrls.push(fo.add(o.rotation, 'y', -Math.PI, Math.PI, 0.01).name('поворот').onChange(save));
    const sc = { s: o.scale.x }; ctrls.push(fo.add(sc, 's', 0.2, 3, 0.01).name('масштаб').onChange((v) => { o.scale.setScalar(v); save(); }));
  };
  canvas.addEventListener('click', (e) => {
    if (!e.altKey && !e.shiftKey) return; // выбор — по Shift+клику, чтобы обычные клики работали как на сайте
    e.stopImmediatePropagation();
    ptr.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ptr, camera);
    for (const [k, pl] of Object.entries(P)) {
      const h = ray.intersectObject(pl.island, true)[0]; if (!h) continue;
      let o = h.object; while (o.parent && o.parent !== pl.island) o = o.parent; // предмет целиком — ребёнок острова
      select(o, k); return;
    }
  }, true);
  fo.add({ hint: 'Shift + клик по предмету' }, 'hint').name('как выбрать').disable();

  gui.add({ copy: async () => {
    const txt = JSON.stringify(changes, null, 1);
    try { await navigator.clipboard.writeText(txt); alert('Скопировано. Пришлите это Claude.'); }
    catch { prompt('Скопируйте и пришлите Claude:', txt); }
  } }, 'copy').name('📋 Скопировать изменения');
  return gui;
}
