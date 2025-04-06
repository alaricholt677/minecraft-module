export class MinecraftGame {
    constructor(canvasId, uiContainerId) {
        this.canvas = document.getElementById(canvasId);
        this.uiContainer = document.getElementById(uiContainerId);

        if (!this.canvas || !this.uiContainer) throw new Error("Canvas or UI container not found.");
        this.gl = this.canvas.getContext("webgl");
        if (!this.gl) throw new Error("WebGL not supported in this browser.");

        this.textures = {
            mainMenuBackground: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...",
            buttonTexture: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...",
            crosshair: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...",
            hotbarSlot: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...",
            blockTextures: {
                grass: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...",
                stone: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...",
                wood: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...",
            },
        };

        this.worlds = []; // Store created worlds
        this.servers = []; // Store multiplayer servers

        this.blocks = []; // Store placed blocks
        this.movement = { forward: false, backward: false, left: false, right: false, jump: false, crouch: false };
        this.selectedBlock = "grass"; // Default selected block
        this.hotbar = ["grass", "stone", "wood"]; // Hotbar with block types
        this.hotbarIndex = 0;

        this.init();
    }

    async init() {
        this.setupControls();
        this.showMainMenu();
    }

    setupControls() {
        // Mouse lock for first-person look-around
        this.canvas.addEventListener("click", () => this.canvas.requestPointerLock());
        document.addEventListener("mousemove", (event) => {
            if (document.pointerLockElement === this.canvas) {
                console.log("Looking around...");
            }
        });

        // Movement controls
        document.addEventListener("keydown", (event) => {
            switch (event.code) {
                case "KeyW": this.movement.forward = true; break;
                case "KeyS": this.movement.backward = true; break;
                case "KeyA": this.movement.left = true; break;
                case "KeyD": this.movement.right = true; break;
                case "Space": this.movement.jump = true; break;
                case "ShiftLeft": this.movement.crouch = true; break;
            }
        });
        document.addEventListener("keyup", (event) => {
            switch (event.code) {
                case "KeyW": this.movement.forward = false; break;
                case "KeyS": this.movement.backward = false; break;
                case "KeyA": this.movement.left = false; break;
                case "KeyD": this.movement.right = false; break;
                case "Space": this.movement.jump = false; break;
                case "ShiftLeft": this.movement.crouch = false; break;
            }
        });

        // Scroll to switch blocks in hotbar
        window.addEventListener("wheel", (event) => {
            this.hotbarIndex = (this.hotbarIndex + (event.deltaY > 0 ? 1 : -1) + this.hotbar.length) % this.hotbar.length;
            this.selectedBlock = this.hotbar[this.hotbarIndex];
            console.log(`Selected block: ${this.selectedBlock}`);
        });

        // Left-click to break a block, right-click to place
        document.addEventListener("mousedown", (event) => {
            if (event.button === 0) this.breakBlock(); // Left-click
            if (event.button === 2) this.placeBlock(); // Right-click
        });
    }

    showMainMenu() {
        this.uiContainer.innerHTML = "";
        const background = this.createUIElement("mainMenuBackground", "div", {
            texture: this.textures.mainMenuBackground,
            styles: { width: "100%", height: "100%", position: "absolute", top: 0, left: 0 },
        });

        const singlePlayerButton = this.createUIElement("singlePlayerButton", "button", {
            text: "Single Player",
            texture: this.textures.buttonTexture,
            styles: { width: "200px", height: "50px", margin: "20px auto", lineHeight: "50px", display: "block", color: "white", textAlign: "center" },
            onClick: () => this.showSinglePlayerUI(),
        });

        const multiplayerButton = this.createUIElement("multiplayerButton", "button", {
            text: "Multiplayer",
            texture: this.textures.buttonTexture,
            styles: { width: "200px", height: "50px", margin: "20px auto", lineHeight: "50px", display: "block", color: "white", textAlign: "center" },
            onClick: () => this.showMultiplayerUI(),
        });

        this.uiContainer.appendChild(background);
        this.uiContainer.appendChild(singlePlayerButton);
        this.uiContainer.appendChild(multiplayerButton);
    }

    showSinglePlayerUI() {
        this.uiContainer.innerHTML = "";
        const background = this.createUIElement("singlePlayerBackground", "div", {
            texture: this.textures.singlePlayerBackground,
            styles: { width: "100%", height: "100%", position: "absolute", top: 0, left: 0 },
        });

        const createWorldButton = this.createUIElement("createWorldButton", "button", {
            text: "Create World",
            texture: this.textures.buttonTexture,
            styles: { width: "200px", height: "50px", margin: "20px auto", lineHeight: "50px", display: "block", color: "white", textAlign: "center" },
            onClick: () => this.createWorld(),
        });

        this.uiContainer.appendChild(background);
        this.uiContainer.appendChild(createWorldButton);
    }

    showMultiplayerUI() {
        this.uiContainer.innerHTML = "";
        const background = this.createUIElement("multiplayerBackground", "div", {
            texture: this.textures.multiplayerBackground,
            styles: { width: "100%", height: "100%", position: "absolute", top: 0, left: 0 },
        });

        const addServerButton = this.createUIElement("addServerButton", "button", {
            text: "Add Server",
            texture: this.textures.buttonTexture,
            styles: { width: "200px", height: "50px", margin: "20px auto", lineHeight: "50px", display: "block", color: "white", textAlign: "center" },
            onClick: () => this.addServer(),
        });

        const createServerButton = this.createUIElement("createServerButton", "button", {
            text: "Create Server",
            texture: this.textures.buttonTexture,
            styles: { width: "200px", height: "50px", margin: "20px auto", lineHeight: "50px", display: "block", color: "white", textAlign: "center" },
            onClick: () => this.createServer(),
        });

        this.uiContainer.appendChild(background);
        this.uiContainer.appendChild(addServerButton);
        this.uiContainer.appendChild(createServerButton);
    }

    createUIElement(id, type, { text, texture, styles, onClick }) {
        const element = document.createElement(type);
        if (text) element.textContent = text;
        if (texture) element.style.backgroundImage = `url('${texture}')`;
        if (styles) Object.assign(element.style, styles);
        if (onClick) element.onclick = onClick;
        element.id = id;
        return element;
    }

    createWorld() {
        const worldName = prompt("Enter world name:");
        if (worldName) {
            this.worlds.push({ name: worldName });
            alert(`World "${worldName}" created.`);
        }
    }

    addServer() {
        const serverName = prompt("Enter server name:");
        const serverAddress = prompt("Enter server address:");
        if (serverName && serverAddress) {
            this.servers.push({ name: serverName, address: serverAddress });
            alert(`Server "${serverName}" added.`);
        }
    }

    placeBlock() {
        console.log(`Placing block: ${this.selectedBlock}`);
    }

    breakBlock() {
        console.log("Breaking block...");
    }
}
