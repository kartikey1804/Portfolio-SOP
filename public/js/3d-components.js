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
        
        // Cache layout measurements to prevent layout thrashing
        this.sectionBounds = [];
        
        this.init();
    }
    
    init() {
        // Initialize user attention map
        this.initUserAttentionMap();
        
        // Apply initial layout cache and register update events
        this.cacheSectionBounds();
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth < 768;
            this.cacheSectionBounds();
        });
        
        // Dynamic recaching to capture updates from Firestore renders
        setInterval(() => this.cacheSectionBounds(), 2000);
        
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
    
    cacheSectionBounds() {
        this.sectionBounds = Array.from(this.sections).map(section => {
            return {
                element: section,
                id: section.id,
                offsetTop: section.offsetTop,
                offsetHeight: section.offsetHeight,
                offsetWidth: section.offsetWidth
            };
        });
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
        let lastProximityCheck = 0;
        
        // Track mouse position and speed with throttled proximity checks
        document.addEventListener('mousemove', (e) => {
            this.previousMousePos = { ...this.mousePos };
            this.mousePos = { x: e.clientX, y: e.clientY };
            
            // Calculate mouse speed
            const dx = this.mousePos.x - this.previousMousePos.x;
            const dy = this.mousePos.y - this.previousMousePos.y;
            this.mouseSpeed = Math.sqrt(dx * dx + dy * dy);
            
            const now = Date.now();
            if (now - lastProximityCheck > 50) { // Limit execution to 20fps
                lastProximityCheck = now;
                this.updateProximityPreActivation();
            }
        });
    }
    
    updateProximityPreActivation() {
        // Check all hover elements for proximity to cursor
        this.hoverElements.forEach(element => {
            // Optimization: skip elements whose parent section is not visible
            const parentSection = element.closest('section');
            if (parentSection && !parentSection.classList.contains('visible')) {
                this.deactivateElement(element);
                return;
            }
            
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
        
        // Update sections based on mouse position using cached layout measurements
        const updateMagneticEffect = () => {
            currentX += (mouseX - currentX) * 0.1;
            currentY += (mouseY - currentY) * 0.1;
            
            const scrollY = window.scrollY;
            
            this.sectionBounds.forEach(bounds => {
                const section = bounds.element;
                
                // Calculate position relative to viewport using cached offsetTop
                const sectionTop = bounds.offsetTop - scrollY;
                const centerX = window.innerWidth / 2; // sections are centered full-width
                const centerY = sectionTop + bounds.offsetHeight / 2;
                
                // Calculate distance from mouse to section center
                const dx = currentX - centerX;
                const dy = currentY - centerY;
                
                // Calculate rotation based on distance
                const rotationY = (dx / window.innerWidth) * 8;
                const rotationX = -(dy / window.innerHeight) * 8;
                
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
        
        // Wait for skills list to render
        const checkSkills = setInterval(() => {
            const skillItems = Array.from(skillsList.querySelectorAll('.skill-item'));
            if (skillItems.length > 0) {
                clearInterval(checkSkills);
                
                // Initialize skill clusters dynamically based on their category section
                this.skillClusters = this.initializeSkillClusters(skillItems);
                
                // Create visual connections between related skills
                this.createSkillConnections(skillsList, skillItems);
                
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
                        this.reclusterSkills(item, skillItems);
                    });
                });
                
                // Update clusters periodically
                setInterval(() => {
                    this.updateSkillClusters();
                }, 5000);
            }
        }, 500);
    }
    
    initializeSkillClusters(skillItems) {
        // Group skills by their closest .skill-type-section container (category card)
        const clusters = {};
        
        skillItems.forEach(item => {
            const section = item.closest('.skill-type-section');
            const titleEl = section ? section.querySelector('.skill-type-title') : null;
            const category = titleEl ? titleEl.textContent.trim().toLowerCase() : 'other';
            
            if (!clusters[category]) {
                clusters[category] = [];
            }
            clusters[category].push(item);
        });
        
        return clusters;
    }
    
    createSkillConnections(container, skillItems) {
        // Create a canvas for drawing connections
        const canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '0';
        container.style.position = 'relative';
        container.appendChild(canvas);
        
        this.skillCanvas = canvas;
        this.skillCtx = canvas.getContext('2d');
        
        const resizeCanvas = () => {
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
            this.drawSkillConnections();
        };
        
        // Initial setup
        setTimeout(resizeCanvas, 300);
        
        // Update connections on resize
        window.addEventListener('resize', resizeCanvas);
    }
    
    drawSkillConnections() {
        if (!this.skillCtx || !this.skillCanvas) return;
        
        const container = this.skillCanvas.parentNode;
        const containerRect = container.getBoundingClientRect();
        
        // Clear canvas
        this.skillCtx.clearRect(0, 0, this.skillCanvas.width, this.skillCanvas.height);
        
        // Draw connections between related skills (same category)
        const interactionData = this.userAttentionMap.get('skills') || { interactionLevel: 0 };
        const opacity = 0.15 + (interactionData.interactionLevel * 0.35);
        this.skillCtx.strokeStyle = `rgba(0, 188, 212, ${opacity})`;
        this.skillCtx.lineWidth = 1 + (interactionData.interactionLevel * 1);
        
        Object.values(this.skillClusters).forEach(cluster => {
            for (let i = 0; i < cluster.length; i++) {
                for (let j = i + 1; j < cluster.length; j++) {
                    const skill1 = cluster[i];
                    const skill2 = cluster[j];
                    
                    const rect1 = skill1.getBoundingClientRect();
                    const rect2 = skill2.getBoundingClientRect();
                    
                    const x1 = rect1.left - containerRect.left + rect1.width / 2;
                    const y1 = rect1.top - containerRect.top + rect1.height / 2;
                    const x2 = rect2.left - containerRect.left + rect2.width / 2;
                    const y2 = rect2.top - containerRect.top + rect2.height / 2;
                    
                    this.skillCtx.beginPath();
                    this.skillCtx.moveTo(x1, y1);
                    this.skillCtx.lineTo(x2, y2);
                    this.skillCtx.stroke();
                }
            }
        });
    }
    
    applySkillClustering() {
        // No-op to preserve standard premium CSS grid layout
    }
    
    highlightRelatedSkills(activeSkill, allSkills) {
        let activeCluster = null;
        Object.values(this.skillClusters).forEach(cluster => {
            if (cluster.includes(activeSkill)) {
                activeCluster = cluster;
            }
        });
        
        if (!activeCluster) return;
        
        allSkills.forEach(skill => {
            if (activeCluster.includes(skill) && skill !== activeSkill) {
                gsap.to(skill, {
                    scale: 1.02,
                    opacity: 1,
                    duration: 0.3,
                    ease: "power2.out"
                });
            } else if (skill !== activeSkill) {
                gsap.to(skill, {
                    scale: 0.96,
                    opacity: 0.5,
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
        // Pulse animation on click
        gsap.to(activeSkill, {
            scale: 1.08,
            duration: 0.3,
            yoyo: true,
            repeat: 1,
            ease: "power2.out"
        });
    }
    
    updateSkillClusters() {
        this.drawSkillConnections();
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
        try {
            window.threeDComponents = new ThreeDComponents();
        } catch (e) {
            console.error("Error initializing 3D components:", e);
        }
    }, 500);
});
