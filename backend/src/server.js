const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const morgan = require('morgan');
const dayjs = require('dayjs');
const { nanoid } = require('nanoid');

const { jwtSecret, port } = require('./config');
const {
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
  getUserById,
  getUserByEmail,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  addProposal,
  updateProposal,
  addSignature,
  addAnalyticsEvent,
  updateUser,
} = require('./dataStore');
const { authMiddleware } = require('./auth');
const { emitIntegrationEvent } = require('./integrationEvents');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

function signToken(userId) {
  return jwt.sign({ userId }, jwtSecret, { expiresIn: '12h' });
}

function sanitizeProposalForPublic(proposal) {
  const { ownerId, passcode, ...rest } = proposal;
  return rest;
}

function mockAiGeneration(payload) {
  const sections = [
    {
      id: nanoid(),
      title: 'Executive Summary',
      type: 'text',
      content: {
        text: `Hallo ${payload.clientName}, hier ist ein maßgeschneidertes Angebot für ${payload.projectTitle}.`,
      },
    },
    {
      id: nanoid(),
      title: 'Projektumfang',
      type: 'text',
      content: {
        text: payload.projectDescription,
      },
    },
    {
      id: nanoid(),
      title: 'Budget & Timeline',
      type: 'pricing',
      content: {
        rows: [
          { title: 'Discovery', price: payload.budgetRange || 'TBD', description: 'Research & Workshops' },
          { title: 'Delivery', price: 'Auf Anfrage', description: 'Iterative Umsetzung' },
        ],
      },
    },
  ];
  return {
    title: `${payload.projectTitle} – Proposal`,
    sections,
  };
}

function computeProposalAnalytics(proposalId) {
  const events = analyticsEvents.filter((e) => e.proposalId === proposalId);
  const totalViews = events.filter((e) => e.eventType === 'view').length;
  const signedEvent = events.find((e) => e.eventType === 'signed');
  const lastViewedAt = events.filter((e) => e.eventType === 'view').map((e) => e.createdAt).sort().pop() || null;
  const sectionViewStats = [];
  const sectionEvents = events.filter((e) => e.eventType === 'section_view');
  const grouped = {};
  sectionEvents.forEach((event) => {
    const key = event.metadata?.sectionId;
    if (!key) return;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(event);
  });
  Object.entries(grouped).forEach(([sectionId, secs]) => {
    const durations = secs.map((e) => e.metadata?.durationMs || 0);
    const avgTime = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    sectionViewStats.push({ sectionId, avgTimeOnSection: avgTime, viewCount: secs.length });
  });
  return {
    totalViews,
    lastViewedAt,
    signedAt: signedEvent?.createdAt || null,
    sectionViewStats,
    eventsTimeline: events,
  };
}

function computeOverview(ownerId) {
  const ownerProposals = proposals.filter((p) => p.ownerId === ownerId);
  const proposalsTotal = ownerProposals.length;
  const proposalsSigned = ownerProposals.filter((p) => p.status === 'signed').length;
  const conversionRate = proposalsTotal ? Math.round((proposalsSigned / proposalsTotal) * 100) : 0;
  const cutoff = dayjs().subtract(30, 'day');
  const viewsLast30Days = analyticsEvents.filter(
    (event) => event.eventType === 'view' && dayjs(event.createdAt).isAfter(cutoff) && ownerProposals.some((p) => p.id === event.proposalId)
  ).length;
  return {
    proposalsTotal,
    proposalsSigned,
    conversionRate,
    viewsLast30Days,
  };
}

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const match = bcrypt.compareSync(password, user.passwordHash);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });
  const token = signToken(user.id);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, companyName: user.companyName } });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email, name: req.user.name, companyName: req.user.companyName } });
});

app.get('/api/profile', authMiddleware, (req, res) => {
  const user = getUserById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user: { id: user.id, email: user.email, name: user.name, companyName: user.companyName } });
});

app.put('/api/profile', authMiddleware, (req, res) => {
  const user = getUserById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { name, companyName, email, currentPassword, newPassword } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (companyName) updates.companyName = companyName;
  if (email) updates.email = email;
  if (newPassword) {
    if (!currentPassword || !bcrypt.compareSync(currentPassword, user.passwordHash)) {
      return res.status(400).json({ message: 'Aktuelles Passwort stimmt nicht.' });
    }
    updates.passwordHash = bcrypt.hashSync(newPassword, 10);
  }
  const updated = updateUser(user.id, updates);
  res.json({ user: { id: updated.id, email: updated.email, name: updated.name, companyName: updated.companyName } });
});

