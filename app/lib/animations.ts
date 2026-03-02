import type { Variants, Transition } from "framer-motion";

// Shared spring config for natural feel
export const smoothSpring: Transition = {
    type: "spring",
    stiffness: 300,
    damping: 30,
};

export const gentleSpring: Transition = {
    type: "spring",
    stiffness: 200,
    damping: 25,
};

// Fade in from below
export const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    },
};

// Fade in from above
export const fadeInDown: Variants = {
    hidden: { opacity: 0, y: -16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
    },
};

// Simple fade in
export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.4 },
    },
};

// Scale in
export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
    },
};

// Stagger children container
export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        },
    },
};

// Stagger item (used as child of staggerContainer)
export const staggerItem: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
    },
};

// Slide in from right (for sidebar)
export const slideInRight: Variants = {
    hidden: { x: "100%" },
    visible: {
        x: 0,
        transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] },
    },
    exit: {
        x: "100%",
        transition: { duration: 0.25, ease: [0.32, 0.72, 0, 1] },
    },
};

// Backdrop fade
export const backdropFade: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
};

// Slide down (for mobile menu)
export const slideDown: Variants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
        opacity: 1,
        height: "auto",
        transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
    },
    exit: {
        opacity: 0,
        height: 0,
        transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] },
    },
};

// Card hover (applied via whileHover)
export const cardHover = {
    y: -3,
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.08)",
    transition: { duration: 0.2 },
};

export const cardTap = {
    scale: 0.98,
    transition: { duration: 0.1 },
};
