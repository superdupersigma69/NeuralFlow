const NEURALFLOW_API_KEY = 'AIzaSyBbqdgk9DUunsKRULzJdzlyHaFXBc1DnuU';
const NEURALFLOW_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

let conversationHistory = [];
let aiSettings = {
    personality: 'helpful',
    responseLength: 'medium',
    creativity: 0.9,
    customPrompt: ''
};

let currentTheme = 'light';
let savedChats = [];
let currentChatId = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    animateStats();
});

function initializeApp() {
    loadTheme();
    loadSettings();
    loadChatHistory();
    updateChatHistory();
    
    // Show home page by default
    showHomePage();
    
    // Set up event listeners
    setupEventListeners();
}

function initializeAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease';
        observer.observe(card);
    });
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
}

function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const body = document.body;
    const themeIcons = document.querySelectorAll('.theme-icon');
    const themeText = document.getElementById('themeText');
    
    body.setAttribute('data-theme', theme);
    
    if (theme === 'dark') {
        themeIcons.forEach(icon => icon.className = 'fas fa-moon theme-icon');
        if (themeText) themeText.textContent = 'Dark Mode';
    } else {
        themeIcons.forEach(icon => icon.className = 'fas fa-sun theme-icon');
        if (themeText) themeText.textContent = 'Light Mode';
    }
}

function toggleTheme() {
    const body = document.body;
    const themeIcons = document.querySelectorAll('.theme-icon');
    const themeText = document.getElementById('themeText');
    const currentTheme = body.getAttribute('data-theme') || 'light';
    
    if (currentTheme === 'light') {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeIcons.forEach(icon => icon.className = 'fas fa-moon theme-icon');
        if (themeText) themeText.textContent = 'Dark Mode';
    } else {
        body.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        themeIcons.forEach(icon => icon.className = 'fas fa-sun theme-icon');
        if (themeText) themeText.textContent = 'Light Mode';
    }
}

function initializeSettings() {
    const settingsBtn = document.querySelector('.settings-btn');
    const settingsPanel = document.getElementById('settingsPanel');
    const closeBtn = document.querySelector('.close-btn');
    const saveBtn = document.getElementById('saveSettings');
    const creativitySlider = document.getElementById('creativity');
    const creativityValue = document.getElementById('creativityValue');

    if (settingsBtn && settingsPanel) {
        settingsBtn.addEventListener('click', () => {
            settingsPanel.classList.add('active');
        });
    }

    if (closeBtn && settingsPanel) {
        closeBtn.addEventListener('click', () => {
            settingsPanel.classList.remove('active');
        });
    }

    if (creativitySlider && creativityValue) {
        creativitySlider.addEventListener('input', (e) => {
            creativityValue.textContent = e.target.value;
            aiSettings.creativity = parseFloat(e.target.value);
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            aiSettings.personality = document.getElementById('aiPersonality').value;
            aiSettings.responseLength = document.getElementById('responseLength').value;
            aiSettings.customPrompt = document.getElementById('customPrompt').value;
            
            settingsPanel.classList.remove('active');
            
            showNotification('Settings saved!');
        });
    }

    document.addEventListener('click', (e) => {
        if (settingsPanel && !settingsPanel.contains(e.target) && !settingsBtn?.contains(e.target)) {
            settingsPanel.classList.remove('active');
        }
    });
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'settings-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

function getPersonalityPrompt(personality) {
    const prompts = {
        helpful: 'You are a helpful, friendly, and supportive AI assistant. Always be kind, patient, and provide useful information.',
        creative: 'You are a creative, imaginative, and artistic AI assistant. Think outside the box and provide innovative solutions.',
        professional: 'You are a professional, formal, and business-oriented AI assistant. Use formal language and provide structured responses.',
        casual: 'You are a casual, conversational, and relaxed AI assistant. Use informal language and be approachable.',
        humorous: 'You are a witty, funny, and entertaining AI assistant. Include humor and jokes when appropriate.',
        detailed: 'You are a detailed, analytical, and thorough AI assistant. Provide comprehensive explanations and deep insights.'
    };
    return prompts[personality] || prompts.helpful;
}

function getResponseLengthConfig(length) {
    const configs = {
        short: { maxOutputTokens: 500 },
        medium: { maxOutputTokens: 1000 },
        long: { maxOutputTokens: 2048 }
    };
    return configs[length] || configs.medium;
}

function initializeChat() {
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');

    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }

    if (chatInput) {
        chatInput.addEventListener('keydown', handleKeyDown);
    }
}

