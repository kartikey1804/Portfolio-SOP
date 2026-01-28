// Neural Network 3D Visualization

// Skip execution if THREE is not defined (neural network feature disabled)
if (typeof THREE !== 'undefined') {
class NeuralNetwork3D {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.nodes = [];
        this.connections = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isMobile = window.innerWidth < 768;
        this.performanceLevel = this.getPerformanceLevel();
        this.animationFrameId = null;
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.isPaused = false;
        
        this.init();
        this.animate();
    }
    
    getPerformanceLevel() {
        // Enhanced performance detection
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) return 0; // Low performance
        
        // Check for WebGL2 support
        const isWebGL2 = !!canvas.getContext('webgl2');
        
        // Check device memory if available
        const deviceMemory = navigator.deviceMemory || 0;
        
        // Check for high-end GPUs
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            const highEndGPUs = ['NVIDIA', 'AMD Radeon', 'Intel Iris', 'Apple M1', 'Apple M2', 'Apple M3', 'RTX', 'RX 6'];
            
            for (const gpu of highEndGPUs) {
                if (renderer.includes(gpu)) {
                    return isWebGL2 && deviceMemory >= 4 ? 2 : 1;
                }
            }
        }
        
        return isWebGL2 ? 1 : 0;
    }
    
    init() {
        // Set up renderer with performance optimizations
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.shadowMap.enabled = this.performanceLevel > 0;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
        this.renderer.autoClear = false;
        
        // Enable logarithmic depth buffer for better depth precision
        this.renderer.logarithmicDepthBuffer = true;
        
        this.container.appendChild(this.renderer.domElement);
        
        // Set up camera
        this.camera.position.z = 50;
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Add directional light for shadows (only on medium/high performance)
        if (this.performanceLevel > 0) {
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(10, 10, 10);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = this.performanceLevel === 2 ? 2048 : 1024;
            directionalLight.shadow.mapSize.height = this.performanceLevel === 2 ? 2048 : 1024;
            this.scene.add(directionalLight);
        }
        
        // Add point light for pulsing effect
        this.pointLight = new THREE.PointLight(0x00bcd4, 1, 100);
        this.pointLight.position.set(0, 0, 0);
        this.scene.add(this.pointLight);
        
        // Create neural network nodes based on performance
        this.createNodes();
        this.createConnections();
        
        // Add event listeners
        this.addEventListeners();
        
        // Start pulsing animation
        this.startPulsing();
        
        // Add FPS monitoring for adaptive performance
        this.startFPSMonitoring();
    }
    
    createNodes() {
        const nodeCount = this.isMobile ? 15 : this.performanceLevel === 2 ? 60 : 30;
        // Use lower polygon count for mobile/low performance
        const nodeGeometry = new THREE.SphereGeometry(0.5, this.performanceLevel === 2 ? 16 : 8, this.performanceLevel === 2 ? 16 : 8);
        
        for (let i = 0; i < nodeCount; i++) {
            const nodeMaterial = new THREE.MeshPhongMaterial({
                color: 0x00bcd4,
                transparent: true,
                opacity: 0.8,
                shininess: 100
            });
            
            const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
            
            // Random position within a sphere
            const radius = this.isMobile ? 15 : 30;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            node.position.x = Math.sin(phi) * Math.cos(theta) * radius;
            node.position.y = Math.sin(phi) * Math.sin(theta) * radius;
            node.position.z = Math.cos(phi) * radius;
            
            // Store original position for animation
            node.originalPosition = node.position.clone();
            node.vx = (Math.random() - 0.5) * 0.02;
            node.vy = (Math.random() - 0.5) * 0.02;
            node.vz = (Math.random() - 0.5) * 0.02;
            
            // Add glow effect using GSAP (only on high performance)
            if (this.performanceLevel === 2) {
                this.addNodeGlow(node);
            }
            
            this.scene.add(node);
            this.nodes.push(node);
        }
    }
    
    addNodeGlow(node) {
        // Create a separate glow mesh for each node
        const glowGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00bcd4,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        node.add(glow);
        
        // Animate the glow
        gsap.to(glow.scale, {
            x: 1.5,
            y: 1.5,
            z: 1.5,
            duration: 2,
            yoyo: true,
            repeat: -1,
            ease: "power2.inOut"
        });
        
        gsap.to(glow.material, {
            opacity: 0.1,
            duration: 2,
            yoyo: true,
            repeat: -1,
            ease: "power2.inOut"
        });
    }
    
    createConnections() {
        const connectionMaterial = new THREE.LineBasicMaterial({
            color: 0x00bcd4,
            transparent: true,
            opacity: 0.3
        });
        
        // Create connections between nodes
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const distance = this.nodes[i].position.distanceTo(this.nodes[j].position);
                
                // Only connect nodes that are close enough
                if (distance < 15) {
                    const points = [this.nodes[i].position, this.nodes[j].position];
                    const geometry = new THREE.BufferGeometry().setFromPoints(points);
                    const connection = new THREE.Line(geometry, connectionMaterial);
                    
                    this.scene.add(connection);
                    this.connections.push({
                        line: connection,
                        node1: this.nodes[i],
                        node2: this.nodes[j],
                        distance: distance,
                        originalDistance: distance
                    });
                    
                    // Add data flow animation to connections
                    this.addDataFlowAnimation(connection);
                }
            }
        }
    }
    
    addDataFlowAnimation(connection) {
        // This is a simplified data flow animation using opacity changes
        gsap.to(connection.material, {
            opacity: 0.6,
            duration: Math.random() * 2 + 1,
            yoyo: true,
            repeat: -1,
            ease: "power2.inOut",
            delay: Math.random() * 2
        });
    }
    
    addEventListeners() {
        // Mouse move event
        this.container.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / this.container.clientWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / this.container.clientHeight) * 2 + 1;
        });
        
        // Touch event for mobile
        this.container.addEventListener('touchmove', (event) => {
            event.preventDefault();
            const touch = event.touches[0];
            this.mouse.x = (touch.clientX / this.container.clientWidth) * 2 - 1;
            this.mouse.y = -(touch.clientY / this.container.clientHeight) * 2 + 1;
        });
        
        // Window resize with debounce
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
            }, 250);
        });
        
        // Scroll event for camera movement
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            this.camera.position.y = scrollY * 0.01;
        });
        
        // Pause when tab is inactive
        document.addEventListener('visibilitychange', () => {
            this.isPaused = document.hidden;
        });
    }
    
    startPulsing() {
        gsap.to(this.pointLight, {
            intensity: 2,
            duration: 2,
            yoyo: true,
            repeat: -1,
            ease: "power2.inOut"
        });
    }
    
    startFPSMonitoring() {
        setInterval(() => {
            this.fps = this.frameCount;
            this.frameCount = 0;
            
            // Adjust performance based on FPS
            if (this.fps < 30 && this.performanceLevel > 0) {
                this.performanceLevel--;
                this.optimizeForPerformance();
            }
        }, 1000);
    }
    
    optimizeForPerformance() {
        // Reduce node count if FPS is low
        if (this.nodes.length > 15) {
            for (let i = this.nodes.length - 1; i >= 15; i--) {
                this.scene.remove(this.nodes[i]);
                this.nodes.splice(i, 1);
            }
            
            // Recreate connections with fewer nodes
            this.connections.forEach(conn => {
                this.scene.remove(conn.line);
            });
            this.connections = [];
            this.createConnections();
        }
        
        // Disable shadows if FPS is very low
        if (this.fps < 20) {
            this.renderer.shadowMap.enabled = false;
        }
    }
    
    animate() {
        if (this.isPaused) {
            this.animationFrameId = requestAnimationFrame(() => this.animate());
            return;
        }
        
        this.frameCount++;
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Update nodes with Perlin noise-like motion
        this.nodes.forEach(node => {
            // Subtle floating animation
            node.position.x += node.vx * deltaTime * 60;
            node.position.y += node.vy * deltaTime * 60;
            node.position.z += node.vz * deltaTime * 60;
            
            // Apply gravity towards original position
            const dx = node.originalPosition.x - node.position.x;
            const dy = node.originalPosition.y - node.position.y;
            const dz = node.originalPosition.z - node.position.z;
            
            node.vx += dx * 0.001 * deltaTime * 60;
            node.vy += dy * 0.001 * deltaTime * 60;
            node.vz += dz * 0.001 * deltaTime * 60;
            
            // Damping
            node.vx *= 0.98;
            node.vy *= 0.98;
            node.vz *= 0.98;
            
            // Check distance to mouse for interaction
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObject(node);
            
            if (intersects.length > 0) {
                gsap.to(node.scale, {
                    x: 1.5,
                    y: 1.5,
                    z: 1.5,
                    duration: 0.3
                });
                node.material.opacity = 1;
                
                // Pulse effect on hover
                gsap.to(node.material, {
                    color: 0x80deea,
                    duration: 0.3,
                    yoyo: true,
                    repeat: 1
                });
            } else {
                gsap.to(node.scale, {
                    x: 1,
                    y: 1,
                    z: 1,
                    duration: 0.3
                });
                node.material.opacity = 0.8;
            }
        });
        
        // Update connections
        this.connections.forEach(connection => {
            const points = [connection.node1.position, connection.node2.position];
            connection.line.geometry.setFromPoints(points);
            connection.line.geometry.attributes.position.needsUpdate = true;
            
            // Adjust opacity based on distance
            const distance = connection.node1.position.distanceTo(connection.node2.position);
            connection.line.material.opacity = Math.max(0.1, 0.5 - (distance / 30));
        });
        
        // Camera rotation - slower on mobile
        this.camera.rotation.y += (this.isMobile ? 0.0005 : 0.001) * deltaTime * 60;
        
        // Point light follows mouse with easing
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersectPoint = new THREE.Vector3();
        this.raycaster.ray.at(20, intersectPoint);
        
        // Smoothly interpolate point light position
        const lerpFactor = 0.05 * deltaTime * 60;
        this.pointLight.position.lerp(intersectPoint, lerpFactor);
        
        this.renderer.render(this.scene, this.camera);
        
        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }
    
    // Cleanup method to prevent memory leaks
    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        // Remove all nodes and connections
        this.nodes.forEach(node => {
            this.scene.remove(node);
        });
        
        this.connections.forEach(connection => {
            this.scene.remove(connection.line);
        });
        
        // Remove renderer
        this.container.removeChild(this.renderer.domElement);
        this.renderer.dispose();
    }
}

// Initialize neural network when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const heroSection = document.getElementById('home');
    if (heroSection) {
        // Create a container for the neural network
        const nnContainer = document.createElement('div');
        nnContainer.style.position = 'absolute';
        nnContainer.style.top = '0';
        nnContainer.style.left = '0';
        nnContainer.style.width = '100%';
        nnContainer.style.height = '100%';
        nnContainer.style.zIndex = '-1';
        heroSection.style.position = 'relative';
        heroSection.appendChild(nnContainer);
        
        // Initialize the neural network
        const neuralNetwork = new NeuralNetwork3D(nnContainer);
    }
});
}

