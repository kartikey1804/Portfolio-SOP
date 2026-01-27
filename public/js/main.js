// public/js/main.js
import { db } from './firebase.js';
import { initializeStatusChecker } from './status.js';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDocs,
  addDoc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {

  // ---------- LOADING SCREEN ----------
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    // Hide loading screen after a short delay to ensure content is fully loaded
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
    }, 1500);
  }
  


  // ---------- STATUS MANAGEMENT ----------
  onSnapshot(doc(db, 'settings', 'profileStatus'), (docSnap) => {
    const statusWelcome = document.getElementById('status-welcome');
    const statusFooter = document.getElementById('status-footer');
    const statusContact = document.getElementById('status-contact');
    
    // Clear existing status content
    statusWelcome.innerHTML = '';
    statusFooter.innerHTML = '';
    statusContact.innerHTML = '';
    
    if (docSnap.exists() && docSnap.data().visible) {
      const statusData = docSnap.data();
      const statusBadge = document.createElement('div');
      statusBadge.className = `status-badge status-${statusData.type}`;
      statusBadge.textContent = statusData.label;
      
      // Add the same status badge to all locations
      statusWelcome.appendChild(statusBadge.cloneNode(true));
      statusFooter.appendChild(statusBadge.cloneNode(true));
      statusContact.appendChild(statusBadge.cloneNode(true));
    }
  });

  // ---------- CONTENT SCHEDULER ----------
  // Function to check and publish scheduled content
  const checkScheduledContent = async () => {
    try {
      // Get all scheduled content with status "scheduled"
      const schedulerQuery = query(collection(db, 'scheduler'), orderBy('publishDate'));
      const snapshot = await getDocs(schedulerQuery);
      
      const now = new Date().toISOString();
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        
        // Check if content is scheduled and publish date has arrived
        if (data.status === 'scheduled' && data.publishDate <= now) {
          // Prepare content for publishing
          const publishData = {
            title: data.title,
            content: data.content,
            order: data.order,
            visible: true,
            createdAt: now,
            updatedAt: now
          };
          
          // Publish to the appropriate collection based on contentType
          switch (data.contentType) {
            case 'project':
              await addDoc(collection(db, 'projects'), publishData);
              break;
            case 'skill':
              await addDoc(collection(db, 'skills'), publishData);
              break;
            case 'testimonial':
              await addDoc(collection(db, 'testimonials'), publishData);
              break;
            case 'reading':
              await addDoc(collection(db, 'reading'), publishData);
              break;
          }
          
          // Update status to published
          await updateDoc(doc(db, 'scheduler', docSnap.id), {
            status: 'published',
            publishedAt: now
          });
        }
      }
    } catch (error) {
      console.error('Error checking scheduled content:', error);
    }
  };
  
  // Run scheduler check immediately on page load
  checkScheduledContent();
  
  // Set up interval to check for scheduled content every minute
  setInterval(checkScheduledContent, 60000); // 60 seconds

  // ---------- FIRESTORE STATUS ----------
  initializeStatusChecker();

  // ---------- ANIMATED SECTION TRANSITIONS ----------
  const sections = document.querySelectorAll('section[id]');
  
  // Add animate-on-scroll class to all sections
  sections.forEach(section => {
    section.classList.add('animate-on-scroll');
  });

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // analytics hook (safe)
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));

  // ---------- CONTACT FORM FUNCTIONALITY ----------
  const contactForm = document.getElementById('contact-form');
  const contactMessage = document.getElementById('contact-message');
  const wordCountDisplay = contactMessage ? contactMessage.parentElement.querySelector('.word-count') : null;
  const contactStatus = document.getElementById('contact-status');

  // Word count functionality
  if (contactMessage && wordCountDisplay) {
    const updateWordCount = () => {
      const text = contactMessage.value.trim();
      const wordCount = text === '' ? 0 : text.split(/\s+/).length;
      const maxWords = 100;
      
      wordCountDisplay.textContent = `${wordCount}/${maxWords} words`;
      
      if (wordCount > maxWords) {
        wordCountDisplay.classList.add('exceeded');
      } else {
        wordCountDisplay.classList.remove('exceeded');
      }
    };

    contactMessage.addEventListener('input', updateWordCount);
    updateWordCount(); // Initialize count on page load
  }

  // Form submission
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (contactStatus) {
        contactStatus.textContent = '';
        contactStatus.className = 'contact-status';
      }

      // Get form data
      const formData = new FormData(contactForm);
      const message = formData.get('message').trim();
      const wordCount = message === '' ? 0 : message.split(/\s+/).length;
      
      // Validate word count
      if (wordCount > 100) {
        if (contactStatus) {
          contactStatus.textContent = 'Error: Message exceeds 100 words.';
          contactStatus.className = 'contact-status error';
        }
        return;
      }

      try {
        // Import addDoc here to avoid import at top level
        const { addDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Create contact submission object
        const contactSubmission = {
          name: formData.get('name').trim(),
          email: formData.get('email').trim(),
          phone: formData.get('phone').trim(),
          linkedin: formData.get('linkedin').trim(),
          message: message,
          timestamp: new Date().toISOString()
        };

        // Add to Firestore
        await addDoc(collection(db, 'contacts'), contactSubmission);
        
        if (contactStatus) {
          contactStatus.textContent = 'Message sent successfully!';
          contactStatus.className = 'contact-status success';
        }
        
        // Reset form
        contactForm.reset();
        if (wordCountDisplay) {
          wordCountDisplay.textContent = '0/100 words';
          wordCountDisplay.classList.remove('exceeded');
        }
      } catch (error) {
        console.error('Error sending message:', error);
        if (contactStatus) {
          contactStatus.textContent = 'Error sending message. Please try again later.';
          contactStatus.className = 'contact-status error';
        }
      }
    });
  }

  // ---------- HIRE ME BUTTON FUNCTIONALITY ----------
  const hireMeBtn = document.getElementById('hire-me-btn');
  const hireMeContainer = document.querySelector('.hire-me-container');
  const mailSystemDefaultBtn = document.getElementById('mail-system-default');
  const mailGmailBtn = document.getElementById('mail-gmail');
  const mailOutlookBtn = document.getElementById('mail-outlook');
  const mailCopyBtn = document.getElementById('mail-copy');

  const recipientEmail = 'kartikeypandey1804@gmail.com';
  const subject = encodeURIComponent('Hiring Inquiry from Portfolio');
  const body = encodeURIComponent('Dear Kartikey,\n\nI am writing to discuss a potential opportunity...\n\nBest regards,');

  if (hireMeBtn && hireMeContainer) {
    hireMeBtn.addEventListener('click', () => {
      hireMeContainer.classList.toggle('active');
    });

    // Close dropdown if clicked outside
    document.addEventListener('click', (event) => {
      if (!hireMeContainer.contains(event.target) && hireMeContainer.classList.contains('active')) {
        hireMeContainer.classList.remove('active');
      }
    });
  }

  if (mailSystemDefaultBtn) {
    mailSystemDefaultBtn.addEventListener('click', () => {
      window.location.href = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
      hireMeContainer.classList.remove('active');
    });
  }

  if (mailGmailBtn) {
    mailGmailBtn.addEventListener('click', () => {
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${recipientEmail}&su=${subject}&body=${body}`;
      window.open(gmailUrl, '_blank');
      hireMeContainer.classList.remove('active');
    });
  }

  if (mailOutlookBtn) {
    mailOutlookBtn.addEventListener('click', () => {
      const outlookUrl = `https://outlook.live.com/owa/?path=/mail/action/compose&to=${recipientEmail}&subject=${subject}&body=${body}`;
      window.open(outlookUrl, '_blank');
      hireMeContainer.classList.remove('active');
    });
  }

  if (mailCopyBtn) {
    mailCopyBtn.addEventListener('click', async () => {
      const emailContent = `To: ${recipientEmail}\nSubject: ${decodeURIComponent(subject)}\n\n${decodeURIComponent(body)}`;
      try {
        await navigator.clipboard.writeText(emailContent);
        alert('Email content copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy email content: ', err);
        alert('Failed to copy email content. Please copy manually: ' + recipientEmail);
      }
      hireMeContainer.classList.remove('active');
    });
  }
});

