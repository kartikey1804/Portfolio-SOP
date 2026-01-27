import { initializeStatusChecker } from './status.js';
import { db, auth } from './firebase.js';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
  collection,
  doc,
  getDocs,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  setDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
// Import admin authentication check
import { isAdminLoggedIn } from './auth.js';

// Helper function to normalize numeric inputs
const normalizeNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  return parseFloat(String(value).replace('%', '')) || 0;
};


// Helper function to show user feedback
const showFeedback = (message, isSuccess = true) => {
  // Create or update feedback element
  let feedbackEl = document.getElementById('admin-feedback');
  if (!feedbackEl) {
    feedbackEl = document.createElement('div');
    feedbackEl.id = 'admin-feedback';
    feedbackEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 4px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(feedbackEl);
  }
  
  // Set feedback content and style
  feedbackEl.textContent = message;
  feedbackEl.style.backgroundColor = isSuccess ? '#10b981' : '#ef4444';
  feedbackEl.style.opacity = '1';
  
  // Hide after 3 seconds
  setTimeout(() => {
    feedbackEl.style.opacity = '0';
  }, 3000);
};

// Sidebar navigation logic
const sidebarLinks = document.querySelectorAll('.admin-sidebar a');
const adminSections = document.querySelectorAll('.admin-content > .admin-section');

const showSection = (targetId) => {
  adminSections.forEach(section => {
    section.style.display = (section.id === targetId) ? 'block' : 'none';
  });
  sidebarLinks.forEach(link => {
    if (link.getAttribute('href') === `#${targetId}`) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
};

sidebarLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('href').substring(1);
    showSection(targetId);
  });
});

// Show analytics by default on load
showSection('analytics');

// Function to toggle dashboard and auth sections
const toggleAdminView = (loggedIn) => {
  const authSection = document.getElementById('auth');
  const dashboardSection = document.getElementById('dashboard');

  if (loggedIn) {
    authSection.style.display = 'none';
    dashboardSection.style.display = 'flex'; // Use flex as per admin.css
  } else {
    authSection.style.display = 'block';
    dashboardSection.style.display = 'none';
  }
};

// Login form submission
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm.email.value;
    const password = loginForm.password.value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // UI will be updated by onAuthStateChanged listener
    } catch (error) {
      console.error('Login failed:', error.message);
      alert('Login failed: ' + error.message);
    }
  });
}

// Logout button
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await auth.signOut();
      // UI will be updated by onAuthStateChanged listener
    } catch (error) {
      console.error('Logout failed:', error.message);
      alert('Logout failed: ' + error.message);
    }
  });
}

// ---------- FIRESTORE DATA HANDLING ----------
// Function to load all data from Firestore when authenticated
const loadFirestoreData = () => {
  // Load Hero data
  loadHeroData();
  // Load About data
  loadAboutData();
  // Load Skills data
  loadSkillsData();
  // Load Projects data
  loadProjectsData();
  // Load Social Links data
  loadSocialLinksData();
  // Load Experience data
  loadExperienceData();
  // Load Education data
  loadEducationData();
  // Load Roadmap data
  loadRoadmapData();
  // Load Achievements data
  loadAchievementsData();
  // Load Certificates data
  loadCertificatesData();
  // Load Resume data
  loadResumeData();
  // Load Testimonials data
  loadTestimonialsData();
  // Load Contact submissions data
  loadContactsData();
  // Load Content Scheduler data
  loadSchedulerData();
  // Load Status data
  loadStatusData();
  // Load Analytics data
  loadAnalyticsData();
};

// ---------- ANALYTICS DASHBOARD ----------
const loadAnalyticsData = () => {
  // Function to calculate date ranges
  const getDateRanges = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // This week: from Sunday to Saturday
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(thisWeekStart.getDate() - 1);
    
    // This month: from 1st to current date
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Last month: from 1st to last day of previous month
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    
    return {
      thisWeekStart,
      lastWeekStart,
      lastWeekEnd,
      thisMonthStart,
      lastMonthStart,
      lastMonthEnd
    };
  };
  
  // Function to calculate percentage change
  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    const change = ((current - previous) / previous) * 100;
    return Math.round(change);
  };
  
  // Function to update a metric card
  const updateMetricCard = (id, value, percentageChange, period = 'this week') => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
    
    const changeElement = element?.parentElement?.querySelector('.stat-change');
    if (changeElement) {
      const sign = percentageChange >= 0 ? '+' : '';
      changeElement.textContent = `${sign}${percentageChange}% ${period}`;
    }
  };
  
  // Real-time listener for analytics data
  onSnapshot(collection(db, 'analytics'), (snapshot) => {
    const analyticsData = snapshot.docs.map(doc => doc.data());
    const { thisWeekStart, lastWeekStart, lastWeekEnd, thisMonthStart, lastMonthStart, lastMonthEnd } = getDateRanges();
    
    // Calculate Total Views (all-time)
    const totalViews = analyticsData.length;
    updateMetricCard('total-views', totalViews, 0);
    
    // Calculate Contact Form Submissions
    const contactSubmissions = analyticsData.filter(event => event.section === 'contact').length;
    
    // Calculate this month vs last month for contact submissions
    const contactThisMonth = analyticsData.filter(event => 
      event.section === 'contact' && 
      event.timestamp && 
      event.timestamp.toDate() >= thisMonthStart
    ).length;
    
    const contactLastMonth = analyticsData.filter(event => 
      event.section === 'contact' && 
      event.timestamp && 
      event.timestamp.toDate() >= lastMonthStart && 
      event.timestamp.toDate() <= lastMonthEnd
    ).length;
    
    const contactChange = calculatePercentageChange(contactThisMonth, contactLastMonth);
    updateMetricCard('contact-submissions', contactSubmissions, contactChange, 'this month');
    
    // Calculate Project Interactions
    const projectInteractions = analyticsData.filter(event => 
      event.section === 'projects' || event.section === 'featured-project'
    ).length;
    
    // Calculate this week vs last week for project interactions
    const projectsThisWeek = analyticsData.filter(event => 
      (event.section === 'projects' || event.section === 'featured-project') && 
      event.timestamp && 
      event.timestamp.toDate() >= thisWeekStart
    ).length;
    
    const projectsLastWeek = analyticsData.filter(event => 
      (event.section === 'projects' || event.section === 'featured-project') && 
      event.timestamp && 
      event.timestamp.toDate() >= lastWeekStart && 
      event.timestamp.toDate() <= lastWeekEnd
    ).length;
    
    const projectChange = calculatePercentageChange(projectsThisWeek, projectsLastWeek);
    updateMetricCard('project-interactions', projectInteractions, projectChange);
    
    // Calculate Resume Downloads
    const resumeDownloads = analyticsData.filter(event => event.section === 'resume').length;
    
    // Calculate this month vs last month for resume downloads
    const resumeThisMonth = analyticsData.filter(event => 
      event.section === 'resume' && 
      event.timestamp && 
      event.timestamp.toDate() >= thisMonthStart
    ).length;
    
    const resumeLastMonth = analyticsData.filter(event => 
      event.section === 'resume' && 
      event.timestamp && 
      event.timestamp.toDate() >= lastMonthStart && 
      event.timestamp.toDate() <= lastMonthEnd
    ).length;
    
    const resumeChange = calculatePercentageChange(resumeThisMonth, resumeLastMonth);
    updateMetricCard('resume-downloads', resumeDownloads, resumeChange, 'this month');
    
    // Calculate Skill Clicks
    const skillClicks = analyticsData.filter(event => event.section === 'skills').length;
    
    // Calculate this week vs last week for skill clicks
    const skillsThisWeek = analyticsData.filter(event => 
      event.section === 'skills' && 
      event.timestamp && 
      event.timestamp.toDate() >= thisWeekStart
    ).length;
    
    const skillsLastWeek = analyticsData.filter(event => 
      event.section === 'skills' && 
      event.timestamp && 
      event.timestamp.toDate() >= lastWeekStart && 
      event.timestamp.toDate() <= lastWeekEnd
    ).length;
    
    const skillChange = calculatePercentageChange(skillsThisWeek, skillsLastWeek);
    updateMetricCard('skill-clicks', skillClicks, skillChange);
    
    // Calculate Featured Project Views
    const featuredViews = analyticsData.filter(event => event.section === 'featured-project').length;
    
    // Calculate this week vs last week for featured project views
    const featuredThisWeek = analyticsData.filter(event => 
      event.section === 'featured-project' && 
      event.timestamp && 
      event.timestamp.toDate() >= thisWeekStart
    ).length;
    
    const featuredLastWeek = analyticsData.filter(event => 
      event.section === 'featured-project' && 
      event.timestamp && 
      event.timestamp.toDate() >= lastWeekStart && 
      event.timestamp.toDate() <= lastWeekEnd
    ).length;
    
    const featuredChange = calculatePercentageChange(featuredThisWeek, featuredLastWeek);
    updateMetricCard('featured-views', featuredViews, featuredChange);
  });
};

