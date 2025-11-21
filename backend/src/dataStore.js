const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');
const dayjs = require('dayjs');

const now = () => dayjs().toISOString();

const demoUserId = 'user-demo-1';

const users = [
  {
    id: demoUserId,
    email: 'demo@arcdraft.app',
    passwordHash: bcrypt.hashSync('password123', 10),
    name: 'Demo Founder',
    companyName: 'ArcDraft Labs',
  },
];

const templates = [
  {
    id: nanoid(),
    ownerId: demoUserId,
    name: 'Standard Consulting Proposal',
    description: 'Hero, Scope, Pricing und Signaturblock',
    status: 'active',
    projectTitle: 'Standard Consulting Proposal',
    projectDescription: 'ArcDraft Consulting Projektumfang und Investmentübersicht.',
    tone: 'freundlich',
    language: 'de',
    productIds: [],
    customProducts: [],
    createdAt: now(),
    updatedAt: now(),
  },
];
const proposals = [];
const signatures = [];
const analyticsEvents = [];

const brandingSettings = {
  [demoUserId]: {
    ownerId: demoUserId,
    logoUrl: 'https://dummyimage.com/120x40/0ff/000.png&text=ArcDraft',
    primaryColor: '#3EF0E7',
    accentColor: '#FF6A3D',
    fontFamily: 'Inter',
  },
};

const securitySettings = {
  [demoUserId]: {
    ownerId: demoUserId,
    requireProposalPasscode: false,
    globalPasscode: null,
  },
};

const n8nSettings = {
  [demoUserId]: {
    ownerId: demoUserId,
    webhookUrl: 'https://example.com/n8n/webhook/mock',
    apiKey: 'demo-api-key',
  },
};

function generatePublicSlug() {
  return nanoid(16);
}

function seedProposalFromTemplate({ template, overrides = {}, ownerId }) {
  const proposalId = nanoid();
  const slug = generatePublicSlug();
  const baseSections = template.sections || [];
  const sections = baseSections.map((section) => ({
    id: nanoid(),
    title: section.title,
    type: section.type,
    content: section.contentStructure,
  }));
  const proposal = {
    id: proposalId,
    ownerId,
    title: `${template.name} Draft`,
    templateId: template.id,
    status: 'draft',
    aiGenerationSource: {
      templateId: template.id,
      language: 'de',
      tone: 'formal',
      workflowInfo: 'seeded-from-template',
    },
    sections,
    recipient: {
      name: 'Alex Client',
      email: 'client@example.com',
      company: 'Client GmbH',
    },
    publicSlug: slug,
    passcode: null,
    signedAt: null,
    viewedAt: null,
    createdAt: now(),
    updatedAt: now(),
  };
  proposals.push({ ...proposal, ...overrides });
  return proposal;
}

function getUserByEmail(email) {
  return users.find((u) => u.email === email);
}

function getUserById(id) {
  return users.find((u) => u.id === id);
}

function updateUser(id, updates) {
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...updates };
  return users[idx];
}

function addTemplate(template) {
  templates.push(template);
}

function updateTemplate(id, updates) {
  const idx = templates.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  templates[idx] = { ...templates[idx], ...updates, updatedAt: now() };
  return templates[idx];
}

function deleteTemplate(id) {
  const idx = templates.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  templates.splice(idx, 1);
  return true;
}

function addProposal(proposal) {
  proposals.push(proposal);
}

function updateProposal(id, updates) {
  const idx = proposals.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  proposals[idx] = { ...proposals[idx], ...updates, updatedAt: now() };
  return proposals[idx];
}

function addSignature(signature) {
  signatures.push(signature);
}

function addAnalyticsEvent(event) {
  analyticsEvents.push(event);
}

module.exports = {
  users,
  templates,
  proposals,
  signatures,
  analyticsEvents,
  brandingSettings,
  securitySettings,
  n8nSettings,
  demoUserId,
  now,
  generatePublicSlug,
  seedProposalFromTemplate,
  getUserByEmail,
  getUserById,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  addProposal,
  updateProposal,
  addSignature,
  addAnalyticsEvent,
  updateUser,
};
