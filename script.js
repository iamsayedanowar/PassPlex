"use strict";

const CHAR_SETS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:\'",.<>/?'
};

const CONFIG = {
    minLength: 4,
    maxLength: 128,
    defaultLength: 12,
    guessesPerSecond: 1e12
};

const elements = {
    lengthSlider: document.getElementById('length-slider'),
    lengthBox: document.getElementById('length-box'),
    lengthVal: document.getElementById('length-val'),
    sliderMinus: document.getElementById('slider-minus'),
    sliderPlus: document.getElementById('slider-plus'),
    checkUpper: document.getElementById('upper'),
    checkLower: document.getElementById('lower'),
    checkNumbers: document.getElementById('numbers'),
    checkSymbols: document.getElementById('symbols'),
    excludeInput: document.getElementById('exclude'),
    passwordField: document.getElementById('password'),
    strengthField: document.getElementById('strength'),
    crackTimeField: document.getElementById('crack-time'),
    copyBtn: document.querySelector('.copy-btn')
};

const clamp = (value, min = CONFIG.minLength, max = CONFIG.maxLength) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) return min;
    return Math.min(Math.max(num, min), max);
};

const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const getActiveCharSets = () => {
    const sets = {};
    if (elements.checkUpper.checked) sets.upper = CHAR_SETS.upper;
    if (elements.checkLower.checked) sets.lower = CHAR_SETS.lower;
    if (elements.checkNumbers.checked) sets.numbers = CHAR_SETS.numbers;
    if (elements.checkSymbols.checked) sets.symbols = CHAR_SETS.symbols;
    return sets;
};

const getAllowedChars = () => {
    const activeSets = getActiveCharSets();
    const excludeChars = new Set(elements.excludeInput.value.split(''));

    let allowedChars = '';
    Object.values(activeSets).forEach(set => {
        allowedChars += set;
    });

    return allowedChars.split('').filter(char => !excludeChars.has(char)).join('');
};

const getFilteredCharSets = () => {
    const activeSets = getActiveCharSets();
    const excludeChars = new Set(elements.excludeInput.value.split(''));

    const filteredSets = {};
    Object.entries(activeSets).forEach(([key, set]) => {
        const filtered = set.split('').filter(char => !excludeChars.has(char)).join('');
        if (filtered) filteredSets[key] = filtered;
    });

    return filteredSets;
};

const syncLength = (value, triggerGeneration = true) => {
    const clampedValue = clamp(value);

    elements.lengthBox.value = clampedValue;
    elements.lengthSlider.value = clampedValue;
    elements.lengthVal.textContent = clampedValue;

    const currentPassword = elements.passwordField.value;
    if (currentPassword.length > clampedValue) {
        elements.passwordField.value = currentPassword.substring(0, clampedValue);
        evaluatePassword();
    }

    if (triggerGeneration) {
        generatePassword();
    }
};

const filterPasswordInput = (input) => {
    const allowedChars = getAllowedChars();
    return input.split('').filter(char => allowedChars.includes(char)).join('');
};

const filterCurrentPassword = () => {
    const currentPassword = elements.passwordField.value;
    const filteredPassword = filterPasswordInput(currentPassword);

    if (filteredPassword !== currentPassword) {
        elements.passwordField.value = filteredPassword;
    }

    const newLength = clamp(filteredPassword.length);
    elements.lengthVal.textContent = newLength;
    elements.lengthSlider.value = newLength;
    elements.lengthBox.value = newLength;

    evaluatePassword();
};

const generatePassword = () => {
    const charSets = getFilteredCharSets();
    const length = clamp(elements.lengthSlider.value);

    if (Object.keys(charSets).length === 0) {
        setPassword('');
        updateStrengthDisplay('-', '-', '');
        return;
    }

    const allChars = Object.values(charSets).join('');

    if (allChars.length === 0) {
        setPassword('');
        updateStrengthDisplay('-', '-', '');
        return;
    }

    const passwordArray = [];
    const charSetKeys = Object.keys(charSets);

    charSetKeys.forEach(key => {
        const set = charSets[key];
        if (set.length > 0) {
            const randomIndex = Math.floor(Math.random() * set.length);
            passwordArray.push(set[randomIndex]);
        }
    });

    while (passwordArray.length < length) {
        const randomIndex = Math.floor(Math.random() * allChars.length);
        passwordArray.push(allChars[randomIndex]);
    }

    for (let i = passwordArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
    }

    setPassword(passwordArray.join(''));
};

