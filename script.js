const lenis = new Lenis();
function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

gsap.registerPlugin(ScrollTrigger);
gsap.utils.toArray(".reveal").forEach(el => {
    gsap.from(el, {
        y: 80, opacity: 0, duration: 1.2, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 80%" }
    });
});

const c = document.getElementById("stars"), x = c.getContext("2d");
function size() { c.width = innerWidth; c.height = innerHeight; }
size(); addEventListener("resize", size);
const stars = Array.from({ length: 180 }, () => ({
    x: Math.random() * c.width, y: Math.random() * c.height,
    r: Math.random() * 1.5, s: Math.random() * 0.3 + 0.05
}));
(function draw() {
    x.clearRect(0, 0, c.width, c.height);
    stars.forEach(p => {
        p.y += p.s; if (p.y > c.height) p.y = 0;
        x.fillStyle = "rgba(255,255,255,.8)";
        const yy = (((p.y - scrollY * p.r * 0.15) % c.height) + c.height) % c.height;
        x.beginPath(); x.arc(p.x, yy, p.r, 0, 6.28); x.fill();
    });
    requestAnimationFrame(draw);
})();

// Each step slides in
gsap.utils.toArray(".step").forEach(step => {
    gsap.from(step, {
        x: -40, opacity: 0, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: step, start: "top 80%" }
    });
});

// The line draws as you scroll
gsap.to(".line-fill", {
    scaleY: 1, ease: "none",
    scrollTrigger: {
        trigger: ".timeline",
        start: "top 60%",
        end: "bottom 70%",
        scrub: true
    }
});
const wrap = document.getElementById("earth");

if (wrap) {
    // Scene, camera, renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
    camera.position.set(0, 1.5, 8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    wrap.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0x4466aa, 0.7));
    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(5, 3, 5);
    scene.add(sun);

    // Earth: blue sphere + cyan grid lines
    const earth = new THREE.Mesh(
        new THREE.SphereGeometry(2, 48, 48),
        new THREE.MeshStandardMaterial({ color: 0x1e5bd8, roughness: 0.8, metalness: 0.1 })
    );
    scene.add(earth);

    earth.add(new THREE.Mesh(
        new THREE.SphereGeometry(2.02, 28, 28),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.15 })
    ));

    // Soft atmosphere glow
    scene.add(new THREE.Mesh(
        new THREE.SphereGeometry(2.25, 48, 48),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.08, side: THREE.BackSide })
    ));

    // Satellites on tilted orbits
    const orbits = [];
    const configs = [
        { radius: 3.0, tiltX: 0.4, tiltZ: 0.0, speed: 0.012, color: 0xff8a1f },
        { radius: 3.6, tiltX: -0.7, tiltZ: 0.5, speed: -0.008, color: 0x22d3ee },
        { radius: 4.2, tiltX: 1.1, tiltZ: -0.3, speed: 0.006, color: 0xff8a1f }
    ];

    configs.forEach(cfg => {
        const tilt = new THREE.Group();
        tilt.rotation.x = cfg.tiltX;
        tilt.rotation.z = cfg.tiltZ;
        scene.add(tilt);

        // Orbit ring
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(cfg.radius - 0.005, cfg.radius + 0.005, 128),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15, side: THREE.DoubleSide })
        );
        ring.rotation.x = Math.PI / 2;
        tilt.add(ring);

        // Pivot that spins, carrying the satellite
        const pivot = new THREE.Group();
        tilt.add(pivot);

        const sat = new THREE.Group();
        sat.add(new THREE.Mesh(
            new THREE.BoxGeometry(0.14, 0.1, 0.1),
            new THREE.MeshBasicMaterial({ color: cfg.color })
        ));
        sat.add(new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.02, 0.12),
            new THREE.MeshBasicMaterial({ color: 0x9fd8ff })
        ));
        sat.position.x = cfg.radius;
        pivot.add(sat);

        orbits.push({ pivot, speed: cfg.speed });
    });

    // Only animate while visible (saves battery)
    let visible = true;
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }).observe(wrap);

    function animate() {
        requestAnimationFrame(animate);
        if (!visible) return;
        earth.rotation.y += 0.002;
        orbits.forEach(o => { o.pivot.rotation.y += o.speed; });
        renderer.render(scene, camera);
    }
    animate();

    // Keep it sharp when the window resizes
    window.addEventListener("resize", () => {
        camera.aspect = wrap.clientWidth / wrap.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    });
}

const cursor = document.querySelector(".cursor");

