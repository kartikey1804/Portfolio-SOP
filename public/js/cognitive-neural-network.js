// Real-time 3D Neural Network for Portfolio
// Compatible with Three.js r128

// Skip execution if THREE is not defined (neural network feature disabled)
if (typeof THREE !== 'undefined') {
class NeuralNetworkScene {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.nodes = [];
        this.connections = [];
        this.mouse = new THREE.Vector2();
        this.cursor3D = new THREE.Vector3();
        this.raycaster = new THREE.Raycaster();
        this.isMobile = window.innerWidth < 768;
        this.isIdle = true;
        this.idleTimer = null;
        this.animationId = null;
        this.scrollY = 0;
        this.lastScrollY = 0;
        this.scrollVelocity = 0;
        this.lastScrollTime = Date.now();
        
        // Neural network parameters (simplified for compatibility)
        this.nodeCount = this.isMobile ? 30 : 60;
        this.connectionProbability = 0.1;
        this.nodeSize = this.isMobile ? 0.6 : 0.9;
        this.animationSpeed = 1.0;
        
        // Cursor interaction parameters
        this.cursorInfluenceRadius = 20;
        this.cursorAttractionStrength = 0.03;
        this.glowIntensityFactor = 2.0;
        
        // Initialize the scene
        this.init();
        this.animate();
        this.setupEventListeners();
    }
    
    init() {
        // Create canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '-1';
        this.canvas.style.pointerEvents = 'none';
        document.body.appendChild(this.canvas);
        
        // Scene setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 50;
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: this.isMobile ? false : true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0x6699cc, 0.8);
        directionalLight.position.set(20, 30, 40);
        this.scene.add(directionalLight);
        
        // Create neural network with simple meshes (no instanced geometry)
        this.createNeuralNetwork();
    }
    
    createNeuralNetwork() {
        // Create nodes as individual meshes (compatible with r128)
        const nodeGeometry = new THREE.SphereGeometry(this.nodeSize, 8, 8);
        
        for (let i = 0; i < this.nodeCount; i++) {
            // Create material for each node (individual materials for color variation)
            const nodeMaterial = new THREE.MeshPhongMaterial({
                color: 0x50e3c2,
                transparent: true,
                opacity: 0.8,
                shininess: 100
            });
            
            // Create node mesh
            const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
            
            // Random initial position
            node.position.x = (Math.random() - 0.5) * 100;
            node.position.y = (Math.random() - 0.5) * 100;
            node.position.z = (Math.random() - 0.5) * 50;
            
            // Add velocity property
            node.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.1
            );
            
            // Neural signal properties
            node.signalActive = false;
            node.signalStrength = 0;
            node.signalTimer = 0;
            node.energyLevel = 0.5;
            node.baseOpacity = 0.8;
            node.baseColor = new THREE.Color(0x50e3c2);
            node.glowIntensity = 0;
            
            // Random color variation using HSL
            const hue = 0.55 + (Math.random() - 0.5) * 0.2;
            node.material.color.setHSL(hue, 0.7, 0.6);
            node.baseColor.setHSL(hue, 0.7, 0.6);
            
            // Add to scene and nodes array
            this.nodes.push(node);
            this.scene.add(node);
        }
        
        // Create connections
        const connectionMaterial = new THREE.LineBasicMaterial({
            color: 0x6699cc,
            transparent: true,
            opacity: 0.3
        });
        
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                if (Math.random() < this.connectionProbability) {
                    const node1 = this.nodes[i];
                    const node2 = this.nodes[j];
                    
                    // Create line geometry with initial points
                    const points = [node1.position.clone(), node2.position.clone()];
                    const geometry = new THREE.BufferGeometry().setFromPoints(points);
                    const line = new THREE.Line(geometry, connectionMaterial.clone());
                    
                    // Store connection with references to nodes and signal properties
                    const connection = {
                        line: line,
                        node1: node1,
                        node2: node2,
                        pulse: Math.random(),
                        pulseSpeed: 0.01 + Math.random() * 0.02,
                        signalStrength: 0,
                        pathStrength: 0.5,
                        direction: Math.random() > 0.5 ? 'forward' : 'backward'
                    };
                    
                    this.connections.push(connection);
                    this.scene.add(line);
                }
            }
        }
    }
    
    setupEventListeners() {
        // Mouse movement
        document.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });
        
        // Scroll
        window.addEventListener('scroll', (e) => {
            this.handleScroll(e);
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Tab visibility
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
        
        // UI element hover and click events
        document.addEventListener('DOMContentLoaded', () => {
            // Add hover and click listeners to all interactive elements
            const interactiveElements = document.querySelectorAll('button, a, .nav-link, .project-card, .skill-item');
            
            interactiveElements.forEach(element => {
                // Hover events
                element.addEventListener('mouseenter', () => {
                    this.preActivateNeurons();
                });
                
                element.addEventListener('mouseleave', () => {
                    this.deactivateNeurons();
                });
                
                // Click events
                element.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.triggerSignalBurst();
                });
            });
        });
    }
    
    preActivateNeurons() {
        // Pre-activate nearby neural clusters with gradual intensification
        const centerNode = this.nodes[Math.floor(Math.random() * this.nodes.length)];
        
        this.nodes.forEach(node => {
            const distance = node.position.distanceTo(centerNode.position);
            if (distance < 25) {
                // Gradually increase energy level for pre-activation
                node.energyLevel = Math.min(1.0, node.energyLevel + 0.1);
            }
        });
    }
    
    deactivateNeurons() {
        // Gradually decrease energy level after hover ends
        this.nodes.forEach(node => {
            node.energyLevel = Math.max(0.5, node.energyLevel - 0.05);
        });
    }
    
    triggerSignalBurst() {
        // Clicking buttons triggers radial neural firing
        const centerNode = this.nodes[Math.floor(Math.random() * this.nodes.length)];
        
        // Trigger radial firing
        this.nodes.forEach(node => {
            const distance = node.position.distanceTo(centerNode.position);
            if (distance < 30) {
                // Stronger activation for closer nodes
                const activationStrength = 1 - (distance / 30);
                node.signalActive = true;
                node.signalTimer = 1.0 * activationStrength;
                node.glowIntensity = Math.max(node.glowIntensity, activationStrength);
            }
        });
        
        // Strengthen connections between activated nodes temporarily
        this.connections.forEach(conn => {
            if (conn.node1.signalActive && conn.node2.signalActive) {
                conn.pathStrength = Math.min(1.0, conn.pathStrength + 0.2);
            }
        });
    }
    
    handleMouseMove(e) {
        // Update mouse position in normalized device coordinates
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        
        // Project cursor into 3D space
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const intersectionPoint = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(planeZ, intersectionPoint);
        this.cursor3D.copy(intersectionPoint);
        
        // Reset idle state
        this.resetIdleState();
    }
    
    handleScroll() {
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastScrollTime;
        const deltaY = window.scrollY - this.scrollY;
        
        this.scrollY = window.scrollY;
        
        // Calculate scroll velocity
        this.scrollVelocity = Math.abs(deltaY / deltaTime) * 1000;
        this.scrollVelocity = Math.min(this.scrollVelocity, 100); // Cap at 100 for performance
        
        // Update camera depth based on scroll
        const cameraZ = 50 + this.scrollY * 0.05;
        this.camera.position.z = cameraZ;
        
        // Increase animation speed with scroll velocity
        this.animationSpeed = Math.min(3.0, 1.0 + (this.scrollVelocity * 0.01));
        
        // Reset idle state
        this.resetIdleState();
        
        this.lastScrollTime = currentTime;
        this.lastScrollY = this.scrollY;
    }
    
    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    handleVisibilityChange() {
        if (document.hidden) {
            // Pause animation when tab is inactive
            this.pauseAnimation();
        } else {
            // Resume animation when tab is active
            this.resumeAnimation();
        }
    }
    
    resetIdleState() {
        this.isIdle = false;
        
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
        }
        
        // Set idle timer
        this.idleTimer = setTimeout(() => {
            this.isIdle = true;
        }, 3000);
    }
    
    pauseAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    resumeAnimation() {
        if (!this.animationId) {
            this.animate();
        }
    }
    
    updateNodes() {
        const deltaTime = 0.16; // Assume ~60fps
        const scaledDelta = deltaTime * this.animationSpeed;
        
        this.nodes.forEach((node, index) => {
            // Cursor attraction and interaction
            if (!this.isIdle) {
                const distanceToCursor = node.position.distanceTo(this.cursor3D);
                
                if (distanceToCursor < this.cursorInfluenceRadius) {
                    // Calculate attraction strength based on distance
                    const attractionStrength = this.cursorAttractionStrength * (1 - distanceToCursor / this.cursorInfluenceRadius);
                    
                    // Apply attraction to cursor
                    const direction = this.cursor3D.clone().sub(node.position).normalize();
                    const attraction = direction.multiplyScalar(attractionStrength);
                    node.velocity.add(attraction);
                    
                    // Increase glow intensity based on proximity
                    node.glowIntensity = Math.max(node.glowIntensity, 1 - distanceToCursor / this.cursorInfluenceRadius);
                    
                    // Trigger signal activation when very close
                    if (distanceToCursor < this.cursorInfluenceRadius * 0.5) {
                        node.signalActive = true;
                        node.signalTimer = 1.0;
                    }
                }
            }
            
            // Node repulsion
            this.nodes.forEach((otherNode, otherIndex) => {
                if (index !== otherIndex) {
                    const distance = node.position.distanceTo(otherNode.position);
                    if (distance < 10 && distance > 0) {
                        const direction = node.position.clone().sub(otherNode.position).normalize();
                        const repulsion = direction.multiplyScalar(
                            0.05 / (distance * distance)
                        );
                        node.velocity.add(repulsion);
                    }
                }
            });
            
            // Node attraction to center (weak)
            const centerAttraction = node.position.clone().multiplyScalar(-0.005);
            node.velocity.add(centerAttraction);
            
            // Apply velocity
            node.position.add(node.velocity.clone().multiplyScalar(scaledDelta));
            
            // Add some random motion for organic feel
            node.velocity.x += (Math.random() - 0.5) * 0.02 * scaledDelta;
            node.velocity.y += (Math.random() - 0.5) * 0.02 * scaledDelta;
            node.velocity.z += (Math.random() - 0.5) * 0.01 * scaledDelta;
            
            // Limit velocity
            const maxVelocity = 0.5;
            node.velocity.clampScalar(-maxVelocity, maxVelocity);
            
            // Wrap around edges
            this.wrapNodePosition(node);
            
            // Update signal timer and active state
            if (node.signalTimer > 0) {
                node.signalTimer -= 0.01 * scaledDelta;
            } else {
                node.signalActive = false;
            }
            
            // Update glow intensity decay
            node.glowIntensity = Math.max(0, node.glowIntensity - 0.02 * scaledDelta);
            
            // Idle energy decay
            if (this.isIdle) {
                // Gradually decrease energy level when idle
                node.energyLevel = Math.max(0.3, node.energyLevel - 0.01 * scaledDelta);
                
                // Weaken all connections over time when idle
                this.connections.forEach(conn => {
                    conn.pathStrength = Math.max(0.3, conn.pathStrength - 0.005 * scaledDelta);
                });
            }
            
            // Update node appearance based on glow, signal, and energy level
            const glowFactor = node.glowIntensity * this.glowIntensityFactor;
            const signalFactor = node.signalActive ? 0.5 : 0;
            const energyFactor = (node.energyLevel - 0.5) * 2; // Map 0.5-1.0 to 0-1.0
            const totalFactor = Math.min(1.5, glowFactor + signalFactor + energyFactor);
            
            node.material.opacity = node.baseOpacity * (1 + totalFactor * 0.3);
            node.material.emissive.setHSL(node.baseColor.getHSL().h, 0.7, totalFactor * 0.3);
            node.material.shininess = 100 + totalFactor * 50;
            
            // Scale based on activity and idle state
            let scale = 1;
            if (this.isIdle) {
                const breathing = Math.sin(Date.now() * 0.001) * 0.1 + 1;
                scale = breathing;
            } else {
                scale = 1 + totalFactor * 0.2;
            }
            node.scale.setScalar(scale);
        });
    }
    
    propagateSignals() {
        const deltaTime = 0.16;
        const scaledDelta = deltaTime * this.animationSpeed;
        
        this.connections.forEach(conn => {
            // Propagate signals based on direction
            if (conn.node1.signalActive && conn.signalStrength < 1.0) {
                conn.signalStrength = Math.min(1.0, conn.signalStrength + 0.1 * scaledDelta * conn.pathStrength);
                
                // Trigger signal on the other node with probability based on path strength
                if (Math.random() < 0.3 * conn.pathStrength * scaledDelta) {
                    conn.node2.signalActive = true;
                    conn.node2.signalTimer = Math.max(conn.node2.signalTimer, 0.5);
                    
                    // Strengthen path when signal is propagated
                    conn.pathStrength = Math.min(1.0, conn.pathStrength + 0.01);
                }
            }
            
            // Propagate in the other direction if needed
            if (conn.node2.signalActive && conn.signalStrength < 1.0) {
                conn.signalStrength = Math.min(1.0, conn.signalStrength + 0.1 * scaledDelta * conn.pathStrength);
                
                if (Math.random() < 0.3 * conn.pathStrength * scaledDelta) {
                    conn.node1.signalActive = true;
                    conn.node1.signalTimer = Math.max(conn.node1.signalTimer, 0.5);
                    
                    // Strengthen path when signal is propagated
                    conn.pathStrength = Math.min(1.0, conn.pathStrength + 0.01);
                }
            }
            
            // Signal decay
            conn.signalStrength = Math.max(0, conn.signalStrength - 0.02 * scaledDelta);
        });
    }
    
    updateConnections() {
        this.connections.forEach(conn => {
            // Update connection geometry with current node positions
            const points = [conn.node1.position, conn.node2.position];
            conn.line.geometry.setFromPoints(points);
            
            // Pulse animation combined with signal strength
            conn.pulse += conn.pulseSpeed * this.animationSpeed;
            if (conn.pulse > 1) {
                conn.pulse = 0;
            }
            
            // Calculate combined intensity from pulse and signal strength
            const pulseIntensity = Math.sin(conn.pulse * Math.PI * 2) * 0.2;
            const signalIntensity = conn.signalStrength * 0.5;
            const totalIntensity = 0.1 + pulseIntensity + signalIntensity;
            
            // Update opacity based on combined intensity
            conn.line.material.opacity = totalIntensity;
            
            // Update color based on signal strength
            const hue = 0.55 + (conn.signalStrength * 0.2);
            conn.line.material.color.setHSL(hue, 0.7, 0.6);
            
            // Update width based on path strength and signal strength
            conn.line.material.linewidth = 1 + (conn.pathStrength * 2) + (conn.signalStrength * 3);
        });
    }
    
    wrapNodePosition(node) {
        const boundary = 60;
        if (node.position.x > boundary) node.position.x = -boundary;
        if (node.position.x < -boundary) node.position.x = boundary;
        if (node.position.y > boundary) node.position.y = -boundary;
        if (node.position.y < -boundary) node.position.y = boundary;
        if (node.position.z > boundary / 2) node.position.z = -boundary / 2;
        if (node.position.z < -boundary / 2) node.position.z = boundary / 2;
    }
    
    animate() {
        // Update nodes and connections
        this.updateNodes();
        this.propagateSignals();
        this.updateConnections();
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
        
        // Request next animation frame
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    destroy() {
        // Clean up resources
        this.pauseAnimation();
        
        // Remove canvas from DOM
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        
        // Dispose renderer
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

// Initialize the neural network when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a moment for the page to render and Three.js to load
    setTimeout(() => {
        try {
            window.neuralNetwork = new NeuralNetworkScene();
        } catch (error) {
            console.error('Error initializing neural network:', error);
        }
    }, 100);
});

// Clean up when page is unloaded
window.addEventListener('beforeunload', () => {
    if (window.neuralNetwork) {
        window.neuralNetwork.destroy();
    }
});
}

