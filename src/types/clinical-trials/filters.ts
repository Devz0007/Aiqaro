// src/types/clinical-trials/filters.ts
import { z } from 'zod';

// 1. Update StudyPhase to match API exactly
export enum StudyPhase {
  PHASE1 = 'PHASE1',
  PHASE2 = 'PHASE2',
  PHASE3 = 'PHASE3',
  PHASE4 = 'PHASE4',
  EARLY_PHASE1 = 'EARLY_PHASE1',
  NA = 'NA',
}

// 2. Update StudyStatus to include all possible values
export enum StudyStatus {
  NOT_YET_RECRUITING = 'NOT_YET_RECRUITING',
  RECRUITING = 'RECRUITING',
  ENROLLING_BY_INVITATION = 'ENROLLING_BY_INVITATION',
  ACTIVE_NOT_RECRUITING = 'ACTIVE_NOT_RECRUITING',
  COMPLETED = 'COMPLETED',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
  WITHDRAWN = 'WITHDRAWN',
  AVAILABLE = 'AVAILABLE',
  NO_LONGER_AVAILABLE = 'NO_LONGER_AVAILABLE',
  TEMPORARILY_NOT_AVAILABLE = 'TEMPORARILY_NOT_AVAILABLE',
  APPROVED_FOR_MARKETING = 'APPROVED_FOR_MARKETING',
  WITHHELD = 'WITHHELD',
  UNKNOWN = 'UNKNOWN',
}

// 3. Add Sex enum instead of string literals
export enum Sex {
  ALL = 'ALL',
  FEMALE = 'FEMALE',
  MALE = 'MALE',
}