// Template routes
app.get('/api/templates', authMiddleware, (req, res) => {
  const ownerTemplates = templates.filter((t) => t.ownerId === req.user.id);
  res.json(ownerTemplates);
});

app.post('/api/templates', authMiddleware, (req, res) => {
  const { name, description, sections = [], variablesSchema = [], status = 'draft' } = req.body;
  const template = {
    id: nanoid(),
    ownerId: req.user.id,
    name,
    description,
    status,
    sections,
    variablesSchema,
    createdAt: now(),
    updatedAt: now(),
  };
  addTemplate(template);
  res.status(201).json(template);
});

app.get('/api/templates/:id', authMiddleware, (req, res) => {
  const template = templates.find((t) => t.id === req.params.id && t.ownerId === req.user.id);
  if (!template) return res.status(404).json({ message: 'Not found' });
  res.json(template);
});

app.put('/api/templates/:id', authMiddleware, (req, res) => {
  const template = templates.find((t) => t.id === req.params.id && t.ownerId === req.user.id);
  if (!template) return res.status(404).json({ message: 'Not found' });
  const updated = updateTemplate(template.id, { ...req.body });
  res.json(updated);
});

app.delete('/api/templates/:id', authMiddleware, (req, res) => {
  const template = templates.find((t) => t.id === req.params.id && t.ownerId === req.user.id);
  if (!template) return res.status(404).json({ message: 'Not found' });
  deleteTemplate(template.id);
  res.status(204).send();
});

// AI Proposal generation
app.post('/api/proposals/ai-generate', authMiddleware, (req, res) => {
  const payload = req.body;
  if (!payload.clientName || !payload.projectTitle) {
    return res.status(400).json({ message: 'clientName and projectTitle required' });
  }
  const ownerId = req.user.id;
  const generation = mockAiGeneration(payload);
  const proposal = {
    id: nanoid(),
    ownerId,
    title: generation.title,
    templateId: payload.templateId || null,
    status: 'draft',
    aiGenerationSource: {
      templateId: payload.templateId || null,
      language: payload.language || 'de',
      tone: payload.tone || 'formal',
      workflowInfo: 'mock-n8n-webhook',
    },
    sections: generation.sections,
    recipient: {
      name: payload.clientName,
      email: payload.clientEmail,
      company: payload.clientCompany,
    },
    publicSlug: generatePublicSlug(),
    passcode: payload.passcode || null,
    signedAt: null,
    viewedAt: null,
    createdAt: now(),
    updatedAt: now(),
  };
  addProposal(proposal);
  emitIntegrationEvent('proposal.generated', { proposalId: proposal.id, ownerId });
  res.status(201).json({ proposalId: proposal.id, proposal });
});

// Proposal CRUD
app.get('/api/proposals', authMiddleware, (req, res) => {
  const { status } = req.query;
  let ownerProposals = proposals.filter((p) => p.ownerId === req.user.id);
  if (status) ownerProposals = ownerProposals.filter((p) => p.status === status);
  res.json(ownerProposals);
});

app.get('/api/proposals/:id', authMiddleware, (req, res) => {
  const proposal = proposals.find((p) => p.id === req.params.id && p.ownerId === req.user.id);
  if (!proposal) return res.status(404).json({ message: 'Not found' });
  res.json(proposal);
});

app.put('/api/proposals/:id', authMiddleware, (req, res) => {
  const proposal = proposals.find((p) => p.id === req.params.id && p.ownerId === req.user.id);
  if (!proposal) return res.status(404).json({ message: 'Not found' });
  const updated = updateProposal(proposal.id, req.body);
  if (req.body.status === 'sent') {
    emitIntegrationEvent('proposal.sent', { proposalId: proposal.id, ownerId: req.user.id });
  }
  res.json(updated);
});

// Analytics
app.get('/api/proposals/:id/analytics', authMiddleware, (req, res) => {
  const proposal = proposals.find((p) => p.id === req.params.id && p.ownerId === req.user.id);
  if (!proposal) return res.status(404).json({ message: 'Not found' });
  res.json(computeProposalAnalytics(proposal.id));
});

