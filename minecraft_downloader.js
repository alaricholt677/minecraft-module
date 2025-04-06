import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';

class MinecraftGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.camera.position.set(0, 20, 50); // Initial player position
        this.controls = null; // Placeholder for future player controls

        this.BLOCK_SIZE = 1; // Size of each block
        this.textures = this.loadTextures(); // Load block textures
        this.world = []; // Holds block meshes
        this.players = []; // Multiplayer avatars

        this.init();
    }

    loadTextures() {
        const loader = new THREE.TextureLoader();
        return {
            grass: loader.load('https://upload.wikimedia.org/wikipedia/commons/3/36/Grass_texture.jpg'),
            stone: loader.load('https://upload.wikimedia.org/wikipedia/commons/1/12/Stone_texture.jpg'),
            water: loader.load('https://upload.wikimedia.org/wikipedia/commons/a/a4/Water_texture.jpg'),
            sand: loader.load('https://upload.wikimedia.org/wikipedia/commons/5/58/Sand_texture.jpg'),
        };
    }

    async init() {
        this.setupWorld();
        this.setupLighting();
        this.setupUI();
        this.animate();
        this.setupControls();
    }

    setupWorld() {
        const worldSize = 32; // 32x32 blocks
        const maxHeight = 10;

        for (let x = 0; x < worldSize; x++) {
            for (let z = 0; z < worldSize; z++) {
                // Use Perlin noise or random values for terrain height
                const height = Math.floor(Math.random() * maxHeight); 
                const blockType = height < 5 ? 'sand' : 'grass'; // Sand near sea level, grass elsewhere
                for (let y = 0; y <= height; y++) {
                    const type = y === height ? blockType : 'stone'; // Surface blocks are biome-specific
                    this.addBlock(x, y, z, type);
                }
            }
        }
    }

    addBlock(x, y, z, type) {
        const geometry = new THREE.BoxGeometry(this.BLOCK_SIZE, this.BLOCK_SIZE, this.BLOCK_SIZE);
        const material = new THREE.MeshStandardMaterial({ map: this.textures[type] });
        const block = new THREE.Mesh(geometry, material);

        block.position.set(x * this.BLOCK_SIZE, y * this.BLOCK_SIZE, z * this.BLOCK_SIZE);
        this.scene.add(block);
        this.world.push(block);
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft ambient light
        const sunLight = new THREE.DirectionalLight(0xffee88, 1); // Simulates sunlight
        sunLight.castShadow = true;
        sunLight.position.set(30, 50, 30);
        this.scene.add(ambientLight);
        this.scene.add(sunLight);
    }

    setupUI() {
        // Example UI: Player HUD
        const hud = document.createElement('div');
        hud.style.position = 'absolute';
        hud.style.top = '10px';
        hud.style.left = '10px';
        hud.style.color = 'white';
        hud.style.fontFamily = 'Arial, sans-serif';
        hud.style.zIndex = 1000;
        hud.innerHTML = '<p>Health: ♥♥♥♥♥</p><p>Hunger: ☺☺☺☺☺</p>';
        document.body.appendChild(hud);
    }

    setupControls() {
        // Basic player controls
        document.addEventListener('keydown', (event) => {
            const moveSpeed = 0.5;
            switch (event.key) {
                case 'w': this.camera.position.z -= moveSpeed; break;
                case 's': this.camera.position.z += moveSpeed; break;
                case 'a': this.camera.position.x -= moveSpeed; break;
                case 'd': this.camera.position.x += moveSpeed; break;
                case ' ': this.camera.position.y += moveSpeed; break; // Jump
                case 'Shift': this.camera.position.y -= moveSpeed; break; // Crouch
            }
        });

        document.addEventListener('mousemove', (event) => {
            if (document.pointerLockElement === this.canvas) {
                this.camera.rotation.y -= event.movementX * 0.002;
                this.camera.rotation.x -= event.movementY * 0.002;
            }
        });

        this.canvas.addEventListener('click', () => {
            this.canvas.requestPointerLock();
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
}

export default MinecraftGame;