// ---------- STATUS MANAGEMENT ----------
const loadStatusData = () => {
  const statusForm = document.getElementById('status-form');
  if (!statusForm) return;

  // Real-time listener for Status data
  onSnapshot(doc(db, 'settings', 'profileStatus'), (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById('status-type').value = data.type || 'available';
      document.getElementById('status-label').value = data.label || '';
      document.getElementById('status-visible').checked = data.visible !== false;
    }
  });
};

// Status form submission
const statusForm = document.getElementById('status-form');
if (statusForm) {
  statusForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      // Check if user is authenticated and has admin privileges
      const isAdmin = await isAdminLoggedIn();
      if (!isAdmin) {
        showFeedback('Please login with admin credentials!', false);
        return;
      }
      
      const type = document.getElementById('status-type').value;
      const label = document.getElementById('status-label').value;
      const visible = document.getElementById('status-visible').checked;

      const statusData = {
        type,
        label,
        visible,
        updatedAt: new Date().toISOString()
      };

      // Update or create the status document
      await updateDoc(doc(db, 'settings', 'profileStatus'), statusData, { merge: true });
      showFeedback('Status updated successfully!');
    } catch (error) {
      console.error('Error saving status:', error);
      showFeedback('Failed to save status: ' + error.message, false);
    }
  });
};

// ---------- HERO SECTION ----------
const loadHeroData = () => {
  const heroList = document.getElementById('hero-list');
  if (!heroList) return;

  // Real-time listener for Hero data
  onSnapshot(doc(db, 'hero', 'main'), (docSnap) => {
    heroList.innerHTML = '';
    if (docSnap.exists()) {
      const data = docSnap.data();
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${data.name || 'Hero Content'}</span>
        <div>
          <button onclick="editHero('main', ${JSON.stringify(data).replace(/"/g, '&quot;')})">Edit</button>
          <button class="danger" onclick="deleteHero('main')">Delete</button>
        </div>
      `;
      heroList.appendChild(li);
    }
  });
};

// Global functions for Hero section
globalThis.editHero = (id, data) => {
  document.getElementById('hero-id').value = id;
  document.getElementById('hero-name').value = data.name || '';
  document.getElementById('hero-role').value = data.role || '';
  document.getElementById('hero-value-proposition').value = data.valueProposition || '';
  document.getElementById('hero-availability').value = data.availability || 'available';
  document.getElementById('hero-cta-text').value = data.ctaText || '';
  document.getElementById('hero-visible').checked = data.visible !== false;
};

globalThis.deleteHero = async (id) => {
  if (confirm('Are you sure you want to delete this hero content?')) {
    try {
      const isAdmin = await isAdminLoggedIn();
      if (!isAdmin) {
        showFeedback('Please login with admin credentials!', false);
        return;
      }
      await deleteDoc(doc(db, 'hero', id));
      showFeedback('Hero content deleted successfully!');
    } catch (error) {
      console.error('Error deleting hero content:', error);
      showFeedback('Failed to delete hero content: ' + error.message, false);
    }
  }
};

const initHeroForm = () => {
  const heroForm = document.getElementById('hero-form');
  if (!heroForm) return;

  heroForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      // Check if user is authenticated and has admin privileges
      const isAdmin = await isAdminLoggedIn();
      if (!isAdmin) {
        showFeedback('Please login with admin credentials!', false);
        return;
      }
      
      const id = document.getElementById('hero-id').value || 'main';
      const name = document.getElementById('hero-name').value;
      const role = document.getElementById('hero-role').value;
      const valueProposition = document.getElementById('hero-value-proposition').value;
      const availability = document.getElementById('hero-availability').value;
      const ctaText = document.getElementById('hero-cta-text').value;
      const visible = document.getElementById('hero-visible').checked;

      const heroData = {
        name,
        role,
        valueProposition,
        availability,
        ctaText,
        visible,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'hero', id), heroData);
      showFeedback('Hero content saved successfully!');
      heroForm.reset();
      document.getElementById('hero-id').value = '';
    } catch (error) {
      console.error('Error saving hero content:', error);
      showFeedback('Failed to save hero content: ' + error.message, false);
    }
  });

  // New button for Hero section
  const heroNewBtn = document.getElementById('hero-new-btn');
  if (heroNewBtn) {
    heroNewBtn.addEventListener('click', () => {
      heroForm.reset();
      document.getElementById('hero-id').value = '';
    });
  }
};

// ---------- ABOUT SECTION ----------
const loadAboutData = () => {
  const aboutForm = document.getElementById('about-form');
  const aboutList = document.getElementById('about-list');
  if (!aboutForm || !aboutList) return;

  // Real-time listener for About data
  onSnapshot(query(collection(db, 'about'), orderBy('order')), (snapshot) => {
    aboutList.innerHTML = '';
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${data.content.substring(0, 50)}${data.content.length > 50 ? '...' : ''}</span>
        <div>
          <button onclick="editAbout('${docSnap.id}', ${JSON.stringify(data).replace(/"/g, '&quot;')})">Edit</button>
          <button class="danger" onclick="deleteAbout('${docSnap.id}')">Delete</button>
        </div>
      `;
      aboutList.appendChild(li);
    });
  });
};

// Global functions for About section (exposed to window for button onclick)
globalThis.editAbout = (id, data) => {
  document.getElementById('about-id').value = id;
  document.getElementById('about-content').value = data.content;
  document.getElementById('about-available').checked = data.available || false;
  document.getElementById('about-order').value = data.order || 0;
  document.getElementById('about-visible').checked = data.visible !== false;
};

globalThis.deleteAbout = async (id) => {
  if (confirm('Are you sure you want to delete this about entry?')) {
    try {
      const isAdmin = await isAdminLoggedIn();
      if (!isAdmin) {
        showFeedback('Please login with admin credentials!', false);
        return;
      }
      await deleteDoc(doc(db, 'about', id));
      showFeedback('About entry deleted successfully!');
    } catch (error) {
      console.error('Error deleting about entry:', error);
      showFeedback('Failed to delete about entry: ' + error.message, false);
    }
  }
};

// About form submission
const aboutForm = document.getElementById('about-form');
if (aboutForm) {
  aboutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      // Check if user is authenticated and has admin privileges
      const isAdmin = await isAdminLoggedIn();
      if (!isAdmin) {
        showFeedback('Please login with admin credentials!', false);
        return;
      }
      
      const id = document.getElementById('about-id').value;
      const content = document.getElementById('about-content').value;
      const available = document.getElementById('about-available').checked;
      const order = parseInt(document.getElementById('about-order').value);
      const visible = document.getElementById('about-visible').checked;

      const aboutData = {
        content,
        available,
        order,
        visible,
        updatedAt: new Date().toISOString()
      };

      if (id) {
        // Update existing document
        await updateDoc(doc(db, 'about', id), aboutData);
        showFeedback('About entry updated successfully!');
      } else {
        // Add new document
        await addDoc(collection(db, 'about'), {
          ...aboutData,
          createdAt: new Date().toISOString()
        });
        showFeedback('About entry added successfully!');
      }
      // Reset form
      aboutForm.reset();
      document.getElementById('about-id').value = '';
    } catch (error) {
      console.error('Error saving about entry:', error);
      showFeedback('Failed to save about entry: ' + error.message, false);
    }
  });

  // New button for About section
  const aboutNewBtn = document.getElementById('about-new-btn');
  if (aboutNewBtn) {
    aboutNewBtn.addEventListener('click', () => {
      aboutForm.reset();
      document.getElementById('about-id').value = '';
    });
  }
}