function addMessage(content, isUser = false) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const welcomeScreen = chatMessages.querySelector('.welcome-screen');
    if (welcomeScreen) {
        welcomeScreen.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.innerHTML = isUser ? '<i class="fas fa-user"></i>' : '<i class="fas fa-brain"></i>';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = `<p>${content}</p>`;
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    messageDiv.style.opacity = '0';
    messageDiv.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateY(0)';
    }, 100);
}

async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');
    const chatMessages = document.getElementById('chatMessages');
    
    const message = chatInput.value.trim();
    if (!message) return;

    // Create new chat if none exists
    if (currentChatId === null) {
        startNewChat();
    }

    addMessage(message, true);
    chatInput.value = '';
    chatInput.style.height = 'auto';
    
    const sendButtonIcon = sendButton.querySelector('i');
    const originalIcon = sendButtonIcon.className;
    sendButtonIcon.className = 'fas fa-spinner fa-spin';
    sendButton.disabled = true;

    try {
        conversationHistory.push({
            role: 'user',
            content: message
        });

        const personalityPrompt = getPersonalityPrompt(aiSettings.personality);
        const lengthConfig = getResponseLengthConfig(aiSettings.responseLength);
        
        let systemPrompt = personalityPrompt;
        if (aiSettings.customPrompt) {
            systemPrompt += '\n\nAdditional instructions: ' + aiSettings.customPrompt;
        }

        const requestBody = {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: systemPrompt + '\n\nUser: ' + message }]
                }
            ],
            generationConfig: {
                temperature: aiSettings.creativity,
                maxOutputTokens: lengthConfig.maxOutputTokens,
                topP: 0.95,
                topK: 40,
                candidateCount: 1
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        };

        const response = await fetch(`${NEURALFLOW_API_URL}?key=${NEURALFLOW_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('NeuralFlow API Error:', response.status, errorText);
            throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
            const aiResponse = data.candidates[0].content.parts[0].text;
            addMessage(aiResponse, false);
            
            conversationHistory.push({
                role: 'assistant',
                content: aiResponse
            });
            
            // Save chat after each message
            saveCurrentChat();
        } else {
            throw new Error('Invalid response format from NeuralFlow API');
        }

    } catch (error) {
        console.error('Error:', error);
        addMessage('I apologize, but I\'m having trouble connecting to the NeuralFlow AI service right now. Please try again in a moment.', false);
    } finally {
        sendButtonIcon.className = originalIcon;
        sendButton.disabled = false;
    }
}

function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

function initializeNavbar() {
    const navbar = document.querySelector('.navbar');
    let lastScrollTop = 0;

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.15)';
            navbar.style.backdropFilter = 'blur(15px)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.1)';
            navbar.style.backdropFilter = 'blur(10px)';
        }

        if (scrollTop > lastScrollTop && scrollTop > 200) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }

        lastScrollTop = scrollTop;
    });
}

function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.hero-content, .hero-visual, .section-title');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.8s ease';
        observer.observe(el);
    });
}

document.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.floating-shapes .shape');
    
    parallaxElements.forEach((element, index) => {
        const speed = 0.5 + (index * 0.1);
        element.style.transform = `translateY(${scrolled * speed}px) rotate(${scrolled * 0.1}deg)`;
    });
});

window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

const typingEffect = (element, text, speed = 50) => {
    let i = 0;
    element.innerHTML = '';
    
    function typeWriter() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(typeWriter, speed);
        }
    }
    
    typeWriter();
};

const heroTitle = document.querySelector('.hero-title .gradient-text');
if (heroTitle) {
    setTimeout(() => {
        typingEffect(heroTitle, 'Next Generation');
    }, 1000);
}

document.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX / window.innerWidth - 0.5;
    const mouseY = e.clientY / window.innerHeight - 0.5;
    
    const parallaxElements = document.querySelectorAll('.floating-shapes .shape');
    parallaxElements.forEach((element, index) => {
        const speed = (index + 1) * 0.5;
        const translateX = mouseX * speed * 40;
        const translateY = mouseY * speed * 40;
        element.style.transform = `translate(${translateX}px, ${translateY}px) rotate(${scrolled * 0.1}deg)`;
    });
    
    const brainCore = document.querySelector('.brain-core');
    if (brainCore) {
        brainCore.style.transform = `translate(-50%, -50%) translate(${mouseX * 20}px, ${mouseY * 20}px)`;
    }
    
    const particles = document.querySelectorAll('.particle');
    particles.forEach((particle, index) => {
        const speed = (index + 1) * 0.5;
        particle.style.transform = `translate(${mouseX * speed * 20}px, ${mouseY * speed * 20}px)`;
    });
});

const featureCards = document.querySelectorAll('.feature-card');
featureCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-15px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
    });
});

const buttons = document.querySelectorAll('.btn');
buttons.forEach(button => {
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-3px) scale(1.05)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0) scale(1)';
    });
});

const socialLinks = document.querySelectorAll('.social-link');
socialLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
        link.style.transform = 'translateY(-5px) rotate(5deg)';
    });
    
    link.addEventListener('mouseleave', () => {
        link.style.transform = 'translateY(0) rotate(0deg)';
    });
});

window.addEventListener('resize', () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
});

const preloadImages = () => {
    const imageUrls = [
        'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
        'https://images.unsplash.com/photo-1676299251950-8d3d5376cdfe?w=800'
    ];
    
    imageUrls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
};

preloadImages();

function initializeAutoResize() {
    const textarea = document.getElementById('chatInput');
    if (textarea) {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 200) + 'px';
        });
    }
}

function initializeSidebar() {
    const menuBtn = document.querySelector('.menu-btn');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
}

function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function sendSuggestion(text) {
    if (currentChatId === null) {
        startNewChat();
    }
    
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.value = text;
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 200) + 'px';
        sendMessage();
    }
}

function showHomePage() {
    document.getElementById('homePage').style.display = 'flex';
    document.getElementById('chatInterface').style.display = 'none';
}

function showChatInterface() {
    document.getElementById('homePage').style.display = 'none';
    document.getElementById('chatInterface').style.display = 'flex';
}

function loadSavedChats() {
    const saved = localStorage.getItem('neuralflow_chats');
    if (saved) {
        savedChats = JSON.parse(saved);
        updateChatHistory();
    }
}

function saveChats() {
    localStorage.setItem('neuralflow_chats', JSON.stringify(savedChats));
}

function generateChatId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function createChatTitle(firstMessage) {
    const words = firstMessage.split(' ').slice(0, 2);
    return words.join(' ') + (firstMessage.split(' ').length > 2 ? '...' : '');
}

function startNewChat() {
    // Save current chat if it exists and has messages
    if (currentChatId && conversationHistory.length > 0) {
        saveCurrentChat();
    }
    
    // Create new chat
    currentChatId = generateChatId();
    conversationHistory = [];
    
    // Add to saved chats
    const newChat = {
        id: currentChatId,
        title: 'New Chat',
        date: new Date().toISOString(),
        messages: []
    };
    
    savedChats.unshift(newChat);
    saveChats();
    updateChatHistory();
    
    // Show chat interface
    showChatInterface();
    
    // Clear chat messages
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.innerHTML = `
            <div class="welcome-screen">
                <div class="welcome-content">
                    <div class="welcome-icon">
                        <div class="icon-container">
                            <i class="fas fa-brain"></i>
                            <div class="icon-glow"></div>
                        </div>
                    </div>
                    <h2>How can I help you today?</h2>
                    <p>I'm NeuralFlow AI, powered by advanced neural networks. Ask me anything!</p>
                    
                    <div class="suggestion-grid">
                        <button class="suggestion-btn" onclick="sendSuggestion('Write a creative story about a robot learning to paint')">
                            <div class="suggestion-icon">
                                <i class="fas fa-palette"></i>
                            </div>
                            <div class="suggestion-content">
                                <span class="suggestion-title">Creative Writing</span>
                                <span class="suggestion-desc">Write a creative story about a robot learning to paint</span>
                            </div>
                            <div class="suggestion-glow"></div>
                        </button>
                        <button class="suggestion-btn" onclick="sendSuggestion('Explain quantum computing in simple terms')">
                            <div class="suggestion-icon">
                                <i class="fas fa-atom"></i>
                            </div>
                            <div class="suggestion-content">
                                <span class="suggestion-title">Science Explained</span>
                                <span class="suggestion-desc">Explain quantum computing in simple terms</span>
                            </div>
                            <div class="suggestion-glow"></div>
                        </button>
                        <button class="suggestion-btn" onclick="sendSuggestion('Help me plan a weekend trip to the mountains')">
                            <div class="suggestion-icon">
                                <i class="fas fa-mountain"></i>
                            </div>
                            <div class="suggestion-content">
                                <span class="suggestion-title">Travel Planning</span>
                                <span class="suggestion-desc">Help me plan a weekend trip to the mountains</span>
                            </div>
                            <div class="suggestion-glow"></div>
                        </button>
                        <button class="suggestion-btn" onclick="sendSuggestion('Write a professional email to schedule a meeting')">
                            <div class="suggestion-icon">
                                <i class="fas fa-envelope"></i>
                            </div>
                            <div class="suggestion-content">
                                <span class="suggestion-title">Professional Writing</span>
                                <span class="suggestion-desc">Write a professional email to schedule a meeting</span>
                            </div>
                            <div class="suggestion-glow"></div>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Update chat title
    updateChatTitle('New Chat');
}

