// Type definitions for the Resume Tailor application

export interface PersonalInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  website?: string;
}

export interface Experience {
  title: string;
  company: string;
  duration: string;
  description: string;
}

export interface Education {
  degree: string;
  institution: string;
  year: string;
  gpa?: string;
}

export interface Project {
  name: string;
  description: string;
  duration?: string;
  technologies?: string;
  link?: string;
}

export interface ExtractedInfo {
  personalInfo: PersonalInfo;
  summary?: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects?: Project[];
  certifications?: string[];
  languages?: string[];
  achievements?: string[];
}

export interface ResumeData {
  id?: string;
  userId: string;
  originalText: string;
  extractedInfo: ExtractedInfo;
  jobDescription?: string;
  optimizedResume?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email?: string;
  name?: string;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface OptimizedResumeResponse {
  optimizedResume: string;
  atsScore: number;
  keywordMatches: string[];
  suggestions: string[];
}
