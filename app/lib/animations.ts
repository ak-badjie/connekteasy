import type { Variants, Transition } from "framer-motion";

// Shared spring config for natural feel
export const smoothSpring: Transition = {
    type: "spring",
    stiffness: 300,
    damping: 25,
    mass: 1
};

export const gentleSpring: Transition = {
    type: "spring",
    stiffness: 250,
    damping: 30,
    mass: 0.8
};

// Subtle Slide Up (replaces fadeInUp)
export const fadeInUp: Variants = {
    hidden: { y: 40, scale: 0.95, opacity: 0 }, // Using opacity 0 just to prevent FOUC, but fast snap
    visible: {
        y: 0,
        scale: 1,
        opacity: 1,
        transition: smoothSpring,
    },
};

// Subtle Slide Down (replaces fadeInDown)
export const fadeInDown: Variants = {
    hidden: { y: -40, scale: 0.95, opacity: 0 },
    visible: {
        y: 0,
        scale: 1,
        opacity: 1,
        transition: smoothSpring,
    },
};

// Fast snap in (replaces fadeIn)
export const fadeIn: Variants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
        scale: 1,
        opacity: 1,
        transition: gentleSpring,
    },
};

// Swell in (Apple style subtle scale)
export const scaleIn: Variants = {
    hidden: { scale: 0.85, opacity: 0 },
    visible: {
        scale: 1,
        opacity: 1,
        transition: smoothSpring,
    },
};

// Stagger children container
export const staggerContainer: Variants = {
    hidden: { scale: 1 },
    visible: {
        scale: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.05,
        },
    },
};

// Stagger item (Subtle 3D flip + drop)
export const staggerItem: Variants = {
    hidden: { y: 30, scale: 0.9, rotateX: 15, opacity: 0 },
    visible: {
        y: 0,
        scale: 1,
        rotateX: 0,
        opacity: 1,
        transition: smoothSpring,
    },
};

// Slide in from right (for sidebar)
export const slideInRight: Variants = {
    hidden: { x: "100%", rotateY: 10 },
    visible: {
        x: 0,
        rotateY: 0,
        transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    exit: {
        x: "100%",
        rotateY: -10,
        transition: { type: "spring", stiffness: 300, damping: 30 },
    },
};

// Backdrop fade (Snappy)
export const backdropFade: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.15 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
};

// Slide down (for mobile menu)
export const slideDown: Variants = {
    hidden: { y: -20, opacity: 0, height: 0, scaleY: 0.8, originY: 0 },
    visible: {
        y: 0,
        opacity: 1,
        height: "auto",
        scaleY: 1,
        transition: smoothSpring,
    },
    exit: {
        y: -20,
        opacity: 0,
        height: 0,
        scaleY: 0.8,
        transition: { duration: 0.2 },
    },
};

// Apple-style Card hover
export const cardHover = {
    scale: 1.02,
    y: -4,
    rotateZ: 0.5,
    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)",
    transition: { type: "spring", stiffness: 400, damping: 25 },
};

export const cardTap = {
    scale: 0.96,
    rotateZ: -0.5,
    transition: { type: "spring", stiffness: 500, damping: 20 },
};

// Icon subtle hover
export const iconHover = {
    scale: 1.15,
    rotateZ: 10,
    transition: { type: "spring", stiffness: 400, damping: 10 }
};

export const iconTap = {
    scale: 0.85,
    rotateZ: -10,
    transition: { type: "spring", stiffness: 400, damping: 10 }
};
