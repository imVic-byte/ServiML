<template>
    <div class="notification-bell-wrapper">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="bell-icon">
            <path d="M5.85 3.5a.75.75 0 0 0-1.117-1 9.719 9.719 0 0 0-2.348 4.876.75.75 0 0 0 1.479.248A8.219 8.219 0 0 1 5.85 3.5ZM19.267 2.5a.75.75 0 1 0-1.118 1 8.22 8.22 0 0 1 1.987 4.124.75.75 0 0 0 1.48-.248A9.72 9.72 0 0 0 19.266 2.5Z" />
            <path fill-rule="evenodd" d="M12 2.25A6.75 6.75 0 0 0 5.25 9v.75a8.217 8.217 0 0 1-2.119 5.52.75.75 0 0 0 .298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 1 0 7.48 0 24.583 24.583 0 0 0 4.83-1.244.75.75 0 0 0 .298-1.205 8.217 8.217 0 0 1-2.118-5.52V9A6.75 6.75 0 0 0 12 2.25ZM9.75 18c0-.034 0-.067.002-.1a25.05 25.05 0 0 0 4.496 0l.002.1a2.25 2.25 0 1 1-4.5 0Z" clip-rule="evenodd" />
        </svg>
        <!-- Red dot indicator -->
        <span class="notification-dot"></span>
    </div>
</template>

<style scoped>
.notification-bell-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.15);
    border-radius: 9999px;
    padding: 0.5rem;
    transition: background-color 0.2s;
}

.notification-bell-wrapper:hover {
    background-color: rgba(255, 255, 255, 0.25);
}

.bell-icon {
    width: 2rem;
    height: 2rem;
    color: #ffffff;
    animation: ring 2s ease-in-out infinite;
    transform-origin: top center;
}

.notification-dot {
    position: absolute;
    top: 0.375rem;
    right: 0.375rem;
    width: 1rem;
    height: 1rem;
    background-color: #ef4444;
    border-radius: 9999px;
    border: 2px solid #1f3d64;
    animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes ring {
    0%, 100% { transform: rotate(0deg); }
    5% { transform: rotate(12deg); }
    10% { transform: rotate(-10deg); }
    15% { transform: rotate(8deg); }
    20% { transform: rotate(-5deg); }
    25% { transform: rotate(0deg); }
}

@keyframes pulse-dot {
    0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
    50% { box-shadow: 0 0 0 4px rgba(239, 68, 68, 0); }
}
</style>