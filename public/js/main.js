// public/js/main.js
import { db } from './firebase.js';
import { initializeStatusChecker } from './status.js';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  doc,
  getDocs,
  addDoc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {

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

  const list = section.querySelector('ul');
  if (!list) return;

  list.innerHTML = '';

  if (!items.length) {
    section.style.display = 'none';
    return;
  }

  section.style.display = '';
  items.forEach(item => {
    const li = document.createElement('li');
    renderItem(li, item);
    list.appendChild(li);
  });
}

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
              
              // Simulate skill progression data if none exists
              const progressionData = skill.progression || [
                { year: '2021', level: 40 },
                { year: '2022', level: 55 },
                { year: '2023', level: 70 },
                { year: '2024', level: 85 },
                { year: '2025', level: percentage }
              ];
              
              return `
                <div class="skill-item">
                  <div class="skill-header">
                    <span class="skill-name">${skill.title}</span>
                    <span class="skill-percentage">${percentage}%</span>
                  </div>
                  <div class="skill-bar">
                    <div class="skill-bar-fill" style="--skill-level: ${percentage}%;"></div>
                  </div>
                  <div class="skill-progression-timeline">
                    <h5>Progression Over Time</h5>
                    <div class="timeline-container">
                      <div class="timeline-line"></div>
                      ${progressionData.map((item, index) => `
                        <div class="timeline-item" style="left: ${(index / (progressionData.length - 1)) * 100}%;">
                          <div class="timeline-dot"></div>
                          <div class="timeline-content">
                            <div class="timeline-year">${item.year}</div>
                            <div class="timeline-level">${item.level}%</div>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  </div>
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
  
  // Filter projects
  const filteredProjects = allProjects.filter(project => {
    // Apply category filter
    const matchesCategory = activeFilter === 'all' || project.category?.toLowerCase() === activeFilter;
    
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
    
    li.innerHTML = `
      <div class="experience-content">
        ${dateRange ? `<div class="experience-date">${dateRange}</div>` : ''}
        <h3>${exp.title}</h3>
        ${exp.companyName ? `<p><strong>${exp.companyName}</strong></p>` : ''}
        ${exp.role ? `<p>${exp.role}</p>` : ''}
        ${exp.description ? `<p>${exp.description}</p>` : ''}
        ${exp.responsibilities ? `<p>${exp.responsibilities}</p>` : ''}
      </div>
    `;
  });
});

/* ---------- EDUCATION ---------- */
onSnapshot(query(collection(db, 'education'), orderBy('order')), snapshot => {
  const items = snapshot.docs
    .map(d => d.data())
    .filter(i => i.visible !== false);

  renderListSection('education', items, (li, edu) => {
    li.innerHTML = `
      <h3>${edu.degree || 'Degree'}</h3>
      ${edu.specialization ? `<p><strong>Specialization:</strong> ${edu.specialization}</p>` : ''}
      <p><strong>Institution:</strong> ${edu.institution || 'Institution'}</p>
      ${edu.grade ? `<p><strong>Grade:</strong> ${edu.grade}</p>` : ''}
    `;
  });
});

/* ---------- ROADMAP ---------- */
onSnapshot(query(collection(db, 'roadmap'), orderBy('order')), snapshot => {
  const items = snapshot.docs
    .map(d => d.data())
    .filter(i => i.visible !== false);

  renderListSection('roadmap', items, (li, roadmapItem) => {
    li.innerHTML = `
      <h3>${roadmapItem.title}</h3>
      <p>${roadmapItem.description}</p>
    `;
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