// ---------- SKILLS SECTION ----------
const loadSkillsData = () => {
  const skillsList = document.getElementById('skills-list');
  if (!skillsList) return;

  // Real-time listener for Skills data
  onSnapshot(query(collection(db, 'skills'), orderBy('order')), (snapshot) => {
    skillsList.innerHTML = '';
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${data.title}</span>
        <div>
          <button onclick="editSkill('${docSnap.id}', ${JSON.stringify(data).replace(/"/g, '&quot;')})">Edit</button>
          <button class="danger" onclick="deleteSkill('${docSnap.id}')">Delete</button>
        </div>
      `;
      skillsList.appendChild(li);
    });
  });
};

// Global functions for Skills section
globalThis.editSkill = (id, data) => {
  document.getElementById('skill-id').value = id;
  document.getElementById('skill-title').value = data.title;
  document.getElementById('skill-description').value = data.description || '';
  document.getElementById('skill-level').value = data.level || 'novice';
  document.getElementById('skill-type').value = data.type || 'frontend';
  document.getElementById('skill-percentage').value = data.percentage || 50;
  document.getElementById('skill-order').value = data.order || 0;
  document.getElementById('skill-visible').checked = data.visible !== false;
  // Load progression points for this skill
  loadSkillProgression(id, data);
};

globalThis.deleteSkill = async (id) => {
  if (confirm('Are you sure you want to delete this skill?')) {
    try {
      const isAdmin = await isAdminLoggedIn();
      if (!isAdmin) {
        showFeedback('Please login with admin credentials!', false);
        return;
      }
      await deleteDoc(doc(db, 'skills', id));
      showFeedback('Skill deleted successfully!');
    } catch (error) {
      console.error('Error deleting skill:', error);
      showFeedback('Failed to delete skill: ' + error.message, false);
    }
  }
};

// Skills form submission
const skillsForm = document.getElementById('skills-form');
if (skillsForm) {
  skillsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      // Check if user is authenticated and has admin privileges
      const isAdmin = await isAdminLoggedIn();
      if (!isAdmin) {
        showFeedback('Please login with admin credentials!', false);
        return;
      }
      
      const id = document.getElementById('skill-id').value;
      const title = document.getElementById('skill-title').value;
      const description = document.getElementById('skill-description').value;
      const level = document.getElementById('skill-level').value;
      const type = document.getElementById('skill-type').value;
      const percentage = parseInt(document.getElementById('skill-percentage').value);
      const order = parseInt(document.getElementById('skill-order').value);
      const visible = document.getElementById('skill-visible').checked;

      const skillData = {
        title,
        description,
        level,
        type,
        percentage,
        order,
        visible,
        updatedAt: new Date().toISOString()
      };

      if (id) {
        await updateDoc(doc(db, 'skills', id), skillData);
        showFeedback('Skill updated successfully!');
      } else {
        await addDoc(collection(db, 'skills'), {
          ...skillData,
          createdAt: new Date().toISOString(),
          progression: []
        });
        showFeedback('Skill added successfully!');
      }
      skillsForm.reset();
      document.getElementById('skill-id').value = '';
      // Reset progression container
      document.getElementById('skill-progression-container').innerHTML = '<p>Select a skill from the list above to manage its progression points.</p>';
    } catch (error) {
      console.error('Error saving skill:', error);
      showFeedback('Failed to save skill: ' + error.message, false);
    }
  });

  // New button for Skills section
  const skillNewBtn = document.getElementById('skill-new-btn');
  if (skillNewBtn) {
    skillNewBtn.addEventListener('click', () => {
      skillsForm.reset();
      document.getElementById('skill-id').value = '';
      // Reset progression container
      document.getElementById('skill-progression-container').innerHTML = '<p>Select a skill from the list above to manage its progression points.</p>';
    });
  }
}

// ---------- SKILL PROGRESSION MANAGEMENT ----------
let currentSkillId = null;
let currentSkillData = null;

// Load skill progression points
const loadSkillProgression = (skillId, skillData) => {
  currentSkillId = skillId;
  currentSkillData = skillData;
  
  const container = document.getElementById('skill-progression-container');
  if (!container) return;
  
  const progression = skillData.progression || [];
  
  container.innerHTML = `
    <h4>Progression for: ${skillData.title}</h4>
    <form id="progression-form">
      <input type="hidden" id="progression-skill-id" value="${skillId}">
      <input type="hidden" id="progression-edit-index" value="">
      <div class="progression-form-row">
        <input type="text" id="progression-year" placeholder="Year (e.g., 2023)" required>
        <input type="number" id="progression-level" placeholder="Level (0-100)" min="0" max="100" required>
        <button type="submit">Add Progression Point</button>
      </div>
    </form>
    <div id="progression-list">
      ${progression.length > 0 ? progression.map((point, index) => `
        <div class="progression-item">
          <span>${point.year}: ${point.level}%</span>
          <div>
            <button onclick="editProgressionPoint(${index})">Edit</button>
            <button class="danger" onclick="deleteProgressionPoint(${index})">Delete</button>
          </div>
        </div>
      `).join('') : '<p>No progression points yet. Add your first one above.</p>'}
    </div>
  `;
  
  // Add event listener for progression form
  const progressionForm = document.getElementById('progression-form');
  if (progressionForm) {
    progressionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveProgressionPoint();
    });
  }
};

// Save a progression point
const saveProgressionPoint = async () => {
  if (!currentSkillId || !currentSkillData) return;
  
  const year = document.getElementById('progression-year').value;
  const level = parseInt(document.getElementById('progression-level').value);
  
  if (!year || isNaN(level)) {
    alert('Please enter both year and level');
    return;
  }
  
  try {
    // Get current progression array
    const progression = [...(currentSkillData.progression || [])];
    
    // Check if we're editing an existing point or adding a new one
    const editIndex = parseInt(document.getElementById('progression-edit-index').value);
    if (!isNaN(editIndex) && editIndex >= 0) {
      // Edit existing point
      progression[editIndex] = { year, level };
      document.getElementById('progression-edit-index').value = '';
    } else {
      // Add new point
      progression.push({ year, level });
    }
    
    // Sort progression by year
    progression.sort((a, b) => a.year.localeCompare(b.year));
    
    // Update the skill with new progression
    await updateDoc(doc(db, 'skills', currentSkillId), {
      progression,
      updatedAt: new Date().toISOString()
    });
    
    // Reset form
    document.getElementById('progression-form').reset();
    
    // Refresh progression list
    loadSkillProgression(currentSkillId, { ...currentSkillData, progression });
  } catch (error) {
    console.error('Error saving progression point:', error);
    alert('Failed to save progression point: ' + error.message);
  }
};

// Edit a progression point
window.editProgressionPoint = (index) => {
  if (!currentSkillData || !currentSkillData.progression) return;
  
  const point = currentSkillData.progression[index];
  if (!point) return;
  
  // Fill form with existing point data
  document.getElementById('progression-year').value = point.year;
  document.getElementById('progression-level').value = point.level;
  document.getElementById('progression-edit-index').value = index;
};

// Delete a progression point
window.deleteProgressionPoint = async (index) => {
  if (!currentSkillId || !currentSkillData || !currentSkillData.progression) return;
  
  if (confirm('Are you sure you want to delete this progression point?')) {
    try {
      // Create a new progression array without the deleted point
      const newProgression = currentSkillData.progression.filter((_, i) => i !== index);
      
      // Update the skill
      await updateDoc(doc(db, 'skills', currentSkillId), {
        progression: newProgression,
        updatedAt: new Date().toISOString()
      });
      
      // Refresh progression list
      loadSkillProgression(currentSkillId, { ...currentSkillData, progression: newProgression });
    } catch (error) {
      console.error('Error deleting progression point:', error);
      alert('Failed to delete progression point: ' + error.message);
    }
  }
};

// ---------- PROJECTS SECTION ----------
const loadProjectsData = () => {
  const projectsList = document.getElementById('projects-list');
  if (!projectsList) return;

  // Real-time listener for Projects data
  onSnapshot(query(collection(db, 'projects'), orderBy('order')), (snapshot) => {
    projectsList.innerHTML = '';
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${data.title}</span>
        <div>
          <button onclick="editProject('${docSnap.id}', ${JSON.stringify(data).replace(/"/g, '&quot;')})">Edit</button>
          <button class="danger" onclick="deleteProject('${docSnap.id}')">Delete</button>
        </div>
      `;
      projectsList.appendChild(li);
    });
  });
};

// Global functions for Projects section
globalThis.editProject = (id, data) => {
  document.getElementById('project-id').value = id;
  document.getElementById('project-title').value = data.title;
  document.getElementById('project-description').value = data.description || '';
  document.getElementById('project-image-urls').value = Array.isArray(data.imageUrls) ? data.imageUrls.join('\n') : '';
  document.getElementById('project-github-url').value = data.githubUrl || '';
  document.getElementById('project-live-url').value = data.liveUrl || '';
  
  // Handle project category
  const category = data.category || '';
  const categorySelect = document.getElementById('project-category');
  const customCategoryGroup = document.getElementById('custom-category-group');
  const customCategoryInput = document.getElementById('project-custom-category');
  
  // Check if category is one of the predefined options
  const predefinedCategories = ['web', 'mobile', 'design', 'data'];
  if (predefinedCategories.includes(category)) {
    categorySelect.value = category;
    customCategoryGroup.style.display = 'none';
    customCategoryInput.value = '';
  } else {
    categorySelect.value = 'other';
    customCategoryGroup.style.display = 'block';
    customCategoryInput.value = category || '';
  }
  
  document.getElementById('project-order').value = data.order || 0;
  document.getElementById('project-visible').checked = data.visible !== false;
};

// Initialize project category event listener
const initProjectCategoryListener = () => {
  const categorySelect = document.getElementById('project-category');
  const customCategoryGroup = document.getElementById('custom-category-group');
  
  if (categorySelect && customCategoryGroup) {
    categorySelect.addEventListener('change', (e) => {
      if (e.target.value === 'other') {
        customCategoryGroup.style.display = 'block';
      } else {
        customCategoryGroup.style.display = 'none';
        document.getElementById('project-custom-category').value = '';
      }
    });
  }
};

globalThis.deleteProject = async (id) => {
  if (confirm('Are you sure you want to delete this project?')) {
    try {
      const isAdmin = await isAdminLoggedIn();
      if (!isAdmin) {
        showFeedback('Please login with admin credentials!', false);
        return;
      }
      await deleteDoc(doc(db, 'projects', id));
      showFeedback('Project deleted successfully!');
    } catch (error) {
      console.error('Error deleting project:', error);
      showFeedback('Failed to delete project: ' + error.message, false);
    }
  }
};

