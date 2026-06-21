// Core ITC eligibility rules engine
// Returns { claimable: true|false|null, status: 'claimable'|'not_claimable'|'review', reason: string, confidence: 'high'|'medium'|'low' }

const ITC_RULES = {
  claimable: [
    { keywords: ['internet', 'broadband', 'airtel', 'jio fiber', 'bsnl', 'wifi', 'wi-fi', 'data plan'], reason: 'Internet bills are fully claimable as business expenses', confidence: 'high' },
    { keywords: ['aws', 'amazon web services', 'gcp', 'google cloud', 'azure', 'digitalocean', 'linode', 'vultr', 'vercel', 'netlify', 'heroku', 'hosting', 'domain', 'server', 'vps', 'cdn', 'cloudflare'], reason: 'Cloud hosting and domain costs are claimable business expenses', confidence: 'high' },
    { keywords: ['coworking', 'wework', 'awfis', 'innov8', 'cowrks', 'office space', 'co-working'], reason: 'Coworking space rent is claimable as office expense', confidence: 'high' },
    { keywords: ['laptop', 'monitor', 'keyboard', 'mouse', 'hard disk', 'ssd', 'webcam', 'headset', 'headphones', 'microphone', 'speaker', 'printer', 'scanner', 'tablet', 'ipad', 'graphics card', 'ram', 'processor', 'computer', 'desktop', 'workstation', 'external drive'], reason: 'Computer hardware used for business is claimable', confidence: 'high' },
    { keywords: ['adobe', 'figma', 'notion', 'slack', 'github', 'gitlab', 'bitbucket', 'zoom', 'google workspace', 'microsoft 365', 'office 365', 'dropbox', 'sketch', 'invision', 'jira', 'confluence', 'linear', 'postman', 'insomnia', 'docker', 'jetbrains', 'vs code', 'software', 'subscription', 'saas', 'license', 'annual plan', 'pro plan'], reason: 'Software subscriptions for business use are claimable', confidence: 'high' },
    { keywords: ['stationery', 'ink', 'notebook', 'pen', 'marker', 'whiteboard', 'office supplies', 'paper', 'toner', 'cartridge'], reason: 'Office stationery and supplies are claimable', confidence: 'high' },
    { keywords: ['courier', 'delivery', 'shipping', 'delhivery', 'bluedart', 'dtdc', 'fedex', 'dhl', 'ekart', 'xpressbees'], reason: 'Business courier and shipping charges are claimable', confidence: 'medium' },
    { keywords: ['chartered accountant', 'ca fees', 'legal fees', 'consultant', 'professional fees', 'audit', 'tax filing'], reason: 'Professional fees like CA and legal charges are claimable', confidence: 'high' },
    { keywords: ['bank charges', 'payment gateway', 'razorpay', 'stripe', 'payu', 'ccavenue', 'transaction fee'], reason: 'Payment gateway and banking charges for business are claimable', confidence: 'high' },
    { keywords: ['training', 'course', 'udemy', 'coursera', 'linkedin learning', 'workshop', 'seminar', 'conference', 'certification'], reason: 'Professional training and skill development is claimable', confidence: 'medium' },
    { keywords: ['marketing', 'advertising', 'facebook ads', 'google ads', 'instagram ads', 'linkedin ads', 'seo', 'content'], reason: 'Business marketing and advertising expenses are claimable', confidence: 'high' },
    { keywords: ['raw material', 'packaging', 'inventory', 'stock', 'goods purchased for resale'], reason: 'Raw materials and business inventory are claimable', confidence: 'high' },
  ],
  notClaimable: [
    { keywords: ['swiggy', 'zomato', 'food', 'restaurant', 'cafe', 'coffee', 'tea', 'snacks', 'lunch', 'dinner', 'breakfast', 'meal', 'barbeque', 'biryani'], reason: 'Food and beverages are explicitly blocked under Section 17(5) of CGST Act', confidence: 'high' },
    { keywords: ['uber', 'ola', 'rapido', 'taxi', 'cab', 'auto rickshaw', 'meru'], reason: 'Cab/taxi rides are blocked from ITC under Section 17(5)(b)', confidence: 'high' },
    { keywords: ['petrol', 'diesel', 'fuel', 'cng', 'lpg', 'motor spirit'], reason: 'Motor vehicle fuel is not eligible for ITC under GST rules', confidence: 'high' },
    { keywords: ['grocery', 'supermarket', 'dmart', 'bigbasket', 'blinkit', 'zepto', 'grofers', 'milkbasket'], reason: 'Personal groceries are not business expenses and cannot be claimed', confidence: 'high' },
    { keywords: ['movie', 'cinema', 'netflix', 'spotify', 'hotstar', 'disney', 'amazon prime', 'youtube premium', 'entertainment', 'gaming', 'playstation', 'xbox'], reason: 'Personal entertainment is blocked from ITC claims', confidence: 'high' },
    { keywords: ['gym', 'fitness', 'yoga', 'health club', 'sport'], reason: 'Personal fitness expenses are not claimable unless required for business', confidence: 'high' },
    { keywords: ['personal loan', 'home loan emi', 'car emi', 'credit card payment', 'insurance premium'], reason: 'Personal financial obligations are not claimable business expenses', confidence: 'high' },
    { keywords: ['rent home', 'house rent', 'apartment rent', 'residential'], reason: 'Home/residential rent is not claimable (business office rent is)', confidence: 'medium' },
    { keywords: ['alcohol', 'wine', 'beer', 'liquor', 'cigarette', 'tobacco'], reason: 'Alcohol and tobacco are completely blocked from ITC', confidence: 'high' },
  ],
  review: [
    { keywords: ['mobile', 'smartphone', 'recharge', 'airtel postpaid', 'jio postpaid', 'phone bill', 'data recharge'], reason: 'Phone bills are partially claimable if used for business — typically 50-60% claimable. Needs CA review.', confidence: 'medium' },
    { keywords: ['electricity', 'electric bill', 'power bill', 'bescom', 'tata power', 'msedcl'], reason: 'Home electricity can be partially claimed if you work from home. Proportion based on office area vs total area.', confidence: 'medium' },
    { keywords: ['amazon', 'flipkart', 'meesho', 'myntra', 'nykaa', 'snapdeal'], reason: 'ITC eligibility depends on what was purchased. Please specify the item purchased.', confidence: 'low' },
    { keywords: ['hotel', 'accommodation', 'oyo', 'treebo', 'fabhotel', 'airbnb', 'stay'], reason: 'Business travel accommodation is claimable, personal stay is not. Please confirm if this was for business travel.', confidence: 'medium' },
    { keywords: ['vehicle', 'car', 'bike', 'motorcycle', 'scooter', 'maintenance', 'repair'], reason: 'Vehicle expenses are partly claimable for goods transport. Personal vehicle maintenance is generally not claimable.', confidence: 'low' },
    { keywords: ['gift', 'gifts', 'corporate gift', 'diwali gift'], reason: 'Corporate gifts are claimable up to ₹50,000 per recipient per year. Personal gifts are not claimable.', confidence: 'low' },
  ]
};

