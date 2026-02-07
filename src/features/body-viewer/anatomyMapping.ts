import { type BodyRegionId } from './bodyRegions'

/**
 * Maps BioDigital anatomical structure names/IDs to our simplified body regions.
 * BioDigital has thousands of detailed structures - we group these into our 9 regions.
 */

// Keywords/patterns for each body region (case-insensitive matching)
const REGION_PATTERNS: Record<BodyRegionId, string[]> = {
  head: [
    'skull', 'cranium', 'head', 'face', 'frontal', 'parietal', 'temporal', 'occipital',
    'mandible', 'maxilla', 'zygomatic', 'nasal', 'orbit', 'eye', 'ear', 'brain',
    'cerebrum', 'cerebellum', 'brainstem', 'meninges', 'scalp', 'forehead',
    'temple', 'jaw', 'chin', 'cheek', 'nose', 'mouth', 'lip', 'tongue', 'teeth',
    'sinus', 'ethmoid', 'sphenoid', 'lacrimal', 'palatine', 'vomer',
    'masseter', 'temporalis', 'frontalis', 'orbicularis', 'buccinator',
    'hippocampus', 'thalamus', 'hypothalamus', 'pituitary', 'pineal',
    'corpus callosum', 'ventricle', 'cortex'
  ],
  neck: [
    'neck', 'cervical', 'throat', 'larynx', 'pharynx', 'trachea', 'esophagus',
    'thyroid', 'parathyroid', 'hyoid', 'sternocleidomastoid', 'scalene',
    'carotid', 'jugular', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7',
    'atlas', 'axis', 'cervical vertebra', 'vocal', 'epiglottis', 'cricoid'
  ],
  chest: [
    'chest', 'thorax', 'thoracic', 'pectoral', 'breast', 'sternum', 'rib',
    'clavicle', 'collarbone', 'intercostal', 'heart', 'cardiac', 'lung',
    'pulmonary', 'bronchi', 'pleura', 'diaphragm', 'mediastinum', 'aorta',
    'vena cava', 'pericardium', 'atrium', 'ventricle', 'valve', 'coronary',
    't1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 't11', 't12',
    'thoracic vertebra', 'manubrium', 'xiphoid', 'costal'
  ],
  abdomen: [
    'abdomen', 'abdominal', 'belly', 'stomach', 'gastric', 'liver', 'hepatic',
    'gallbladder', 'biliary', 'pancreas', 'spleen', 'splenic', 'intestine',
    'colon', 'cecum', 'appendix', 'duodenum', 'jejunum', 'ileum', 'rectum',
    'sigmoid', 'anus', 'anal', 'kidney', 'renal', 'adrenal', 'ureter',
    'bladder', 'urethra', 'peritoneum', 'omentum', 'mesentery',
    'umbilicus', 'navel', 'groin', 'inguinal', 'pelvis', 'pelvic',
    'hip', 'ilium', 'ischium', 'pubis', 'sacrum', 'coccyx', 'sacral',
    'l1', 'l2', 'l3', 'l4', 'l5', 'lumbar vertebra', 'psoas',
    'rectus abdominis', 'oblique', 'transverse abdominis',
    'reproductive', 'ovary', 'uterus', 'prostate', 'testicle', 'scrotum'
  ],
  back: [
    'back', 'spine', 'spinal', 'vertebra', 'vertebrae', 'dorsal',
    'trapezius', 'latissimus', 'rhomboid', 'erector spinae', 'multifidus',
    'spinalis', 'longissimus', 'iliocostalis', 'quadratus lumborum',
    'thoracolumbar', 'intervertebral', 'disc', 'lamina', 'spinous process',
    'transverse process', 'facet', 'neural arch', 'vertebral body',
    'scapula', 'shoulder blade', 'infraspinatus', 'supraspinatus',
    'subscapularis', 'teres'
  ],
  left_arm: [
    'left arm', 'left shoulder', 'left humerus', 'left elbow', 'left forearm',
    'left radius', 'left ulna', 'left wrist', 'left hand', 'left finger',
    'left thumb', 'left bicep', 'left tricep', 'left brachial',
    'left deltoid', 'left carpal', 'left metacarpal', 'left phalanx',
    'left palm', 'left digit'
  ],
  right_arm: [
    'right arm', 'right shoulder', 'right humerus', 'right elbow', 'right forearm',
    'right radius', 'right ulna', 'right wrist', 'right hand', 'right finger',
    'right thumb', 'right bicep', 'right tricep', 'right brachial',
    'right deltoid', 'right carpal', 'right metacarpal', 'right phalanx',
    'right palm', 'right digit'
  ],
  left_leg: [
    'left leg', 'left thigh', 'left femur', 'left knee', 'left patella',
    'left tibia', 'left fibula', 'left shin', 'left calf', 'left ankle',
    'left foot', 'left toe', 'left heel', 'left quadricep', 'left hamstring',
    'left gluteus', 'left gastrocnemius', 'left soleus', 'left tarsal',
    'left metatarsal', 'left calcaneus', 'left talus', 'left achilles'
  ],
  right_leg: [
    'right leg', 'right thigh', 'right femur', 'right knee', 'right patella',
    'right tibia', 'right fibula', 'right shin', 'right calf', 'right ankle',
    'right foot', 'right toe', 'right heel', 'right quadricep', 'right hamstring',
    'right gluteus', 'right gastrocnemius', 'right soleus', 'right tarsal',
    'right metatarsal', 'right calcaneus', 'right talus', 'right achilles'
  ],
}