// ---------- SOCIAL LINKS SECTION ----------
const loadSocialLinksData = () => {
  const socialLinksList = document.getElementById('social-links-list');
  if (!socialLinksList) return;

  // Real-time listener for Social Links data
  onSnapshot(query(collection(db, 'socialLinks'), orderBy('order')), (snapshot) => {
    socialLinksList.innerHTML = '';
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${data.title}</span>
        <div>
          <button onclick="editSocialLink('${docSnap.id}', ${JSON.stringify(data).replace(/"/g, '&quot;')})">Edit</button>
          <button class="danger" onclick="deleteSocialLink('${docSnap.id}')">Delete</button>
        </div>
      `;
      socialLinksList.appendChild(li);
    });
  });
};

// ---------- EXPERIENCE SECTION ----------
const loadExperienceData = () => {
  const experienceList = document.getElementById('experience-list');
  if (!experienceList) return;

  // Real-time listener for Experience data
  onSnapshot(query(collection(db, 'experience'), orderBy('order')), (snapshot) => {
    experienceList.innerHTML = '';
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${data.title}</span>
        <div>
          <button onclick="editExperience('${docSnap.id}', ${JSON.stringify(data).replace(/"/g, '&quot;')})">Edit</button>
          <button class="danger" onclick="deleteExperience('${docSnap.id}')">Delete</button>
        </div>
      `;
      experienceList.appendChild(li);
    });
  });
};

// Global functions for Experience section
globalThis.editExperience = (id, data) => {
  document.getElementById('experience-id').value = id;
  document.getElementById('experience-job-title').value = data.title;
  document.getElementById('experience-company-name').value = data.company;
  document.getElementById('experience-role').value = data.role || '';
  document.getElementById('experience-responsibilities').value = data.responsibilities || '';
  document.getElementById('experience-from-date').value = data.fromDate || '';
  document.getElementById('experience-to-date').value = data.toDate || '';
  document.getElementById('experience-to-present').checked = data.toPresent || false;
  document.getElementById('experience-order').value = data.order || 0;
  document.getElementById('experience-visible').checked = data.visible !== false;
};

globalThis.deleteExperience = async (id) => {
  if (confirm('Are you sure you want to delete this experience?')) {
    try {
      const isAdmin = await isAdminLoggedIn();
      if (!isAdmin) {
        showFeedback('Please login with admin credentials!', false);
        return;
      }
      await deleteDoc(doc(db, 'experience', id));
      showFeedback('Experience deleted successfully!');
    } catch (error) {
      console.error('Error deleting experience:', error);
      showFeedback('Failed to delete experience: ' + error.message, false);
    }
  }
};

// ---------- EDUCATION SECTION ----------
const loadEducationData = () => {
  const educationList = document.getElementById('education-list');
  if (!educationList) return;

  // Real-time listener for Education data
  onSnapshot(query(collection(db, 'education'), orderBy('order')), (snapshot) => {
    educationList.innerHTML = '';
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${data.degree} - ${data.institution}</span>
        <div>
          <button onclick="editEducation('${docSnap.id}', ${JSON.stringify(data).replace(/"/g, '&quot;')})">Edit</button>
          <button class="danger" onclick="deleteEducation('${docSnap.id}')">Delete</button>
        </div>
      `;
      educationList.appendChild(li);
    });
  });
};

// Global functions for Education section
globalThis.editEducation = (id, data) => {
  document.getElementById('education-id').value = id;
  document.getElementById('education-degree').value = data.degree || '';
  document.getElementById('education-specialization').value = data.specialization || '';
  document.getElementById('education-institution').value = data.institution || '';
  document.getElementById('education-gradeValue').value = data.gradeValue || '';
  document.getElementById('education-grade').value = data.grade || '';
  document.getElementById('education-order').value = data.order || 0;
  document.getElementById('education-visible').checked = data.visible !== false;
};

globalThis.deleteEducation = async (id) => {
  if (confirm('Are you sure you want to delete this education entry?')) {
    try {
      const isAdmin = await isAdminLoggedIn();
      if (!isAdmin) {
        showFeedback('Please login with admin credentials!', false);
        return;
      }
      await deleteDoc(doc(db, 'education', id));
      showFeedback('Education entry deleted successfully!');
    } catch (error) {
      console.error('Error deleting education:', error);
      showFeedback('Failed to delete education entry: ' + error.message, false);
    }
  }
};

// ---------- ROADMAP SECTION ----------
const loadRoadmapData = () => {
  const roadmapList = document.getElementById('roadmap-list');
  if (!roadmapList) return;

  // Real-time listener for Roadmap data
  onSnapshot(query(collection(db, 'roadmap'), orderBy('order')), (snapshot) => {
    roadmapList.innerHTML = '';
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${data.title}</span>
        <div>
          <button onclick="editRoadmap('${docSnap.id}', ${JSON.stringify(data).replace(/"/g, '&quot;')})">Edit</button>
          <button class="danger" onclick="deleteRoadmap('${docSnap.id}')">Delete</button>
        </div>
      `;
      roadmapList.appendChild(li);
    });
  });
};

// Global functions for Roadmap section
globalThis.editRoadmap = (id, data) => {
  document.getElementById('roadmap-id').value = id;
  document.getElementById('roadmap-title').value = data.title || '';
  document.getElementById('roadmap-description').value = data.description || '';
  
  // Update summary metrics
  document.getElementById('roadmap-learned').value = data.learned || 0;
  document.getElementById('roadmap-planned').value = data.planned || 0;
  document.getElementById('roadmap-executed').value = data.executed || 0;
  document.getElementById('roadmap-practiced').value = data.practiced || 0;
  document.getElementById('roadmap-achieved').value = data.achieved || 0;
  document.getElementById('roadmap-overall').value = data.overall || 0;
  
  document.getElementById('roadmap-order').value = data.order || 0;
  document.getElementById('roadmap-visible').checked = data.visible !== false;
  
  // Update display options
  const displaySettings = data.display || {
    description: true,
    summary: true,
    achievement: true,
    timeline: true,
    metrics: true
  };
  document.getElementById('roadmap-display-description').checked = displaySettings.description;
  document.getElementById('roadmap-display-summary').checked = displaySettings.summary;
  document.getElementById('roadmap-display-achievement').checked = displaySettings.achievement;
  document.getElementById('roadmap-display-timeline').checked = displaySettings.timeline;
  document.getElementById('roadmap-display-metrics').checked = displaySettings.metrics;
  
  // Update progression timeline entries
  const progressionContainer = document.getElementById('roadmap-progression-container');
  const progressionEntries = data.progression || [
    { date: '2023-01', type: 'planned', value: 0 }
  ];
  
  // Clear existing entries
  progressionContainer.innerHTML = '';
  
  // Add each progression entry
  progressionEntries.forEach((entry, index) => {
    const newEntry = document.createElement('div');
    newEntry.className = 'progression-entry';
    newEntry.innerHTML = `
      <div class="form-row">
        <div class="form-group">
          <label for="progression-date-${index}">Date (YYYY-MM)</label>
          <input type="text" class="progression-date" placeholder="2023-01" value="${entry.date || '2023-01'}"/>
        </div>
        <div class="form-group">
          <label for="progression-type-${index}">Type</label>
          <select class="progression-type">
            <option value="planned" ${entry.type === 'planned' ? 'selected' : ''}>Planned</option>
            <option value="learning" ${entry.type === 'learning' ? 'selected' : ''}>Learning</option>
            <option value="practiced" ${entry.type === 'practiced' ? 'selected' : ''}>Practiced</option>
            <option value="executed" ${entry.type === 'executed' ? 'selected' : ''}>Executed</option>
            <option value="achieved" ${entry.type === 'achieved' ? 'selected' : ''}>Achieved</option>
          </select>
        </div>
        <div class="form-group">
          <label for="progression-value-${index}">Value (%)</label>
          <input type="number" class="progression-value" placeholder="0-100" min="0" max="100" value="${entry.value || 0}"/>
        </div>
        <button type="button" class="remove-progression-btn">Remove</button>
      </div>
    `;
    progressionContainer.appendChild(newEntry);
    
    // Add event listener for remove button
    newEntry.querySelector('.remove-progression-btn').addEventListener('click', () => {
      newEntry.remove();
    });
  });
};

globalThis.deleteRoadmap = async (id) => {
  if (confirm('Are you sure you want to delete this roadmap item?')) {
    try {
      const isAdmin = await isAdminLoggedIn();
      if (!isAdmin) {
        showFeedback('Please login with admin credentials!', false);
        return;
      }
      await deleteDoc(doc(db, 'roadmap', id));
      showFeedback('Roadmap item deleted successfully!');
    } catch (error) {
      console.error('Error deleting roadmap item:', error);
      showFeedback('Failed to delete roadmap item: ' + error.message, false);
    }
  }
};

