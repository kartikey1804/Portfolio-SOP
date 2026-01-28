// 3D Component Interactions with Predictive Behaviors
class ThreeDComponents {
    constructor() {
        this.sections = document.querySelectorAll('section:not(#home)');
        this.isMobile = window.innerWidth < 768;
        this.mousePos = { x: 0, y: 0 };
        this.previousMousePos = { x: 0, y: 0 };
        this.mouseSpeed = 0;
        this.hoverElements = [];
        this.userAttentionMap = new Map();
        
        this.init();
    }
    
    init() {
        // Initialize user attention map
        this.initUserAttentionMap();
        
        // Apply 3D effects to sections
        this.apply3DEffects();
        
        // Add magnetic cursor effect with proximity pre-activation
        this.addMagneticEffect();
        
        // Add 3D scroll animations with predictive behavior
        this.addScrollAnimations();
        
        // Add skills section interactions with predictive clustering
        this.addSkillsInteractions();
        
        // Add projects section interactions with wake-up effect
        this.addProjectsInteractions();
        
        // Add cursor tracking for predictive behaviors
        this.addCursorTracking();
        
        // Add navigation effects with neural feedback
        this.addNavigationEffects();
    }
    
    initUserAttentionMap() {
        // Initialize with empty attention data for all sections
        this.sections.forEach(section => {
            this.userAttentionMap.set(section.id, {
                visitCount: 0,
                totalTime: 0,
                lastVisit: 0,
                interactionLevel: 0
            });
        });
    }
    
    addCursorTracking() {
        // Track mouse position and speed
        document.addEventListener('mousemove', (e) => {
            this.previousMousePos = { ...this.mousePos };
            this.mousePos = { x: e.clientX, y: e.clientY };
            
            // Calculate mouse speed
            const dx = this.mousePos.x - this.previousMousePos.x;
            const dy = this.mousePos.y - this.previousMousePos.y;
            this.mouseSpeed = Math.sqrt(dx * dx + dy * dy);
            
            // Update proximity pre-activation
            this.updateProximityPreActivation();
        });
    }
    