if (cursor && window.matchMedia("(hover: hover)").matches) {
    let x = 0, y = 0, lastX = 0, lastY = 0;
    let angle = 0, target = 0, first = true;

    window.addEventListener("mousemove", e => {
        x = e.clientX;
        y = e.clientY;

        if (first) { lastX = x; lastY = y; first = false; }

        // Update direction only after the mouse has moved a few pixels
        const dx = x - lastX, dy = y - lastY;
        if (Math.hypot(dx, dy) > 4) {
            target = Math.atan2(dy, dx) * 180 / Math.PI + 90;
            lastX = x;
            lastY = y;
        }
        cursor.style.opacity = 1;
    });

    (function loop() {
        // Turn the shortest way toward the target angle
        const diff = ((((target - angle) + 180) % 360) + 360) % 360 - 180;
        angle += diff * 0.15;
        cursor.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
        requestAnimationFrame(loop);
    })();

    document.querySelectorAll("a, button, .btn").forEach(el => {
        el.addEventListener("mouseenter", () => cursor.classList.add("hover"));
        el.addEventListener("mouseleave", () => cursor.classList.remove("hover"));
    });

    document.addEventListener("mouseleave", () => { cursor.style.opacity = 0; });
}

history.scrollRestoration = "manual";
window.scrollTo(0, 0);

const loader = document.getElementById("loader");

if (loader) {
    lenis.stop(); // lock scrolling while loading

    const text = document.getElementById("loaderText");
    const fill = document.getElementById("loaderFill");
    const pct = document.getElementById("loaderPercent");

    const messages = [
        "INITIALIZING SOLAR TELEMETRY",
        "CALIBRATING MAGNETOMETERS",
        "SCANNING LOW EARTH ORBIT",
        "SYNCING SATELLITE FEEDS"
    ];

    const state = { v: 0 };

    gsap.to(state, {
        v: 100,
        duration: 3,
        ease: "power1.inOut",
        onUpdate: () => {
            const v = Math.round(state.v);
            fill.style.width = v + "%";
            pct.textContent = v + "%";
            const i = Math.min(messages.length - 1, Math.floor((v / 100) * messages.length));
            text.textContent = messages[i];
        },
        onComplete: () => {
            text.textContent = "TELEMETRY ONLINE";
            gsap.to(loader, {
                opacity: 0,
                duration: 0.8,
                delay: 0.5,
                onComplete: () => {
                    loader.style.display = "none";
                    lenis.start();
                    ScrollTrigger.refresh();
                    document.dispatchEvent(new Event("siteready"));
                }
            });
        }
    });
}

// Split text into words, each inside a mask
function splitWords(el) {
    const walk = node => {
        [...node.childNodes].forEach(child => {
            if (child.nodeType === 3) {
                const frag = document.createDocumentFragment();
                child.textContent.split(/(\s+)/).forEach(part => {
                    if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
                    const outer = document.createElement("span");
                    outer.className = "word";
                    const inner = document.createElement("span");
                    inner.className = "word-inner";
                    inner.textContent = part;
                    outer.appendChild(inner);
                    frag.appendChild(outer);
                });
                node.replaceChild(frag, child);
            } else if (child.nodeType === 1) {
                walk(child);
            }
        });
    };
    walk(el);
    return el.querySelectorAll(".word-inner");
}

// 1. Headings: words rise out of the mask
gsap.utils.toArray(".split").forEach(el => {
    const words = splitWords(el);
    gsap.set(words, { yPercent: 110 });
    const play = () => gsap.to(words, { yPercent: 0, duration: 1, ease: "power4.out", stagger: 0.07 });

    if (el.hasAttribute("data-hero")) {
        document.addEventListener("siteready", play, { once: true });
    } else {
        ScrollTrigger.create({ trigger: el, start: "top 85%", once: true, onEnter: play });
    }
});

// If there is no loader on the page, start the hero right away
if (!document.getElementById("loader")) {
    document.dispatchEvent(new Event("siteready"));
}

// 2. Parallax: orb drifts down slowly, hero text moves up faster
gsap.to(".orb", {
    top: "80%", ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
});
gsap.to(".hero .content", {
    yPercent: -15, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
});

gsap.to(".giant-num", {
    xPercent: -12, ease: "none",
    scrollTrigger: { trigger: "#distance", start: "top bottom", end: "bottom top", scrub: true }
});

document.addEventListener("siteready", () => {
    document.getElementById("hud").classList.add("on");
}, { once: true });

gsap.to("#progressFill", {
    scaleX: 1, ease: "none",
    scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: true }
});