function loadChat(chatId) {
    const chat = savedChats.find(c => c.id === chatId);
    if (!chat) return;
    
    currentChatId = chatId;
    conversationHistory = chat.messages || [];
    
    // Show chat interface
    showChatInterface();
    
    // Load messages
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
        
        if (conversationHistory.length === 0) {
            chatMessages.innerHTML = `
                <div class="welcome-screen">
                    <div class="welcome-content">
                        <div class="welcome-icon">
                            <div class="icon-container">
                                <i class="fas fa-brain"></i>
                                <div class="icon-glow"></div>
                            </div>
                        </div>
                        <h2>How can I help you today?</h2>
                        <p>I'm NeuralFlow AI, powered by advanced neural networks. Ask me anything!</p>
                        
                        <div class="suggestion-grid">
                            <button class="suggestion-btn" onclick="sendSuggestion('Write a creative story about a robot learning to paint')">
                                <div class="suggestion-icon">
                                    <i class="fas fa-palette"></i>
                                </div>
                                <div class="suggestion-content">
                                    <span class="suggestion-title">Creative Writing</span>
                                    <span class="suggestion-desc">Write a creative story about a robot learning to paint</span>
                                </div>
                                <div class="suggestion-glow"></div>
                            </button>
                            <button class="suggestion-btn" onclick="sendSuggestion('Explain quantum computing in simple terms')">
                                <div class="suggestion-icon">
                                    <i class="fas fa-atom"></i>
                                </div>
                                <div class="suggestion-content">
                                    <span class="suggestion-title">Science Explained</span>
                                    <span class="suggestion-desc">Explain quantum computing in simple terms</span>
                                </div>
                                <div class="suggestion-glow"></div>
                            </button>
                            <button class="suggestion-btn" onclick="sendSuggestion('Help me plan a weekend trip to the mountains')">
                                <div class="suggestion-icon">
                                    <i class="fas fa-mountain"></i>
                                </div>
                                <div class="suggestion-content">
                                    <span class="suggestion-title">Travel Planning</span>
                                    <span class="suggestion-desc">Help me plan a weekend trip to the mountains</span>
                                </div>
                                <div class="suggestion-glow"></div>
                            </button>
                            <button class="suggestion-btn" onclick="sendSuggestion('Write a professional email to schedule a meeting')">
                                <div class="suggestion-icon">
                                    <i class="fas fa-envelope"></i>
                                </div>
                                <div class="suggestion-content">
                                    <span class="suggestion-title">Professional Writing</span>
                                    <span class="suggestion-desc">Write a professional email to schedule a meeting</span>
                                </div>
                                <div class="suggestion-glow"></div>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            conversationHistory.forEach(msg => {
                addMessage(msg.content, msg.role === 'user');
            });
        }
    }
    
    // Update chat title
    updateChatTitle(chat.title);
    updateChatHistory();
}

function deleteChat(chatId, event) {
    event.stopPropagation();
    
    if (confirm('Are you sure you want to delete this chat?')) {
        savedChats = savedChats.filter(chat => chat.id !== chatId);
        saveChats();
        
        if (currentChatId === chatId) {
            currentChatId = null;
            conversationHistory = [];
            showHomePage();
        }
        
        updateChatHistory();
    }
}

function saveCurrentChat() {
    if (!currentChatId || conversationHistory.length === 0) return;
    
    const chatIndex = savedChats.findIndex(chat => chat.id === currentChatId);
    if (chatIndex === -1) return;
    
    const firstUserMessage = conversationHistory.find(msg => msg.role === 'user');
    const title = firstUserMessage ? createChatTitle(firstUserMessage.content) : 'New Chat';
    
    savedChats[chatIndex] = {
        ...savedChats[chatIndex],
        title,
        messages: conversationHistory,
        date: new Date().toISOString()
    };
    
    saveChats();
    updateChatHistory();
}

function updateChatHistory() {
    const chatHistory = document.getElementById('chatHistory');
    if (!chatHistory) return;
    
    chatHistory.innerHTML = '';
    
    savedChats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
        chatItem.onclick = () => loadChat(chat.id);
        
        chatItem.innerHTML = `
            <i class="fas fa-message"></i>
            <div class="chat-info">
                <div class="chat-title">${chat.title}</div>
            </div>
            <div class="delete-chat" onclick="deleteChat('${chat.id}', event)">
                <i class="fas fa-trash"></i>
            </div>
        `;
        
        chatHistory.appendChild(chatItem);
    });
}

function updateChatTitle(title) {
    const titleElement = document.getElementById('currentChatTitle');
    if (titleElement) {
        titleElement.textContent = title;
    }
}

function toggleSettings() {
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel) {
        settingsPanel.classList.toggle('active');
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

window.sendMessage = sendMessage;
window.sendSuggestion = sendSuggestion;
window.startNewChat = startNewChat;
window.toggleSettings = toggleSettings;
window.toggleSidebar = toggleSidebar;
window.toggleTheme = toggleTheme;
window.handleKeyDown = handleKeyDown;

function enterAI() {
    // Add smooth transition effect
    const homePage = document.getElementById('homePage');
    const chatInterface = document.getElementById('chatInterface');
    
    homePage.style.opacity = '0';
    homePage.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        showChatInterface();
        chatInterface.style.opacity = '0';
        chatInterface.style.transform = 'scale(1.05)';
        
        setTimeout(() => {
            chatInterface.style.opacity = '1';
            chatInterface.style.transform = 'scale(1)';
        }, 50);
    }, 300);
}

function animateStats() {
    const stats = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-target'));
                animateCounter(entry.target, target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    stats.forEach(stat => observer.observe(stat));
}

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 100;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 20);
}

// Set up event listeners
function setupEventListeners() {
    // Initialize all the existing functionality
    initializeAnimations();
    initializeChat();
    initializeSmoothScrolling();
    initializeNavbar();
    initializeScrollAnimations();
    initializeSettings();
    initializeAutoResize();
    initializeSidebar();
    initializeTheme();
    loadSavedChats();
    initializeInteractiveCards();
}

function initializeInteractiveCards() {
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (centerY - y) / 10;
            const rotateY = (x - centerX) / 10;
            
            card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
    });
}

document.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX / window.innerWidth - 0.5;
    const mouseY = e.clientY / window.innerHeight - 0.5;
    
    const parallaxElements = document.querySelectorAll('.floating-shapes .shape');
    parallaxElements.forEach((element, index) => {
        const speed = (index + 1) * 0.5;
        const translateX = mouseX * speed * 40;
        const translateY = mouseY * speed * 40;
        element.style.transform = `translate(${translateX}px, ${translateY}px) rotate(${scrolled * 0.1}deg)`;
    });
    
    const brainCore = document.querySelector('.brain-core');
    if (brainCore) {
        brainCore.style.transform = `translate(-50%, -50%) translate(${mouseX * 20}px, ${mouseY * 20}px)`;
    }
    
    const particles = document.querySelectorAll('.particle');
    particles.forEach((particle, index) => {
        const speed = (index + 1) * 0.5;
        particle.style.transform = `translate(${mouseX * speed * 20}px, ${mouseY * speed * 20}px)`;
    });
}); 