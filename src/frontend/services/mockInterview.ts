const questionPlans: Record<string, string[]> = {
  'Frontend Engineer|Technical': [
    'Walk me through how you would diagnose a React page that feels slow after a feature launch.',
    'How would you design a resilient frontend state model for an interview session with live feedback?',
    'Describe a tradeoff you would make when deciding between client-side and server-side rendering for a dashboard.',
  ],
  'Frontend Engineer|Behavioral': [
    'Tell me about a time you pushed back on a product request because the implementation risk was too high.',
    'Describe a project where you had to balance speed with code quality.',
    'How do you handle disagreement with a designer or product manager on scope?',
  ],
  'Product Manager|Behavioral': [
    'Tell me about a time you had to prioritize under severe resource constraints.',
    'How do you create alignment when engineering and business goals diverge?',
    'Describe a product decision you would reverse if you had the chance.',
  ],
}

export const roleOptions = [
  'Frontend Engineer',
  'Backend Engineer',
  'Full Stack Engineer',
  'Product Manager',
  'Data Analyst',
]

export const interviewTypeOptions = [
  'Technical',
  'Behavioral',
  'Case Study',
  'System Design',
]

export const difficultyOptions = ['Junior', 'Mid-level', 'Senior', 'Staff']

export function buildMockQuestionPlan(role: string, interviewType: string) {
  return (
    questionPlans[`${role}|${interviewType}`] ?? [
      `Tell me how you would prepare for a ${interviewType.toLowerCase()} interview for a ${role} role.`,
      'What would you improve about your most recent answer if you had one more minute?',
      'What is one area of this role where you would need to ramp up fastest?',
    ]
  )
}