/* ---------- GENERIC RENDER HELPER ---------- */
function renderListSection(sectionId, items, renderItem) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  
  // Try to find UL by direct query first, then by ID
  let listElement = section.querySelector('ul') || document.getElementById(`${sectionId}-list`);
  if (!listElement) return;
  
  listElement.innerHTML = '';
  
  if (!items.length) {
    section.style.display = 'none';
    return;
  }

  section.style.display = '';
  
  items.forEach(item => {
    const li = document.createElement('li');
    renderItem(li, item);
    listElement.appendChild(li);
  });
}

/* ---------- HERO SECTION ---------- */
onSnapshot(doc(db, 'hero', 'main'), (docSnap) => {
  const heroSection = document.getElementById('home');
  const heroTitle = document.querySelector('.hero-title');
  const heroSubtitle = document.querySelector('.hero-subtitle');
  const heroButtons = document.querySelector('.hero-buttons');

  if (!heroSection || !heroTitle || !heroSubtitle || !heroButtons) return;

  if (docSnap.exists()) {
    const data = docSnap.data();
    
    if (data.visible) {
      // Update hero content with Firestore data
      if (data.name && data.role) {
        heroTitle.textContent = `${data.name} | ${data.role}`;
      } else if (data.name) {
        heroTitle.textContent = data.name;
      } else if (data.role) {
        heroTitle.textContent = data.role;
      } else {
        heroTitle.textContent = 'Innovative Solutions for Modern Challenges';
      }
      
      if (data.valueProposition) {
        heroSubtitle.textContent = data.valueProposition;
      } else {
        heroSubtitle.textContent = 'Bridging the gap between technology and human experience through creative problem-solving';
      }
      
      // Update CTA button text
      const ctaButton = heroButtons.querySelector('.btn-primary');
      if (ctaButton && data.ctaText) {
        ctaButton.textContent = data.ctaText;
      }
      
      heroSection.style.display = '';
    } else {
      heroSection.style.display = 'none';
    }
  }
});

