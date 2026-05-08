const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { authMiddleware } = require('../middleware/auth');
const TeamInvite = require('../models/TeamInvite');
const TeamMember = require('../models/TeamMember');
const User = require('../models/User');

// ============================================
// POST /api/team/invite — Invite a team member
// ============================================
router.post('/invite', authMiddleware, async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

    // Check if already a member
    const existingMember = await TeamMember.findOne({ email, status: 'active' });
    if (existingMember) {
      return res.status(400).json({ success: false, error: 'This person is already a team member' });
    }

    // Check if already invited
    const existingInvite = await TeamInvite.findOne({ email, status: 'pending' });
    if (existingInvite) {
      return res.status(400).json({ success: false, error: 'An invitation has already been sent to this email' });
    }

    const inviteToken = crypto.randomBytes(16).toString('hex');
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${inviteToken}`;

    // Send email
    const emailTransporter = req.app.get('emailTransporter');
    if (emailTransporter) {
      try {
        await emailTransporter.sendMail({
          from: `"EmailAI Team" <${process.env.SMTP_USER}>`,
          to: email,
          subject: `${req.user.name || 'Someone'} invited you to join EmailAI`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>👋 You're Invited!</h2>
              <p><strong>${req.user.name || 'Someone'}</strong> has invited you to join their team on EmailAI as a <strong>${role || 'viewer'}</strong>.</p>
              <p>Click the link below to accept:</p>
              <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Accept Invitation</a>
              <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">This invitation expires in 7 days.</p>
            </div>
          `
        });
      } catch (e) {
        console.error('Email error:', e.message);
      }
    }

    const userId = req.user._id || req.user.id;
    const invite = await TeamInvite.create({
      email: email.toLowerCase().trim(),
      role: role || 'viewer',
      invitedBy: userId,
      token: inviteToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    res.status(200).json({
      success: true,
      message: `Invitation sent to ${email}`,
      data: {
        id: invite._id,
        email,
        role: role || 'viewer',
        status: 'pending',
        invitedBy: req.user.name,
        expiresAt: invite.expiresAt
      }
    });
  } catch (error) {
    console.error('Invite error:', error);
    res.status(500).json({ success: false, error: 'Failed to send invitation' });
  }
});

// ============================================
// GET /api/team/members — List team members
// ============================================
router.get('/members', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    // Get active members
    const members = await TeamMember.find({ status: 'active' })
      .populate('user', 'name email createdAt')
      .sort({ joinedAt: -1 });

    // Get pending invites
    const pendingInvites = await TeamInvite.find({ status: 'pending' })
      .sort({ createdAt: -1 });

    const formattedMembers = members.map(m => ({
      id: m._id,
      name: m.user?.name || 'Unknown',
      email: m.user?.email || '',
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt
    }));

    // If no members, show the current user as admin
    if (formattedMembers.length === 0) {
      formattedMembers.push({
        id: userId,
        name: req.user.name || 'You',
        email: req.user.email || '',
        role: 'admin',
        status: 'active',
        joinedAt: new Date()
      });
    }

    res.json({
      success: true,
      members: formattedMembers,
      pendingInvites: pendingInvites.map(i => ({
        id: i._id,
        email: i.email,
        role: i.role,
        status: i.status,
        createdAt: i.createdAt,
        expiresAt: i.expiresAt
      }))
    });
  } catch (error) {
    console.error('Get members error:', error);
    res.json({
      success: true,
      members: [{
        id: req.user._id || req.user.id,
        name: req.user.name || 'You',
        email: req.user.email || '',
        role: 'admin',
        status: 'active'
      }],
      pendingInvites: []
    });
  }
});

// ============================================
// DELETE /api/team/members/:memberId — Remove member
// ============================================
router.delete('/members/:memberId', authMiddleware, async (req, res) => {
  try {
    await TeamMember.findByIdAndDelete(req.params.memberId);
    res.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to remove member' });
  }
});

// ============================================
// PUT /api/team/members/:memberId/role — Change role
// ============================================
router.put('/members/:memberId/role', authMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    const member = await TeamMember.findByIdAndUpdate(
      req.params.memberId,
      { role },
      { new: true }
    );

    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    res.json({ success: true, message: 'Role updated', data: { id: member._id, role: member.role } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update role' });
  }
});

// ============================================
// POST /api/team/accept-invite/:token — Accept invitation
// ============================================
router.post('/accept-invite/:token', authMiddleware, async (req, res) => {
  try {
    const invite = await TeamInvite.findOne({ token: req.params.token, status: 'pending' });
    if (!invite) return res.status(404).json({ success: false, error: 'Invitation not found or already used' });
    if (invite.expiresAt < new Date()) return res.status(400).json({ success: false, error: 'Invitation has expired' });

    // Create team member
    await TeamMember.create({
      user: req.user._id || req.user.id,
      email: invite.email,
      role: invite.role,
      status: 'active',
      joinedAt: new Date()
    });

    // Mark invite as accepted
    invite.status = 'accepted';
    await invite.save();

    res.json({ success: true, message: 'Welcome to the team! 🎉' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to accept invitation' });
  }
});

// ============================================
// GET /api/team/pending-invites — Get pending invites
// ============================================
router.get('/pending-invites', authMiddleware, async (req, res) => {
  try {
    const invites = await TeamInvite.find({ status: 'pending' })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      invites: invites.map(i => ({
        id: i._id,
        email: i.email,
        role: i.role,
        createdAt: i.createdAt,
        expiresAt: i.expiresAt
      }))
    });
  } catch (error) {
    res.json({ success: true, invites: [] });
  }
});

module.exports = router; 