// Generic arm/leg patterns (when no left/right specified, we'll need position context)
const GENERIC_ARM_PATTERNS = [
  'arm', 'shoulder', 'humerus', 'elbow', 'forearm', 'radius', 'ulna',
  'wrist', 'hand', 'finger', 'thumb', 'bicep', 'tricep', 'brachial',
  'deltoid', 'carpal', 'metacarpal', 'phalanx', 'palm', 'digit'
]

const GENERIC_LEG_PATTERNS = [
  'leg', 'thigh', 'femur', 'knee', 'patella', 'tibia', 'fibula',
  'shin', 'calf', 'ankle', 'foot', 'toe', 'heel', 'quadricep', 'hamstring',
  'gluteus', 'gluteal', 'gastrocnemius', 'soleus', 'tarsal', 'metatarsal',
  'calcaneus', 'talus', 'achilles', 'plantar'
]

/**
 * Maps an anatomical structure name to a body region.
 * Returns null if no match found.
 */
export function mapAnatomyToBodyRegion(anatomyName: string): BodyRegionId | null {
  if (!anatomyName) return null

  const lowerName = anatomyName.toLowerCase()

  // First, check for exact region patterns (with left/right specified)
  for (const [region, patterns] of Object.entries(REGION_PATTERNS)) {
    for (const pattern of patterns) {
      if (lowerName.includes(pattern.toLowerCase())) {
        return region as BodyRegionId
      }
    }
  }

  // Check for generic arm patterns (default to right if unspecified)
  for (const pattern of GENERIC_ARM_PATTERNS) {
    if (lowerName.includes(pattern)) {
      // Check context clues for left/right
      if (lowerName.includes('left') || lowerName.includes('l.') || lowerName.includes('(l)')) {
        return 'left_arm'
      }
      return 'right_arm' // Default to right
    }
  }

  // Check for generic leg patterns (default to right if unspecified)
  for (const pattern of GENERIC_LEG_PATTERNS) {
    if (lowerName.includes(pattern)) {
      if (lowerName.includes('left') || lowerName.includes('l.') || lowerName.includes('(l)')) {
        return 'left_leg'
      }
      return 'right_leg' // Default to right
    }
  }

  return null
}

/**
 * Get a human-readable body region name from an anatomy structure.
 * Useful for displaying what body part was selected.
 */
export function getRegionFromAnatomy(anatomyName: string): { region: BodyRegionId | null; readable: string } {
  const region = mapAnatomyToBodyRegion(anatomyName)
  
  if (!region) {
    return { region: null, readable: anatomyName }
  }

  const regionLabels: Record<BodyRegionId, string> = {
    head: 'Head',
    neck: 'Neck', 
    chest: 'Chest',
    abdomen: 'Abdomen',
    back: 'Back',
    left_arm: 'Left Arm',
    right_arm: 'Right Arm',
    left_leg: 'Left Leg',
    right_leg: 'Right Leg',
  }

  return { region, readable: regionLabels[region] }
}
