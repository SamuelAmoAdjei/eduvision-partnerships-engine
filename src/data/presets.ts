import { PresetScenario } from '../types';

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'moe-stem',
    title: 'Ministry of Education — Western Region STEM Expansion',
    category: 'Ministry & Gov',
    targetOrg: 'Ministry of Education (Ghana) & Ghana Education Service',
    baseContext: `Eduvision Ghana has completed a 2-year pilot across 30 public junior high schools in the Ashanti Region, reaching 12,500 students with hands-on robotics and coding kits. Certified 240 Science and ICT teachers with an 89% classroom implementation rate. 
Baseline assessment showed a 34% increase in national BECE ICT performance among participating schools. Total pilot investment: $180,000.`,
    customInstructions: 'Focus on expanding the STEM and Digital Literacy program to 50 under-resourced schools in the Western and Western North Regions. Propose a 50/50 cost-matching co-funding framework with GES regional directorates and request official accreditation for teacher training modules.',
    sampleEmailIntent: 'Follow up on our preliminary meeting with the Deputy Minister for General Education regarding the Western Region STEM deployment and present the updated co-funding matrix.'
  },
  {
    id: 'corp-mtn',
    title: 'MTN Ghana Foundation — Rural Girls in Tech & Coding Labs',
    category: 'Corporate Partner',
    targetOrg: 'MTN Ghana Foundation & Corporate Social Investment Directorate',
    baseContext: `Eduvision Ghana's "Girls Code West Africa" initiative has successfully trained 4,200 adolescent girls in web development, mobile app building, and solar-powered digital labs across peri-urban districts. 92% of graduates completed capstone community projects.
Current infrastructure: 4 mobile containerized solar tech hubs serving remote communities in the Eastern Region.`,
    customInstructions: 'Propose sponsoring 3 new solar-powered Eduvision Mobile Tech Hubs over 24 months, with direct co-branding rights, employee volunteer mentorship opportunities, and 2,000 target female beneficiaries in Northern Region.',
    sampleEmailIntent: 'Submit the formal partnership proposal for the 2026-2028 Rural Girls in Tech Expansion following MTN Foundation\'s Q3 Call for Proposals.'
  },
  {
    id: 'foundation-mastercard',
    title: 'Mastercard Foundation — TVET & Youth Employability Tech Pipeline',
    category: 'Global Foundation / NGO',
    targetOrg: 'Mastercard Foundation (Young Africa Works Ghana Program)',
    baseContext: `Eduvision Ghana operates practical Technical and Vocational Education and Training (TVET) software apprenticeships bridging high school graduates to remote global freelancing and local tech jobs.
Current track record: 850 youth trained, 76% employed or freelancing within 6 months, earning an average monthly income of $380 USD above national minimum wage.`,
    customInstructions: 'Draft a multi-million-dollar 3-year strategic partnership proposal to scale the TVET Software Apprenticeship Hub to 5,000 disadvantaged youth across Greater Accra, Kumasi, and Tamale with dedicated job placement guarantees.',
    sampleEmailIntent: 'Initiate formal contact with the Mastercard Foundation Program Lead to discuss alignment with the Young Africa Works strategy.'
  }
];
