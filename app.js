// Constants
const STORAGE_KEY = 'itemPickerLists';
const CURRENT_LIST_KEY = 'itemPickerCurrentList';
const COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
    '#FF9FF3', '#54A0FF', '#48DBFB', '#FF9F43', '#00D2D3',
    '#1DD1A1', '#FF6348', '#2E86DE', '#EE5A6F', '#FFC312'
];

// State
let items = [];
let isSpinning = false;
let currentRotation = 0;
let savedLists = {};

// DOM Elements
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spin-btn');
const itemsInput = document.getElementById('items-input');
const updateWheelBtn = document.getElementById('update-wheel-btn');
const itemCountSpan = document.getElementById('item-count');
const savedListsSelect = document.getElementById('saved-lists');
const loadListBtn = document.getElementById('load-list-btn');
const deleteListBtn = document.getElementById('delete-list-btn');
const saveListBtn = document.getElementById('save-list-btn');
const listNameInput = document.getElementById('list-name');
const winnerDisplay = document.getElementById('winner-display');
const winnerText = document.getElementById('winner-text');

// Initialize
function init() {
    loadSavedLists();
    loadCurrentList();
    updateItemCount();
    drawWheel();
    setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
    spinBtn.addEventListener('click', spinWheel);
    updateWheelBtn.addEventListener('click', updateWheel);
    itemsInput.addEventListener('input', updateItemCount);
    loadListBtn.addEventListener('click', loadSelectedList);
    deleteListBtn.addEventListener('click', deleteSelectedList);
    saveListBtn.addEventListener('click', saveCurrentList);
}

// Local Storage Functions
function loadSavedLists() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            savedLists = JSON.parse(stored);
            updateSavedListsDropdown();
        } catch (e) {
            console.error('Error loading saved lists:', e);
            savedLists = {};
        }
    }
}

function saveLists() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedLists));
    updateSavedListsDropdown();
}

function loadCurrentList() {
    const stored = localStorage.getItem(CURRENT_LIST_KEY);
    if (stored) {
        try {
            const data = JSON.parse(stored);
            items = data.items || [];
            itemsInput.value = items.join('\n');
            updateItemCount();
            drawWheel();
        } catch (e) {
            console.error('Error loading current list:', e);
        }
    }
}

function saveCurrentListToStorage() {
    const data = {
        items: items,
        timestamp: Date.now()
    };
    localStorage.setItem(CURRENT_LIST_KEY, JSON.stringify(data));
}

function updateSavedListsDropdown() {
    savedListsSelect.innerHTML = '<option value="">-- Select a saved list --</option>';
    Object.keys(savedLists).sort().forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        savedListsSelect.appendChild(option);
    });
}

// List Management
function updateWheel() {
    const text = itemsInput.value.trim();
    items = text.split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);

    updateItemCount();
    drawWheel();
    saveCurrentListToStorage();
    hideWinner();
}

function updateItemCount() {
    const text = itemsInput.value.trim();
    const count = text.split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0).length;
    itemCountSpan.textContent = count;
}

function saveCurrentList() {
    const name = listNameInput.value.trim();
    if (!name) {
        alert('Please enter a name for the list');
        return;
    }

    if (items.length === 0) {
        alert('Cannot save an empty list');
        return;
    }

    savedLists[name] = {
        items: items,
        timestamp: Date.now()
    };

    saveLists();
    listNameInput.value = '';
    alert(`List "${name}" saved successfully!`);
}

function loadSelectedList() {
    const selectedName = savedListsSelect.value;
    if (!selectedName) {
        alert('Please select a list to load');
        return;
    }

    const list = savedLists[selectedName];
    if (list && list.items) {
        items = list.items;
        itemsInput.value = items.join('\n');
        updateItemCount();
        drawWheel();
        saveCurrentListToStorage();
        hideWinner();
        alert(`List "${selectedName}" loaded successfully!`);
    }
}

function deleteSelectedList() {
    const selectedName = savedListsSelect.value;
    if (!selectedName) {
        alert('Please select a list to delete');
        return;
    }

    if (confirm(`Are you sure you want to delete "${selectedName}"?`)) {
        delete savedLists[selectedName];
        saveLists();
        alert(`List "${selectedName}" deleted successfully!`);
    }
}

// Wheel Drawing
function drawWheel() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (items.length === 0) {
        // Draw empty wheel
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#f0f0f0';
        ctx.fill();
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw message
        ctx.fillStyle = '#999';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Add items to spin!', centerX, centerY);
        return;
    }

    const anglePerItem = (2 * Math.PI) / items.length;

    // Draw segments
    items.forEach((item, index) => {
        const startAngle = currentRotation + index * anglePerItem;
        const endAngle = startAngle + anglePerItem;
        const color = COLORS[index % COLORS.length];

        // Draw segment
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + anglePerItem / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        // Truncate long text
        let displayText = item;
        if (displayText.length > 15) {
            displayText = displayText.substring(0, 12) + '...';
        }

        ctx.fillText(displayText, radius * 0.65, 0);
        ctx.restore();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 4;
    ctx.stroke();
}

// Spinning Animation
function spinWheel() {
    if (isSpinning) return;
    if (items.length === 0) {
        alert('Please add items to the list first!');
        return;
    }

    hideWinner();
    isSpinning = true;
    spinBtn.disabled = true;

    // Random spin duration and final position
    const spinDuration = 3000 + Math.random() * 2000; // 3-5 seconds
    const numberOfSpins = 5 + Math.random() * 5; // 5-10 full rotations
    const randomAngle = Math.random() * 2 * Math.PI;
    const totalRotation = numberOfSpins * 2 * Math.PI + randomAngle;

    const startTime = Date.now();
    const startRotation = currentRotation;

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);

        // Easing function for smooth deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3);

        currentRotation = startRotation + totalRotation * easeOut;
        drawWheel();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Normalize rotation
            currentRotation = currentRotation % (2 * Math.PI);
            drawWheel();
            isSpinning = false;
            spinBtn.disabled = false;

            // Determine winner
            const winnerIndex = getWinnerIndex();
            showWinner(items[winnerIndex]);
        }
    }

    animate();
}

function getWinnerIndex() {
    // The pointer is at the top (12 o'clock position)
    // We need to find which segment is at the top
    const anglePerItem = (2 * Math.PI) / items.length;

    // Normalize the rotation to 0-2π
    let normalizedRotation = currentRotation % (2 * Math.PI);
    if (normalizedRotation < 0) normalizedRotation += 2 * Math.PI;

    // The top of the wheel is at π/2 (90 degrees, pointing up)
    // We need to find which segment is at 3π/2 (270 degrees, pointing down where pointer is)
    const pointerAngle = (3 * Math.PI / 2) - normalizedRotation;
    let adjustedAngle = pointerAngle % (2 * Math.PI);
    if (adjustedAngle < 0) adjustedAngle += 2 * Math.PI;

    const winnerIndex = Math.floor(adjustedAngle / anglePerItem);
    return winnerIndex % items.length;
}

// Winner Display
function showWinner(winner) {
    winnerText.textContent = winner;
    winnerDisplay.classList.remove('hidden');
    createConfetti();

    // Play celebration sound (optional - would need audio file)
    // new Audio('celebration.mp3').play();
}

function hideWinner() {
    winnerDisplay.classList.add('hidden');
}

function createConfetti() {
    const confettiContainer = document.getElementById('confetti');
    confettiContainer.innerHTML = '';

    const confettiColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#F7DC6F', '#BB8FCE'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.background = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        confettiContainer.appendChild(confetti);
    }
}

// Start the app
init();