export function checkITCEligibility(expenseName, category = '') {
  const lower = (expenseName + ' ' + category).toLowerCase();

  for (const rule of ITC_RULES.claimable) {
    if (rule.keywords.some(k => lower.includes(k))) {
      return {
        claimable: true,
        status: 'claimable',
        reason: rule.reason,
        confidence: rule.confidence,
      };
    }
  }

  for (const rule of ITC_RULES.notClaimable) {
    if (rule.keywords.some(k => lower.includes(k))) {
      return {
        claimable: false,
        status: 'not_claimable',
        reason: rule.reason,
        confidence: rule.confidence,
      };
    }
  }

  for (const rule of ITC_RULES.review) {
    if (rule.keywords.some(k => lower.includes(k))) {
      return {
        claimable: null,
        status: 'review',
        reason: rule.reason,
        confidence: rule.confidence,
      };
    }
  }

  // Category-based fallback
  if (category) {
    const catLower = category.toLowerCase();
    if (['internet', 'software', 'hardware', 'office', 'cloud', 'professional'].includes(catLower)) {
      return {
        claimable: true,
        status: 'claimable',
        reason: `${category} expenses are generally claimable as business expenses`,
        confidence: 'medium',
      };
    }
    if (['food', 'personal', 'entertainment', 'travel'].includes(catLower)) {
      return {
        claimable: false,
        status: 'not_claimable',
        reason: `${category} expenses are generally not claimable under GST rules`,
        confidence: 'medium',
      };
    }
  }

  return {
    claimable: null,
    status: 'review',
    reason: 'Could not auto-classify this expense. Please review manually or consult your CA.',
    confidence: 'low',
  };
}

export function formatINR(amount) {
  if (amount === undefined || amount === null) return '₹0';
  return '₹' + Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export function getGSTFilingDeadline() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  
  // GST GSTR-3B filing deadline is 20th of next month
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  const deadline = new Date(nextYear, nextMonth, 20);
  
  const diff = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
  return {
    deadline,
    daysLeft: diff,
    isUrgent: diff <= 7,
    formattedDate: deadline.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    filingPeriod: now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
  };
}

export function getCurrentFilingMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