app.get('/api/analytics/overview', authMiddleware, (req, res) => {
  res.json(computeOverview(req.user.id));
});

// Settings
app.get('/api/settings/branding', authMiddleware, (req, res) => {
  res.json(brandingSettings[req.user.id] || {});
});

app.put('/api/settings/branding', authMiddleware, (req, res) => {
  brandingSettings[req.user.id] = { ...brandingSettings[req.user.id], ...req.body, ownerId: req.user.id };
  res.json(brandingSettings[req.user.id]);
});

app.get('/api/settings/security', authMiddleware, (req, res) => {
  res.json(securitySettings[req.user.id] || {});
});

app.put('/api/settings/security', authMiddleware, (req, res) => {
  securitySettings[req.user.id] = { ...securitySettings[req.user.id], ...req.body, ownerId: req.user.id };
  res.json(securitySettings[req.user.id]);
});

app.get('/api/settings/n8n', authMiddleware, (req, res) => {
  res.json(n8nSettings[req.user.id] || {});
});

app.put('/api/settings/n8n', authMiddleware, (req, res) => {
  n8nSettings[req.user.id] = { ...n8nSettings[req.user.id], ...req.body, ownerId: req.user.id };
  res.json(n8nSettings[req.user.id]);
});

// Public routes
app.get('/api/public/proposals/:slug', (req, res) => {
  const proposal = proposals.find((p) => p.publicSlug === req.params.slug);
  if (!proposal) return res.status(404).json({ message: 'Not found' });
  if (proposal.passcode) {
    return res.json({ requiresPasscode: true, proposalId: proposal.id });
  }
  res.json({ proposal: sanitizeProposalForPublic(proposal), branding: brandingSettings[proposal.ownerId] });
});

app.post('/api/public/proposals/:slug/verify-passcode', (req, res) => {
  const proposal = proposals.find((p) => p.publicSlug === req.params.slug);
  if (!proposal) return res.status(404).json({ message: 'Not found' });
  if (proposal.passcode && proposal.passcode === req.body.passcode) {
    return res.json({ proposal: sanitizeProposalForPublic(proposal), branding: brandingSettings[proposal.ownerId] });
  }
  return res.status(401).json({ message: 'Invalid passcode' });
});

app.post('/api/public/proposals/:slug/events', (req, res) => {
  const proposal = proposals.find((p) => p.publicSlug === req.params.slug);
  if (!proposal) return res.status(404).json({ message: 'Not found' });
  const event = {
    id: nanoid(),
    proposalId: proposal.id,
    eventType: req.body.eventType,
    metadata: req.body.metadata || req.body,
    createdAt: now(),
  };
  addAnalyticsEvent(event);
  if (req.body.eventType === 'view') {
    updateProposal(proposal.id, { viewedAt: now(), status: proposal.status === 'sent' ? 'viewed' : proposal.status });
  }
  res.status(201).json({ ok: true });
});

app.post('/api/public/proposals/:slug/sign', (req, res) => {
  const proposal = proposals.find((p) => p.publicSlug === req.params.slug);
  if (!proposal) return res.status(404).json({ message: 'Not found' });
  if (proposal.status === 'signed') return res.status(400).json({ message: 'Already signed' });
  const { signerName, signerEmail, signatureType, signatureData } = req.body;
  if (!signerName || !signatureType || !signatureData) return res.status(400).json({ message: 'Invalid payload' });
  const signature = {
    id: nanoid(),
    proposalId: proposal.id,
    signerName,
    signerEmail: signerEmail || proposal.recipient?.email,
    signedAt: now(),
    signerIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    signatureType,
    signatureData,
    proposalContentHash: Buffer.from(JSON.stringify(proposal.sections)).toString('base64'),
  };
  addSignature(signature);
  const updatedProposal = updateProposal(proposal.id, { status: 'signed', signedAt: signature.signedAt });
  addAnalyticsEvent({ id: nanoid(), proposalId: proposal.id, eventType: 'signed', metadata: { signerName }, createdAt: signature.signedAt });
  emitIntegrationEvent('proposal.signed', { proposalId: proposal.id, ownerId: proposal.ownerId, signerName });
  res.json({ proposal: sanitizeProposalForPublic(updatedProposal), signature });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(port, () => {
  console.log(`ArcDraft backend running on port ${port}`);
});
