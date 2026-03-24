"use client";

import { motion } from "framer-motion";
import { Project } from "@/app/lib/data";
import { cardHover, cardTap } from "@/app/lib/animations";

interface ProjectCardProps {
    project: Project;
    onClick: (project: Project) => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
    return (
        <motion.button
            onClick={() => onClick(project)}
            className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md p-2 sm:p-3 cursor-pointer group"
            whileHover={cardHover}
            whileTap={cardTap}
            layout
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                <h3 className="font-display text-sm sm:text-base font-semibold text-gray-900 group-hover:text-mustard-600 transition-colors leading-snug line-clamp-2">
                    {project.title}
                </h3>
                <span
                    className={`shrink-0 px-2 py-1 text-[10px] sm:text-xs font-medium rounded-full ${
                        project.status === "open"
                            ? "bg-mustard-50 text-mustard-700"
                            : project.status === "in-progress"
                                ? "bg-yellow-50 text-yellow-700"
                                : "bg-gray-100 text-gray-500"
                        }`}
                >
                    {project.status === "open" ? "Open" : project.status === "in-progress" ? "In Progress" : "Closed"}
                </span>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mb-3 sm:mb-4 line-clamp-2">{project.description}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-3 sm:mb-4">
                {project.tags.slice(0, 3).map((tag) => (
                    <span
                        key={tag}
                        className="px-2 py-1 text-[10px] sm:text-xs font-medium bg-gray-50 text-gray-500 rounded-full"
                    >
                        {tag}
                    </span>
                ))}
                {project.tags.length > 3 && (
                    <span className="px-2 py-1 text-[10px] sm:text-xs font-medium bg-gray-50 text-gray-500 rounded-full">
                        +{project.tags.length - 3}
                    </span>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-teal-100 text-mustard-700 flex items-center justify-center text-[10px] sm:text-xs font-bold">
                        {project.postedByAvatar}
                    </div>
                    <div>
                        <p className="text-[11px] sm:text-xs font-medium text-gray-900">{project.postedBy}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500">{project.postedAt}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">{project.budget}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">
                        {project.budgetType === "hourly" ? "Hourly" : "Fixed Price"}
                    </p>
                </div>
            </div>
        </motion.button>
    );
}