// ---------- ACHIEVEMENTS SECTION ----------
const loadAchievementsData = () => {
  const achievementsList = document.getElementById('achievements-list');
  if (!achievementsList) return;

  // Real-time listener for Achievements data
  onSnapshot(query(collection(db, 'achievements'), orderBy('order')), (snapshot) => {
    achievementsList.innerHTML = '';
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${data.title}</span>
        <div>
          <button onclick="editAchievement('${docSnap.id}', ${JSON.stringify(data).replace(/"/g, '&quot;')})">Edit</button>
          <button class="danger" onclick="deleteAchievement('${docSnap.id}')">Delete</button>
        </div>
      `;
      achievementsList.appendChild(li);
    });
  });
};

// ---------- CERTIFICATES SECTION ----------
const loadCertificatesData = () => {
  const certificatesList = document.getElementById('certificates-list');
  if (!certificatesList) return;

  // Real-time listener for Certificates data
  onSnapshot(query(collection(db, 'certificates'), orderBy('order')), (snapshot) => {
    certificatesList.innerHTML = '';
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${data.title}</span>
        <div>
          <button onclick="editCertificate('${docSnap.id}', ${JSON.stringify(data).replace(/"/g, '&quot;')})"></button>
          <button class="danger" onclick="deleteCertificate('${docSnap.id}')">Delete</button>
        </div>
      `;
      certificatesList.appendChild(li);
    });
  });
};

// ---------- RESUME SECTION ----------
const loadResumeData = () => {
  const resumeList = document.getElementById('resume-list');
  if (!resumeList) return;

  // Real-time listener for Resume data
  onSnapshot(query(collection(db, 'resume'), orderBy('order')), (snapshot) => {
    resumeList.innerHTML = '';
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${data.name}</span>
        <div>
          <button onclick="editResume('${docSnap.id}', ${JSON.stringify(data).replace(/"/g, '&quot;')})"></button>
          <button class="danger" onclick="deleteResume('${docSnap.id}')">Delete</button>
        </div>
      `;
      resumeList.appendChild(li);
    });
  });
};

// Resume form submission
const resumeForm = document.getElementById('resume-form');
if (resumeForm) {
  resumeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('resume-id').value;
    const name = document.getElementById('resume-name').value;
    const url = document.getElementById('resume-url').value;
    const order = parseInt(document.getElementById('resume-order').value);
    const visible = document.getElementById('resume-visible').checked;

    const resumeData = {
      name,
      url,
      order,
      visible,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      if (id) {
        // Update existing resume
        await updateDoc(doc(db, 'resume', id), resumeData);
      } else {
        // Add new resume
        await addDoc(collection(db, 'resume'), resumeData);
      }
      resumeForm.reset();
      document.getElementById('resume-id').value = '';
    } catch (error) {
      console.error('Error saving resume:', error);
      alert('Error saving resume: ' + error.message);
    }
  });
}

// Edit resume function
globalThis.editResume = (id, data) => {
  document.getElementById('resume-id').value = id;
  document.getElementById('resume-name').value = data.name;
  document.getElementById('resume-url').value = data.url;
  document.getElementById('resume-order').value = data.order;
  document.getElementById('resume-visible').checked = data.visible;
};

// Delete resume function
globalThis.deleteResume = async (id) => {
  if (confirm('Are you sure you want to delete this resume?')) {
    try {
      await deleteDoc(doc(db, 'resume', id));
    } catch (error) {
      console.error('Error deleting resume:', error);
      alert('Error deleting resume: ' + error.message);
    }
  }
};

// New resume button
document.getElementById('resume-new-btn')?.addEventListener('click', () => {
  resumeForm.reset();
  document.getElementById('resume-id').value = '';
});

// Initialize resume
loadResumeData();

// ---------- CONTACTS SECTION ----------
const loadContactsData = () => {
  const contactsList = document.getElementById('contacts-list');
  if (!contactsList) return;

  // Real-time listener for Contact submissions data (ordered by newest first)
  onSnapshot(query(collection(db, 'contacts'), orderBy('timestamp', 'desc')), (snapshot) => {
    contactsList.innerHTML = '';
    
    if (snapshot.empty) {
      const li = document.createElement('li');
      li.textContent = 'No contact submissions yet.';
      contactsList.appendChild(li);
      return;
    }
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="contact-info">
          <h4>${data.name} - ${data.email}</h4>
          ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
          ${data.linkedin ? `<p><strong>LinkedIn:</strong> <a href="${data.linkedin}" target="_blank">${data.linkedin}</a></p>` : ''}
          <p><strong>Date:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
          <div class="contact-message">
            <strong>Message:</strong>
            <p>${data.message}</p>
          </div>
        </div>
        <div>
          <button class="danger" onclick="deleteContact('${docSnap.id}')">Delete</button>
        </div>
      `;
      contactsList.appendChild(li);
    });
  });
};

// Global function to delete a contact submission
window.deleteContact = async (id) => {
  if (confirm('Are you sure you want to delete this contact submission?')) {
    try {
      await deleteDoc(doc(db, 'contacts', id));
    } catch (error) {
      console.error('Error deleting contact submission:', error);
      alert('Failed to delete contact submission: ' + error.message);
    }
  }
};

// ---------- CONTENT SCHEDULER SECTION ----------
const loadSchedulerData = () => {
  const schedulerList = document.getElementById('scheduler-list');
  if (!schedulerList) return;

  // Real-time listener for Scheduler data
  onSnapshot(query(collection(db, 'scheduler'), orderBy('publishDate')), (snapshot) => {
    schedulerList.innerHTML = '';
    
    if (snapshot.empty) {
      const li = document.createElement('li');
      li.textContent = 'No scheduled content yet.';
      schedulerList.appendChild(li);
      return;
    }
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const li = document.createElement('li');
      li.innerHTML = `
        <div>
          <h4>${data.title} (${data.contentType})</h4>
          <p><strong>Status:</strong> ${data.status}</p>
          <p><strong>Publish Date:</strong> ${new Date(data.publishDate).toLocaleString()}</p>
          <p>${data.content.substring(0, 100)}${data.content.length > 100 ? '...' : ''}</p>
        </div>
        <div>
          <button onclick="editScheduler('${docSnap.id}', ${JSON.stringify(data).replace(/"/g, '&quot;')})">Edit</button>
          <button class="danger" onclick="deleteScheduler('${docSnap.id}')">Delete</button>
        </div>
      `;
      schedulerList.appendChild(li);
    });
  });
};

// Global functions for Scheduler section
window.editScheduler = (id, data) => {
  document.getElementById('scheduler-id').value = id;
  document.getElementById('scheduler-content-type').value = data.contentType || 'project';
  document.getElementById('scheduler-title').value = data.title || '';
  document.getElementById('scheduler-content').value = data.content || '';
  document.getElementById('scheduler-publish-date').value = data.publishDate ? new Date(data.publishDate).toISOString().slice(0, 16) : '';
  document.getElementById('scheduler-status').value = data.status || 'draft';
  document.getElementById('scheduler-order').value = data.order || 0;
};

window.deleteScheduler = async (id) => {
  if (confirm('Are you sure you want to delete this scheduled content?')) {
    try {
      await deleteDoc(doc(db, 'scheduler', id));
    } catch (error) {
      console.error('Error deleting scheduled content:', error);
      alert('Failed to delete scheduled content: ' + error.message);
    }
  }
};

// Scheduler form submission
const schedulerForm = document.getElementById('scheduler-form');
if (schedulerForm) {
  schedulerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('scheduler-id').value;
    const contentType = document.getElementById('scheduler-content-type').value;
    const title = document.getElementById('scheduler-title').value;
    const content = document.getElementById('scheduler-content').value;
    const publishDate = new Date(document.getElementById('scheduler-publish-date').value).toISOString();
    const status = document.getElementById('scheduler-status').value;
    const order = parseInt(document.getElementById('scheduler-order').value);

    const schedulerData = {
      contentType,
      title,
      content,
      publishDate,
      status,
      order,
      updatedAt: new Date().toISOString()
    };

    try {
      if (id) {
        // Update existing document
        await updateDoc(doc(db, 'scheduler', id), schedulerData);
      } else {
        // Add new document
        await addDoc(collection(db, 'scheduler'), {
          ...schedulerData,
          createdAt: new Date().toISOString()
        });
      }
      // Reset form
      schedulerForm.reset();
      document.getElementById('scheduler-id').value = '';
    } catch (error) {
      console.error('Error saving scheduled content:', error);
      alert('Failed to save scheduled content: ' + error.message);
    }
  });

  // New button for Scheduler section
  const schedulerNewBtn = document.getElementById('scheduler-new-btn');
  if (schedulerNewBtn) {
    schedulerNewBtn.addEventListener('click', () => {
      schedulerForm.reset();
      document.getElementById('scheduler-id').value = '';
    });
  }
};

// Initial check and listener for auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    toggleAdminView(true);
    initializeStatusChecker();
    loadFirestoreData();
    initHeroForm();
  } else {
    toggleAdminView(false);
  }
});

