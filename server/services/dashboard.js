import { getLetters } from './letters.js';
import * as membersService from './members.js';

function isApprovedOrSent(l) {
  return l.status === 'approved' || l.status === 'sent';
}

function isUserSenderOrCc(l, uid, members) {
  if (!uid || !members.length) return false;
  const senderMember = members.find((m) => `${m.role} – ${m.name}` === l.from && (m.userId || '').trim() === uid);
  if (senderMember) return true;
  const userMember = members.find((m) => (m.userId || '').trim() === uid);
  return userMember && Array.isArray(l.cc) && l.cc.includes(userMember.id);
}

export async function getDashboardStats(userId) {
  const letters = await getLetters();
  const drafts = letters.filter((l) => l.status === 'draft').length;
  const pendingApproval = letters.filter((l) => l.status === 'pending_approval').length;
  let awaitingMyApproval = pendingApproval;
  let outbox = 0;
  if (userId) {
    awaitingMyApproval = letters.filter((l) => {
      if (l.status !== 'pending_approval' || !l.approvalSteps?.length) return false;
      const pending = l.approvalSteps.find((s) => s.status === 'pending');
      return pending?.approver?.id === userId;
    }).length;
    const members = await membersService.getMembersForCurrentPeriod().catch(() => []);
    outbox = letters.filter((l) => isApprovedOrSent(l) && isUserSenderOrCc(l, userId, members)).length;
  }
  return {
    outbox,
    drafts,
    pendingApproval,
    awaitingMyApproval,
  };
}