const setPassword = (password) => {
    elements.passwordField.value = password;

    const length = clamp(password.length);
    elements.lengthVal.textContent = length;
    elements.lengthSlider.value = length;
    elements.lengthBox.value = length;

    evaluatePassword();
};

const calculateCrackTime = (password) => {
    const length = password.length;
    const poolSize = getAllowedChars().length || 1;

    if (!password || poolSize < 1) return 0;

    const totalCombinations = Math.pow(poolSize, length);

    const averageGuesses = totalCombinations / 2;

    const seconds = averageGuesses / CONFIG.guessesPerSecond;

    return seconds / (60 * 60 * 24 * 365.25);
};

const formatCrackTime = (years) => {
    const timeUnits = [
        { threshold: 1e30, label: 'nonillion years' },
        { threshold: 1e27, label: 'octillion years' },
        { threshold: 1e24, label: 'septillion years' },
        { threshold: 1e21, label: 'sextillion years' },
        { threshold: 1e18, label: 'quintillion years' },
        { threshold: 1e15, label: 'quadrillion years' },
        { threshold: 1e12, label: 'trillion years' },
        { threshold: 1e9, label: 'billion years' },
        { threshold: 1e6, label: 'million years' },
        { threshold: 1e3, label: 'thousand years' },
        { threshold: 100, label: 'centuries' },
        { threshold: 10, label: 'decades' },
        { threshold: 1, label: 'years' },
        { threshold: 1 / 12, label: 'months' },
        { threshold: 1 / 52, label: 'weeks' },
        { threshold: 1 / 365.25, label: 'days' },
        { threshold: 1 / (365.25 * 24), label: 'hours' },
        { threshold: 1 / (365.25 * 24 * 60), label: 'minutes' }
    ];

    if (years < 1 / (365.25 * 24 * 60)) {
        return 'seconds';
    }

    for (const unit of timeUnits) {
        if (years >= unit.threshold) {
            const value = Math.round(years / unit.threshold);
            return value > 1 ? unit.label : unit.label.slice(0, -1);
        }
    }

    return 'seconds';
};

const getPasswordStrength = (password) => {
    const length = password.length;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[^A-Za-z0-9]/.test(password);

    let score = 0;

    if (length >= 8) score += 1;
    if (length >= 12) score += 1;
    if (length >= 16) score += 1;
    if (length >= 20) score += 1;

    if (hasUpper) score += 1;
    if (hasLower) score += 1;
    if (hasNumbers) score += 1;
    if (hasSymbols) score += 1;

    if (score <= 2) return { strength: 'Very Weak', class: 'very-weak' };
    if (score <= 4) return { strength: 'Weak', class: 'weak' };
    if (score <= 6) return { strength: 'Good', class: 'good' };
    if (score <= 7) return { strength: 'Strong', class: 'strong' };
    return { strength: 'Very Strong', class: 'very-strong' };
};

const evaluatePassword = () => {
    const password = elements.passwordField.value;

    if (!password) {
        updateStrengthDisplay('-', '-', '');
        return;
    }

    const strengthInfo = getPasswordStrength(password);
    const crackTimeYears = calculateCrackTime(password);
    const crackTimeFormatted = formatCrackTime(crackTimeYears);

    updateStrengthDisplay(strengthInfo.strength, crackTimeFormatted, strengthInfo.class);
};

const updateStrengthDisplay = (strength, crackTime, strengthClass) => {
    elements.strengthField.textContent = strength;
    elements.strengthField.className = strengthClass;
    elements.crackTimeField.textContent = crackTime;
};

let copyTimeout;
const copyPassword = async () => {
    const password = elements.passwordField.value;

    if (!password) {
        showCopyFeedback('No password to copy', false);
        return;
    }

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(password);
        } else {
            elements.passwordField.select();
            elements.passwordField.setSelectionRange(0, 99999);
            document.execCommand('copy');
            elements.passwordField.blur();
        }

        showCopyFeedback('Copied!', true);
    } catch (err) {
        console.error('Failed to copy password:', err);
        showCopyFeedback('Copy failed', false);
    }
};

