/**
 * Letter visibility for role-based access: admin sees all; non-admin sees only
 * letters they created, sent (from), or are in cc.
 */

function isUserSenderOrCc(letter, userId, members) {
  if (!userId || !members?.length) return false;
  const senderMember = members.find(
    (m) => `${m.role} – ${m.name}` === letter.from && (m.userId || '').trim() === userId
  );
  if (senderMember) return true;
  const userMember = members.find((m) => (m.userId || '').trim() === userId);
  return userMember && Array.isArray(letter.cc) && letter.cc.includes(userMember.id);
}

/**
 * Returns true if the letter is visible to the user given their role.
 * @param {object} letter - Letter with createdBy, from, cc
 * @param {string} userId - Sheet user id (for createdBy and member matching)
 * @param {string} userRole - 'admin' | 'creator' | 'approver' | 'viewer'
 * @param {object[]} members - Members for current period (for sender/cc check)
 */
export function isLetterVisibleToUser(letter, userId, userRole, members) {
  if (userRole === 'admin') return true;
  const createdById = letter.createdBy?.id ?? letter.createdBy;
  if (createdById && String(createdById).trim() === String(userId).trim()) return true;
  return isUserSenderOrCc(letter, userId, members);
}