// 4. Update sort fields to match API capabilities
export enum SortField {
  LAST_UPDATE_POST_DATE = 'LastUpdatePostDate',
  ENROLLMENT_COUNT = 'EnrollmentCount',
  STUDY_FIRST_POST_DATE = 'StudyFirstPostDate',
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

// 5. Update SearchFilters interface with more precise types
export interface SearchFilters {
  phase?: StudyPhase[] | string[];
  status?: StudyStatus[] | string[];
  location?: string;
  minAge?: string;
  maxAge?: string;
  gender?: Sex;
  healthyVolunteers?: boolean;
  sort?: {
    field: SortField;
    direction: SortDirection;
  };
  therapeuticArea?: string[];
}

// 6. Update schema with more precise validations
export const SearchFiltersSchema = z
  .object({
    phase: z.union([z.array(z.nativeEnum(StudyPhase)), z.array(z.string())]).optional(),
    status: z.union([z.array(z.nativeEnum(StudyStatus)), z.array(z.string())]).optional(),
    location: z.string().min(1).optional(),
    minAge: z.string().regex(/^\d+$/, 'Age must be a number').optional(),
    maxAge: z.string().regex(/^\d+$/, 'Age must be a number').optional(),
    gender: z.nativeEnum(Sex).optional(),
    healthyVolunteers: z.boolean().optional(),
    sort: z
      .object({
        field: z.nativeEnum(SortField),
        direction: z.nativeEnum(SortDirection),
      })
      .optional(),
    therapeuticArea: z.array(z.string()).optional(), // Updated to allow multiple values
  })
  .refine(
    (data) => {
      const minAge = data.minAge ?? '';
      const maxAge = data.maxAge ?? '';

      if (minAge !== '' && maxAge !== '') {
        return parseInt(minAge, 10) <= parseInt(maxAge, 10);
      }

      return true;
    },
    {
      message: 'Minimum age must be less than or equal to maximum age',
    }
  );

// 7. Update display maps with more precise types
export const phaseDisplayMap: Readonly<Record<StudyPhase, string>> = {
  [StudyPhase.PHASE1]: 'Phase 1',
  [StudyPhase.PHASE2]: 'Phase 2',
  [StudyPhase.PHASE3]: 'Phase 3',
  [StudyPhase.PHASE4]: 'Phase 4',
  [StudyPhase.EARLY_PHASE1]: 'Early Phase 1',
  [StudyPhase.NA]: 'Not Applicable',
};

export const statusDisplayMap: Readonly<Record<StudyStatus, string>> = {
  [StudyStatus.NOT_YET_RECRUITING]: 'Not yet recruiting',
  [StudyStatus.RECRUITING]: 'Recruiting',
  [StudyStatus.ENROLLING_BY_INVITATION]: 'Enrolling by invitation',
  [StudyStatus.ACTIVE_NOT_RECRUITING]: 'Active, not recruiting',
  [StudyStatus.COMPLETED]: 'Completed',
  [StudyStatus.SUSPENDED]: 'Suspended',
  [StudyStatus.TERMINATED]: 'Terminated',
  [StudyStatus.WITHDRAWN]: 'Withdrawn',
  [StudyStatus.AVAILABLE]: 'Available',
  [StudyStatus.NO_LONGER_AVAILABLE]: 'No longer available',
  [StudyStatus.TEMPORARILY_NOT_AVAILABLE]: 'Temporarily not available',
  [StudyStatus.APPROVED_FOR_MARKETING]: 'Approved for marketing',
  [StudyStatus.WITHHELD]: 'Withheld',
  [StudyStatus.UNKNOWN]: 'Unknown',
};

// Define the therapeutic area type
export interface TherapeuticAreaData {
  value: string;
  label: string;
  keywords: string[];
}

// Update therapeutic areas with more type safety and improved keyword matching
export const THERAPEUTIC_AREAS: TherapeuticAreaData[] = [
  { 
    value: 'oncology',
    label: 'Oncology',
    keywords: [
      'cancer', 'tumor', 'neoplasm', 'carcinoma', 'lymphoma', 'leukemia', 'melanoma', 'sarcoma', 'metastatic', 'oncological',
      'chemotherapy', 'radiation therapy', 'immunotherapy', 'targeted therapy', 'myeloma', 'glioma', 'blastoma',
      'adenocarcinoma', 'malignant', 'benign tumor', 'metastasis', 'oncogene', 'cancer staging', 'remission',
      'solid tumor', 'hematologic', 'bone marrow', 'biopsy', 'cancer biomarker', 'cancer screening'
    ]
  },
  { 
    value: 'cardiology',
    label: 'Cardiology',
    keywords: [
      'heart', 'cardiac', 'cardiovascular', 'hypertension', 'arrhythmia', 'coronary', 'vascular', 'atherosclerosis', 'stroke', 'thrombosis',
      'myocardial infarction', 'heart failure', 'angina', 'palpitations', 'tachycardia', 'bradycardia', 'heart valve',
      'atrial fibrillation', 'ventricular', 'blood pressure', 'cholesterol', 'stent', 'bypass', 'angioplasty',
      'cardiomyopathy', 'ischemic', 'heart rhythm', 'pacemaker', 'defibrillator', 'endocarditis', 'peripheral artery disease'
    ]
  },
  { 
    value: 'neurology',
    label: 'Neurology',
    keywords: [
      'brain', 'neural', 'neurological', 'alzheimer', 'parkinson', 'epilepsy', 'multiple sclerosis', 'migraine', 'dementia', 'neuropathy',
      'seizure', 'stroke', 'neurodegenerative', 'cognitive decline', 'tremor', 'huntington', 'amyotrophic lateral sclerosis',
      'brain tumor', 'concussion', 'traumatic brain injury', 'spinal cord', 'nerve damage', 'neurotransmitter',
      'cerebral palsy', 'meningitis', 'encephalitis', 'dystonia', 'myasthenia gravis', 'vertigo', 'neuromuscular'
    ]
  },
  { 
    value: 'immunology',
    label: 'Immunology',
    keywords: [
      'immune', 'autoimmune', 'allergy', 'rheumatoid', 'lupus', 'inflammatory', 'immunodeficiency', 'transplant', 'rejection', 'immunotherapy',
      'antibody', 'antigen', 'cytokine', 'inflammation', 'immune response', 'immune system', 'autoantibody',
      'immunoglobulin', 'lymphocyte', 'vaccine', 'immunization', 'immune tolerance', 'immune checkpoint',
      'immunosuppression', 'autoimmunity', 'immune cell', 'immune modulation', 'immune reconstitution',
      'immune surveillance', 'immune memory'
    ]
  },
  { 
    value: 'infectious_diseases',
    label: 'Infectious Diseases',
    keywords: [
      'infection', 'viral', 'bacterial', 'covid', 'hiv', 'aids', 'hepatitis', 'tuberculosis', 'antimicrobial', 'vaccine',
      'pathogen', 'microorganism', 'antibiotic', 'antiviral', 'fungal', 'parasitic', 'sepsis', 'pneumonia',
      'meningitis', 'influenza', 'coronavirus', 'sars', 'mers', 'ebola', 'zika', 'malaria', 'dengue',
      'antibiotic resistance', 'immune response', 'contagious', 'epidemic', 'pandemic', 'quarantine',
      'infection control', 'preventive measures'
    ]
  },
  { 
    value: 'rare_diseases',
    label: 'Rare Diseases',
    keywords: [
      'rare', 'orphan', 'genetic disorder', 'congenital', 'hereditary', 'syndrome', 'mutation', 'metabolic disorder',
      'lysosomal storage', 'mitochondrial disease', 'cystic fibrosis', 'huntington', 'duchenne', 'fabry disease',
      'gaucher disease', 'pompe disease', 'sickle cell', 'thalassemia', 'hemophilia', 'phenylketonuria',
      'rare cancer', 'rare genetic', 'rare neurological', 'rare metabolic', 'rare cardiovascular',
      'rare respiratory', 'rare immunological', 'rare endocrine', 'rare bone', 'rare skin'
    ]
  },
  { 
    value: 'pediatrics',
    label: 'Pediatrics',
    keywords: [
      'pediatric', 'children', 'infant', 'neonatal', 'juvenile', 'childhood', 'adolescent', 'birth', 'congenital',
      'developmental', 'growth', 'pediatric cancer', 'pediatric cardiology', 'pediatric neurology',
      'pediatric immunology', 'pediatric endocrinology', 'pediatric gastroenterology', 'pediatric pulmonology',
      'birth defect', 'genetic disorder', 'developmental delay', 'learning disability', 'autism spectrum',
      'attention deficit', 'childhood obesity', 'pediatric diabetes', 'pediatric asthma', 'pediatric arthritis',
      'childhood vaccination'
    ]
  },
  { 
    value: 'metabolic',
    label: 'Metabolic Disorders',
    keywords: [
      'diabetes', 'obesity', 'metabolic', 'endocrine', 'thyroid', 'hormone', 'lipid', 'nutrition',
      'metabolism', 'insulin resistance', 'metabolic syndrome', 'type 1 diabetes', 'type 2 diabetes',
      'gestational diabetes', 'hyperthyroidism', 'hypothyroidism', 'adrenal disorder', 'pituitary disorder',
      'growth hormone', 'metabolic disease', 'inborn error', 'fatty acid oxidation', 'glycogen storage',
      'mitochondrial disorder', 'amino acid metabolism', 'carbohydrate metabolism', 'lipid metabolism',
      'mineral metabolism', 'vitamin deficiency'
    ]
  },
  { 
    value: 'respiratory',
    label: 'Respiratory',
    keywords: [
      'lung', 'pulmonary', 'asthma', 'copd', 'respiratory', 'bronchial', 'pneumonia', 'airway', 'breathing',
      'emphysema', 'bronchitis', 'pulmonary fibrosis', 'cystic fibrosis', 'lung cancer', 'tuberculosis',
      'sleep apnea', 'respiratory failure', 'pulmonary hypertension', 'pleural effusion', 'bronchiectasis',
      'interstitial lung disease', 'respiratory infection', 'respiratory distress', 'respiratory syncytial virus',
      'lung transplant', 'mechanical ventilation', 'oxygen therapy', 'pulmonary rehabilitation', 'lung function',
      'respiratory muscle'
    ]
  },
  { 
    value: 'gastroenterology',
    label: 'Gastroenterology',
    keywords: [
      'gastro', 'digestive', 'liver', 'intestinal', 'bowel', 'colitis', 'crohn', 'hepatic', 'pancreatic',
      'gastrointestinal', 'stomach', 'esophagus', 'celiac', 'inflammatory bowel disease', 'ulcerative colitis',
      'irritable bowel syndrome', 'hepatitis', 'cirrhosis', 'fatty liver', 'gallbladder', 'bile duct',
      'pancreatitis', 'gastritis', 'peptic ulcer', 'acid reflux', 'GERD', 'dysphagia', 'gastroparesis',
      'gastrointestinal bleeding', 'colorectal cancer', 'diverticulitis', 'gut microbiome'
    ]
  },
  { 
    value: 'dermatology',
    label: 'Dermatology',
    keywords: [
      'skin', 'dermal', 'psoriasis', 'eczema', 'acne', 'dermatitis', 'melanoma', 'cutaneous',
      'rash', 'skin cancer', 'basal cell carcinoma', 'squamous cell carcinoma', 'atopic dermatitis',
      'rosacea', 'vitiligo', 'alopecia', 'hair loss', 'skin infection', 'fungal infection',
      'contact dermatitis', 'urticaria', 'skin allergy', 'photodermatosis', 'skin aging',
      'wound healing', 'scar', 'keloid', 'skin graft', 'dermatomyositis', 'skin biopsy'
    ]
  },
  { 
    value: 'mental_health',
    label: 'Mental Health',
    keywords: [
      'psychiatric', 'depression', 'anxiety', 'schizophrenia', 'bipolar', 'mental', 'psychological', 'behavioral', 'mood',
      'post traumatic stress', 'PTSD', 'obsessive compulsive', 'OCD', 'eating disorder', 'anorexia', 'bulimia',
      'personality disorder', 'attention deficit', 'ADHD', 'autism spectrum', 'panic disorder',
      'social anxiety', 'phobia', 'psychosis', 'substance abuse', 'addiction', 'cognitive behavioral therapy',
      'psychotherapy', 'mental illness', 'psychiatric medication', 'neurodevelopmental'
    ]
  },
  { 
    value: 'womens_health',
    label: 'Women\'s Health',
    keywords: [
      'gynecology', 'obstetrics', 'breast', 'ovarian', 'cervical', 'pregnancy', 'fertility', 'menopause', 'reproductive',
      'maternal health', 'prenatal', 'postnatal', 'gestational', 'labor and delivery', 'contraception',
      'family planning', 'infertility', 'in vitro fertilization', 'IVF', 'endometriosis', 'polycystic ovary',
      'PCOS', 'uterine fibroids', 'breast cancer', 'cervical cancer', 'ovarian cancer',
      'hormone replacement', 'osteoporosis', 'mammography', 'pelvic floor', 'menstrual disorders'
    ]
  },
  { 
    value: 'orthopedics',
    label: 'Orthopedics',
    keywords: [
      'bone', 'joint', 'muscular', 'skeletal', 'arthritis', 'osteoporosis', 'fracture', 'orthopedic', 'rheumatology',
      'spine', 'spinal', 'back pain', 'neck pain', 'scoliosis', 'osteoarthritis', 'rheumatoid arthritis',
      'joint replacement', 'knee replacement', 'hip replacement', 'shoulder surgery', 'sports injury',
      'tendonitis', 'ligament', 'cartilage', 'bone density', 'bone marrow', 'musculoskeletal',
      'physical therapy', 'rehabilitation', 'orthopedic trauma', 'joint reconstruction'
    ]
  },
  { 
    value: 'ophthalmology',
    label: 'Ophthalmology',
    keywords: [
      'eye', 'vision', 'retinal', 'ocular', 'glaucoma', 'macular', 'blindness', 'optical',
      'cataract', 'cornea', 'refractive error', 'myopia', 'hyperopia', 'astigmatism', 'presbyopia',
      'diabetic retinopathy', 'age-related macular degeneration', 'AMD', 'retinal detachment',
      'dry eye syndrome', 'conjunctivitis', 'keratoconus', 'optic nerve', 'eye surgery',
      'laser eye surgery', 'LASIK', 'intraocular pressure', 'vision correction', 'eye disease',
      'visual impairment'
    ]
  },
  { 
    value: 'regenerative_medicine',
    label: 'Regenerative Medicine',
    keywords: [
      'stem cell', 'regenerative', 'tissue engineering', 'cell therapy', 'gene therapy', 'bioengineering', 'regeneration',
      'tissue repair', 'cellular therapy', 'biomaterials', 'scaffold', 'organ regeneration', 'wound healing',
      'tissue transplant', 'stem cell transplant', 'bone marrow transplant', 'cord blood', 'platelet rich plasma',
      'PRP therapy', 'cartilage regeneration', 'skin grafting', 'bioprinting', '3D printing',
      'tissue scaffolds', 'regenerative therapy', 'cell culture', 'tissue culture', 'organoid',
      'regenerative treatment', 'tissue reconstruction'
    ]
  },
  { 
    value: 'pain_management',
    label: 'Pain Management',
    keywords: [
      'pain', 'chronic pain', 'analgesia', 'neuropathic', 'palliative', 'acute pain', 'pain relief',
      'pain medication', 'opioid', 'non-opioid', 'pain control', 'pain assessment', 'pain scale',
      'back pain', 'neck pain', 'joint pain', 'muscle pain', 'nerve pain', 'cancer pain',
      'postoperative pain', 'pain therapy', 'pain rehabilitation', 'pain psychology',
      'interventional pain', 'pain clinic', 'pain specialist', 'pain management program',
      'alternative pain therapy', 'pain reduction'
    ]
  },
  { 
    value: 'addiction_medicine',
    label: 'Addiction Medicine',
    keywords: [
      'addiction', 'substance abuse', 'dependence', 'opioid', 'alcohol', 'withdrawal', 'rehabilitation',
      'substance use disorder', 'drug abuse', 'alcoholism', 'drug dependence', 'behavioral addiction',
      'addiction treatment', 'recovery program', 'detoxification', 'medication-assisted treatment',
      'addiction therapy', 'addiction counseling', 'relapse prevention', 'harm reduction',
      'substance abuse prevention', 'addiction medicine', 'addiction psychiatry', 'drug rehabilitation',
      'recovery support', 'addiction recovery', 'sobriety', 'addiction intervention', 'addiction assessment',
      'addiction specialist'
    ]
  }
];

export type TherapeuticArea = (typeof THERAPEUTIC_AREAS)[number]['value'];