/* ---------- ABOUT ---------- */
onSnapshot(query(collection(db, 'about'), orderBy('order')), snapshot => {
  const aboutSection = document.getElementById('about');
  const aboutContent = document.getElementById('about-content');

  if (!aboutSection || !aboutContent) return;

  // Clear previous content
  aboutContent.textContent = '';
  aboutSection.style.display = 'none';

  if (snapshot.empty) {
    return;
  }

  // Assuming there's only one 'about' document or we take the first one
  const docSnap = snapshot.docs[0];
  const data = docSnap.data();

  if (data.visible) {
    aboutContent.textContent = data.content;
    aboutSection.style.display = '';
  }
});

/* ---------- SKILLS ---------- */
onSnapshot(query(collection(db, 'skills'), orderBy('order')), snapshot => {
  const items = snapshot.docs
    .map(d => d.data())
    .filter(i => i.visible !== false);
  
  // Group skills by type
  const skillsByType = items.reduce((groups, skill) => {
    const type = skill.type || 'other';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(skill);
    return groups;
  }, {});
  
  // Render skills grouped by type
  const skillsList = document.getElementById('skills-list');
  if (skillsList) {
    // Define type labels for display
    const typeLabels = {
      frontend: 'Frontend',
      backend: 'Backend',
      database: 'Database',
      devops: 'DevOps',
      tools: 'Tools',
      other: 'Other'
    };
    
    // Sort skill types in a logical order
    const sortedTypes = ['frontend', 'backend', 'database', 'devops', 'tools', 'other'];
    
    skillsList.innerHTML = '';
    
    // Render each skill type group
    sortedTypes.forEach(type => {
      const skills = skillsByType[type];
      if (skills && skills.length > 0) {
        const typeSection = document.createElement('li');
        typeSection.className = 'skill-type-section';
        
        typeSection.innerHTML = `
          <h3 class="skill-type-title">${typeLabels[type]}</h3>
          <div class="skill-type-container">
            ${skills.map(skill => {
              const percentage = skill.percentage || 70;
              
              // Only show progression timeline if data exists
              const progressionData = skill.progression || [];
              
              return `
                <div class="skill-item">
                  <div class="skill-header">
                    <span class="skill-name">${skill.title}</span>
                    <span class="skill-percentage">${percentage}%</span>
                  </div>
                  <div class="skill-bar">
                    <div class="skill-bar-fill" style="--skill-level: ${percentage}%;"></div>
                  </div>
                  ${progressionData.length > 0 ? `
                  <div class="skill-progression-timeline">
                    <h5>Progression Over Time</h5>
                    <div class="timeline-container">
                      <div class="timeline-line"></div>
                      ${progressionData.map((item, index) => `
                        <div class="timeline-item" style="left: ${(index / (progressionData.length - 1)) * 100}%;">
                          <div class="timeline-dot"></div>
                          <div class="timeline-content">
                            <div class="timeline-year">${item.year || 'N/A'}</div>
                            <div class="timeline-level">${item.level || 0}%</div>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        `;
        
        skillsList.appendChild(typeSection);
      }
    });
  }
  
});



/* ---------- PROJECTS ---------- */
let allProjects = [];
let isFeaturedProjectEnabled = true; // Default to enabled

// Listen for featured project settings
onSnapshot(doc(db, 'settings', 'featuredProject'), (docSnap) => {
  if (docSnap.exists()) {
    isFeaturedProjectEnabled = docSnap.data().enabled || true;
    updateFeaturedProject();
  }
});

onSnapshot(query(collection(db, 'projects'), orderBy('order')), snapshot => {
  allProjects = snapshot.docs
    .map(d => d.data())
    .filter(i => i.visible !== false);
  
  // Initialize or update filters
  applyProjectFilters();
  
  // Update featured project
  updateFeaturedProject();
});

// Add event listeners for project filtering
document.addEventListener('DOMContentLoaded', () => {
  // Filter buttons event listener
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Remove active class from all buttons
      filterButtons.forEach(b => b.classList.remove('active'));
      // Add active class to clicked button
      e.target.classList.add('active');
      // Apply filters
      applyProjectFilters();
    });
  });
  
  // Search input event listener
  const searchInput = document.getElementById('project-search');
  if (searchInput) {
    searchInput.addEventListener('input', applyProjectFilters);
  }
});

// Apply project filters (category + search)
function applyProjectFilters() {
  // Get current filter values
  const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
  const searchTerm = document.getElementById('project-search')?.value.toLowerCase() || '';
  
  // Define predefined categories
  const predefinedCategories = ['web', 'mobile', 'design', 'data'];
  
  // Filter projects
  const filteredProjects = allProjects.filter(project => {
    // Get project category (default to 'other' if not specified)
    const projectCategory = project.category?.toLowerCase() || 'other';
    
    // Apply category filter
    let matchesCategory = false;
    if (activeFilter === 'all') {
      matchesCategory = true;
    } else if (activeFilter === 'other') {
      // Include custom categories under 'other' filter
      matchesCategory = !predefinedCategories.includes(projectCategory);
    } else {
      // Exact match for predefined categories
      matchesCategory = projectCategory === activeFilter;
    }
    
    // Apply search filter
    const matchesSearch = !searchTerm || 
      project.title?.toLowerCase().includes(searchTerm) ||
      project.description?.toLowerCase().includes(searchTerm) ||
      project.category?.toLowerCase().includes(searchTerm);
    
    return matchesCategory && matchesSearch;
  });
  
  // Render filtered projects
  renderListSection('projects', filteredProjects, (li, p) => {
    // Find related projects
    const relatedProjects = getRelatedProjects(p, filteredProjects, 4);
    
    li.innerHTML = `
      ${p.imageUrl ? `
        <div class="project-image-container">
          <img src="${p.imageUrl}" alt="${p.title}" class="project-image" />
          ${p.previewText || p.description ? `
            <div class="project-preview-overlay">
              <div class="project-preview-content">
                <h4>${p.title}</h4>
                <p>${p.previewText || p.description.substring(0, 100)}${(p.previewText || p.description).length > 100 ? '...' : ''}</p>
              </div>
            </div>
          ` : ''}
        </div>
      ` : ''}
      <div class="project-content">
        <h3>${p.title}</h3>
        <p>${p.description}</p>
        <div class="project-links">
          ${p.liveUrl ? `<a href="${p.liveUrl}" target="_blank" rel="noopener"><span>Live</span></a>` : ''}
          ${p.githubUrl ? `<a href="${p.githubUrl}" target="_blank" rel="noopener"><span>GitHub</span></a>` : ''}
          ${p.url && !p.liveUrl ? `<a href="${p.url}" target="_blank" rel="noopener"><span>View</span></a>` : ''}
        </div>
      </div>
      ${relatedProjects.length > 0 ? `
        <div class="related-projects">
          <h4>Related Projects</h4>
          <div class="related-projects-container">
            ${relatedProjects.map(related => `
              <div class="related-project-item">
                ${related.imageUrl ? `<img src="${related.imageUrl}" alt="${related.title}" class="related-project-image" />` : ''}
                <div class="related-project-info">
                  <h5>${related.title}</h5>
                  ${related.category ? `<span class="related-project-category">${related.category}</span>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
  });
  
  // Initialize lightbox functionality after rendering projects
  initializeLightbox();
}

/* ---------- SOCIAL LINKS ---------- */
// Function to get social media platform from URL
const getSocialPlatform = (url) => {
  const platformMap = {
    'github': ['github.com'],
    'linkedin': ['linkedin.com'],
    'twitter': ['twitter.com', 'x.com'],
    'facebook': ['facebook.com'],
    'instagram': ['instagram.com'],
    'youtube': ['youtube.com'],
    'twitch': ['twitch.tv'],
    'discord': ['discord.com'],
    'reddit': ['reddit.com'],
    'medium': ['medium.com'],
    'dev': ['dev.to'],
    'stackoverflow': ['stackoverflow.com'],
    'dribbble': ['dribbble.com'],
    'behance': ['behance.net'],
    'codepen': ['codepen.io'],
    'gitlab': ['gitlab.com'],
    'bitbucket': ['bitbucket.org'],
    'telegram': ['telegram.org', 't.me'],
    'whatsapp': ['whatsapp.com'],
    'snapchat': ['snapchat.com'],
    'tiktok': ['tiktok.com']
  };
  
  const urlLower = url.toLowerCase();
  for (const [platform, domains] of Object.entries(platformMap)) {
    if (domains.some(domain => urlLower.includes(domain))) {
      return platform;
    }
  }
  return 'generic';
};

// Function to get social media logo URL
const getSocialLogoUrl = (platform) => {
  // Using Simple Icons CDN for social media logos
  return `https://cdn.simpleicons.org/${platform}/ffffff/256`;
};

onSnapshot(query(collection(db, 'socialLinks'), orderBy('order')), snapshot => {
  const container = document.getElementById('social-links-container');
  if (!container) return;

  container.innerHTML = '';
  const links = snapshot.docs
    .map(d => d.data())
    .filter(l => l.visible !== false);

  if (!links.length) {
    container.style.display = 'none';
    return;
  }

  container.style.display = '';
  links.forEach(l => {
    const platform = getSocialPlatform(l.url);
    const logoUrl = getSocialLogoUrl(platform);
    
    const a = document.createElement('a');
    a.href = l.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.className = 'social-link';
    
    // Create logo element
    const img = document.createElement('img');
    img.src = logoUrl;
    img.alt = `${l.title} logo`;
    img.className = 'social-logo';
    img.width = 24;
    img.height = 24;
    
    // Create text element
    const span = document.createElement('span');
    span.textContent = l.title;
    span.className = 'social-text';
    
    // Add elements to link
    a.appendChild(img);
    a.appendChild(span);
    
    container.appendChild(a);
  });
});

/* ---------- EXPERIENCE ---------- */
onSnapshot(query(collection(db, 'experience'), orderBy('order')), snapshot => {
  const items = snapshot.docs
    .map(d => d.data())
    .filter(i => i.visible !== false);

  renderListSection('experience', items, (li, exp) => {
    const startDate = exp.fromDate ? new Date(exp.fromDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '';
    const endDate = exp.toPresent ? 'Present' : exp.toDate ? new Date(exp.toDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '';
    const dateRange = `${startDate} - ${endDate}`;
    
    // Get company name from any available field
    const companyName = exp.companyName || exp.company || exp.organization || '';
    
    li.innerHTML = `
      <div class="experience-content">
        ${dateRange ? `<div class="experience-date">${dateRange}</div>` : ''}
        <h3>${exp.title}</h3>
        ${companyName ? `<p class="experience-company"><strong>${companyName}</strong></p>` : ''}
        ${exp.role ? `<p class="experience-role">${exp.role}</p>` : ''}
        ${exp.description ? `<p class="experience-description">${exp.description}</p>` : ''}
        ${exp.responsibilities ? `<p class="experience-responsibilities">${exp.responsibilities}</p>` : ''}
      </div>
    `;
  });
});

/* ---------- EDUCATION ---------- */
onSnapshot(query(collection(db, 'education'), orderBy('order')), (snapshot) => {
  const realItems = snapshot.docs
    .map(d => d.data())
    .filter(i => i.visible !== false);
  
  // Always use real data if available, don't add default grade values based on degree type
  const educationItems = realItems.map(item => ({
    ...item,
    // Just map available grade values without adding hardcoded defaults
    gradeValue: item.gradeValue || 
               item.cgpa || 
               item.percentage || 
               item.score || 
               item.marks
  }));
  
  renderListSection('education', educationItems, (li, edu) => {
    let gradeContent = '';
    
    // Handle different data structures for backward compatibility
    let gradeValue = edu.gradeValue || '';
    let gradeType = edu.grade || edu.gradeType || '';
    
    // If gradeValue is empty but we have grade data, try to extract value and type
    if (!gradeValue && edu.grade && typeof edu.grade === 'string') {
      // Check if grade field contains both value and type (e.g., "92 Percentage")
      const gradeParts = edu.grade.split(/\s+/);
      if (gradeParts.length >= 2) {
        gradeValue = gradeParts[0];
        gradeType = gradeParts.slice(1).join(' ');
      }
    }
    
    // Format grade display based on type and value availability
    if (gradeValue && gradeType) {
      if (gradeType.toLowerCase() === 'percentage') {
        gradeContent = `${gradeValue}%`;
      } else {
        gradeContent = `${gradeValue} (${gradeType})`;
      }
    } else if (gradeValue) {
      gradeContent = `${gradeValue}`;
    } else if (gradeType) {
      gradeContent = `${gradeType}`;
    }
    
    li.innerHTML = `
      <div class="education-card">
        <h3>${edu.degree || 'Degree'}</h3>
        ${edu.specialization ? `<p><strong>Specialization:</strong> ${edu.specialization}</p>` : ''}
        <p><strong>Institution:</strong> ${edu.institution || 'Institution'}</p>
        ${gradeContent ? `<p><strong>Grade:</strong> ${gradeContent}</p>` : ''}
      </div>
    `;
  });
}, (error) => {
  console.error('Error fetching education data from Firestore:', error);
  
  // Fallback to empty array if Firestore fails, don't use hardcoded test data
  renderListSection('education', [], (li, edu) => {});
});

/* ---------- ROADMAP ---------- */
onSnapshot(query(collection(db, 'roadmap'), orderBy('order')), snapshot => {
  const items = snapshot.docs
    .map(d => d.data())
    .filter(i => i.visible !== false);

  const roadmapSection = document.getElementById('roadmap');
  if (!roadmapSection) return;

  // Clear existing content
  roadmapSection.innerHTML = '<h2>Roadmap</h2><div class="roadmap-container"></div>';
  const roadmapContainer = roadmapSection.querySelector('.roadmap-container');

  if (!items.length) {
    roadmapSection.style.display = 'none';
    return;
  }

  roadmapSection.style.display = '';

  // Create visual roadmap layout without curved path
  roadmapContainer.className = 'visual-roadmap';
  
  // Create roadmap content container only (no path)
  roadmapContainer.innerHTML = `
    <div class="roadmap-content"></div>
  `;
  
  const roadmapContent = roadmapContainer.querySelector('.roadmap-content');
  
  // Set CSS variable for number of roadmap items to ensure proper spacing
  roadmapContent.style.setProperty('--roadmap-items', items.length);
  
  items.forEach((item, index) => {
    const roadmapItem = document.createElement('div');
    roadmapItem.className = 'visual-roadmap-item';
    
    // Calculate overall progress if not provided
    const overallProgress = item.overall || Math.round(
      ((item.learned || 0) + 
       (item.planned || 0) + 
       (item.executed || 0) + 
       (item.practiced || 0) + 
       (item.achieved || 0)) / 5
    );
    
    // Define color mapping for different progression types
    const typeColors = {
      learned: '#e74c3c',
      planned: '#3498db',
      executed: '#2ecc71',
      practiced: '#f39c12',
      achieved: '#9b59b6',
      overall: '#1abc9c',
      learning: '#e74c3c' // Add mapping for 'learning' type
    };
    
    // Use actual progression data or empty array if none exists (no simulation)
    const progressionTimeline = item.progression || [];
    
    // Get color for the milestone based on latest progression type or default to planned
    let latestProgress = progressionTimeline.length > 0 ? progressionTimeline[progressionTimeline.length - 1] : { type: 'planned', value: 0 };
    const milestoneColor = typeColors[latestProgress.type] || typeColors.overall;
    
    // Check if item is truly achieved - should have both achieved type and significant progress
    const isAchieved = (latestProgress.type === 'achieved' && latestProgress.value >= 100) || (item.achieved || 0) >= 100;
    const achievementEntry = progressionTimeline.find(entry => entry.type === 'achieved' && entry.value >= 100);
    const achievementDate = achievementEntry ? achievementEntry.date : null;
    
    // Get display settings with defaults
    const display = item.display || {
      description: true,
      summary: true,
      achievement: true,
      timeline: true,
      metrics: true
    };
    
    roadmapItem.innerHTML = `
      <div class="roadmap-milestone" style="background-color: ${milestoneColor};">
        ${isAchieved ? `<div class="milestone-achieved-badge">✓</div>` : ''}
      </div>
      <div class="roadmap-item-card">
        <div class="roadmap-item-header">
          <h3>${item.title}</h3>
          <div class="roadmap-header-stats">
            <span class="overall-progress" style="color: ${typeColors.overall};">${overallProgress}%</span>
            ${isAchieved ? `<span class="achieved-badge">Achieved</span>` : ''}
          </div>
        </div>
        ${display.description && item.description ? `<p class="roadmap-item-description">${item.description}</p>` : ''}
        ${display.summary ? `
        <div class="roadmap-item-summary">
          <div class="progress-indicator" style="background-color: ${typeColors.learned};"></div>
          <span>${item.learned || 0}% Learned</span>
          <div class="progress-indicator" style="background-color: ${typeColors.executed};"></div>
          <span>${item.executed || 0}% Executed</span>
        </div>
        ` : ''}
        ${display.achievement && isAchieved && achievementDate ? `
        <div class="achievement-info">
          <div class="achievement-icon">🏆</div>
          <div class="achievement-details">
            <div class="achievement-label">Achieved</div>
            <div class="achievement-date-value">${achievementDate}</div>
          </div>
        </div>
        ` : ''}
        <div class="roadmap-detailed-progress" style="display: none;">
          ${display.timeline && progressionTimeline.length > 0 ? `
          <h5>Progression Timeline</h5>
          <div class="timeline-container">
            ${progressionTimeline.map((progress, idx) => {
              const progressColor = typeColors[progress.type] || typeColors.overall;
              const isAchievementEntry = progress.type === 'achieved' && progress.value >= 100;
              return `
                <div class="timeline-entry ${isAchievementEntry ? 'achievement-highlight' : ''}">
                  <div class="timeline-date">${progress.date || 'N/A'}</div>
                  <div class="timeline-type" style="background-color: ${progressColor};">${progress.type || 'Unknown'}</div>
                  <div class="timeline-value">${progress.value || 0}%</div>
                  ${isAchievementEntry ? `<div class="achievement-indicator">🎉</div>` : ''}
                </div>
              `;
            }).join('')}
          </div>
          ` : ''}
          
          ${display.metrics ? `
          <h5>Detailed Metrics</h5>
          <div class="roadmap-metrics-grid">
            <div class="metric-card" style="border-color: ${typeColors.learned};">
              <div class="metric-label">Learned</div>
              <div class="metric-value">${item.learned || 0}%</div>
              <div class="metric-bar">
                <div class="metric-fill" style="width: ${item.learned || 0}%; background-color: ${typeColors.learned};"></div>
              </div>
            </div>
            
            <div class="metric-card" style="border-color: ${typeColors.planned};">
              <div class="metric-label">Planned</div>
              <div class="metric-value">${item.planned || 0}%</div>
              <div class="metric-bar">
                <div class="metric-fill" style="width: ${item.planned || 0}%; background-color: ${typeColors.planned};"></div>
              </div>
            </div>
            
            <div class="metric-card" style="border-color: ${typeColors.executed};">
              <div class="metric-label">Executed</div>
              <div class="metric-value">${item.executed || 0}%</div>
              <div class="metric-bar">
                <div class="metric-fill" style="width: ${item.executed || 0}%; background-color: ${typeColors.executed};"></div>
              </div>
            </div>
            
            <div class="metric-card" style="border-color: ${typeColors.practiced};">
              <div class="metric-label">Practiced</div>
              <div class="metric-value">${item.practiced || 0}%</div>
              <div class="metric-bar">
                <div class="metric-fill" style="width: ${item.practiced || 0}%; background-color: ${typeColors.practiced};"></div>
              </div>
            </div>
            
            <div class="metric-card" style="border-color: ${typeColors.achieved};">
              <div class="metric-label">Achieved</div>
              <div class="metric-value">${item.achieved || 0}%</div>
              <div class="metric-bar">
                <div class="metric-fill" style="width: ${item.achieved || 0}%; background-color: ${typeColors.achieved};"></div>
              </div>
            </div>
          </div>
          ` : ''}
        </div>
        ${(display.timeline || display.metrics) ? `<button class="expand-btn">${item.description ? 'View Details' : 'No Details'}</button>` : ''}
      </div>
    `;
    
    // Add click event to toggle detailed progress
    const expandBtn = roadmapItem.querySelector('.expand-btn');
    const detailedProgress = roadmapItem.querySelector('.roadmap-detailed-progress');
    
    expandBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      detailedProgress.style.display = detailedProgress.style.display === 'none' ? 'block' : 'none';
      expandBtn.textContent = detailedProgress.style.display === 'none' ? 'View Details' : 'Hide Details';
      roadmapItem.classList.toggle('expanded');
    });
    
    roadmapContent.appendChild(roadmapItem);
  });
});

/* ---------- ACHIEVEMENTS ---------- */
onSnapshot(query(collection(db, 'achievements'), orderBy('order')), snapshot => {
  const items = snapshot.docs
    .map(d => d.data())
    .filter(i => i.visible !== false);

  renderListSection('achievements', items, (li, achievement) => {
    li.innerHTML = `
      <h3>${achievement.title}</h3>
      <p>${achievement.description}</p>
    `;
  });
});

/* ---------- CERTIFICATES ---------- */
onSnapshot(query(collection(db, 'certificates'), orderBy('order')), snapshot => {
  const items = snapshot.docs
    .map(d => d.data())
    .filter(i => i.visible !== false);

  renderListSection('certificates', items, (li, cert) => {
    li.innerHTML = `
      <h3>${cert.title}</h3>
      <p>${cert.issuer}</p>
      ${cert.date ? `<p>${cert.date}</p>` : ''}
      ${cert.url ? `<a href="${cert.url}" target="_blank" rel="noopener">View Certificate</a>` : ''}
    `;
  });
});

/* ---------- TESTIMONIALS ---------- */
onSnapshot(query(collection(db, 'testimonials'), orderBy('order')), snapshot => {
  const items = snapshot.docs
    .map(d => d.data())
    .filter(i => i.visible !== false);

  const container = document.getElementById('testimonials-container');
  if (!container) return;

  if (!items.length) {
    container.innerHTML = '<p>No testimonials available.</p>';
    return;
  }

  container.innerHTML = `
    <div class="testimonials-grid">
      ${items.map(testimonial => `
        <div class="testimonial-card">
          ${testimonial.image || testimonial.avatarUrl ? `
            <div class="testimonial-image">
              <img src="${testimonial.image || testimonial.avatarUrl}" alt="${testimonial.name || testimonial.author}" />
            </div>
          ` : ''}
          <div class="testimonial-content">
            <div class="testimonial-header">
              <h3>${testimonial.name || testimonial.author}</h3>
              <div class="testimonial-rating">
                ${'★'.repeat(Math.floor(testimonial.rating || 5))}${'☆'.repeat(Math.max(0, 5 - Math.floor(testimonial.rating || 5)))}
              </div>
            </div>
            <p class="testimonial-role">${testimonial.role || ''}${testimonial.company ? ` at ${testimonial.company}` : ''}</p>
            <p class="testimonial-message">${testimonial.message || testimonial.text}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
});

/* ---------- READING LIST ---------- */
onSnapshot(query(collection(db, 'readingList'), orderBy('order')), snapshot => {
  const readingListContainer = document.getElementById('reading-list-container');
  if (!readingListContainer) return;

  const readingItems = snapshot.docs
    .map(d => d.data())
    .filter(item => item.visible !== false);

  if (!readingItems.length) {
    readingListContainer.innerHTML = '<p>No items in reading list yet.</p>';
    return;
  }

  readingListContainer.innerHTML = readingItems.map(item => `
    <div class="reading-item">
      <span class="reading-item-type">${item.type || 'Book'}</span>
      <h3>${item.title}</h3>
      ${item.author ? `<div class="reading-item-author">by ${item.author}</div>` : ''}
      <p class="reading-item-review">${item.review || item.description || 'No review available.'}</p>
      ${item.url ? `<a href="${item.url}" target="_blank" rel="noopener" class="reading-item-link">Read More</a>` : ''}
    </div>
  `).join('');
});

// Helper function to get related projects
function getRelatedProjects(currentProject, allProjects, limit = 4) {
  if (!currentProject || allProjects.length <= 1) return [];
  
  // Filter out the current project
  const otherProjects = allProjects.filter(project => project.title !== currentProject.title);
  
  // Calculate similarity score for each project
  const scoredProjects = otherProjects.map(project => {
    let score = 0;
    
    // Check if categories match
    if (currentProject.category && project.category && 
        currentProject.category.toLowerCase() === project.category.toLowerCase()) {
      score += 10;
    }
    
    // Check if skills match (if skills array exists)
    if (currentProject.skills && project.skills) {
      const commonSkills = currentProject.skills.filter(skill => 
        project.skills.includes(skill)
      );
      score += commonSkills.length * 5;
    }
    
    return { project, score };
  });
  
  // Sort by score descending and return top N projects
  return scoredProjects
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.project);
}

/* ---------- FEATURED PROJECT FUNCTIONALITY ---------- */
function updateFeaturedProject() {
  const featuredProjectSection = document.getElementById('featured-project');
  const featuredProjectContainer = document.getElementById('featured-project-container');
  
  if (!featuredProjectSection || !featuredProjectContainer) return;
  
  // Hide or show the featured project section based on the setting
  if (isFeaturedProjectEnabled && allProjects.length > 0) {
    featuredProjectSection.style.display = '';
    
    // Select a random project
    const randomIndex = Math.floor(Math.random() * allProjects.length);
    const featuredProject = allProjects[randomIndex];
    
    // Render the featured project
    featuredProjectContainer.innerHTML = `
      <div class="featured-project-content">
        ${featuredProject.imageUrl ? `
          <div class="featured-project-image-container">
            <img src="${featuredProject.imageUrl}" alt="${featuredProject.title}" class="featured-project-image project-image" />
          </div>
        ` : ''}
        <div class="featured-project-info">
          ${featuredProject.category ? `<span class="featured-project-category">${featuredProject.category}</span>` : ''}
          <h3 class="featured-project-title">${featuredProject.title}</h3>
          <p class="featured-project-description">${featuredProject.description}</p>
          <div class="featured-project-links">
            ${featuredProject.liveUrl ? `<a href="${featuredProject.liveUrl}" target="_blank" rel="noopener" class="featured-project-link">Live</a>` : ''}
            ${featuredProject.githubUrl ? `<a href="${featuredProject.githubUrl}" target="_blank" rel="noopener" class="featured-project-link">GitHub</a>` : ''}
            ${featuredProject.url && !featuredProject.liveUrl ? `<a href="${featuredProject.url}" target="_blank" rel="noopener" class="featured-project-link">View</a>` : ''}
          </div>
        </div>
      </div>
    `;
    
    // Re-initialize lightbox for the featured project image
    initializeLightbox();
  } else {
    featuredProjectSection.style.display = 'none';
  }
}

/* ---------- LIGHTBOX GALLERY FUNCTIONALITY ---------- */
function initializeLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightbox-image');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  const lightboxClose = document.getElementById('lightbox-close');
  
  if (!lightbox || !lightboxImage || !lightboxClose) return;
  
  const projectImages = document.querySelectorAll('.project-image');
  let currentImageIndex = 0;
  let imageUrls = [];
  let imageCaptions = [];
  
  // Get all image URLs and captions
  projectImages.forEach((img, index) => {
    imageUrls[index] = img.src;
    imageCaptions[index] = img.alt;
    
    // Add click event listener to each image
    img.addEventListener('click', () => {
      currentImageIndex = index;
      openLightbox();
    });
  });
  
  function openLightbox() {
    lightboxImage.src = imageUrls[currentImageIndex];
    lightboxCaption.textContent = imageCaptions[currentImageIndex];
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  function showNextImage() {
    currentImageIndex = (currentImageIndex + 1) % imageUrls.length;
    lightboxImage.src = imageUrls[currentImageIndex];
    lightboxCaption.textContent = imageCaptions[currentImageIndex];
  }
  
  function showPrevImage() {
    currentImageIndex = (currentImageIndex - 1 + imageUrls.length) % imageUrls.length;
    lightboxImage.src = imageUrls[currentImageIndex];
    lightboxCaption.textContent = imageCaptions[currentImageIndex];
  }
  
  // Event listeners for lightbox controls
  lightboxClose.addEventListener('click', closeLightbox);
  
  if (lightboxNext) {
    lightboxNext.addEventListener('click', showNextImage);
  }
  
  if (lightboxPrev) {
    lightboxPrev.addEventListener('click', showPrevImage);
  }
  
  // Close lightbox when clicking outside the image
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (lightbox.classList.contains('active')) {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        showNextImage();
      } else if (e.key === 'ArrowLeft') {
        showPrevImage();
      }
    }
  });
}

// Removed analytics section from public page
