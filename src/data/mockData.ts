export interface User {
  id: string;
  email: string;
  level: 'Junior' | 'Intermediate' | 'Expert';
  lastOnline: string;
}

export interface BugReport {
  id: string;
  title: string;
  description: string;
  date: string;
  status: 'In Process' | 'Resolved';
  reporter: {
    name: string;
    avatar: string; // Background color or letter representation
    device: string;
  };
}

export const mockUsers: User[] = [
  { id: '202022256', email: 'tanya.hill@example.com', level: 'Junior', lastOnline: '7/11/19' },
  { id: '202022257', email: 'curtis.weaver@example.com', level: 'Junior', lastOnline: '4/4/18' },
  { id: '202022258', email: 'deanna.curtis@example.com', level: 'Intermediate', lastOnline: '3/4/16' },
  { id: '202122256', email: 'felicia.reid@example.com', level: 'Expert', lastOnline: '4/21/12' },
  { id: '202122245', email: 'dolores.chambers@example.com', level: 'Expert', lastOnline: '12/4/17' },
  { id: '202122246', email: 'michael.mitc@example.com', level: 'Junior', lastOnline: '8/30/14' },
  { id: '202122247', email: 'sara.cruz@example.com', level: 'Intermediate', lastOnline: '8/15/17' },
  { id: '202122248', email: 'kenzi.lawson@example.com', level: 'Expert', lastOnline: '5/30/14' },
  { id: '202122249', email: 'jackson.graham@example.com', level: 'Junior', lastOnline: '6/27/15' },
  { id: '202222280', email: 'willie.jennings@example.com', level: 'Expert', lastOnline: '1/31/14' },
  { id: '202222281', email: 'michelle.rivera@example.com', level: 'Expert', lastOnline: '5/19/12' },
  { id: '202222282', email: 'georgia.young@example.com', level: 'Junior', lastOnline: '7/18/17' },
  { id: '202222283', email: 'debbie.baker@example.com', level: 'Intermediate', lastOnline: '8/16/13' },
  { id: '202222284', email: 'nathan.roberts@example.com', level: 'Expert', lastOnline: '10/6/13' },
  { id: '202222285', email: 'nevaeh.simmons@example.com', level: 'Junior', lastOnline: '9/18/16' },
  { id: '202222286', email: 'bill.sanders@example.com', level: 'Expert', lastOnline: '1/15/12' }
];

export const mockBugReports: BugReport[] = [
  {
    id: 'bug-1',
    title: 'Notification is not working on the app',
    description: 'Notification is not displaying any reminders.',
    date: 'Sunday 2026.03.30',
    status: 'In Process',
    reporter: {
      name: 'Cahnn',
      avatar: '#ff7a00',
      device: 'reported on mobile'
    }
  },
  {
    id: 'bug-2',
    title: 'Password Reset Email Not Sending',
    description: "Password reset email are not being sent to user's requesting password reset. please fix this asap",
    date: 'Sunday 2026.03.30',
    status: 'In Process',
    reporter: {
      name: 'Cahnn',
      avatar: '#ff7a00',
      device: 'reported on mobile'
    }
  },
  {
    id: 'bug-3',
    title: 'Crash on App Launch',
    description: 'Mobile app crashes immediately upon launching in certain devices.',
    date: 'Sunday 2026.03.30',
    status: 'Resolved',
    reporter: {
      name: 'Cahnn',
      avatar: '#ff7a00',
      device: 'reported on mobile'
    }
  },
  {
    id: 'bug-4',
    title: 'unable to save changes in the goals screen',
    description: "The changes i made in the goals aren't saving",
    date: 'Sunday 2026.03.30',
    status: 'Resolved',
    reporter: {
      name: 'Cahnn',
      avatar: '#ff7a00',
      device: 'reported on mobile'
    }
  },
  {
    id: 'bug-5',
    title: 'Notification is not working on the app',
    description: 'Notification is not displaying any reminders.',
    date: 'Sunday 2026.03.30',
    status: 'In Process',
    reporter: {
      name: 'Cahnn',
      avatar: '#ff7a00',
      device: 'reported on mobile'
    }
  }
];

export interface InterviewerPersona {
  id: string;
  name: string;
  title: string;
  style: string;
  avatar: string;
  gender?: 'male' | 'female';
}

export interface Course {
  id: string;
  category: string;
  targetRoles: string[];
  targetLevels: ('Junior' | 'Mid' | 'Senior')[];
  interviewers: InterviewerPersona[];
  focusAreas: string[];
  targetOutcomes: string[];
  growthGoals: string[];
  architectPrompt: string;
  interviewerPrompt: string;
  evaluatorPrompt: string;
  coachPrompt: string;
}