const showCopyFeedback = (message, success) => {
    const copyText = elements.copyBtn.querySelector('.copy-text');
    const copySuccess = elements.copyBtn.querySelector('.copy-success');

    if (copyText && copySuccess) {
        copyText.style.display = 'none';
        copySuccess.style.display = 'inline';
        copySuccess.textContent = message;

        if (success) {
            elements.copyBtn.classList.add('copied');
        }

        clearTimeout(copyTimeout);
        copyTimeout = setTimeout(() => {
            copyText.style.display = 'inline';
            copySuccess.style.display = 'none';
            elements.copyBtn.classList.remove('copied');
        }, 2000);
    }
};

const setupEventListeners = () => {
    elements.lengthSlider.addEventListener('input', () => {
        syncLength(elements.lengthSlider.value);
    });

    elements.lengthBox.addEventListener('input', debounce(() => {
        syncLength(elements.lengthBox.value);
    }, 300));

    elements.lengthBox.addEventListener('blur', () => {
        syncLength(elements.lengthBox.value);
    });

    elements.lengthBox.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            elements.lengthBox.blur();
        }
    });

    elements.sliderMinus.addEventListener('click', () => {
        syncLength(Number(elements.lengthSlider.value) - 1);
    });

    elements.sliderPlus.addEventListener('click', () => {
        syncLength(Number(elements.lengthSlider.value) + 1);
    });

    [elements.checkUpper, elements.checkLower, elements.checkNumbers, elements.checkSymbols].forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            filterCurrentPassword();
            generatePassword();
        });
    });

    elements.excludeInput.addEventListener('input', debounce(() => {
        filterCurrentPassword();
        generatePassword();
    }, 300));

    elements.passwordField.addEventListener('input', () => {
        const originalPassword = elements.passwordField.value;
        const filteredPassword = filterPasswordInput(originalPassword);

        if (filteredPassword !== originalPassword) {
            elements.passwordField.value = filteredPassword;
        }

        const newLength = clamp(filteredPassword.length);
        elements.lengthVal.textContent = newLength;
        elements.lengthSlider.value = newLength;
        elements.lengthBox.value = newLength;

        evaluatePassword();
    });

    elements.passwordField.addEventListener('paste', (e) => {
        e.preventDefault();

        const pastedText = (e.clipboardData || window.clipboardData).getData('text');
        const filteredText = filterPasswordInput(pastedText);

        const start = elements.passwordField.selectionStart;
        const end = elements.passwordField.selectionEnd;
        const currentValue = elements.passwordField.value;

        const newValue = currentValue.slice(0, start) + filteredText + currentValue.slice(end);
        const clampedValue = newValue.substring(0, clamp(newValue.length));

        elements.passwordField.value = clampedValue;

        const newCursorPos = start + filteredText.length;
        elements.passwordField.setSelectionRange(newCursorPos, newCursorPos);

        const newLength = clamp(clampedValue.length);
        elements.lengthVal.textContent = newLength;
        elements.lengthSlider.value = newLength;
        elements.lengthBox.value = newLength;

        evaluatePassword();
    });

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
            e.preventDefault();
            generatePassword();
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'c' && document.activeElement === elements.passwordField) {
            copyPassword();
        }
    });

    elements.excludeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            elements.excludeInput.blur();
        }
    });
};

const validateElements = () => {
    const requiredElements = Object.keys(elements);
    const missingElements = requiredElements.filter(key => !elements[key]);

    if (missingElements.length > 0) {
        console.error('Missing DOM elements:', missingElements);
        return false;
    }

    return true;
};

const init = () => {
    if (!validateElements()) {
        console.error('Failed to initialize: Missing required DOM elements');
        return;
    }

    syncLength(CONFIG.defaultLength, false);

    setupEventListeners();

    generatePassword();

    elements.passwordField.focus();

    console.log('Password generator initialized successfully');
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

window.generatePassword = generatePassword;
window.copyPassword = copyPassword;