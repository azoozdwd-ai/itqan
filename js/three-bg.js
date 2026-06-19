(function() {
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.innerWidth < 768;
  if (prefersReduced) {
    var canvas = document.getElementById('particle-bg');
    if (canvas) {
      var ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.fillStyle = '#070f18';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    return;
  }

  var canvas = document.getElementById('particle-bg');
  var scene = new THREE.Scene();

  var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 14;

  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: !isMobile
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 1.5));
  renderer.setClearColor(0x000000, 0);

  var COUNT = isMobile ? 500 : 1200;
  var positions = new Float32Array(COUNT * 3);
  var sizes = new Float32Array(COUNT);
  var speeds = new Float32Array(COUNT);
  var offsets = [];

  for (var i = 0; i < COUNT; i++) {
    var i3 = i * 3;
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(2 * Math.random() - 1);
    var r = 5 + Math.random() * 10;
    positions[i3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.cos(phi) * 1.2;
    positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    sizes[i] = 0.04 + Math.random() * 0.12;
    speeds[i] = 0.1 + Math.random() * 0.4;
    offsets.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      z: Math.random() * 100
    });
  }

  var geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  var gold = new THREE.Color('#dfc073');
  var warmWhite = new THREE.Color('#f0f4f8');
  var colors = new Float32Array(COUNT * 3);
  for (var i = 0; i < COUNT; i++) {
    var i3 = i * 3;
    var tint = warmWhite.clone().lerp(gold, Math.random() * 0.15);
    colors[i3] = tint.r;
    colors[i3 + 1] = tint.g;
    colors[i3 + 2] = tint.b;
  }
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  var textureCanvas = document.createElement('canvas');
  textureCanvas.width = 64;
  textureCanvas.height = 64;
  var tCtx = textureCanvas.getContext('2d');
  var gradient = tCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,0.7)');
  gradient.addColorStop(0.2, 'rgba(255,255,255,0.5)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  tCtx.fillStyle = gradient;
  tCtx.fillRect(0, 0, 64, 64);
  var texture = new THREE.CanvasTexture(textureCanvas);

  var mat = new THREE.PointsMaterial({
    size: 0.35,
    map: texture,
    vertexColors: true,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });

  var particles = new THREE.Points(geom, mat);
  scene.add(particles);

  // Connection lines
  var lineGeo = new THREE.BufferGeometry();
  var maxLines = 600;
  var linePos = new Float32Array(maxLines * 6);
  var lineColors = new Float32Array(maxLines * 6);
  var lineCount = 0;
  var lineMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.06,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  var lines = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(lines);

  var mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  document.addEventListener('mousemove', function(e) {
    mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  });
  document.addEventListener('touchmove', function(e) {
    if (e.touches.length) {
      mouse.targetX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
    }
  }, { passive: true });

  var clock = new THREE.Clock();
  var frameCount = 0;

  function animate() {
    requestAnimationFrame(animate);
    var t = clock.getElapsedTime();
    frameCount++;

    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    var pos = geom.attributes.position.array;
    for (var i = 0; i < COUNT; i++) {
      var i3 = i * 3;
      var ox = offsets[i].x;
      var oy = offsets[i].y;
      var oz = offsets[i].z;
      var sp = speeds[i];

      pos[i3] += Math.sin(t * 0.15 + ox) * 0.003;
      pos[i3 + 1] += Math.cos(t * 0.12 + oy) * 0.003;
      pos[i3 + 2] += Math.sin(t * 0.1 + oz) * 0.003;

      var dx = pos[i3], dy = pos[i3 + 1], dz = pos[i3 + 2];
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist > 14) {
        pos[i3] *= 0.99;
        pos[i3 + 1] *= 0.99;
        pos[i3 + 2] *= 0.99;
      }
    }
    geom.attributes.position.needsUpdate = true;

    // Update connection lines every 4 frames
    if (frameCount % 4 === 0) {
      var maxDist = 2.5;
      var count = 0;
      for (var i = 0; i < COUNT && count < maxLines; i++) {
        var i3 = i * 3;
        for (var j = i + 1; j < COUNT && count < maxLines; j++) {
          var j3 = j * 3;
          var dx = pos[i3] - pos[j3];
          var dy = pos[i3 + 1] - pos[j3 + 1];
          var dz = pos[i3 + 2] - pos[j3 + 2];
          var d = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (d < maxDist) {
            var idx = count * 6;
            linePos[idx] = pos[i3];
            linePos[idx + 1] = pos[i3 + 1];
            linePos[idx + 2] = pos[i3 + 2];
            linePos[idx + 3] = pos[j3];
            linePos[idx + 4] = pos[j3 + 1];
            linePos[idx + 5] = pos[j3 + 2];
            var alpha = 1 - d / maxDist;
            lineColors[idx] = colors[i3] * alpha;
            lineColors[idx + 1] = colors[i3 + 1] * alpha;
            lineColors[idx + 2] = colors[i3 + 2] * alpha;
            lineColors[idx + 3] = colors[j3] * alpha;
            lineColors[idx + 4] = colors[j3 + 1] * alpha;
            lineColors[idx + 5] = colors[j3 + 2] * alpha;
            count++;
          }
        }
      }
      lines.geometry.dispose();
      var newLineGeo = new THREE.BufferGeometry();
      newLineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos.slice(0, count * 6), 3));
      newLineGeo.setAttribute('color', new THREE.Float32BufferAttribute(lineColors.slice(0, count * 6), 3));
      lines.geometry = newLineGeo;
    }

    particles.rotation.x += mouse.y * 0.003;
    particles.rotation.y += mouse.x * 0.003;

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
  });
})();