export const mockCourses: Course[] = [
  {
    id: 'course-1',
    category: 'IT',
    targetRoles: ['Programmer', 'Software Engineer', 'Fullstack Developer'],
    targetLevels: ['Junior', 'Mid', 'Senior'],
    interviewers: [
      {
        id: 'persona-1',
        name: 'David',
        title: 'Senior Programmer',
        style: 'Challenging & Detailed',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
        gender: 'male'
      },
      {
        id: 'persona-2',
        name: 'Elena',
        title: 'Tech Lead',
        style: 'Empathetic & Meticulous',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop',
        gender: 'female'
      }
    ],
    focusAreas: ['Technical Questions', 'Structured Question', 'Scenario-Based'],
    targetOutcomes: ['Upcoming Interview', 'General Growth'],
    growthGoals: ['Answer Clarity', 'Confidence', 'Reduce Filler words'],
    architectPrompt: `You are the AI Interview Architect/Planner (Ang Planner). Your role is to plan the interview structure based on the candidate's target roles and the job description provided.
Custom
1. Analyze the user's input (such as a Job Description or Resume).
2. Construct a structured 5-stage interview syllabus tailored to test the core technical and algorithmic skills required.
3. Pass this structured flow to the Interviewer Agent to guide the conversation step-by-step.`,
    interviewerPrompt: `You are David, a Senior Programmer AI Interviewer at a top-tier tech firm. Your style is challenging, meticulous, and detailed.
 
Your goal is to conduct a technical interview for a software programmer candidate. 
1. Ask one challenging question at a time.
2. Drill deep into their answers: if they give a high-level response, ask them to explain the algorithmic complexity, trade-offs, or corner cases.
3. Incorporate realistic coding scenarios, system design choices, and best practices.
4. Keep a professional, slightly demanding, but supportive tone. Avoid giving away the answers immediately.`,
    evaluatorPrompt: `You are the AI Technical Evaluator. Evaluate the candidate's technical response based on the following criteria:
1. Technical Correctness (0-10): Accuracy of the logic, algorithms, and concepts explained.
2. Depth of Understanding (0-10): Ability to detail architectural trade-offs and underlying principles.
3. Coding/Problem Solving Structure (0-10): Clear and logical breakdown of complex technical tasks.
 
Provide a concise breakdown of scores and an overall score. Highlight strong points and technical gaps in a structured summary.`,
    coachPrompt: `You are the AI Interview Coach. Analyze the candidate's communication style, response structures, and psychological readiness:
1. Answer Clarity: Did the candidate explain complex ideas in simple, structured terms?
2. Confidence & Pacing: Was the tone steady, authoritative, and professional?
3. Filler Words: Did they overuse 'um', 'like', 'uh', or repetitive phrases?
 
Provide constructive suggestions, a practice plan, and action items to improve before the next interview round.`
  },
  {
    id: 'course-2',
    category: 'Product',
    targetRoles: ['Product Manager', 'Technical Product Manager', 'Product Owner'],
    targetLevels: ['Mid', 'Senior'],
    interviewers: [
      {
        id: 'persona-3',
        name: 'Sarah',
        title: 'Lead Product Manager',
        style: 'Analytical & Structured',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
        gender: 'female'
      },
      {
        id: 'persona-4',
        name: 'Marcus',
        title: 'VP of Product',
        style: 'Strategic & Demanding',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
        gender: 'male'
      }
    ],
    focusAreas: ['Product Sense', 'Analytical Skills', 'Execution'],
    targetOutcomes: ['Career Shift', 'General Growth'],
    growthGoals: ['Structured Frameworks', 'Communication', 'Confidence'],
    architectPrompt: `You are the AI Interview Architect/Planner (Ang Planner). Your role is to plan the PM interview structure based on the candidate's target roles and the job description provided.

1. Analyze the user's input (Job Description, target PM level).
2. Construct a structured PM interview flow covering Product Sense, Analytical/Execution Metrics, and Strategy.
3. Pass this structured flow to the Interviewer Agent to guide the conversation step-by-step.`,
    interviewerPrompt: `You are Sarah, a Lead Product Manager. Your interviewing style is highly analytical and structured.

Conduct a product management interview:
1. Focus on product sense (e.g., "Design an alarm clock for the blind") and metrics questions (e.g., "Uber rides dropped by 5%, what do you do?").
2. Push candidates to define the target user segments, identify pain points, prioritize solutions, and establish key success metrics (KPIs).
3. Expect candidates to use structured frameworks (like CIRCLES or active prioritization).`,
    evaluatorPrompt: `Evaluate the Product Manager candidate based on:
1. User Centricity (0-10): Understanding user needs and behaviors.
2. Analytical Structure (0-10): Ability to break down problems using solid frameworks.
3. Prioritization (0-10): Logic and metrics-based trade-offs when choosing solutions.`,
    coachPrompt: `Provide coaching feedback for the PM candidate:
1. Framework application: Did they clearly state and walk through their framework?
2. Metric selection: Did they choose actionable metrics or vanity metrics?
3. Executive presence: Did they communicate with structure and leadership style?`
  }
];