// ---------- TESTIMONIALS SECTION ----------
// Load Testimonials data
const loadTestimonialsData = () => {
  const testimonialsList = document.getElementById('testimonials-list');
  if (!testimonialsList) return;

  // Real-time listener for Testimonials data
  onSnapshot(query(collection(db, 'testimonials'), orderBy('order')), (snapshot) => {
    testimonialsList.innerHTML = '';
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${data.name} - ${data.role} at ${data.company}</span>
        <div>
          <button onclick="editTestimonial('${docSnap.id}', ${JSON.stringify(data).replace(/"/g, '&quot;')})"></button>
          <button class="danger" onclick="deleteTestimonial('${docSnap.id}')">Delete</button>
        </div>
      `;
      testimonialsList.appendChild(li);
    });
  });
};

// Testimonials form submission - using improved feedback and input handling
const testimonialsForm = document.getElementById('testimonials-form');
if (testimonialsForm) {
  testimonialsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      // Check if user is authenticated and has admin privileges
      const isAdmin = await isAdminLoggedIn();
      if (!isAdmin) {
        showFeedback('Please login with admin credentials!', false);
        return;
      }
      
      const id = document.getElementById('testimonial-id').value;
      const name = document.getElementById('testimonial-name').value;
      const role = document.getElementById('testimonial-role').value;
      const company = document.getElementById('testimonial-company').value;
      const message = document.getElementById('testimonial-message').value;
      const rating = normalizeNumber(document.getElementById('testimonial-rating').value);
      const image = document.getElementById('testimonial-image').value;
      const order = normalizeNumber(document.getElementById('testimonial-order').value);
      const visible = document.getElementById('testimonial-visible').checked;

      // Validate required fields
      if (!name || !message) {
        showFeedback('Name and message are required!', false);
        return;
      }

      const testimonialData = {
        name,
        role,
        company,
        message,
        rating,
        image: image || null,
        order,
        visible,
        updatedAt: new Date().toISOString()
      };

      if (id) {
        await updateDoc(doc(db, 'testimonials', id), testimonialData);
        showFeedback('Testimonial updated successfully!');
      } else {
        await addDoc(collection(db, 'testimonials'), {
          ...testimonialData,
          createdAt: new Date().toISOString()
        });
        showFeedback('Testimonial added successfully!');
      }
      
      testimonialsForm.reset();
      document.getElementById('testimonial-id').value = '';
    } catch (error) {
      console.error('Error saving testimonial (full details):', {
        code: error.code,
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      if (error.code === 'permission-denied') {
        showFeedback('Permission denied: Please ensure you are logged in with the correct admin email and try again.', false);
      } else if (error.code === 'unavailable') {
        showFeedback('Firebase service unavailable. Please check your internet connection and try again.', false);
      } else {
        showFeedback(`Failed to save testimonial: ${error.message}`, false);
      }
    }
  });
}

// Edit testimonial function
globalThis.editTestimonial = (id, data) => {
  document.getElementById('testimonial-id').value = id;
  document.getElementById('testimonial-name').value = data.name;
  document.getElementById('testimonial-role').value = data.role;
  document.getElementById('testimonial-company').value = data.company;
  document.getElementById('testimonial-message').value = data.message;
  document.getElementById('testimonial-rating').value = data.rating;
  document.getElementById('testimonial-image').value = data.image || '';
  document.getElementById('testimonial-order').value = data.order;
  document.getElementById('testimonial-visible').checked = data.visible;
};

// Delete testimonial function
globalThis.deleteTestimonial = async (id) => {
  if (confirm('Are you sure you want to delete this testimonial?')) {
    try {
      const isAdmin = await isAdminLoggedIn();
      if (!isAdmin) {
        showFeedback('Please login with admin credentials!', false);
        return;
      }
      await deleteDoc(doc(db, 'testimonials', id));
      showFeedback('Testimonial deleted successfully!');
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      showFeedback('Failed to delete testimonial: ' + error.message, false);
    }
  }
};

// New testimonial button
document.getElementById('testimonial-new-btn')?.addEventListener('click', () => {
  testimonialsForm.reset();
  document.getElementById('testimonial-id').value = '';
});

// Initialize testimonials
loadTestimonialsData();

// ---------- PROJECTS FORM SUBMISSION ----------
const projectsForm = document.getElementById('projects-form');
if (projectsForm) {
  // Initialize category listener
  initProjectCategoryListener();
  
  projectsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      // Check if user is authenticated and has admin privileges
      const isAdmin = await isAdminLoggedIn();
      if (!isAdmin) {
        showFeedback('Please login with admin credentials!', false);
        return;
      }
      
      const id = document.getElementById('project-id').value;
      const title = document.getElementById('project-title').value;
      const description = document.getElementById('project-description').value;
      const imageUrls = document.getElementById('project-image-urls').value.split('\n').filter(url => url.trim() !== '');
      const githubUrl = document.getElementById('project-github-url').value;
      const liveUrl = document.getElementById('project-live-url').value;
      
      // Get project category
      const categorySelect = document.getElementById('project-category');
      const selectedCategory = categorySelect.value;
      let category = selectedCategory;
      
      // If 'other' is selected, use the custom category value
      if (selectedCategory === 'other') {
        const customCategory = document.getElementById('project-custom-category').value.trim();
        if (customCategory) {
          category = customCategory.toLowerCase();
        } else {
          // Default to 'web' if no category is provided
          category = 'web';
        }
      }
      
      const order = normalizeNumber(document.getElementById('project-order').value);
      const visible = document.getElementById('project-visible').checked;

      const projectData = {
        title,
        description,
        imageUrls,
        githubUrl: githubUrl || null,
        liveUrl: liveUrl || null,
        category,
        order,
        visible,
        updatedAt: new Date().toISOString()
      };

      if (id) {
        await updateDoc(doc(db, 'projects', id), projectData);
        showFeedback('Project updated successfully!');
      } else {
        await addDoc(collection(db, 'projects'), {
          ...projectData,
          createdAt: new Date().toISOString()
        });
        showFeedback('Project added successfully!');
      }
      projectsForm.reset();
      document.getElementById('project-id').value = '';
    } catch (error) {
      console.error('Error saving project:', error);
      showFeedback('Failed to save project: ' + error.message, false);
    }
  });

  // New button for Projects section
  const projectNewBtn = document.getElementById('project-new-btn');
  if (projectNewBtn) {
    projectNewBtn.addEventListener('click', () => {
      projectsForm.reset();
      document.getElementById('project-id').value = '';
    });
  }
}

// ---------- EXPERIENCE FORM SUBMISSION ----------
const experienceForm = document.getElementById('experience-form');
if (experienceForm) {
  experienceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      // Check if user is authenticated and has admin privileges
      const isAdmin = await isAdminLoggedIn();
      if (!isAdmin) {
        showFeedback('Please login with admin credentials!', false);
        return;
      }
      
      const id = document.getElementById('experience-id').value;
      const jobTitle = document.getElementById('experience-job-title').value;
      const companyName = document.getElementById('experience-company-name').value;
      const role = document.getElementById('experience-role').value;
      const responsibilities = document.getElementById('experience-responsibilities').value;
      const fromDate = document.getElementById('experience-from-date').value;
      const toDate = document.getElementById('experience-to-date').value;
      const toPresent = document.getElementById('experience-to-present').checked;
      const order = normalizeNumber(document.getElementById('experience-order').value);
      const visible = document.getElementById('experience-visible').checked;

      const experienceData = {
        title: jobTitle,
        company: companyName,
        role,
        responsibilities,
        fromDate,
        toDate: toPresent ? null : toDate,
        toPresent,
        order,
        visible,
        updatedAt: new Date().toISOString()
      };

      if (id) {
        await updateDoc(doc(db, 'experience', id), experienceData);
        showFeedback('Experience updated successfully!');
      } else {
        await addDoc(collection(db, 'experience'), {
          ...experienceData,
          createdAt: new Date().toISOString()
        });
        showFeedback('Experience added successfully!');
      }
      experienceForm.reset();
      document.getElementById('experience-id').value = '';
    } catch (error) {
      console.error('Error saving experience:', error);
      showFeedback('Failed to save experience: ' + error.message, false);
    }
  });

  // New button for Experience section
  const experienceNewBtn = document.getElementById('experience-new-btn');
  if (experienceNewBtn) {
    experienceNewBtn.addEventListener('click', () => {
      experienceForm.reset();
      document.getElementById('experience-id').value = '';
    });
  }
}

// ---------- EDUCATION FORM SUBMISSION ----------
const educationForm = document.getElementById('education-form');
if (educationForm) {
  educationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      // Check if user is authenticated and has admin privileges
      const isAdmin = await isAdminLoggedIn();
      if (!isAdmin) {
        showFeedback('Please login with admin credentials!', false);
        return;
      }
      
      const id = document.getElementById('education-id').value;
      const degree = document.getElementById('education-degree').value;
      const specialization = document.getElementById('education-specialization').value;
      const institution = document.getElementById('education-institution').value;
      const gradeValue = document.getElementById('education-gradeValue').value;
      const grade = document.getElementById('education-grade').value;
      const order = normalizeNumber(document.getElementById('education-order').value);
      const visible = document.getElementById('education-visible').checked;

      const educationData = {
        degree,
        specialization,
        institution,
        gradeValue,
        grade,
        order,
        visible,
        updatedAt: new Date().toISOString()
      };

      if (id) {
        await updateDoc(doc(db, 'education', id), educationData);
        showFeedback('Education updated successfully!');
      } else {
        await addDoc(collection(db, 'education'), {
          ...educationData,
          createdAt: new Date().toISOString()
        });
        showFeedback('Education added successfully!');
      }
      educationForm.reset();
      document.getElementById('education-id').value = '';
    } catch (error) {
      console.error('Error saving education:', error);
      showFeedback('Failed to save education: ' + error.message, false);
    }
  });

  // New button for Education section
  const educationNewBtn = document.getElementById('education-new-btn');
  if (educationNewBtn) {
    educationNewBtn.addEventListener('click', () => {
      educationForm.reset();
      document.getElementById('education-id').value = '';
    });
  }
}

// ---------- ROADMAP FORM SUBMISSION ----------
const roadmapForm = document.getElementById('roadmap-form');
if (roadmapForm) {
  // Add progression entry functionality
  const progressionContainer = document.getElementById('roadmap-progression-container');
  const addProgressionBtn = document.getElementById('add-progression-btn');
  
  if (addProgressionBtn) {
    addProgressionBtn.addEventListener('click', () => {
      const entryCount = progressionContainer.querySelectorAll('.progression-entry').length;
      const newEntry = document.createElement('div');
      newEntry.className = 'progression-entry';
      newEntry.innerHTML = `
        <div class="form-row">
          <div class="form-group">
            <label for="progression-date-${entryCount}">Date (YYYY-MM)</label>
            <input type="text" class="progression-date" placeholder="2023-01" value="2023-01"/>
          </div>
          <div class="form-group">
            <label for="progression-type-${entryCount}">Type</label>
            <select class="progression-type">
              <option value="planned">Planned</option>
              <option value="learning">Learning</option>
              <option value="practiced">Practiced</option>
              <option value="executed">Executed</option>
              <option value="achieved">Achieved</option>
            </select>
          </div>
          <div class="form-group">
            <label for="progression-value-${entryCount}">Value (%)</label>
            <input type="number" class="progression-value" placeholder="0-100" min="0" max="100" value="0"/>
          </div>
          <button type="button" class="remove-progression-btn">Remove</button>
        </div>
      `;
      progressionContainer.appendChild(newEntry);
      
      // Add event listener for new remove button
      newEntry.querySelector('.remove-progression-btn').addEventListener('click', () => {
        newEntry.remove();
      });
    });
  }
  
  // Add event listeners for existing remove buttons
  progressionContainer.querySelectorAll('.remove-progression-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.progression-entry').remove();
    });
  });
  
  roadmapForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      // Check if user is authenticated and has admin privileges
      const isAdmin = await isAdminLoggedIn();
      if (!isAdmin) {
        showFeedback('Please login with admin credentials!', false);
        return;
      }
      
      const id = document.getElementById('roadmap-id').value;
      const title = document.getElementById('roadmap-title').value;
      const description = document.getElementById('roadmap-description').value;
      
      // Get summary metrics
      const learned = normalizeNumber(document.getElementById('roadmap-learned').value);
      const planned = normalizeNumber(document.getElementById('roadmap-planned').value);
      const executed = normalizeNumber(document.getElementById('roadmap-executed').value);
      const practiced = normalizeNumber(document.getElementById('roadmap-practiced').value);
      const achieved = normalizeNumber(document.getElementById('roadmap-achieved').value);
      const overall = normalizeNumber(document.getElementById('roadmap-overall').value);
      
      // Get progression timeline entries
      const progressionEntries = [];
      const entries = progressionContainer.querySelectorAll('.progression-entry');
      entries.forEach(entry => {
        const date = entry.querySelector('.progression-date').value;
        const type = entry.querySelector('.progression-type').value;
        const value = normalizeNumber(entry.querySelector('.progression-value').value);
        progressionEntries.push({ date, type, value });
      });
      
      const order = normalizeNumber(document.getElementById('roadmap-order').value);
      const visible = document.getElementById('roadmap-visible').checked;
      
      // Get display options
      const displayDescription = document.getElementById('roadmap-display-description').checked;
      const displaySummary = document.getElementById('roadmap-display-summary').checked;
      const displayAchievement = document.getElementById('roadmap-display-achievement').checked;
      const displayTimeline = document.getElementById('roadmap-display-timeline').checked;
      const displayMetrics = document.getElementById('roadmap-display-metrics').checked;

      const roadmapData = {
        title,
        description,
        learned,
        planned,
        executed,
        practiced,
        achieved,
        overall,
        progression: progressionEntries,
        order,
        visible,
        display: {
          description: displayDescription,
          summary: displaySummary,
          achievement: displayAchievement,
          timeline: displayTimeline,
          metrics: displayMetrics
        },
        updatedAt: new Date().toISOString()
      };

      if (id) {
        await updateDoc(doc(db, 'roadmap', id), roadmapData);
        showFeedback('Roadmap updated successfully!');
      } else {
        await addDoc(collection(db, 'roadmap'), {
          ...roadmapData,
          createdAt: new Date().toISOString()
        });
        showFeedback('Roadmap added successfully!');
      }
      roadmapForm.reset();
      document.getElementById('roadmap-id').value = '';
      
      // Reset progression container to have one entry
      progressionContainer.innerHTML = `
        <div class="progression-entry">
          <div class="form-row">
            <div class="form-group">
              <label for="progression-date-0">Date (YYYY-MM)</label>
              <input type="text" class="progression-date" placeholder="2023-01" value="2023-01"/>
            </div>
            <div class="form-group">
              <label for="progression-type-0">Type</label>
              <select class="progression-type">
                <option value="planned">Planned</option>
                <option value="learning">Learning</option>
                <option value="practiced">Practiced</option>
                <option value="executed">Executed</option>
                <option value="achieved">Achieved</option>
              </select>
            </div>
            <div class="form-group">
              <label for="progression-value-0">Value (%)</label>
              <input type="number" class="progression-value" placeholder="0-100" min="0" max="100" value="0"/>
            </div>
            <button type="button" class="remove-progression-btn">Remove</button>
          </div>
        </div>
      `;
      
      // Re-add event listeners for remove buttons
      progressionContainer.querySelectorAll('.remove-progression-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          btn.closest('.progression-entry').remove();
        });
      });
    } catch (error) {
      console.error('Error saving roadmap:', error);
      showFeedback('Failed to save roadmap: ' + error.message, false);
    }
  });

  // New button for Roadmap section
  const roadmapNewBtn = document.getElementById('roadmap-new-btn');
  if (roadmapNewBtn) {
    roadmapNewBtn.addEventListener('click', () => {
      roadmapForm.reset();
      document.getElementById('roadmap-id').value = '';
      
      // Reset progression container to have one entry
      progressionContainer.innerHTML = `
        <div class="progression-entry">
          <div class="form-row">
            <div class="form-group">
              <label for="progression-date-0">Date (YYYY-MM)</label>
              <input type="text" class="progression-date" placeholder="2023-01" value="2023-01"/>
            </div>
            <div class="form-group">
              <label for="progression-type-0">Type</label>
              <select class="progression-type">
                <option value="planned">Planned</option>
                <option value="learning">Learning</option>
                <option value="practiced">Practiced</option>
                <option value="executed">Executed</option>
                <option value="achieved">Achieved</option>
              </select>
            </div>
            <div class="form-group">
              <label for="progression-value-0">Value (%)</label>
              <input type="number" class="progression-value" placeholder="0-100" min="0" max="100" value="0"/>
            </div>
            <button type="button" class="remove-progression-btn">Remove</button>
          </div>
        </div>
      `;
      
      // Re-add event listeners for remove buttons
      progressionContainer.querySelectorAll('.remove-progression-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          btn.closest('.progression-entry').remove();
        });
      });
    });
  }
}

// Global functions for Achievements section
globalThis.editAchievement = (id, data) => {
  document.getElementById('achievements-id').value = id;
  document.getElementById('achievements-title').value = data.title || '';
  document.getElementById('achievements-description').value = data.description || '';
  document.getElementById('achievements-order').value = data.order || 0;
  document.getElementById('achievements-visible').checked = data.visible !== false;
};

globalThis.deleteAchievement = async (id) => {
  if (confirm('Are you sure you want to delete this achievement?')) {
    try {
      const isAdmin = await isAdminLoggedIn();
      if (!isAdmin) {
        showFeedback('Please login with admin credentials!', false);
        return;
      }
      await deleteDoc(doc(db, 'achievements', id));
      showFeedback('Achievement deleted successfully!');
    } catch (error) {
      console.error('Error deleting achievement:', error);
      showFeedback('Failed to delete achievement: ' + error.message, false);
    }
  }
};

// ---------- ACHIEVEMENTS FORM SUBMISSION ----------
const achievementsForm = document.getElementById('achievements-form');
if (achievementsForm) {
  achievementsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      // Check if user is authenticated and has admin privileges
      const isAdmin = await isAdminLoggedIn();
      if (!isAdmin) {
        showFeedback('Please login with admin credentials!', false);
        return;
      }
      
      const id = document.getElementById('achievements-id').value;
      const title = document.getElementById('achievements-title').value;
      const description = document.getElementById('achievements-description').value;
      const order = normalizeNumber(document.getElementById('achievements-order').value);
      const visible = document.getElementById('achievements-visible').checked;

      const achievementData = {
        title,
        description,
        order,
        visible,
        updatedAt: new Date().toISOString()
      };

      if (id) {
        await updateDoc(doc(db, 'achievements', id), achievementData);
        showFeedback('Achievement updated successfully!');
      } else {
        await addDoc(collection(db, 'achievements'), {
          ...achievementData,
          createdAt: new Date().toISOString()
        });
        showFeedback('Achievement added successfully!');
      }
      achievementsForm.reset();
      document.getElementById('achievements-id').value = '';
    } catch (error) {
      console.error('Error saving achievement:', error);
      showFeedback('Failed to save achievement: ' + error.message, false);
    }
  });

  // New button for Achievements section
  const achievementsNewBtn = document.getElementById('achievements-new-btn');
  if (achievementsNewBtn) {
    achievementsNewBtn.addEventListener('click', () => {
      achievementsForm.reset();
      document.getElementById('achievements-id').value = '';
    });
  }
}

// Global functions for Certificates section
globalThis.editCertificate = (id, data) => {
  document.getElementById('certificates-id').value = id;
  document.getElementById('certificates-title').value = data.title || '';
  document.getElementById('certificates-issuer').value = data.issuer || '';
  document.getElementById('certificates-date').value = data.date || '';
  document.getElementById('certificates-url').value = data.url || '';
  document.getElementById('certificates-order').value = data.order || 0;
  document.getElementById('certificates-visible').checked = data.visible !== false;
};

globalThis.deleteCertificate = async (id) => {
  if (confirm('Are you sure you want to delete this certificate?')) {
    try {
      const isAdmin = await isAdminLoggedIn();
      if (!isAdmin) {
        showFeedback('Please login with admin credentials!', false);
        return;
      }
      await deleteDoc(doc(db, 'certificates', id));
      showFeedback('Certificate deleted successfully!');
    } catch (error) {
      console.error('Error deleting certificate:', error);
      showFeedback('Failed to delete certificate: ' + error.message, false);
    }
  }
};

// ---------- CERTIFICATES FORM SUBMISSION ----------
const certificatesForm = document.getElementById('certificates-form');
if (certificatesForm) {
  certificatesForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      // Check if user is authenticated and has admin privileges
      const isAdmin = await isAdminLoggedIn();
      if (!isAdmin) {
        showFeedback('Please login with admin credentials!', false);
        return;
      }
      
      const id = document.getElementById('certificates-id').value;
      const title = document.getElementById('certificates-title').value;
      const issuer = document.getElementById('certificates-issuer').value;
      const date = document.getElementById('certificates-date').value;
      const url = document.getElementById('certificates-url').value;
      const order = normalizeNumber(document.getElementById('certificates-order').value);
      const visible = document.getElementById('certificates-visible').checked;

      const certificateData = {
        title,
        issuer,
        date: date || null,
        url: url || null,
        order,
        visible,
        updatedAt: new Date().toISOString()
      };

      if (id) {
        await updateDoc(doc(db, 'certificates', id), certificateData);
        showFeedback('Certificate updated successfully!');
      } else {
        await addDoc(collection(db, 'certificates'), {
          ...certificateData,
          createdAt: new Date().toISOString()
        });
        showFeedback('Certificate added successfully!');
      }
      certificatesForm.reset();
      document.getElementById('certificates-id').value = '';
    } catch (error) {
      console.error('Error saving certificate:', error);
      showFeedback('Failed to save certificate: ' + error.message, false);
    }
  });

  // New button for Certificates section
  const certificatesNewBtn = document.getElementById('certificates-new-btn');
  if (certificatesNewBtn) {
    certificatesNewBtn.addEventListener('click', () => {
      certificatesForm.reset();
      document.getElementById('certificates-id').value = '';
    });
  }
}

// Global functions for Resume section
globalThis.editResume = (id, data) => {
  document.getElementById('resume-id').value = id;
  document.getElementById('resume-name').value = data.name || '';
  document.getElementById('resume-url').value = data.url || '';
  document.getElementById('resume-order').value = data.order || 0;
  document.getElementById('resume-visible').checked = data.visible !== false;
};

globalThis.deleteResume = async (id) => {
  if (confirm('Are you sure you want to delete this resume?')) {
    try {
      const isAdmin = await isAdminLoggedIn();
      if (!isAdmin) {
        showFeedback('Please login with admin credentials!', false);
        return;
      }
      await deleteDoc(doc(db, 'resume', id));
      showFeedback('Resume deleted successfully!');
    } catch (error) {
      console.error('Error deleting resume:', error);
      showFeedback('Failed to delete resume: ' + error.message, false);
    }
  }
};

// ---------- RESUME FORM SUBMISSION ----------
// Update existing resume form listener with improved functionality
const existingResumeForm = document.getElementById('resume-form');
if (existingResumeForm) {
  // Remove any existing event listeners by reassigning the form
  existingResumeForm.replaceWith(existingResumeForm.cloneNode(true));
  const resumeForm = document.getElementById('resume-form');
  
  resumeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      // Check if user is authenticated and has admin privileges
      const isAdmin = await isAdminLoggedIn();
      if (!isAdmin) {
        showFeedback('Please login with admin credentials!', false);
        return;
      }
      
      const id = document.getElementById('resume-id').value;
      const name = document.getElementById('resume-name').value;
      const url = document.getElementById('resume-url').value;
      const order = normalizeNumber(document.getElementById('resume-order').value);
      const visible = document.getElementById('resume-visible').checked;

      const resumeData = {
        name,
        url,
        order,
        visible,
        updatedAt: new Date().toISOString()
      };

      if (id) {
        await updateDoc(doc(db, 'resume', id), resumeData);
        showFeedback('Resume updated successfully!');
      } else {
        await addDoc(collection(db, 'resume'), {
          ...resumeData,
          createdAt: new Date().toISOString()
        });
        showFeedback('Resume added successfully!');
      }
      resumeForm.reset();
      document.getElementById('resume-id').value = '';
    } catch (error) {
      console.error('Error saving resume:', error);
      showFeedback('Failed to save resume: ' + error.message, false);
    }
  });
}

// Global functions for Social Links section
globalThis.editSocialLink = (id, data) => {
  document.getElementById('social-link-id').value = id;
  document.getElementById('social-link-title').value = data.title || '';
  document.getElementById('social-link-url').value = data.url || '';
  document.getElementById('social-link-order').value = data.order || 0;
  document.getElementById('social-link-visible').checked = data.visible !== false;
};

globalThis.deleteSocialLink = async (id) => {
  if (confirm('Are you sure you want to delete this social link?')) {
    try {
      const isAdmin = await isAdminLoggedIn();
      if (!isAdmin) {
        showFeedback('Please login with admin credentials!', false);
        return;
      }
      await deleteDoc(doc(db, 'socialLinks', id));
      showFeedback('Social link deleted successfully!');
    } catch (error) {
      console.error('Error deleting social link:', error);
      showFeedback('Failed to delete social link: ' + error.message, false);
    }
  }
};

// ---------- SOCIAL LINKS FORM SUBMISSION ----------
const socialLinksForm = document.getElementById('social-links-form');
if (socialLinksForm) {
  socialLinksForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      // Check if user is authenticated and has admin privileges
      const isAdmin = await isAdminLoggedIn();
      if (!isAdmin) {
        showFeedback('Please login with admin credentials!', false);
        return;
      }
      
      const id = document.getElementById('social-link-id').value;
      const title = document.getElementById('social-link-title').value;
      const url = document.getElementById('social-link-url').value;
      const order = normalizeNumber(document.getElementById('social-link-order').value);
      const visible = document.getElementById('social-link-visible').checked;

      const socialLinkData = {
        title,
        url,
        order,
        visible,
        updatedAt: new Date().toISOString()
      };

      if (id) {
        await updateDoc(doc(db, 'socialLinks', id), socialLinkData);
        showFeedback('Social link updated successfully!');
      } else {
        await addDoc(collection(db, 'socialLinks'), {
          ...socialLinkData,
          createdAt: new Date().toISOString()
        });
        showFeedback('Social link added successfully!');
      }
      socialLinksForm.reset();
      document.getElementById('social-link-id').value = '';
    } catch (error) {
      console.error('Error saving social link:', error);
      showFeedback('Failed to save social link: ' + error.message, false);
    }
  });

  // New button for Social Links section
  const socialLinkNewBtn = document.getElementById('social-link-new-btn');
  if (socialLinkNewBtn) {
    socialLinkNewBtn.addEventListener('click', () => {
      socialLinksForm.reset();
      document.getElementById('social-link-id').value = '';
    });
  }
}
