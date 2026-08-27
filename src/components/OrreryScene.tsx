import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { Activity, X } from 'lucide-react';
import { CelestialBody, CameraPreset } from '../types';
import { calculateHeliocentricPosition, generateOrbitPoints, AU_TO_KM, AU_TO_LD, calculateDistance } from '../utils/orbitalMechanics';

// Three.js visual scale conversion
// 1 AU = 25 units in Three.js space
export const SCALE_AU = 25.0;

interface OrrerySceneProps {
  bodies: CelestialBody[];
  selectedBody: CelestialBody | null;
  onSelectBody: (body: CelestialBody | null) => void;
  currentJD: number;
  showOrbits: boolean;
  showLabels: boolean;
  showBelt: boolean;
  showGrid: boolean;
  showPHAsOnly: boolean;
  activeCategoryFilter: string;
  cameraPreset: CameraPreset;
  onResetCameraPreset: () => void;
}

export const OrreryScene: React.FC<OrrerySceneProps> = ({
  bodies,
  selectedBody,
  onSelectBody,
  currentJD,
  showOrbits,
  showLabels,
  showBelt,
  showGrid,
  showPHAsOnly,
  activeCategoryFilter,
  cameraPreset,
  onResetCameraPreset,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  
  // 3D Objects tracking
  const bodyMeshesRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const orbitLinesRef = useRef<Map<string, THREE.Line>>(new Map());
  const gridGroupRef = useRef<THREE.Group | null>(null);
  const beltPointsRef = useRef<THREE.Points | null>(null);
  const distanceLineRef = useRef<THREE.Line | null>(null);
  const sunCoronaRef = useRef<THREE.Mesh | null>(null);

  // Mouse interaction state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraRadiusRef = useRef(60);
  const cameraThetaRef = useRef(Math.PI / 4); // Horizontal angle
  const cameraPhiRef = useRef(Math.PI / 3.5); // Elevation angle
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const hudCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [hoveredBody, setHoveredBody] = useState<CelestialBody | null>(null);
  const [showTelemetryVector, setShowTelemetryVector] = useState(false);

  // Filtered list of bodies
  const visibleBodies = useMemo(() => {
    return bodies.filter((b) => {
      if (b.id === 'sun' || b.category === 'planet' || b.category === 'moon') return true;
      if (showPHAsOnly && !b.isPHA) return false;
      if (activeCategoryFilter !== 'all' && b.category !== activeCategoryFilter && !b.isPHA) {
        return false;
      }
      return true;
    });
  }, [bodies, showPHAsOnly, activeCategoryFilter]);

  // Synchronize mutable refs for zero-overhead animation loop
  const currentJDRef = useRef(currentJD);
  currentJDRef.current = currentJD;
  const selectedBodyRef = useRef(selectedBody);
  selectedBodyRef.current = selectedBody;
  const showLabelsRef = useRef(showLabels);
  showLabelsRef.current = showLabels;
  const cameraPresetRef = useRef(cameraPreset);
  cameraPresetRef.current = cameraPreset;
  const visibleBodiesRef = useRef(visibleBodies);
  visibleBodiesRef.current = visibleBodies;
  const hoveredBodyRef = useRef(hoveredBody);
  hoveredBodyRef.current = hoveredBody;
  const bodiesRef = useRef(bodies);
  bodiesRef.current = bodies;
  const showTelemetryVectorRef = useRef(showTelemetryVector);
  showTelemetryVectorRef.current = showTelemetryVector;

  // Generate procedural textures for planet visual realism
  const generatePlanetTexture = useCallback((type: string, baseColorHex: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = baseColorHex;
    ctx.fillRect(0, 0, 256, 128);

    if (type === 'earth') {
      // Continents and clouds
      ctx.fillStyle = '#1B7A3E';
      ctx.beginPath();
      ctx.arc(60, 40, 30, 0, Math.PI * 2);
      ctx.arc(160, 60, 45, 0, Math.PI * 2);
      ctx.arc(200, 80, 25, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric cloud swirls
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.ellipse(80, 50, 40, 15, Math.PI / 6, 0, Math.PI * 2);
      ctx.ellipse(180, 70, 60, 18, -Math.PI / 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'jupiter') {
      // Cloud bands & Great Red Spot
      const bands = ['#C88B52', '#EAD6B8', '#A76D38', '#E6CA9E', '#9E5B23', '#DEC097'];
      bands.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.fillRect(0, i * 21, 256, 21);
      });
      // Great Red Spot
      ctx.fillStyle = '#BD3A2B';
      ctx.beginPath();
      ctx.ellipse(170, 75, 22, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'mars') {
      // Polar ice cap and dark volcanic basalt regions
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(128, 6, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8B3A2B';
      ctx.beginPath();
      ctx.ellipse(100, 65, 45, 20, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'sun') {
      const grad = ctx.createRadialGradient(128, 64, 5, 128, 64, 128);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.3, '#FFE600');
      grad.addColorStop(0.8, '#FF5E00');
      grad.addColorStop(1, '#990000');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 128);
    } else if (type === 'moon') {
      // Lunar regolith baseline
      ctx.fillStyle = '#b8b8c2';
      ctx.fillRect(0, 0, 256, 128);
      // Dark lunar maria (Sea of Tranquility, Oceanus Procellarum, Sea of Serenity)
      ctx.fillStyle = '#6e707a';
      ctx.beginPath();
      ctx.ellipse(75, 45, 35, 22, Math.PI / 6, 0, Math.PI * 2);
      ctx.ellipse(145, 55, 42, 26, -Math.PI / 8, 0, Math.PI * 2);
      ctx.ellipse(105, 80, 28, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      // Impact craters with bright ejecta rays (Tycho, Copernicus)
      ctx.fillStyle = '#e2e2ec';
      ctx.beginPath();
      ctx.arc(170, 85, 5.5, 0, Math.PI * 2);
      ctx.arc(60, 65, 4.5, 0, Math.PI * 2);
      ctx.arc(195, 35, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  // Initialize Scene, Camera, Renderer, Starfield, Ecliptic Grid, Asteroid Belt
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04060d);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
    camera.position.set(0, 45, 55);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, logarithmicDepthBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient light and Sun point light
    const ambientLight = new THREE.AmbientLight(0x223355, 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xfffaed, 2.5, 3000, 0.2);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Deep Space Starfield (Constellations & Cosmic Dust)
    const starCount = 2800;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 600 + Math.random() * 1200;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const sinPhi = Math.sin(phi);

      starPositions[i * 3] = radius * sinPhi * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * sinPhi * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);

      // Star hues: subtle blues, warm whites, soft gold
      const hueChoice = Math.random();
      if (hueChoice > 0.8) {
        starColors[i * 3] = 0.7; starColors[i * 3 + 1] = 0.85; starColors[i * 3 + 2] = 1.0;
      } else if (hueChoice > 0.6) {
        starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 0.9; starColors[i * 3 + 2] = 0.7;
      } else {
        starColors[i * 3] = 0.9; starColors[i * 3 + 1] = 0.95; starColors[i * 3 + 2] = 1.0;
      }
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const starPoints = new THREE.Points(starGeometry, starMaterial);
    scene.add(starPoints);

    // Ecliptic Coordinate Grid
    const gridGroup = new THREE.Group();
    const rings = [0.387, 0.723, 1.0, 1.524, 2.77, 5.2, 9.58]; // Mercury, Venus, Earth, Mars, Belt, Jupiter, Saturn AU
    rings.forEach((au) => {
      const ringGeom = new THREE.RingGeometry(au * SCALE_AU - 0.04, au * SCALE_AU + 0.04, 96);
      const ringMat = new THREE.MeshBasicMaterial({
        color: au === 1.0 ? 0x2288bb : 0x182844,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: au === 1.0 ? 0.45 : 0.25,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      gridGroup.add(ringMesh);
    });

    // Radial axis lines
    const axisMat = new THREE.LineBasicMaterial({ color: 0x182844, transparent: true, opacity: 0.25 });
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      const axisGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(Math.cos(angle) * 10 * SCALE_AU, 0, Math.sin(angle) * 10 * SCALE_AU),
      ]);
      const line = new THREE.Line(axisGeom, axisMat);
      gridGroup.add(line);
    }
    scene.add(gridGroup);
    gridGroupRef.current = gridGroup;

    // Main Asteroid Belt Particle Field (2.2 AU to 3.2 AU)
    const beltCount = 1400;
    const beltGeom = new THREE.BufferGeometry();
    const beltPositions = new Float32Array(beltCount * 3);
    for (let b = 0; b < beltCount; b++) {
      const rAU = 2.15 + Math.random() * 1.15;
      const angle = Math.random() * Math.PI * 2;
      const yDeviation = (Math.random() - 0.5) * 0.2 * SCALE_AU;
      beltPositions[b * 3] = Math.cos(angle) * rAU * SCALE_AU;
      beltPositions[b * 3 + 1] = yDeviation;
      beltPositions[b * 3 + 2] = Math.sin(angle) * rAU * SCALE_AU;
    }
    beltGeom.setAttribute('position', new THREE.BufferAttribute(beltPositions, 3));
    const beltMat = new THREE.PointsMaterial({
      color: 0x8a9ba8,
      size: 0.9,
      transparent: true,
      opacity: 0.45,
    });
    const beltPoints = new THREE.Points(beltGeom, beltMat);
    scene.add(beltPoints);
    beltPointsRef.current = beltPoints;

    // Distance laser line between Earth and target
    const distGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)]);
    const distMat = new THREE.LineDashedMaterial({
      color: 0x00f3ff,
      dashSize: 0.5,
      gapSize: 0.25,
      transparent: true,
      opacity: 0.85,
    });
    const distLine = new THREE.Line(distGeom, distMat);
    distLine.computeLineDistances();
    distLine.visible = false;
    scene.add(distLine);
    distanceLineRef.current = distLine;

    // Window resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width: w, height: h } = entries[0].contentRect;
      if (w > 0 && h > 0 && rendererRef.current && cameraRef.current) {
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
        if (hudCanvasRef.current) {
          const dpr = Math.min(window.devicePixelRatio, 2);
          hudCanvasRef.current.width = w * dpr;
          hudCanvasRef.current.height = h * dpr;
        }
      }
    });
    resizeObserver.observe(container);

    if (hudCanvasRef.current) {
      const dpr = Math.min(window.devicePixelRatio, 2);
      hudCanvasRef.current.width = width * dpr;
      hudCanvasRef.current.height = height * dpr;
    }

    // Continuous Animation & Physics Frame Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const camera = cameraRef.current;
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      if (!camera || !renderer || !scene) return;

      const currentJDVal = currentJDRef.current;
      const currentSelectedBody = selectedBodyRef.current;
      const currentHoveredBody = hoveredBodyRef.current;
      const currentVisibleBodies = visibleBodiesRef.current;
      const currentShowLabels = showLabelsRef.current;
      const currentCameraPreset = cameraPresetRef.current;

      // Pulse sun corona
      if (sunCoronaRef.current) {
        const pulse = 1.0 + Math.sin(Date.now() * 0.003) * 0.05;
        sunCoronaRef.current.scale.set(pulse, pulse, pulse);
      }

      let earthPos3D = new THREE.Vector3(0, 0, 0);
      let selectedPos3D: THREE.Vector3 | null = null;
      const labelsToDraw: Array<{
        name: string;
        distAU: number;
        isPHA: boolean;
        category: string;
        isSelected: boolean;
        isHovered: boolean;
        isPlanet: boolean;
        x: number;
        y: number;
      }> = [];

      // Update positions of all visible bodies for currentJDVal
      currentVisibleBodies.forEach((body) => {
        const group = bodyMeshesRef.current.get(body.id);
        if (!group) return;

        if (body.id === 'sun') {
          group.position.set(0, 0, 0);
        } else {
          const state = calculateHeliocentricPosition(body.orbitalElements, currentJDVal);
          const posX = state.positionAU.x * SCALE_AU;
          const posY = state.positionAU.y * SCALE_AU;
          const posZ = state.positionAU.z * SCALE_AU;
          group.position.set(posX, posY, posZ);

          // Rotate bodies along their axes
          group.rotation.y += 0.01;

          // Align halos to always face camera
          const halo = group.getObjectByName('halo');
          if (halo) {
            halo.lookAt(camera.position);
            if (body.id === currentSelectedBody?.id) {
              const selPulse = 1.4 + Math.sin(Date.now() * 0.008) * 0.3;
              halo.scale.set(selPulse, selPulse, selPulse);
            }
          }

          if (body.id === 'earth') {
            earthPos3D = group.position.clone();
          }
          if (currentSelectedBody && body.id === currentSelectedBody.id) {
            selectedPos3D = group.position.clone();
          }

          // Project 3D positions to 2D screen coordinates for HUD labels
          if (currentShowLabels && renderer.domElement) {
            const projected = group.position.clone().project(camera);
            const w = renderer.domElement.clientWidth;
            const h = renderer.domElement.clientHeight;
            const screenX = (projected.x * 0.5 + 0.5) * w;
            const screenY = (-(projected.y * 0.5) + 0.5) * h;
            const isBehind = projected.z > 1.0;

            const isSelected = currentSelectedBody?.id === body.id;
            const isHovered = currentHoveredBody?.id === body.id;
            const isPrimary = body.category === 'planet' || body.category === 'moon';

            if (!isBehind && screenX > 20 && screenX < w - 20 && screenY > 20 && screenY < h - 20) {
              if (isSelected || isHovered || isPrimary || body.isPHA) {
                labelsToDraw.push({
                  name: body.name,
                  distAU: state.radiusAU,
                  isPHA: !!body.isPHA,
                  category: body.category,
                  isSelected,
                  isHovered,
                  isPlanet: isPrimary,
                  x: screenX,
                  y: screenY,
                });
              }
            }
          }
        }
      });

      // Update geocentric satellite orbit lines (e.g. Moon) to follow Earth's orbital location
      const moonOrbit = orbitLinesRef.current.get('moon');
      if (moonOrbit && earthPos3D) {
        moonOrbit.position.copy(earthPos3D);
      }

      // Update distance line between Earth and selected target
      if (
        distanceLineRef.current &&
        showTelemetryVectorRef.current &&
        currentSelectedBody &&
        currentSelectedBody.id !== 'earth' &&
        selectedPos3D
      ) {
        distanceLineRef.current.visible = true;
        const positions = distanceLineRef.current.geometry.attributes.position as THREE.BufferAttribute;
        positions.setXYZ(0, earthPos3D.x, earthPos3D.y, earthPos3D.z);
        positions.setXYZ(1, selectedPos3D.x, selectedPos3D.y, selectedPos3D.z);
        positions.needsUpdate = true;
        distanceLineRef.current.computeLineDistances();
      } else if (distanceLineRef.current) {
        distanceLineRef.current.visible = false;
      }

      // Camera Target Lock & Follow Mode
      if (currentCameraPreset === 'follow' && currentSelectedBody && selectedPos3D) {
        cameraTargetRef.current.lerp(selectedPos3D, 0.08);
      }

      // Smooth spherical camera orbit computation
      const r = cameraRadiusRef.current;
      const theta = cameraThetaRef.current;
      const phi = cameraPhiRef.current;
      const target = cameraTargetRef.current;

      const camX = target.x + r * Math.sin(phi) * Math.sin(theta);
      const camY = target.y + r * Math.cos(phi);
      const camZ = target.z + r * Math.sin(phi) * Math.cos(theta);

      camera.position.set(camX, camY, camZ);
      camera.lookAt(target);

      renderer.render(scene, camera);

      // Render 2D HUD Canvas Overlay
      const hudCanvas = hudCanvasRef.current;
      if (hudCanvas) {
        const ctx = hudCanvas.getContext('2d');
        if (ctx) {
          const dpr = Math.min(window.devicePixelRatio, 2);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, hudCanvas.width / dpr, hudCanvas.height / dpr);

          if (currentShowLabels) {
            labelsToDraw.forEach((lbl) => {
              const text = `${lbl.name} (${lbl.distAU.toFixed(2)} AU)`;
              ctx.font = lbl.isSelected ? 'bold 11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' : '10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
              const textMetrics = ctx.measureText(text);
              const paddingX = 8;
              const boxW = textMetrics.width + paddingX * 2 + (lbl.isPHA ? 10 : 0);
              const boxH = 20;
              const boxX = Math.round(lbl.x - boxW / 2);
              const boxY = Math.round(lbl.y - 28);

              // Rounded box background
              ctx.beginPath();
              if (ctx.roundRect) {
                ctx.roundRect(boxX, boxY, boxW, boxH, 6);
              } else {
                ctx.rect(boxX, boxY, boxW, boxH);
              }

              if (lbl.isSelected) {
                ctx.fillStyle = '#f59e0b';
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.fillStyle = '#000000';
                ctx.fillText(text, boxX + paddingX + (lbl.isPHA ? 10 : 0), boxY + 14);
              } else if (lbl.isPHA) {
                ctx.fillStyle = 'rgba(69, 10, 10, 0.9)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
                ctx.lineWidth = 1;
                ctx.stroke();

                // Pulsing PHA warning dot
                ctx.beginPath();
                ctx.arc(boxX + 7, boxY + 10, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = '#ef4444';
                ctx.fill();

                ctx.fillStyle = '#fca5a5';
                ctx.fillText(text, boxX + paddingX + 8, boxY + 14);
              } else {
                ctx.fillStyle = 'rgba(5, 5, 7, 0.85)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                ctx.fillText(text, boxX + paddingX, boxY + 14);
              }
            });
          }
        }
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (rendererRef.current && rendererRef.current.domElement) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Build & Update 3D Meshes and Orbit Lines
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clean up old meshes & lines
    bodyMeshesRef.current.forEach((mesh) => scene.remove(mesh));
    bodyMeshesRef.current.clear();
    orbitLinesRef.current.forEach((line) => scene.remove(line));
    orbitLinesRef.current.clear();

    visibleBodies.forEach((body) => {
      // 1. Create Orbit Line Geometry
      if (body.id !== 'sun') {
        const orbitPoints = generateOrbitPoints(body.orbitalElements, 160);
        const points3D = orbitPoints.map((p) => new THREE.Vector3(p.x * SCALE_AU, p.y * SCALE_AU, p.z * SCALE_AU));
        const orbitGeom = new THREE.BufferGeometry().setFromPoints(points3D);

        let orbitColor = new THREE.Color(body.color);
        let opacity = 0.45;
        let isDashed = false;

        if (body.isPHA) {
          opacity = 0.85;
        } else if (body.category === 'planet') {
          opacity = 0.55;
        } else if (body.category === 'comet') {
          opacity = 0.7;
          isDashed = true;
        }

        const orbitMat = isDashed 
          ? new THREE.LineDashedMaterial({ color: orbitColor, transparent: true, opacity, dashSize: 0.8, gapSize: 0.4 })
          : new THREE.LineBasicMaterial({ color: orbitColor, transparent: true, opacity });

        const orbitLine = new THREE.Line(orbitGeom, orbitMat);
        if (isDashed) orbitLine.computeLineDistances();
        orbitLine.visible = showOrbits;
        scene.add(orbitLine);
        orbitLinesRef.current.set(body.id, orbitLine);
      }

      // 2. Create 3D Celestial Body Mesh
      const group = new THREE.Group();
      group.name = body.id;

      if (body.id === 'sun') {
        // Solar Core
        const sunGeom = new THREE.SphereGeometry(2.4, 32, 32);
        const sunTexture = generatePlanetTexture('sun', '#FFAA00');
        const sunMat = new THREE.MeshBasicMaterial({ map: sunTexture });
        const sunMesh = new THREE.Mesh(sunGeom, sunMat);
        group.add(sunMesh);

        // Solar Corona Glow
        const coronaGeom = new THREE.SphereGeometry(3.1, 32, 32);
        const coronaMat = new THREE.MeshBasicMaterial({
          color: 0xffaa00,
          transparent: true,
          opacity: 0.25,
          side: THREE.BackSide,
        });
        const coronaMesh = new THREE.Mesh(coronaGeom, coronaMat);
        group.add(coronaMesh);
        sunCoronaRef.current = coronaMesh;
      } else if (body.category === 'planet') {
        // Realistic Planet representation with visual boost factor
        const planetSizes: Record<string, number> = {
          mercury: 0.45,
          venus: 0.75,
          earth: 0.82,
          mars: 0.55,
          jupiter: 1.85,
          saturn: 1.55,
          uranus: 1.15,
          neptune: 1.1,
        };
        const pSize = planetSizes[body.id] || 0.6;
        const geom = new THREE.SphereGeometry(pSize, 32, 32);
        const texture = generatePlanetTexture(body.id, body.color);
        const mat = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.75,
          metalness: 0.1,
        });
        const pMesh = new THREE.Mesh(geom, mat);
        group.add(pMesh);

        // Add Saturn Rings
        if (body.id === 'saturn') {
          const ringGeom = new THREE.RingGeometry(2.1, 3.6, 48);
          const ringMat = new THREE.MeshStandardMaterial({
            color: 0xdfd3a8,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8,
          });
          const ringMesh = new THREE.Mesh(ringGeom, ringMat);
          ringMesh.rotation.x = Math.PI / 2.3;
          group.add(ringMesh);
        }

        // Add Earth Atmosphere Glow
        if (body.id === 'earth') {
          const atmoGeom = new THREE.SphereGeometry(0.88, 32, 32);
          const atmoMat = new THREE.MeshBasicMaterial({
            color: 0x4da6ff,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide,
          });
          group.add(new THREE.Mesh(atmoGeom, atmoMat));
        }
      } else if (body.category === 'moon' || body.id === 'moon') {
        // Dedicated High-Fidelity 3D Moon Object
        const geom = new THREE.SphereGeometry(0.36, 32, 32);
        const texture = generatePlanetTexture('moon', body.color);
        const mat = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.88,
          metalness: 0.05,
        });
        const moonMesh = new THREE.Mesh(geom, mat);
        group.add(moonMesh);

        // Marker Halo for easy selection and tracking
        const haloGeom = new THREE.RingGeometry(0.46, 0.58, 24);
        const haloMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(body.color),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.5,
        });
        const haloMesh = new THREE.Mesh(haloGeom, haloMat);
        haloMesh.name = 'halo';
        group.add(haloMesh);
      } else {
        // Asteroid / Comet / Interstellar Object
        // Procedural irregular dodecahedron
        const rockGeom = new THREE.DodecahedronGeometry(0.42, 1);
        // Perturb vertices for jagged asteroid realism
        const pos = rockGeom.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const vx = pos.getX(i);
          const vy = pos.getY(i);
          const vz = pos.getZ(i);
          const noise = 1.0 + (Math.sin(vx * 7) + Math.cos(vy * 7)) * 0.15;
          pos.setXYZ(i, vx * noise, vy * noise, vz * noise);
        }
        rockGeom.computeVertexNormals();

        const rockMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(body.color),
          roughness: 0.85,
          metalness: body.spectralClass === 'M' ? 0.6 : 0.1,
          emissive: body.isPHA ? new THREE.Color(0x551111) : new THREE.Color(0x000000),
          emissiveIntensity: body.isPHA ? 0.6 : 0.0,
        });
        const rockMesh = new THREE.Mesh(rockGeom, rockMat);
        group.add(rockMesh);

        // Marker Halo for selection & PHA warning pulse
        const haloGeom = new THREE.RingGeometry(0.55, 0.7, 24);
        const haloMat = new THREE.MeshBasicMaterial({
          color: body.isPHA ? 0xff3344 : new THREE.Color(body.color),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: body.isPHA ? 0.75 : 0.45,
        });
        const haloMesh = new THREE.Mesh(haloGeom, haloMat);
        haloMesh.name = 'halo';
        group.add(haloMesh);
      }

      scene.add(group);
      bodyMeshesRef.current.set(body.id, group);
    });
  }, [visibleBodies, showOrbits, generatePlanetTexture]);

  // Update visibility toggles for grid & belt
  useEffect(() => {
    if (gridGroupRef.current) gridGroupRef.current.visible = showGrid;
    if (beltPointsRef.current) beltPointsRef.current.visible = showBelt;
    orbitLinesRef.current.forEach((line) => {
      line.visible = showOrbits;
    });
  }, [showGrid, showBelt, showOrbits]);

  // Handle Camera Presets Transitions
  useEffect(() => {
    if (cameraPreset === 'topDown') {
      cameraThetaRef.current = 0;
      cameraPhiRef.current = 0.01; // Looking straight down from north ecliptic
      cameraRadiusRef.current = 65;
      cameraTargetRef.current.set(0, 0, 0);
    } else if (cameraPreset === 'innerSystem') {
      cameraThetaRef.current = Math.PI / 4;
      cameraPhiRef.current = Math.PI / 3.5;
      cameraRadiusRef.current = 40;
      cameraTargetRef.current.set(0, 0, 0);
    } else if (cameraPreset === 'outerSystem') {
      cameraThetaRef.current = Math.PI / 3;
      cameraPhiRef.current = Math.PI / 4;
      cameraRadiusRef.current = 140;
      cameraTargetRef.current.set(0, 0, 0);
    } else if (cameraPreset === 'earthGeocentric') {
      const earth = bodiesRef.current.find((b) => b.id === 'earth') || bodiesRef.current[3];
      const earthState = calculateHeliocentricPosition(earth.orbitalElements, currentJDRef.current);
      cameraTargetRef.current.set(earthState.positionAU.x * SCALE_AU, earthState.positionAU.y * SCALE_AU, earthState.positionAU.z * SCALE_AU);
      cameraRadiusRef.current = 10;
      cameraPhiRef.current = Math.PI / 3.2;
    }
  }, [cameraPreset]);

  // Mouse & Touch OrbitControls Implementation
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      cameraThetaRef.current -= deltaX * 0.006;
      cameraPhiRef.current = Math.max(0.01, Math.min(Math.PI - 0.01, cameraPhiRef.current - deltaY * 0.006));

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      onResetCameraPreset();
    } else {
      // Raycasting hover check
      checkRaycastHover(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    cameraRadiusRef.current = Math.max(4, Math.min(450, cameraRadiusRef.current + e.deltaY * 0.05));
    onResetCameraPreset();
  };

  // Raycasting for clicking & selecting bodies
  const checkRaycastHover = (clientX: number, clientY: number) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const hitGroups: THREE.Object3D[] = [];
    bodyMeshesRef.current.forEach((mesh) => hitGroups.push(mesh));

    const intersects = raycaster.intersectObjects(hitGroups, true);
    if (intersects.length > 0) {
      let topParent = intersects[0].object;
      while (topParent.parent && topParent.parent !== sceneRef.current) {
        topParent = topParent.parent;
      }
      const matched = bodies.find((b) => b.id === topParent.name);
      setHoveredBody(matched || null);
    } else {
      setHoveredBody(null);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const hitGroups: THREE.Object3D[] = [];
    bodyMeshesRef.current.forEach((mesh) => hitGroups.push(mesh));

    const intersects = raycaster.intersectObjects(hitGroups, true);
    if (intersects.length > 0) {
      let topParent = intersects[0].object;
      while (topParent.parent && topParent.parent !== sceneRef.current) {
        topParent = topParent.parent;
      }
      const matched = bodies.find((b) => b.id === topParent.name);
      if (matched) {
        onSelectBody(matched);
      }
    }
  };

  // Live Earth Distance calculation for selected body
  const liveEarthDistance = useMemo(() => {
    if (!selectedBody || selectedBody.id === 'earth') return null;
    if (selectedBody.id === 'moon') {
      return {
        distAU: 0.00257,
        distKm: 384400,
        distLD: 1.0,
        lightTimeSec: 1.282,
      };
    }
    const earth = bodies.find((b) => b.id === 'earth') || bodies[3];
    const earthState = calculateHeliocentricPosition(earth.orbitalElements, currentJD);
    const targetState = calculateHeliocentricPosition(selectedBody.orbitalElements, currentJD);
    return calculateDistance(earthState.positionAU, targetState.positionAU);
  }, [selectedBody, currentJD, bodies]);

  return (
    <div
      id="orrery-3d-viewport"
      ref={containerRef}
      className="relative w-full h-full cursor-grab active:cursor-grabbing select-none overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleClick}
    >
      {/* 2D High-Performance HUD Canvas Overlay */}
      <canvas ref={hudCanvasRef} className="absolute inset-0 pointer-events-none w-full h-full" />

      {/* Real-time Distance Vector On-Demand Overlay */}
      {selectedBody && selectedBody.id !== 'earth' && liveEarthDistance && (
        <div id="telemetry-vector-container" className="absolute top-4 left-4 z-20">
          {!showTelemetryVector ? (
            <button
              id="btn-show-telemetry-vector"
              onClick={(e) => {
                e.stopPropagation();
                setShowTelemetryVector(true);
              }}
              className="flex items-center gap-2 bg-black/80 hover:bg-black/95 text-white/70 hover:text-amber-300 border border-white/15 hover:border-amber-500/50 rounded-lg px-3 py-1.5 text-[11px] font-mono tracking-wider backdrop-blur-xl transition-all shadow-xl group cursor-pointer"
              title="Inspect Live Earth Distance & Telemetry Vector"
            >
              <Activity className="w-3.5 h-3.5 text-amber-400/80 group-hover:text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Live Telemetry Vector</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/50 group-hover:bg-amber-500/20 group-hover:text-amber-300 transition-colors">
                View
              </span>
            </button>
          ) : (
            <div
              id="live-telemetry-vector-card"
              className="bg-black/90 backdrop-blur-2xl border border-amber-500/40 rounded-xl p-3.5 text-xs font-mono shadow-2xl text-[#e0e0e0] flex flex-col gap-1.5 max-w-xs animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 text-amber-400 font-medium">
                <span className="flex items-center gap-1.5 tracking-wider uppercase text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Live Telemetry Vector
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase text-white/40">Earth ➔ {selectedBody.name}</span>
                  <button
                    id="btn-hide-telemetry-vector"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTelemetryVector(false);
                    }}
                    className="text-white/40 hover:text-white hover:bg-white/10 rounded p-0.5 transition-colors cursor-pointer"
                    title="Hide Telemetry Vector"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] pt-1">
                <div>
                  <span className="text-white/40 text-[9px] block uppercase tracking-wider">Distance (AU)</span>
                  <span className="text-white font-bold">{liveEarthDistance.distAU.toFixed(5)} AU</span>
                </div>
                <div>
                  <span className="text-white/40 text-[9px] block uppercase tracking-wider">Lunar Distances</span>
                  <span className="text-amber-400 font-bold">{liveEarthDistance.distLD.toFixed(2)} LD</span>
                </div>
                <div>
                  <span className="text-white/40 text-[9px] block uppercase tracking-wider">Kilometers</span>
                  <span className="text-white/90">{Math.round(liveEarthDistance.distKm).toLocaleString()} km</span>
                </div>
                <div>
                  <span className="text-white/40 text-[9px] block uppercase tracking-wider">Light Travel Time</span>
                  <span className="text-white/90">{liveEarthDistance.lightTimeSec.toFixed(1)} sec</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Orientation Compass & Viewport Info */}
      <div className="absolute bottom-4 left-4 pointer-events-none bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-mono text-white/40 flex items-center gap-3 z-10">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>ECLIPTIC J2000 FRAME</span>
        </div>
        <span>•</span>
        <span>1 AU = {SCALE_AU} UNITS</span>
        <span>•</span>
        <span>DRAG: ROTATE | SCROLL: ZOOM</span>
      </div>
    </div>
  );
};
