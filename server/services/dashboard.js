import { getLetters } from './letters.js';
import * as membersService from './members.js';
import * as letterReadsService from './letterReads.js';

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

function isUnread(letter, readIds) {
  return !readIds.has(String(letter.id || '').trim());
}

const log = (msg, data) => fetch('http://127.0.0.1:7246/ingest/55bae2bf-7bcd-493f-9377-31aad3707983',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard.js:getDashboardStats',message:msg,data:data||{},timestamp:Date.now()})}).catch(()=>{});

export async function getDashboardStats(userId) {
  log('getDashboardStats before getLetters', { userId: userId ? 'set' : 'missing' });
  const letters = await getLetters();
  log('getDashboardStats after getLetters', { letterCount: letters?.length });
  log('getDashboardStats before getReadLetterIds', {});
  const readIds = await letterReadsService.getReadLetterIds(userId).catch((e) => {
    log('getDashboardStats getReadLetterIds catch', { errMessage: e?.message });
    return new Set();
  });
  log('getDashboardStats after getReadLetterIds', { readIdsSize: readIds?.size });
  const unreadLetters = letters.filter((l) => isUnread(l, readIds));
  const drafts = unreadLetters.filter((l) => l.status === 'draft').length;
  const pendingApproval = unreadLetters.filter((l) => l.status === 'pending_approval').length;
  let awaitingMyApproval = pendingApproval;
  let outbox = 0;
  if (userId) {
    awaitingMyApproval = unreadLetters.filter((l) => {
      if (l.status !== 'pending_approval' || !l.approvalSteps?.length) return false;
      const pending = l.approvalSteps.find((s) => s.status === 'pending');
      return pending?.approver?.id === userId;
    }).length;
    const members = await membersService.getMembersForCurrentPeriod().catch(() => []);
    outbox = unreadLetters.filter((l) => isApprovedOrSent(l) && isUserSenderOrCc(l, userId, members)).length;
  }
  return {
    outbox,
    drafts,
    pendingApproval,
    awaitingMyApproval,
  };
}
