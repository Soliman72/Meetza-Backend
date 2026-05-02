const memberRepository = require("../repositories/memberRepository");
const {
  validateCreateMember,
  validateMemberIdParam,
  validateUpdateMember,
} = require("../validators/memberValidator");

exports.createMember = async (req) => {
  validateCreateMember(req.body);
  const { user_id } = req.body;

  const existing = await memberRepository.findByUserId(user_id);
  if (existing) {
    throw new Error("Member already exists");
  }

  return memberRepository.insert(user_id);
};

exports.getAllMembers = async () => {
  return memberRepository.findAll();
};

exports.getMemberById = async (user_id) => {
  validateMemberIdParam(user_id);
  const row = await memberRepository.findByUserId(user_id);
  if (!row) {
    throw Object.assign(new Error("Member not found"), { status: 404 });
  }
  return row;
};

exports.updateMember = async (user_id, new_user_id) => {
  if (!user_id || !new_user_id) {
    throw Object.assign(
      new Error("user_id and new_user_id are required"),
      { status: 400 }
    );
  }
  const affected = await memberRepository.updateUserId(user_id, new_user_id);
  if (affected === 0) {
    throw Object.assign(new Error("Member not found"), { status: 404 });
  }
};

exports.deleteMember = async (user_id) => {
  validateMemberIdParam(user_id);
  const existing = await memberRepository.findByUserId(user_id);
  if (!existing) {
    throw Object.assign(new Error("Member not found"), { status: 404 });
  }
  await memberRepository.deleteByUserId(user_id);
};