    updateProximityPreActivation() {
        // Check all hover elements for proximity to cursor
        this.hoverElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            // Calculate distance from cursor to element center
            const dx = this.mousePos.x - centerX;
            const dy = this.mousePos.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Pre-activate elements within proximity threshold
            const proximityThreshold = this.isMobile ? 100 : 150;
            if (distance < proximityThreshold) {
                // Calculate activation strength based on distance
                const activationStrength = 1 - (distance / proximityThreshold);
                this.preActivateElement(element, activationStrength);
            } else {
                // Deactivate if outside threshold
                this.deactivateElement(element);
            }
        });
    }
    
    preActivateElement(element, strength) {
        // Add subtle pre-activation effect based on cursor proximity
        if (!element.classList.contains('pre-activated')) {
            element.classList.add('pre-activated');
        }
        
        // Apply progressive scale based on proximity strength
        const scale = 1 + (strength * 0.05);
        gsap.to(element, {
            scale: scale,
            opacity: 0.95 + (strength * 0.05),
            duration: 0.3,
            ease: "power2.out"
        });
        
        // Add neural network feedback if available
        if (window.cognitiveNN) {
            this.triggerNeuralFeedback(element, strength);
        }
    }
    
    deactivateElement(element) {
        // Remove pre-activation effect
        if (element.classList.contains('pre-activated')) {
            element.classList.remove('pre-activated');
        }
        
        gsap.to(element, {
            scale: 1,
            opacity: 1,
            duration: 0.3,
            ease: "power2.out"
        });
    }
    
    triggerNeuralFeedback(element, strength) {
        // Connect to the cognitive neural network to create visual feedback lines
        if (window.cognitiveNN) {
            window.cognitiveNN.triggerUIFeedback(element, strength);
        }
    }
    
    apply3DEffects() {
        // Set perspective on main container
        const main = document.querySelector('main');
        main.style.perspective = '1000px';
        
        // Add 3D transform style to sections
        this.sections.forEach((section, index) => {
            section.style.transformStyle = 'preserve-3d';
            section.style.perspective = '500px';
            
            // Add subtle initial rotation based on index
            const initialRotationX = (index % 2) * 2 - 1;
            const initialRotationY = ((index + 1) % 2) * 2 - 1;
            section.style.transform = `rotateX(${initialRotationX}deg) rotateY(${initialRotationY}deg) translateY(30px)`;
            
            // Add delay to animations for staggered effect
            section.style.setProperty('--animation-delay', `${index * 0.1}s`);
        });
    }
    
    addMagneticEffect() {
        if (this.isMobile) return;
        
        let mouseX = 0;
        let mouseY = 0;
        let currentX = 0;
        let currentY = 0;
        
        // Track mouse position
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        
        // Update sections based on mouse position
        const updateMagneticEffect = () => {
            currentX += (mouseX - currentX) * 0.1;
            currentY += (mouseY - currentY) * 0.1;
            
            this.sections.forEach(section => {
                const rect = section.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                // Calculate distance from mouse to section center
                const dx = currentX - centerX;
                const dy = currentY - centerY;
                
                // Calculate rotation based on distance
                const rotationY = (dx / rect.width) * 10;
                const rotationX = -(dy / rect.height) * 10;
                
                // Apply rotation with easing

                const isVisible = section.classList.contains('visible');
                
                if (isVisible) {
                    gsap.to(section, {
                        rotationY: rotationY * 0.5,
                        rotationX: rotationX * 0.5,
                        duration: 0.5,
                        ease: "power2.out"
                    });
                }
            });
            
            requestAnimationFrame(updateMagneticEffect);
        };
        
        updateMagneticEffect();
    }
    
    addScrollAnimations() {
        // Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.2,
            rootMargin: '0px 0px -100px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // Add entrance animation
                    gsap.fromTo(entry.target, 
                        { 
                            opacity: 0, 
                            y: 50, 
                            rotationX: 10, 
                            rotationY: 10 
                        },
                        { 
                            opacity: 1, 
                            y: 0, 
                            rotationX: 0, 
                            rotationY: 0,
                            duration: 0.8,
                            ease: "power3.out",
                            delay: 0.1
                        }
                    );
                }
            });
        }, observerOptions);
        
        // Observe all sections
        this.sections.forEach(section => {
            observer.observe(section);
        });
    }
    
    addSkillsInteractions() {
        const skillsList = document.getElementById('skills-list');
        if (!skillsList) return;
        
        // Convert skills list to flex container for clustering
        skillsList.style.display = 'flex';
        skillsList.style.flexWrap = 'wrap';
        skillsList.style.justifyContent = 'center';
        skillsList.style.position = 'relative';
        
        const skillItems = Array.from(skillsList.querySelectorAll('.skill-item'));
        
        // Initialize skill clusters
        this.skillClusters = this.initializeSkillClusters(skillItems);
        
        // Create visual connections between related skills
        this.createSkillConnections(skillsList, skillItems);
        
        // Apply initial clustering
        this.applySkillClustering(skillItems);
        
        skillItems.forEach(item => {
            // Add to hover elements for proximity detection
            this.hoverElements.push(item);
            
            item.addEventListener('mouseenter', () => {
                // Enhanced activation with neural feedback
                gsap.to(item, {
                    scale: 1.05,
                    boxShadow: '0 15px 40px rgba(0, 188, 212, 0.4)',
                    duration: 0.3,
                    ease: "power2.out"
                });
                
                // Update interaction level in attention map
                this.updateInteractionLevel('skills', 0.2);
                
                // Highlight related skills
                this.highlightRelatedSkills(item, skillItems);
            });
            
            item.addEventListener('mouseleave', () => {
                gsap.to(item, {
                    scale: 1,
                    boxShadow: '',
                    duration: 0.3,
                    ease: "power2.out"
                });
                
                // Reset skill highlights
                this.resetSkillHighlights(skillItems);
            });
            
            // Add click interaction tracking
            item.addEventListener('click', () => {
                this.updateInteractionLevel('skills', 0.5);
                
                // Recluster skills based on this skill
                this.reclusterSkills(item, skillItems);
            });
        });
        
        // Update clusters periodically
        setInterval(() => {
            this.updateSkillClusters(skillItems);
        }, 5000);
    }
    
    initializeSkillClusters(skillItems) {
        // Create initial clusters based on skill categories (simplified)
        const clusters = {
            'programming': [],
            'design': [],
            'tools': [],
            'frameworks': []
        };
        
        skillItems.forEach(item => {
            // Simple category assignment based on text content
            const text = item.textContent.toLowerCase();
            if (text.includes('javascript') || text.includes('python') || text.includes('java') || text.includes('c++')) {
                clusters.programming.push(item);
            } else if (text.includes('design') || text.includes('ui') || text.includes('ux') || text.includes('graphic')) {
                clusters.design.push(item);
            } else if (text.includes('git') || text.includes('docker') || text.includes('figma') || text.includes('adobe')) {
                clusters.tools.push(item);
            } else {
                clusters.frameworks.push(item);
            }
        });
        
        return clusters;
    }
    
    createSkillConnections(container, skillItems) {
        // Create a canvas for drawing connections
        const canvas = document.createElement('canvas');
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '0';
        container.appendChild(canvas);
        
        this.skillCanvas = canvas;
        this.skillCtx = canvas.getContext('2d');
        
        // Store initial positions
        skillItems.forEach(item => {
            const rect = item.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            item._skillPos = {
                x: rect.left - containerRect.left + rect.width / 2,
                y: rect.top - containerRect.top + rect.height / 2
            };
        });
        
        // Draw initial connections
        this.drawSkillConnections(skillItems);
        
        // Update connections on resize
        window.addEventListener('resize', () => {
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
            this.drawSkillConnections(skillItems);
        });
    }
    
    drawSkillConnections() {
        if (!this.skillCtx) return;
        
        // Clear canvas
        this.skillCtx.clearRect(0, 0, this.skillCanvas.width, this.skillCanvas.height);
        
        // Draw connections between related skills
        this.skillCtx.strokeStyle = 'rgba(0, 188, 212, 0.3)';
        this.skillCtx.lineWidth = 1;
        
        // Simple connection logic: connect skills in the same cluster
        Object.values(this.skillClusters).forEach(cluster => {
            for (let i = 0; i < cluster.length; i++) {
                for (let j = i + 1; j < cluster.length; j++) {
                    const skill1 = cluster[i];
                    const skill2 = cluster[j];
                    
                    this.skillCtx.beginPath();
                    this.skillCtx.moveTo(skill1._skillPos.x, skill1._skillPos.y);
                    this.skillCtx.lineTo(skill2._skillPos.x, skill2._skillPos.y);
                    this.skillCtx.stroke();
                }
            }
        });
    }
    
    applySkillClustering() {
        // Apply initial positioning based on clusters
        let clusterX = 0;
        const clusterSpacing = 40;
        
        Object.values(this.skillClusters).forEach(cluster => {
            if (cluster.length === 0) return;
            
            // Calculate cluster center
            let clusterY = 0;
            const itemHeight = cluster[0].offsetHeight + 20;

            
            cluster.forEach((item, index) => {
                const row = Math.floor(index / 4);
                const col = index % 4;
                const x = clusterX + col * (item.offsetWidth + 20);
                const y = row * itemHeight;
                
                // Apply positioning
                gsap.to(item, {
                    x: x,
                    y: y,
                    duration: 1.0,
                    ease: "power2.out"
                });
                
                clusterY = Math.max(clusterY, y + itemHeight);
            });
            
            clusterX += clusterSpacing + (cluster.length > 4 ? 4 * (cluster[0].offsetWidth + 20) : cluster.length * (cluster[0].offsetWidth + 20));
        });
    }
    
    highlightRelatedSkills(activeSkill, allSkills) {
        // Find cluster of active skill
        let activeCluster = null;
        Object.values(this.skillClusters).forEach(cluster => {
            if (cluster.includes(activeSkill)) {
                activeCluster = cluster;
            }
        });
        
        if (!activeCluster) return;
        
        // Highlight related skills (same cluster)
        allSkills.forEach(skill => {
            if (activeCluster.includes(skill) && skill !== activeSkill) {
                gsap.to(skill, {
                    scale: 1.02,
                    opacity: 0.9,
                    duration: 0.3,
                    ease: "power2.out"
                });
            } else if (skill !== activeSkill) {
                gsap.to(skill, {
                    scale: 0.95,
                    opacity: 0.6,
                    duration: 0.3,
                    ease: "power2.out"
                });
            }
        });
    }
    
    resetSkillHighlights(allSkills) {
        allSkills.forEach(skill => {
            gsap.to(skill, {
                scale: 1,
                opacity: 1,
                duration: 0.3,
                ease: "power2.out"
            });
        });
    }
    
    reclusterSkills(activeSkill, allSkills) {
        // Reorganize clusters with the active skill at the center
        // This is a simplified implementation
        const newClusters = this.initializeSkillClusters(allSkills);
        
        // Move active skill to a prominent position
        gsap.to(activeSkill, {
            scale: 1.1,
            duration: 0.5,
            ease: "power2.out",
            yoyo: true,
            repeat: 1
        });
        
        // Redraw connections
        this.skillClusters = newClusters;
        this.drawSkillConnections(allSkills);
    }
    
    updateSkillClusters(skillItems) {
        // Update clusters based on user interaction data
        // This is a simplified implementation
        const interactionData = this.userAttentionMap.get('skills') || { interactionLevel: 0 };
        
        if (interactionData.interactionLevel > 0.5) {
            // If user is actively interacting, make clusters tighter
            Object.values(this.skillClusters).forEach(cluster => {
                cluster.forEach(item => {
                    gsap.to(item, {
                        margin: '5px',
                        duration: 1.0,
                        ease: "power2.out"
                    });
                });
            });
        } else {
            // If user is not interacting, spread out clusters
            Object.values(this.skillClusters).forEach(cluster => {
                cluster.forEach(item => {
                    gsap.to(item, {
                        margin: '15px',
                        duration: 1.0,
                        ease: "power2.out"
                    });
                });
            });
        }
        
        // Update connection opacity based on interaction
        if (this.skillCtx) {
            this.skillCtx.strokeStyle = `rgba(0, 188, 212, ${0.2 + interactionData.interactionLevel * 0.3})`;
            this.drawSkillConnections(skillItems);
        }
    }
    
    addProjectsInteractions() {
        const projectsList = document.getElementById('projects-list');
        if (!projectsList) return;
        
        // Wait for projects to be rendered
        const checkProjects = setInterval(() => {
            const projectItems = projectsList.querySelectorAll('li');
            
            if (projectItems.length > 0) {
                projectItems.forEach(item => {
                    item.style.transformStyle = 'preserve-3d';
                    
                    // Add to hover elements for proximity detection
                    this.hoverElements.push(item);
                    
                    // Project "wake-up" effect on mouseenter
                    item.addEventListener('mouseenter', () => {
                        // Enhanced wake-up animation
                        gsap.to(item, {
                            scale: 1.03,
                            translateY: -12,
                            rotateX: 2,
                            rotateY: 2,
                            duration: 0.5,
                            ease: "power2.out"
                        });
                        
                        // Animate project image with parallax effect
                        const image = item.querySelector('.project-image');
                        if (image) {
                            gsap.to(image, {
                                scale: 1.15,
                                duration: 0.6,
                                ease: "power2.out"
                            });
                        }
                        
                        // Update interaction level in attention map
                        this.updateInteractionLevel('projects', 0.3);
                    });
                    
                    item.addEventListener('mouseleave', () => {
                        gsap.to(item, {
                            scale: 1,
                            translateY: 0,
                            rotateX: 0,
                            rotateY: 0,
                            duration: 0.4,
                            ease: "power2.out"
                        });
                        
                        // Reset project image
                        const image = item.querySelector('.project-image');
                        if (image) {
                            gsap.to(image, {
                                scale: 1,
                                duration: 0.5,
                                ease: "power2.out"
                            });
                        }
                    });
                    
                    // Add click interaction tracking
                    item.addEventListener('click', () => {
                        this.updateInteractionLevel('projects', 0.7);
                    });
                });
                
                clearInterval(checkProjects);
            }
        }, 500);
    }
    
    updateInteractionLevel(sectionId, amount) {
        // Update interaction level in the attention map
        if (this.userAttentionMap.has(sectionId)) {
            const attention = this.userAttentionMap.get(sectionId);
            attention.interactionLevel = Math.min(1, attention.interactionLevel + amount);
            attention.lastVisit = Date.now();
            this.userAttentionMap.set(sectionId, attention);
            
            // Update section prominence based on interaction
            this.updateSectionProminence(sectionId, attention);
        }
    }
    
    updateSectionProminence(sectionId, attention) {
        // Update section Z-space and appearance based on attention
        const section = document.getElementById(sectionId);
        if (!section) return;
        
        // Calculate prominence score based on visit count, total time, and interaction level
        const prominence = (
            (attention.visitCount * 0.3) +
            (attention.totalTime * 0.001 * 0.4) +
            (attention.interactionLevel * 0.3)
        );
        
        // Apply Z-space transformation
        const zIndex = Math.min(50, prominence * 10);
        section.style.setProperty('--z-index', zIndex);
        gsap.to(section, {
            z: zIndex,
            duration: 1.0,
            ease: "power2.out"
        });
    }
    
    // Add 3D navigation effects
    addNavigationEffects() {
        const navLinks = document.querySelectorAll('header nav ul li a');
        
        navLinks.forEach(link => {
            link.addEventListener('mouseenter', () => {
                gsap.to(link, {
                    scale: 1.1,
                    color: '#00bcd4',
                    duration: 0.3,
                    ease: "power2.out"
                });
            });
            
            link.addEventListener('mouseleave', () => {
                gsap.to(link, {
                    scale: 1,
                    color: '#fff',
                    duration: 0.3,
                    ease: "power2.out"
                });
            });
        });
    }
}

// Initialize 3D components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a moment for the page to render before initializing 3D effects
    setTimeout(() => {

    }, 500);
});
