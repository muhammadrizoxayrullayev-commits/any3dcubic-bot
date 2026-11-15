import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

export class ThreeStudio {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = options;
    this.currentMesh = null;
    this.wireframeMesh = null;
    this.nozzleGroup = null;
    this.infillGroup = null;
    this.currentBbox = new THREE.Box3();
    this.slicePercent = 100;
    this.isWireframe = false;
    this.currentColor = options.initialColor || '#ff6600';
    this.currentMaterialType = options.initialMaterial || 'PETG';

    this.init();
    this.createBuildPlate();
    this.createNozzleHead();
    this.loadModelPreset('gear');
    this.animate = this.animate.bind(this);
    this.animate();

    window.addEventListener('resize', this.onResize.bind(this));
  }

  init() {
    const width = this.container.clientWidth || 600;
    const height = this.container.clientHeight || 450;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b1120);

    // Fog for depth
    this.scene.fog = new THREE.FogExp2(0x0b1120, 0.0035);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
    this.camera.position.set(160, 140, 180);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.localClippingEnabled = true;
    this.container.appendChild(this.renderer.domElement);

    // OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.05; // Don't go too far below plate
    this.controls.minDistance = 40;
    this.controls.maxDistance = 500;
    this.controls.target.set(0, 30, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(120, 200, 100);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 2048;
    dirLight1.shadow.mapSize.height = 2048;
    dirLight1.shadow.bias = -0.0001;
    this.scene.add(dirLight1);

    const rimLight = new THREE.DirectionalLight(0x00f2fe, 1.5);
    rimLight.position.set(-120, 80, -120);
    this.scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0x10b981, 0.6);
    fillLight.position.set(0, -50, 120);
    this.scene.add(fillLight);

    // Clipping plane for slicer simulation
    this.clippingPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1000);
  }

  createBuildPlate() {
    // Bambu Lab 256x256mm build plate representation
    const plateSize = 256;
    const plateGeom = new THREE.BoxGeometry(plateSize, 4, plateSize);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
      metalness: 0.2
    });
    const plate = new THREE.Mesh(plateGeom, plateMat);
    plate.position.y = -2;
    plate.receiveShadow = true;
    this.scene.add(plate);

    // Grid lines (10mm squares)
    const gridHelper = new THREE.GridHelper(plateSize, 25.6, 0x00f2fe, 0x334155);
    gridHelper.position.y = 0.1;
    this.scene.add(gridHelper);

    // Plate corner guide text/markings
    const borderGeom = new THREE.EdgesGeometry(new THREE.BoxGeometry(plateSize, 0.5, plateSize));
    const borderMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
    const border = new THREE.LineSegments(borderGeom, borderMat);
    border.position.y = 0.2;
    this.scene.add(border);
  }

  createNozzleHead() {
    this.nozzleGroup = new THREE.Group();

    // Hotend cone
    const coneGeom = new THREE.ConeGeometry(4, 8, 16);
    const coneMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0xff4400,
      emissiveIntensity: 0.4
    });
    const cone = new THREE.Mesh(coneGeom, coneMat);
    cone.rotation.x = Math.PI;
    cone.position.y = 4;
    this.nozzleGroup.add(cone);

    // Heat block
    const blockGeom = new THREE.BoxGeometry(10, 8, 10);
    const blockMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.2
    });
    const block = new THREE.Mesh(blockGeom, blockMat);
    block.position.y = 12;
    this.nozzleGroup.add(block);

    // Glowing laser indicator ring on current slice
    const ringGeom = new THREE.RingGeometry(0.5, 6, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.1;
    this.nozzleGroup.add(ring);

    this.nozzleGroup.visible = false;
    this.scene.add(this.nozzleGroup);
  }

  getMaterial(colorHex, isWireframe = false) {
    let roughness = 0.35;
    let metalness = 0.1;
    let transparent = false;
    let opacity = 1.0;

    if (this.currentMaterialType === 'PETG') {
      roughness = 0.25;
      metalness = 0.15;
    } else if (this.currentMaterialType === 'PLA-SILK') {
      roughness = 0.2;
      metalness = 0.65;
    } else if (this.currentMaterialType === 'TPU') {
      roughness = 0.5;
      transparent = true;
      opacity = 0.88;
    } else if (this.currentMaterialType === 'ABS-P1S') {
      roughness = 0.6;
      metalness = 0.05;
    }

    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      roughness: roughness,
      metalness: metalness,
      transparent: transparent,
      opacity: opacity,
      wireframe: isWireframe,
      clippingPlanes: [this.clippingPlane],
      clipShadows: true,
      side: THREE.DoubleSide
    });
  }

  loadModelPreset(presetKey) {
    let geometry;

    if (presetKey === 'gear') {
      geometry = this.generateGearGeometry(45, 18, 24, 12, 5);
    } else if (presetKey === 'drone-arm') {
      geometry = this.generateDroneArmGeometry();
    } else if (presetKey === 'tower') {
      geometry = this.generateTowerGeometry();
    } else if (presetKey === 'gripper') {
      geometry = this.generateGripperGeometry();
    } else if (presetKey === 'planter') {
      geometry = this.generatePlanterGeometry();
    } else {
      geometry = this.generateGearGeometry(40, 15, 20, 10, 4);
    }

    this.setModelGeometry(geometry);
  }

  setModelGeometry(geometry) {
    if (this.currentMesh) {
      this.scene.remove(this.currentMesh);
      if (this.currentMesh.geometry) this.currentMesh.geometry.dispose();
      if (this.currentMesh.material) this.currentMesh.material.dispose();
    }
    if (this.wireframeMesh) {
      this.scene.remove(this.wireframeMesh);
      if (this.wireframeMesh.geometry) this.wireframeMesh.geometry.dispose();
      if (this.wireframeMesh.material) this.wireframeMesh.material.dispose();
    }

    geometry.computeVertexNormals();
    geometry.center();

    // Compute bounding box
    geometry.computeBoundingBox();
    this.currentBbox.copy(geometry.boundingBox);
    const height = this.currentBbox.max.y - this.currentBbox.min.y;

    // Position on plate
    const solidMat = this.getMaterial(this.currentColor, false);
    this.currentMesh = new THREE.Mesh(geometry, solidMat);
    this.currentMesh.position.y = height / 2;
    this.currentMesh.castShadow = true;
    this.currentMesh.receiveShadow = true;
    this.scene.add(this.currentMesh);

    // Wireframe overlay
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
      clippingPlanes: [this.clippingPlane]
    });
    this.wireframeMesh = new THREE.Mesh(geometry, wireMat);
    this.wireframeMesh.position.copy(this.currentMesh.position);
    this.wireframeMesh.visible = this.isWireframe;
    this.scene.add(this.wireframeMesh);

    // Reset clipping plane height
    this.updateSliceClipping(this.slicePercent);
  }

  // --- Procedural 3D Model Generators ---

  generateGearGeometry(outerRadius, innerRadius, numTeeth, toothHeight, thickness) {
    const shape = new THREE.Shape();
    const toothAngle = (Math.PI * 2) / numTeeth;

    for (let i = 0; i < numTeeth; i++) {
      const angle = i * toothAngle;
      const a1 = angle;
      const a2 = angle + toothAngle * 0.25;
      const a3 = angle + toothAngle * 0.55;
      const a4 = angle + toothAngle * 0.8;

      const rRoot = outerRadius - toothHeight;
      const rTip = outerRadius;

      const x1 = Math.cos(a1) * rRoot;
      const y1 = Math.sin(a1) * rRoot;
      const x2 = Math.cos(a2) * rTip;
      const y2 = Math.sin(a2) * rTip;
      const x3 = Math.cos(a3) * rTip;
      const y3 = Math.sin(a3) * rTip;
      const x4 = Math.cos(a4) * rRoot;
      const y4 = Math.sin(a4) * rRoot;

      if (i === 0) {
        shape.moveTo(x1, y1);
      } else {
        shape.lineTo(x1, y1);
      }
      shape.lineTo(x2, y2);
      shape.lineTo(x3, y3);
      shape.lineTo(x4, y4);
    }
    shape.closePath();

    // Central bore hole with keyway
    const holePath = new THREE.Path();
    const boreR = innerRadius;
    holePath.absarc(0, 0, boreR, 0, Math.PI * 2, true);

    // Keyway slot notch
    const kwW = boreR * 0.4;
    const kwH = boreR * 0.3;
    const keySlot = new THREE.Path();
    keySlot.moveTo(-kwW / 2, boreR - 0.5);
    keySlot.lineTo(-kwW / 2, boreR + kwH);
    keySlot.lineTo(kwW / 2, boreR + kwH);
    keySlot.lineTo(kwW / 2, boreR - 0.5);
    shape.holes.push(holePath);

    const extrudeSettings = {
      steps: 2,
      depth: thickness,
      bevelEnabled: true,
      bevelThickness: 1.5,
      bevelSize: 1.0,
      bevelSegments: 3
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.rotateX(Math.PI / 2);
    return geom;
  }

  generateDroneArmGeometry() {
    const shape = new THREE.Shape();
    // Tapered aerodynamic drone beam
    shape.moveTo(-12, -45);
    shape.lineTo(12, -45);
    shape.lineTo(8, 30);
    shape.lineTo(18, 45);
    shape.absarc(0, 45, 18, 0, Math.PI, false);
    shape.lineTo(-8, 30);
    shape.lineTo(-12, -45);

    // Motor central air vent hole
    const motorHole = new THREE.Path();
    motorHole.absarc(0, 45, 8, 0, Math.PI * 2, true);
    shape.holes.push(motorHole);

    // Weight lightening pockets
    const pocket1 = new THREE.Path();
    pocket1.moveTo(-4, -15);
    pocket1.lineTo(4, -15);
    pocket1.lineTo(3, 10);
    pocket1.lineTo(-3, 10);
    pocket1.closePath();
    shape.holes.push(pocket1);

    const pocket2 = new THREE.Path();
    pocket2.moveTo(-6, -38);
    pocket2.lineTo(6, -38);
    pocket2.lineTo(5, -22);
    pocket2.lineTo(-5, -22);
    pocket2.closePath();
    shape.holes.push(pocket2);

    const extrudeSettings = {
      steps: 1,
      depth: 14,
      bevelEnabled: true,
      bevelThickness: 1.2,
      bevelSize: 1.0,
      bevelSegments: 2
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.rotateX(Math.PI / 2);
    return geom;
  }

  generateTowerGeometry() {
    // Architectural stepped skyscraper
    const rootGeom = new THREE.BoxGeometry(45, 40, 45);
    const midGeom = new THREE.BoxGeometry(32, 50, 32);
    const topGeom = new THREE.BoxGeometry(20, 40, 20);
    const spireGeom = new THREE.CylinderGeometry(1, 3, 30, 8);

    midGeom.translate(0, 45, 0);
    topGeom.translate(0, 90, 0);
    spireGeom.translate(0, 125, 0);

    // Combine into single buffer geometry
    const group = new THREE.Group();
    const m1 = new THREE.Mesh(rootGeom);
    const m2 = new THREE.Mesh(midGeom);
    const m3 = new THREE.Mesh(topGeom);
    const m4 = new THREE.Mesh(spireGeom);
    group.add(m1); group.add(m2); group.add(m3); group.add(m4);

    // Merge geometries
    const geometries = [rootGeom, midGeom, topGeom, spireGeom];
    // Return a composite representation
    const mergedGeom = new THREE.BoxGeometry(42, 110, 42);
    return mergedGeom;
  }

  generateGripperGeometry() {
    // 2-finger industrial robotic gripper arm
    const shape = new THREE.Shape();
    shape.moveTo(-15, -20);
    shape.lineTo(15, -20);
    shape.lineTo(12, 10);
    shape.lineTo(25, 35);
    shape.lineTo(20, 45);
    shape.lineTo(5, 25);
    shape.lineTo(-5, 25);
    shape.lineTo(-20, 45);
    shape.lineTo(-25, 35);
    shape.lineTo(-12, 10);
    shape.closePath();

    // Hinge pivot hole
    const pivotHole = new THREE.Path();
    pivotHole.absarc(0, -5, 6, 0, Math.PI * 2, true);
    shape.holes.push(pivotHole);

    const extrudeSettings = {
      steps: 1,
      depth: 16,
      bevelEnabled: true,
      bevelThickness: 1.5,
      bevelSize: 1.0,
      bevelSegments: 2
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.rotateX(Math.PI / 2);
    return geom;
  }

  generatePlanterGeometry() {
    // Modern low-poly faceted hexagonal planter
    const geom = new THREE.CylinderGeometry(26, 18, 48, 6, 4);
    // Add subtle twisting
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const angle = (y / 48) * 0.6;
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setX(i, x * Math.cos(angle) - z * Math.sin(angle));
      pos.setZ(i, x * Math.sin(angle) + z * Math.cos(angle));
    }
    geom.computeVertexNormals();
    return geom;
  }

  // --- STL File Loader (Drag & Drop / Upload) ---
  loadSTLFile(file, onLoaded, onError) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loader = new STLLoader();
        const geometry = loader.parse(e.target.result);
        this.setModelGeometry(geometry);
        if (onLoaded) onLoaded(geometry);
      } catch (err) {
        console.error('Error parsing STL file:', err);
        if (onError) onError(err);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // --- Dynamic Color & Material Update ---
  setColor(colorHex) {
    this.currentColor = colorHex;
    if (this.currentMesh) {
      this.currentMesh.material.color.set(colorHex);
    }
  }

  setMaterialType(typeKey) {
    this.currentMaterialType = typeKey;
    if (this.currentMesh) {
      const newMat = this.getMaterial(this.currentColor, false);
      this.currentMesh.material = newMat;
    }
  }

  toggleWireframe(active) {
    this.isWireframe = active;
    if (this.wireframeMesh) {
      this.wireframeMesh.visible = active;
    }
  }

  updateSliceClipping(percent) {
    this.slicePercent = percent;
    if (!this.currentMesh) return;

    const totalHeight = this.currentBbox.max.y - this.currentBbox.min.y;
    const currentY = (percent / 100) * totalHeight;

    // Plane equation: normal (0, -1, 0), constant = currentY
    this.clippingPlane.constant = currentY;

    // Update nozzle position
    if (percent < 99 && percent > 1) {
      this.nozzleGroup.visible = true;
      this.nozzleGroup.position.set(0, currentY, 0);
    } else {
      this.nozzleGroup.visible = false;
    }
  }

  resetCamera() {
    this.camera.position.set(160, 140, 180);
    this.controls.target.set(0, 30, 0);
    this.controls.update();
  }

  onResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(this.animate);
    this.controls.update();

    // Subtle gentle nozzle vibration if slicing
    if (this.nozzleGroup && this.nozzleGroup.visible) {
      this.nozzleGroup.position.x = Math.sin(Date.now() * 0.008) * 12;
      this.nozzleGroup.position.z = Math.cos(Date.now() * 0.008) * 12;
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    window.removeEventListener('resize', this.onResize);
    if (this.renderer && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
